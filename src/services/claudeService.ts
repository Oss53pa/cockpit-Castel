/**
 * Claude API Service - Service d'extraction IA via l'API Claude
 *
 * Ce service gere l'extraction intelligente de donnees a partir de documents,
 * avec des extracteurs enrichis retournant des types riches avec scores de confiance.
 */

import type { IADocumentType } from '@/types';
import { API_ENDPOINTS } from '@/lib/apiEndpoints';

// ============================================================================
// Interfaces riches pour l'extraction
// ============================================================================

export interface ExtractedDate {
  value: string;
  type: 'creation' | 'echeance' | 'reunion' | 'signature' | 'autre';
  confidence: number;
  context: string;
}

export interface ExtractedAmount {
  value: number;
  currency: string;
  type: 'ttc' | 'ht' | 'tva' | 'loyer' | 'charge' | 'autre';
  confidence: number;
  context: string;
}

export interface ExtractedPerson {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  confidence: number;
}

export interface ExtractedSection {
  title: string;
  level: number;
  content: string;
}

export interface ExtractedAction {
  description: string;
  responsable: string;
  echeance: string;
  priorite: string;
  confidence: number;
}

export interface ExtractedEntity {
  name: string;
  type: 'entreprise' | 'personne' | 'lieu' | 'reference';
  confidence: number;
}

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
}

export interface DocumentMetadata {
  pageCount: number;
  lineCount: number;
  charCount: number;
  language: string;
}

// ============================================================================
// Configuration API
// ============================================================================

interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

// Resultat d'extraction
export interface ExtractionResult {
  documentType: IADocumentType;
  confidence: number;
  extractedData: Record<string, unknown>;
}

// Stockage securise de la cle API
const CONFIG_KEY = 'claude_api_config';
const PROPHET_CONFIG_KEY = 'prophet_ai_config';

/**
 * Recuperer la configuration Claude depuis le stockage securise
 * Reutilise la configuration Prophet AI si disponible
 */
export function getClaudeConfig(): ClaudeConfig | null {
  try {
    const claudeConfig = localStorage.getItem(CONFIG_KEY);
    if (claudeConfig) {
      return JSON.parse(claudeConfig);
    }

    const prophetConfig = localStorage.getItem(PROPHET_CONFIG_KEY);
    if (prophetConfig) {
      const parsed = JSON.parse(prophetConfig);
      if (parsed.provider === 'anthropic' && parsed.anthropicApiKey) {
        return {
          apiKey: parsed.anthropicApiKey,
          model: parsed.anthropicModel || 'claude-sonnet-4-20250514',
          maxTokens: 4096,
        };
      }
    }
  } catch (e) {
    console.error('Erreur lecture config Claude:', e);
  }
  return null;
}

/**
 * Sauvegarder la configuration Claude
 */
export function saveClaudeConfig(config: Partial<ClaudeConfig>): void {
  try {
    const current = getClaudeConfig() || {
      apiKey: '',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
    };
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erreur sauvegarde config Claude:', e);
  }
}

/**
 * Verifier si l'API Claude est configuree
 */
export function isClaudeConfigured(): boolean {
  const config = getClaudeConfig();
  return !!(config?.apiKey && config.apiKey.startsWith('sk-'));
}

/**
 * Prompt systeme pour l'extraction de documents
 */
const EXTRACTION_SYSTEM_PROMPT = `Tu es un assistant specialise dans l'extraction de donnees structurees a partir de documents.

Tu dois analyser le contenu fourni et:
1. Identifier le type de document parmi: facture, devis, compte_rendu, bail_commercial, pv_reception, cv, contrat_travail, rapport_audit, planning, courrier_officiel, photo_reserve, doe, autre
2. Extraire les donnees pertinentes selon le type de document
3. Donner un score de confiance entre 0 et 1

Reponds UNIQUEMENT en JSON avec ce format:
{
  "documentType": "type_detecte",
  "confidence": 0.95,
  "extractedData": {
    // donnees extraites selon le type
  }
}

Pour chaque type de document, voici les champs attendus:

FACTURE:
- fournisseur: { nom, siret?, adresse?, telephone?, email? }
- facture: { numero, date, dateEcheance? }
- montants: { ht, tvaTaux, tvaMontant, ttc, devise }
- objet: description
- lignes?: [{ description, quantite, prixUnitaire, montant }]

COMPTE_RENDU:
- reunion: { type, date, lieu, participants: [{ nom, present }] }
- decisions: [{ description, responsable? }]
- actionsIssues: [{ description, responsable, echeance, priorite }]

BAIL_COMMERCIAL:
- parties: { bailleur, preneur: { raisonSociale, representant, fonction } }
- local: { designation, surface, unite, niveau?, zone? }
- conditions: { loyerMensuel, chargesMensuelles, devise, dureeAns, dateEffet, depotGarantie? }

PV_RECEPTION:
- lot: { numero, designation, entreprise }
- reception: { date, type, avecReserves }
- reserves?: [{ numero, localisation, description, priorite, delaiLevee }]

CV:
- identite: { nom, prenom, email?, telephone? }
- experience: [{ poste, entreprise, debut, fin?, description }]
- formation: [{ diplome, etablissement, annee }]
- competences: string[]

DEVIS:
- fournisseur: { nom, siret?, adresse? }
- devis: { numero, date, validite? }
- montants: { ht, tva, ttc, devise }
- lignes: [{ description, quantite, prixUnitaire, montant }]`;

/**
 * Modeles IA disponibles pour l'extraction
 */
export const AVAILABLE_MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Rapide et efficace (recommandé)' },
  { id: 'claude-opus-4-20250514', label: 'Claude Opus 4', description: 'Plus précis, plus lent' },
  { id: 'claude-haiku-3-20250307', label: 'Claude Haiku 3', description: 'Très rapide, moins précis' },
] as const;

export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export async function extractWithClaude(
  documentContent: string,
  mimeType: string,
  modelOverride?: string
): Promise<ExtractionResult> {
  const config = getClaudeConfig();

  if (!config?.apiKey) {
    console.warn('API Claude non configuree, utilisation du mode simulation');
    return simulateFallbackExtraction(documentContent);
  }

  const model = modelOverride || config.model || DEFAULT_MODEL;

  try {
    const response = await fetch(API_ENDPOINTS.anthropic.messages, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: config.maxTokens || 4096,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyse ce document et extrait les donnees structurees:\n\nType MIME: ${mimeType}\n\nContenu:\n${documentContent}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erreur API Claude: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const textContent = data.content?.[0]?.text;

    if (!textContent) {
      throw new Error('Reponse vide de Claude');
    }

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de reponse invalide');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      documentType: result.documentType as IADocumentType,
      confidence: Math.min(1, Math.max(0, result.confidence)),
      extractedData: result.extractedData || {},
    };
  } catch (error) {
    console.error('Erreur extraction Claude:', error);
    return simulateFallbackExtraction(documentContent);
  }
}

// ============================================================================
// PATTERNS centralises
// ============================================================================

const PATTERNS = {
  dates: {
    numeric: /\b(\d{1,2})[/.]\s?(\d{1,2})[/.]\s?(\d{2,4})\b/g,
    textual: /\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})\b/gi,
  },
  amounts: {
    numberThenCurrency: /(\d[\d\s.,]*\d)\s*(FCFA|XOF|CFA|EUR|€|USD|\$|F\s?CFA)/gi,
    currencyThenNumber: /(FCFA|XOF|CFA|EUR|€|USD|\$|F\s?CFA)\s*(\d[\d\s.,]*\d)/gi,
    labeled: /(?:montant|total|ttc|ht|prix|coût|cout|loyer|charge|tva)[:\s]*(\d[\d\s.,]*\d)/gi,
  },
  people: {
    titled: /(?:M\.|Mme|Mr|Mlle|Dr|Pr|Ing\.?)\s+([A-ZÉÈÊËÀÂÄÙÛÜÏÎÔÖÇ][a-zéèêëàâäùûüïîôöç]+(?:\s+[A-ZÉÈÊËÀÂÄÙÛÜÏÎÔÖÇ][a-zéèêëàâäùûüïîôöç]+){0,2})/g,
    role: /(?:responsable|contact|chef|directeur|manager|ingenieur|ingénieur|architecte|maître|maitre|gérant|gerant|président|president)\s*[:\-–]\s*([A-ZÉÈÊËÀÂÄÙÛÜÏÎÔÖÇa-zéèêëàâäùûüïîôöç\s.]+)/gi,
  },
  references: {
    facture: /(?:facture|fact\.?|invoice)\s*[n°#:]*\s*([A-Z0-9\-/]+)/gi,
    devis: /(?:devis|quotation)\s*[n°#:]*\s*([A-Z0-9\-/]+)/gi,
    contrat: /(?:contrat|contract)\s*[n°#:]*\s*([A-Z0-9\-/]+)/gi,
    reference: /(?:réf(?:érence)?|ref)\s*[.:]\s*([A-Z0-9\-/]+)/gi,
  },
  actions: {
    dated: /^\d{1,2}[./]\d{1,2}[./]\d{2,4}\s*[–\-:]\s*.+/,
    bulleted: /^[-–•►▸◦]\s*.{10,}/,
    numbered: /^\d+[.)]\s*.{10,}/,
    verbs: /\b(réaliser|installer|poser|vérifier|contrôler|corriger|lever|effectuer|mettre en|procéder|achever|terminer|démarrer|commencer|lancer|planifier|prévoir|organiser|coordonner|suivre|superviser|valider|approuver|livrer|réceptionner|commander|fournir|exécuter|remplacer|réparer|nettoyer|préparer)\b/i,
  },
  emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phones: /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{0,3}/g,
  siret: /\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b/g,
} as const;

// ============================================================================
// Extracteurs enrichis
// ============================================================================

/** Extraire toutes les dates trouvees dans le texte avec type et confiance */
function extractDates(text: string): ExtractedDate[] {
  const results: ExtractedDate[] = [];
  const seen = new Set<string>();

  const dateTypeKeywords: Array<{ type: ExtractedDate['type']; patterns: RegExp }> = [
    { type: 'echeance', patterns: /(?:échéance|echeance|date\s*limite|deadline|avant\s*le|au\s*plus\s*tard)/i },
    { type: 'reunion', patterns: /(?:réunion|reunion|rencontre|séance|seance|comité|comite)/i },
    { type: 'signature', patterns: /(?:sign[ée]|signature|paraph[ée]|contresign)/i },
    { type: 'creation', patterns: /(?:créé|cree|établi|etabli|émis|emis|date\s*d[ue'])/i },
  ];

  function classifyDate(ctx: string): { type: ExtractedDate['type']; confidence: number } {
    for (const kw of dateTypeKeywords) {
      if (kw.patterns.test(ctx)) {
        return { type: kw.type, confidence: 0.8 };
      }
    }
    return { type: 'autre', confidence: 0.5 };
  }

  // Numeric dates
  const numericPattern = new RegExp(PATTERNS.dates.numeric.source, 'g');
  let m;
  while ((m = numericPattern.exec(text)) !== null) {
    const val = m[0].trim();
    if (seen.has(val)) continue;
    seen.add(val);
    const start = Math.max(0, m.index - 60);
    const end = Math.min(text.length, m.index + m[0].length + 60);
    const ctx = text.slice(start, end).replace(/\n/g, ' ').trim();
    const classification = classifyDate(ctx);
    results.push({ value: val, type: classification.type, confidence: classification.confidence, context: ctx });
  }

  // Textual dates
  const textualPattern = new RegExp(PATTERNS.dates.textual.source, 'gi');
  while ((m = textualPattern.exec(text)) !== null) {
    const val = m[0].trim();
    if (seen.has(val)) continue;
    seen.add(val);
    const start = Math.max(0, m.index - 60);
    const end = Math.min(text.length, m.index + m[0].length + 60);
    const ctx = text.slice(start, end).replace(/\n/g, ' ').trim();
    const classification = classifyDate(ctx);
    results.push({ value: val, type: classification.type, confidence: classification.confidence + 0.1, context: ctx });
  }

  return results;
}

/** Extraire tous les montants avec type et confiance */
function extractAmounts(text: string): ExtractedAmount[] {
  const results: ExtractedAmount[] = [];
  const seenValues = new Map<number, ExtractedAmount>();

  function classifyAmount(ctx: string): { type: ExtractedAmount['type']; confidence: number } {
    const lower = ctx.toLowerCase();
    if (/\bttc\b/.test(lower)) return { type: 'ttc', confidence: 0.9 };
    if (/\bht\b|hors\s*taxe/.test(lower)) return { type: 'ht', confidence: 0.9 };
    if (/\btva\b|taxe/.test(lower)) return { type: 'tva', confidence: 0.85 };
    if (/\bloyer\b/.test(lower)) return { type: 'loyer', confidence: 0.85 };
    if (/\bcharge/.test(lower)) return { type: 'charge', confidence: 0.8 };
    if (/\btotal\b|montant/.test(lower)) return { type: 'ttc', confidence: 0.6 };
    return { type: 'autre', confidence: 0.5 };
  }

  function normalizeCurrency(raw: string): string {
    const cleaned = raw.replace(/\s/g, '').toUpperCase();
    if (['FCFA', 'XOF', 'CFA'].includes(cleaned) || cleaned === 'FCFA') return 'XOF';
    if (cleaned === '€' || cleaned === 'EUR') return 'EUR';
    if (cleaned === '$' || cleaned === 'USD') return 'USD';
    return cleaned;
  }

  function processMatch(numStr: string, currencyRaw: string, index: number) {
    const cleaned = numStr.replace(/\s/g, '').replace(/,/g, '.');
    const val = parseFloat(cleaned);
    if (isNaN(val) || val <= 0) return;

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + numStr.length + currencyRaw.length + 50);
    const ctx = text.slice(start, end).replace(/\n/g, ' ').trim();
    const classification = classifyAmount(ctx);
    const currency = normalizeCurrency(currencyRaw);

    const existing = seenValues.get(val);
    if (!existing || existing.confidence < classification.confidence) {
      seenValues.set(val, {
        value: val,
        currency,
        type: classification.type,
        confidence: classification.confidence,
        context: ctx,
      });
    }
  }

  // numberThenCurrency
  const p1 = new RegExp(PATTERNS.amounts.numberThenCurrency.source, 'gi');
  let m;
  while ((m = p1.exec(text)) !== null) {
    processMatch(m[1], m[2], m.index);
  }

  // currencyThenNumber
  const p2 = new RegExp(PATTERNS.amounts.currencyThenNumber.source, 'gi');
  while ((m = p2.exec(text)) !== null) {
    processMatch(m[2], m[1], m.index);
  }

  // labeled amounts (no explicit currency)
  const p3 = new RegExp(PATTERNS.amounts.labeled.source, 'gi');
  while ((m = p3.exec(text)) !== null) {
    processMatch(m[1], 'XOF', m.index);
  }

  for (const item of seenValues.values()) {
    results.push(item);
  }

  return results;
}

/** Extraire les personnes avec role et confiance */
function extractPeople(text: string): ExtractedPerson[] {
  const results: ExtractedPerson[] = [];
  const seenNames = new Set<string>();
  const lines = text.split(/\n|\r\n?/);

  // Extraire emails pour enrichissement
  const emails = new Map<string, string>();
  const emailPattern = new RegExp(PATTERNS.emails.source, 'g');
  let em;
  while ((em = emailPattern.exec(text)) !== null) {
    const email = em[0];
    // Associer l'email au contexte proche
    const start = Math.max(0, em.index - 100);
    const ctx = text.slice(start, em.index).toLowerCase();
    emails.set(ctx, email);
  }

  for (const line of lines) {
    // Titled names: "M. Dupont", "Mme Martin"
    const titledPattern = new RegExp(PATTERNS.people.titled.source, 'g');
    let m;
    while ((m = titledPattern.exec(line)) !== null) {
      const name = m[1]?.trim();
      if (!name || name.length <= 2 || seenNames.has(name.toLowerCase())) continue;
      seenNames.add(name.toLowerCase());

      // Detecter le role dans le contexte de la ligne
      const roleLower = line.toLowerCase();
      let role: string | undefined;
      if (/directeur|directrice/.test(roleLower)) role = 'Directeur';
      else if (/chef\s*de\s*projet/.test(roleLower)) role = 'Chef de projet';
      else if (/ingénieur|ingenieur/.test(roleLower)) role = 'Ingénieur';
      else if (/architecte/.test(roleLower)) role = 'Architecte';
      else if (/responsable/.test(roleLower)) role = 'Responsable';
      else if (/maître|maitre/.test(roleLower)) role = "Maître d'ouvrage";
      else if (/gérant|gerant/.test(roleLower)) role = 'Gérant';

      // Chercher un email associe
      let email: string | undefined;
      for (const [ctx, addr] of emails.entries()) {
        if (ctx.includes(name.toLowerCase().split(' ')[0])) {
          email = addr;
          break;
        }
      }

      results.push({ name, role, email, confidence: 0.8 });
    }

    // Role-based: "Responsable : Xxxx"
    const rolePattern = new RegExp(PATTERNS.people.role.source, 'gi');
    while ((m = rolePattern.exec(line)) !== null) {
      const name = m[1].trim().split(/[,;]/)[0].trim();
      if (!name || name.length <= 2 || name.length >= 50 || seenNames.has(name.toLowerCase())) continue;
      seenNames.add(name.toLowerCase());

      const roleKeyword = m[0].split(/[:\-–]/)[0].trim();
      results.push({ name, role: roleKeyword, confidence: 0.7 });
    }
  }

  return results.slice(0, 30);
}

/** Extraire les sections / titres du document avec niveau et contenu */
function extractSections(text: string): ExtractedSection[] {
  const lines = text.split(/\n|\r\n?/);
  const sections: ExtractedSection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Sections numerotees: "1. Titre", "I. Titre", "1.2 Titre"
    const numberedMatch = line.match(/^((?:[IVXLC]+\.)|(?:\d+\.)+)\s*(.{5,80})$/);
    if (numberedMatch) {
      const prefix = numberedMatch[1];
      const level = prefix.includes('.') ? prefix.split('.').filter(Boolean).length : 1;
      const content = collectSectionContent(lines, i + 1);
      sections.push({ title: line, level, content });
      continue;
    }

    // Lignes en MAJUSCULES courtes (titres)
    if (/^[A-ZÉÈÊËÀÂÄÙÛÜÏÎÔÖÇ\s\-–:]{5,80}$/.test(line) && line.length < 80) {
      const content = collectSectionContent(lines, i + 1);
      sections.push({ title: line, level: 1, content });
      continue;
    }

    // Lignes terminant par ":" qui servent de titre
    if (/^[A-Za-zÀ-ÿ\s\-–]{5,60}\s*:\s*$/.test(line)) {
      const title = line.replace(/:\s*$/, '');
      const content = collectSectionContent(lines, i + 1);
      sections.push({ title, level: 2, content });
    }
  }

  return sections.slice(0, 30);
}

/** Collecter le contenu suivant une section jusqu'a la prochaine section */
function collectSectionContent(lines: string[], startIdx: number, maxLines = 15): string {
  const contentLines: string[] = [];
  for (let j = startIdx; j < Math.min(lines.length, startIdx + maxLines); j++) {
    const l = lines[j].trim();
    if (!l) {
      if (contentLines.length > 0) break;
      continue;
    }
    // Arreter si on rencontre un nouveau titre
    if (/^(?:[IVXLC]+\.|(?:\d+\.)+)\s*.{5,}$/.test(l)) break;
    if (/^[A-ZÉÈÊËÀÂÄÙÛÜÏÎÔÖÇ\s\-–:]{5,80}$/.test(l)) break;
    contentLines.push(l);
  }
  return contentLines.join(' ').slice(0, 500);
}

/** Extraire les actions avec responsable, echeance et confiance */
function extractActions(text: string): ExtractedAction[] {
  const lines = text.split(/\n|\r\n?/).map((l) => l.trim()).filter(Boolean);
  const results: ExtractedAction[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    let description = '';
    let confidence = 0.5;

    // Lignes datees (ex: "24.11.24 - Realisation du dallage")
    if (PATTERNS.actions.dated.test(line)) {
      description = line.replace(/^\d{1,2}[./]\d{1,2}[./]\d{2,4}\s*[–\-:]\s*/, '');
      confidence = 0.8;
    }
    // Lignes avec tiret
    else if (PATTERNS.actions.bulleted.test(line) && !line.startsWith('---')) {
      description = line.replace(/^[-–•►▸◦]\s*/, '');
      confidence = 0.7;
    }
    // Lignes numerotees
    else if (PATTERNS.actions.numbered.test(line)) {
      description = line.replace(/^\d+[.)]\s*/, '');
      confidence = 0.7;
    }
    // Verbes d'action
    else if (line.length >= 15 && line.length <= 300 && PATTERNS.actions.verbs.test(line)) {
      description = line;
      confidence = 0.6;
    }

    if (!description || seen.has(description)) continue;
    seen.add(description);

    // Essayer d'extraire responsable et echeance du contexte
    const responsable = extractResponsableFromLine(description);
    const echeance = extractEcheanceFromLine(line);
    const priorite = /urgent/i.test(line) ? 'haute' : /priorit/i.test(line) ? 'haute' : 'moyenne';

    results.push({
      description: description.slice(0, 200),
      responsable,
      echeance,
      priorite,
      confidence,
    });
  }

  return results.slice(0, 50);
}

/** Extraire un responsable depuis une ligne */
function extractResponsableFromLine(line: string): string {
  const match = line.match(/(?:responsable|resp\.?|pilote|par)\s*[:\-–]\s*([A-ZÉÈÊËÀÂÄa-zéèêëàâä\s.]+?)(?:[,;.\n]|$)/i);
  if (match?.[1]) {
    const name = match[1].trim();
    if (name.length > 2 && name.length < 50) return name;
  }
  return 'A assigner';
}

/** Extraire une echeance depuis une ligne */
function extractEcheanceFromLine(line: string): string {
  const dateMatch = line.match(/\b(\d{1,2})[/.]\s?(\d{1,2})[/.]\s?(\d{2,4})\b/);
  if (dateMatch) return dateMatch[0];
  return '';
}

/** Extraire les entites (entreprises, lieux, references) */
function extractEntities(text: string): ExtractedEntity[] {
  const results: ExtractedEntity[] = [];
  const seen = new Set<string>();

  // References de documents
  for (const [, pattern] of Object.entries(PATTERNS.references)) {
    const re = new RegExp(pattern.source, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      const ref = m[1]?.trim();
      if (!ref || ref.length < 2 || seen.has(ref.toLowerCase())) continue;
      seen.add(ref.toLowerCase());
      results.push({ name: ref, type: 'reference', confidence: 0.8 });
    }
  }

  // SIRET
  const siretRe = new RegExp(PATTERNS.siret.source, 'g');
  let sm;
  while ((sm = siretRe.exec(text)) !== null) {
    const siret = sm[0].replace(/\s/g, '');
    if (!seen.has(siret)) {
      seen.add(siret);
      results.push({ name: `SIRET ${siret}`, type: 'entreprise', confidence: 0.9 });
    }
  }

  // Entreprises (lignes en majuscules en debut de document, typiquement en-tete)
  const firstLines = text.split(/\n/).slice(0, 15);
  for (const line of firstLines) {
    const trimmed = line.trim();
    if (/^[A-ZÉÈÊËÀÂ][A-Z\s&.,'-]{4,40}$/.test(trimmed) && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      results.push({ name: trimmed, type: 'entreprise', confidence: 0.6 });
    }
  }

  return results.slice(0, 30);
}

/** Extraire les tableaux structures depuis le texte */
function extractTables(text: string): ExtractedTable[] {
  const tables: ExtractedTable[] = [];
  const lines = text.split(/\n|\r\n?/);

  let currentTable: { headers: string[]; rows: string[][] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detecter les lignes avec separateur "|"
    if (trimmed.includes('|') && trimmed.split('|').length >= 3) {
      const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean);

      // Ligne de separation (ex: "---|---|---")
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        continue;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
    } else {
      // Detecter les lignes tabulees (separees par plusieurs espaces ou tabs)
      const tabbedCells = trimmed.split(/\t+|\s{3,}/).filter(Boolean);
      if (tabbedCells.length >= 3 && tabbedCells.length <= 15) {
        if (!currentTable) {
          currentTable = { headers: tabbedCells, rows: [] };
        } else if (tabbedCells.length >= currentTable.headers.length - 1) {
          currentTable.rows.push(tabbedCells);
        } else {
          // Fin de tableau
          if (currentTable.rows.length > 0) {
            tables.push(currentTable);
          }
          currentTable = null;
        }
      } else if (currentTable) {
        if (currentTable.rows.length > 0) {
          tables.push(currentTable);
        }
        currentTable = null;
      }
    }
  }

  if (currentTable && currentTable.rows.length > 0) {
    tables.push(currentTable);
  }

  return tables.slice(0, 10);
}

/** Calculer les metadonnees du document */
function getDocumentMetadata(text: string): DocumentMetadata {
  const lines = text.split(/\n/);
  const pageCount = Math.max(1, Math.round(text.length / 3000));

  // Detection de langue simple
  const frenchWords = (text.match(/\b(le|la|les|de|des|du|un|une|et|est|en|pour|par|sur|dans|avec|que|qui|ce|se|ne|pas|plus|son|au|ou|cette|il|elle|nous|vous|ils|elles|leur)\b/gi) || []).length;
  const englishWords = (text.match(/\b(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|shall|should|can|could|may|might|must|of|in|to|for|with|on|at|by|from|this|that|it|not|but|or|and|if)\b/gi) || []).length;
  const language = frenchWords > englishWords ? 'fr' : englishWords > frenchWords ? 'en' : 'fr';

  return {
    pageCount,
    lineCount: lines.length,
    charCount: text.length,
    language,
  };
}

// ============================================================================
// Classification par scoring
// ============================================================================

const DOCUMENT_SCORING: Record<IADocumentType, { keywords: Array<{ word: string; weight: number }> }> = {
  facture: {
    keywords: [
      { word: 'facture', weight: 10 },
      { word: 'ttc', weight: 8 },
      { word: 'tva', weight: 7 },
      { word: 'ht', weight: 5 },
      { word: 'invoice', weight: 8 },
      { word: 'montant dû', weight: 6 },
      { word: 'date de paiement', weight: 5 },
      { word: 'reglement', weight: 4 },
      { word: 'n° facture', weight: 9 },
      { word: 'numero facture', weight: 9 },
    ],
  },
  devis: {
    keywords: [
      { word: 'devis', weight: 10 },
      { word: 'proposition', weight: 5 },
      { word: 'offre de prix', weight: 8 },
      { word: 'estimation', weight: 4 },
      { word: 'validite', weight: 5 },
      { word: 'prix unitaire', weight: 6 },
      { word: 'total devis', weight: 8 },
    ],
  },
  compte_rendu: {
    keywords: [
      { word: 'compte-rendu', weight: 10 },
      { word: 'compte rendu', weight: 10 },
      { word: 'reunion', weight: 6 },
      { word: 'réunion', weight: 6 },
      { word: 'participants', weight: 5 },
      { word: 'ordre du jour', weight: 7 },
      { word: 'point de situation', weight: 6 },
      { word: 'avancement', weight: 4 },
      { word: 'travaux en cours', weight: 5 },
      { word: 'chantier', weight: 3 },
      { word: 'procès-verbal', weight: 7 },
      { word: 'proces verbal', weight: 7 },
      { word: 'decisions', weight: 4 },
      { word: 'décisions', weight: 4 },
      { word: 'actions issues', weight: 6 },
    ],
  },
  bail_commercial: {
    keywords: [
      { word: 'bail', weight: 10 },
      { word: 'bail commercial', weight: 12 },
      { word: 'loyer', weight: 7 },
      { word: 'preneur', weight: 8 },
      { word: 'bailleur', weight: 8 },
      { word: 'locataire', weight: 6 },
      { word: 'dépôt de garantie', weight: 7 },
      { word: 'depot de garantie', weight: 7 },
      { word: 'charges locatives', weight: 6 },
    ],
  },
  pv_reception: {
    keywords: [
      { word: 'pv de réception', weight: 12 },
      { word: 'pv de reception', weight: 12 },
      { word: 'procès-verbal de réception', weight: 12 },
      { word: 'réserve', weight: 5 },
      { word: 'reserve', weight: 5 },
      { word: 'réception provisoire', weight: 9 },
      { word: 'reception provisoire', weight: 9 },
      { word: 'réception définitive', weight: 9 },
      { word: 'levée de réserve', weight: 8 },
      { word: 'lot', weight: 2 },
    ],
  },
  cv: {
    keywords: [
      { word: 'curriculum', weight: 10 },
      { word: 'curriculum vitae', weight: 12 },
      { word: 'cv', weight: 6 },
      { word: 'expérience professionnelle', weight: 8 },
      { word: 'experience professionnelle', weight: 8 },
      { word: 'formation', weight: 4 },
      { word: 'compétences', weight: 5 },
      { word: 'competences', weight: 5 },
      { word: 'langues', weight: 3 },
    ],
  },
  contrat_travail: {
    keywords: [
      { word: 'contrat de travail', weight: 12 },
      { word: 'employeur', weight: 7 },
      { word: 'salarié', weight: 7 },
      { word: 'salaire', weight: 6 },
      { word: 'période d\'essai', weight: 8 },
      { word: 'durée du travail', weight: 6 },
      { word: 'cdi', weight: 5 },
      { word: 'cdd', weight: 5 },
    ],
  },
  rapport_audit: {
    keywords: [
      { word: 'audit', weight: 10 },
      { word: 'inspection', weight: 7 },
      { word: 'non-conformité', weight: 8 },
      { word: 'non-conformite', weight: 8 },
      { word: 'constat', weight: 6 },
      { word: 'recommandation', weight: 5 },
      { word: 'observation', weight: 4 },
      { word: 'rapport d\'audit', weight: 12 },
    ],
  },
  planning: {
    keywords: [
      { word: 'planning', weight: 10 },
      { word: 'calendrier', weight: 7 },
      { word: 'gantt', weight: 9 },
      { word: 'phase', weight: 3 },
      { word: 'jalon', weight: 5 },
      { word: 'milestone', weight: 5 },
      { word: 'chronogramme', weight: 8 },
      { word: 'échéancier', weight: 7 },
      { word: 'echeancier', weight: 7 },
    ],
  },
  courrier_officiel: {
    keywords: [
      { word: 'courrier', weight: 6 },
      { word: 'objet :', weight: 5 },
      { word: 'madame, monsieur', weight: 7 },
      { word: 'veuillez agréer', weight: 8 },
      { word: 'lettre recommandée', weight: 8 },
      { word: 'mise en demeure', weight: 9 },
      { word: 'ar n°', weight: 6 },
    ],
  },
  photo_reserve: {
    keywords: [
      { word: 'photo', weight: 5 },
      { word: 'réserve photographique', weight: 10 },
      { word: 'constat photographique', weight: 9 },
      { word: 'annexe photo', weight: 7 },
    ],
  },
  doe: {
    keywords: [
      { word: 'doe', weight: 8 },
      { word: 'dossier des ouvrages', weight: 12 },
      { word: 'ouvrages exécutés', weight: 10 },
      { word: 'ouvrages executes', weight: 10 },
      { word: 'notice technique', weight: 5 },
      { word: 'plans de recolement', weight: 7 },
    ],
  },
  autre: {
    keywords: [],
  },
};

function classifyDocument(text: string, metadata: DocumentMetadata): { type: IADocumentType; confidence: number } {
  const lowerText = text.toLowerCase();
  let bestType: IADocumentType = 'autre';
  let bestScore = 0;
  let totalMaxScore = 0;

  for (const [docType, config] of Object.entries(DOCUMENT_SCORING)) {
    if (docType === 'autre' || config.keywords.length === 0) continue;

    let score = 0;
    let maxScore = 0;

    for (const kw of config.keywords) {
      maxScore += kw.weight;
      // Compter les occurrences (plafonnees a 3 pour eviter le biais sur les repetitions)
      const regex = new RegExp(kw.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lowerText.match(regex);
      const count = Math.min(matches?.length || 0, 3);
      if (count > 0) {
        score += kw.weight * (1 + (count - 1) * 0.2);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestType = docType as IADocumentType;
      totalMaxScore = maxScore;
    }
  }

  // Normaliser la confiance entre 0 et 1
  const confidence = totalMaxScore > 0
    ? Math.min(1, Math.max(0.1, bestScore / totalMaxScore))
    : 0.1;

  // Si le score est trop faible, classifier comme 'autre'
  if (bestScore < 3) {
    return { type: 'autre', confidence: 0.2 };
  }

  return { type: bestType, confidence: Math.round(confidence * 100) / 100 };
}

// ============================================================================
// Extracteur de paragraphes-cles (interne)
// ============================================================================

function extractKeyParagraphs(text: string, maxParagraphs = 20): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 30);
  const scored = paragraphs.map((p) => {
    let score = 0;
    const lower = p.toLowerCase();
    if (/\b(décision|decision|action|résultat|resultat|conclusion|recommandation|observation|constat)\b/.test(lower)) score += 3;
    if (/\b(montant|budget|coût|cout|prix|total|loyer)\b/.test(lower)) score += 2;
    if (/\b(responsable|contact|directeur|chef|maître|maitre)\b/.test(lower)) score += 1;
    if (/\d/.test(p)) score += 1;
    return { text: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxParagraphs).map((s) => s.text);
}

// ============================================================================
// Extraction de secours (fallback)
// ============================================================================

function simulateFallbackExtraction(documentText: string): ExtractionResult {
  const textPreview = documentText.slice(0, 15000);

  // Extracteurs enrichis
  const dates = extractDates(documentText);
  const amounts = extractAmounts(documentText);
  const people = extractPeople(documentText);
  const sections = extractSections(documentText);
  const actions = extractActions(documentText);
  const entities = extractEntities(documentText);
  const tables = extractTables(documentText);
  const metadata = getDocumentMetadata(documentText);
  const keyParagraphs = extractKeyParagraphs(documentText);

  // Classification par scoring
  const classification = classifyDocument(documentText, metadata);

  // Donnees communes enrichies
  const commonData: Record<string, unknown> = {};
  if (dates.length > 0) {
    commonData.datesTrouvees = dates.map((d) => d.value);
    commonData.datesEnrichies = dates;
  }
  if (amounts.length > 0) {
    commonData.montantsTrouves = amounts.map((a) => `${a.value.toLocaleString('fr-FR')} ${a.currency} — ${a.context}`);
    commonData.montantsEnrichis = amounts;
  }
  if (people.length > 0) {
    commonData.personnesMentionnees = people.map((p) => p.name);
    commonData.personnesEnrichies = people;
  }
  if (sections.length > 0) {
    commonData.sections = sections.map((s) => s.title);
    commonData.sectionsEnrichies = sections;
  }
  if (entities.length > 0) {
    commonData.entitesDetectees = entities;
  }
  if (tables.length > 0) {
    commonData.tableauxDetectes = tables;
  }
  commonData.statistiquesDocument = {
    pages: `~${metadata.pageCount}`,
    lignes: metadata.lineCount,
    caracteres: metadata.charCount,
    langue: metadata.language,
  };
  commonData.metadonnees = metadata;

  // Dispatcher selon le type classifie
  const docType = classification.type;

  if (docType === 'facture') {
    return buildFactureResult(classification, documentText, dates, amounts, people, keyParagraphs, commonData, textPreview);
  }

  if (docType === 'compte_rendu') {
    return buildCompteRenduResult(classification, dates, people, sections, actions, keyParagraphs, commonData, textPreview);
  }

  if (docType === 'bail_commercial') {
    return buildBailResult(classification, dates, amounts, people, commonData, textPreview);
  }

  if (docType === 'pv_reception') {
    return buildPVReceptionResult(classification, dates, people, actions, keyParagraphs, commonData, textPreview);
  }

  if (docType === 'devis') {
    return buildDevisResult(classification, dates, amounts, people, commonData, textPreview);
  }

  if (docType === 'rapport_audit') {
    return buildAuditResult(classification, actions, keyParagraphs, commonData, textPreview);
  }

  if (docType === 'planning') {
    return buildPlanningResult(classification, actions, keyParagraphs, commonData, textPreview);
  }

  if (docType === 'cv') {
    return buildCVResult(classification, people, sections, commonData, textPreview);
  }

  // Fallback: inclure le maximum de donnees extraites
  return {
    documentType: classification.type,
    confidence: classification.confidence,
    extractedData: {
      ...(actions.length > 0 && {
        actionsDetectees: actions.slice(0, 20).map((a) => a.description),
        actionsEnrichies: actions.slice(0, 20),
      }),
      ...(keyParagraphs.length > 0 && {
        resumeContenu: keyParagraphs.slice(0, 10).map((p) => p.slice(0, 300)),
      }),
      ...commonData,
      contenuExtrait: textPreview,
      _warning: 'Classification automatique impossible - mode hors-ligne. Configurez une cle API Claude dans les parametres pour une extraction plus precise.',
    },
  };
}

// ============================================================================
// Builders par type de document
// ============================================================================

function buildFactureResult(
  classification: { type: IADocumentType; confidence: number },
  documentText: string,
  dates: ExtractedDate[],
  amounts: ExtractedAmount[],
  people: ExtractedPerson[],
  keyParagraphs: string[],
  commonData: Record<string, unknown>,
  textPreview: string,
): ExtractionResult {
  const numFacture = documentText.match(/(?:facture|fact\.?|invoice)\s*[n°#:]*\s*([A-Z0-9\-/]+)/i)?.[1] || 'A identifier';
  const dateFacture = dates[0]?.value || new Date().toISOString().split('T')[0];

  const firstLines = documentText.split(/\n/).slice(0, 10).join(' ');
  const fournisseurMatch = firstLines.match(/^([A-ZÉÈÊËÀÂ][A-Za-zÀ-ÿ\s&.,-]+?)(?:\n|SIRET|Adresse|Tél)/)?.[1]?.trim();

  // Chercher les montants TTC et HT
  const ttcAmount = amounts.find((a) => a.type === 'ttc');
  const htAmount = amounts.find((a) => a.type === 'ht');
  const tvaAmount = amounts.find((a) => a.type === 'tva');
  const sortedAmounts = [...amounts].sort((a, b) => b.value - a.value);
  const ttcProbable = ttcAmount?.value || sortedAmounts[0]?.value || 0;
  const htProbable = htAmount?.value || 0;
  const tvaProbable = tvaAmount?.value || 0;
  const devise = ttcAmount?.currency || sortedAmounts[0]?.currency || 'XOF';

  return {
    documentType: 'facture',
    confidence: classification.confidence,
    extractedData: {
      fournisseur: { nom: fournisseurMatch || people[0]?.name || 'A identifier (verifier en-tête)' },
      facture: { numero: numFacture, date: dateFacture },
      montants: {
        ht: htProbable,
        tvaTaux: 18,
        tvaMontant: tvaProbable,
        ttc: ttcProbable,
        devise,
      },
      objet: keyParagraphs[0]?.slice(0, 200) || 'A completer',
      ...(amounts.length > 1 && {
        lignesDetectees: amounts.map((a) => ({ montant: a.value, contexte: a.context, type: a.type })),
      }),
      ...commonData,
      contenuExtrait: textPreview,
      _warning: 'Extraction en mode hors-ligne - verifier les donnees',
    },
  };
}

function buildCompteRenduResult(
  classification: { type: IADocumentType; confidence: number },
  dates: ExtractedDate[],
  people: ExtractedPerson[],
  sections: ExtractedSection[],
  actions: ExtractedAction[],
  keyParagraphs: string[],
  commonData: Record<string, unknown>,
  textPreview: string,
): ExtractionResult {
  const actionsIssues = actions.map((a) => ({
    description: a.description,
    responsable: a.responsable,
    echeance: a.echeance,
    priorite: a.priorite,
  }));

  const decisions = keyParagraphs
    .filter((p) => /\b(décid|décision|convenu|retenu|approuv|valid|acté)\b/i.test(p))
    .map((p) => ({ description: p.slice(0, 300), responsable: '' }));

  const pointsAbordes = sections.filter((s) => s.title.length > 5).slice(0, 15).map((s) => s.title);

  return {
    documentType: 'compte_rendu',
    confidence: classification.confidence,
    extractedData: {
      reunion: {
        type: 'Reunion de chantier',
        date: dates[0]?.value || new Date().toISOString().split('T')[0],
        lieu: 'A preciser',
        participants: people.map((p) => ({ nom: p.name, present: true, role: p.role })),
      },
      ...(pointsAbordes.length > 0 && { pointsAbordes }),
      decisions: decisions.length > 0 ? decisions : [],
      actionsIssues,
      ...(keyParagraphs.length > 0 && {
        resumeParParagraphe: keyParagraphs.slice(0, 10).map((p) => p.slice(0, 300)),
      }),
      ...commonData,
      contenuExtrait: textPreview,
      _warning: 'Extraction en mode hors-ligne - verifier et completer les donnees',
    },
  };
}

function buildBailResult(
  classification: { type: IADocumentType; confidence: number },
  dates: ExtractedDate[],
  amounts: ExtractedAmount[],
  people: ExtractedPerson[],
  commonData: Record<string, unknown>,
  textPreview: string,
): ExtractionResult {
  const loyerAmount = amounts.find((a) => a.type === 'loyer') || amounts.find((a) => a.context.toLowerCase().includes('loyer'));
  const chargesAmount = amounts.find((a) => a.type === 'charge') || amounts.find((a) => a.context.toLowerCase().includes('charge'));
  const depotAmount = amounts.find((a) => a.context.toLowerCase().includes('dépôt') || a.context.toLowerCase().includes('depot') || a.context.toLowerCase().includes('garantie'));

  return {
    documentType: 'bail_commercial',
    confidence: classification.confidence,
    extractedData: {
      parties: {
        bailleur: people[0]?.name || 'A identifier',
        preneur: { raisonSociale: people[1]?.name || 'A identifier', representant: people[2]?.name || '', fonction: '' },
      },
      local: { designation: 'A preciser', surface: 0, unite: 'm2' },
      conditions: {
        loyerMensuel: loyerAmount?.value || 0,
        chargesMensuelles: chargesAmount?.value || 0,
        devise: loyerAmount?.currency || 'XOF',
        dureeAns: 0,
        dateEffet: dates[0]?.value || '',
        depotGarantie: depotAmount?.value || 0,
      },
      ...commonData,
      contenuExtrait: textPreview,
      _warning: 'Extraction en mode hors-ligne - verifier les donnees',
    },
  };
}

function buildPVReceptionResult(
  classification: { type: IADocumentType; confidence: number },
  dates: ExtractedDate[],
  people: ExtractedPerson[],
  actions: ExtractedAction[],
  keyParagraphs: string[],
  commonData: Record<string, unknown>,
  textPreview: string,
): ExtractionResult {
  const reserveItems = actions.length > 0
    ? actions.map((a, i) => ({ numero: i + 1, description: a.description, localisation: '', delaiLevee: a.echeance }))
    : keyParagraphs.slice(0, 5).map((p, i) => ({ numero: i + 1, description: p.slice(0, 200), localisation: '', delaiLevee: '' }));

  return {
    documentType: 'pv_reception',
    confidence: classification.confidence,
    extractedData: {
      lot: { numero: 'A identifier', designation: 'A preciser', entreprise: people[0]?.name || '' },
      reception: { date: dates[0]?.value || '', type: 'provisoire', avecReserves: true },
      reserves: reserveItems,
      ...commonData,
      contenuExtrait: textPreview,
      _warning: 'Extraction en mode hors-ligne - verifier les donnees',
    },
  };
}

function buildDevisResult(
  classification: { type: IADocumentType; confidence: number },
  dates: ExtractedDate[],
  amounts: ExtractedAmount[],
  people: ExtractedPerson[],
  commonData: Record<string, unknown>,
  textPreview: string,
): ExtractionResult {
  const ttcAmount = amounts.find((a) => a.type === 'ttc');
  const sortedAmounts = [...amounts].sort((a, b) => b.value - a.value);
  const ttcProbable = ttcAmount?.value || sortedAmounts[0]?.value || 0;

  return {
    documentType: 'devis',
    confidence: classification.confidence,
    extractedData: {
      fournisseur: { nom: people[0]?.name || 'A identifier' },
      devis: { numero: '', date: dates[0]?.value || new Date().toISOString().split('T')[0] },
      montants: {
        ht: 0,
        tva: 0,
        ttc: ttcProbable,
        devise: ttcAmount?.currency || sortedAmounts[0]?.currency || 'XOF',
      },
      ...(amounts.length > 0 && {
        lignesDetectees: amounts.map((a) => ({ montant: a.value, contexte: a.context, type: a.type })),
      }),
      ...commonData,
      contenuExtrait: textPreview,
      _warning: 'Extraction en mode hors-ligne - verifier les donnees',
    },
  };
}

function buildAuditResult(
  classification: { type: IADocumentType; confidence: number },
  actions: ExtractedAction[],
  keyParagraphs: string[],
  commonData: Record<string, unknown>,
  textPreview: string,
): ExtractionResult {
  const constats = actions.length > 0
    ? actions.map((a) => ({ description: a.description, gravite: 'moyen' as const, responsable: a.responsable, confidence: a.confidence }))
    : keyParagraphs.slice(0, 10).map((p) => ({ description: p.slice(0, 200), gravite: 'moyen' as const, responsable: '', confidence: 0.4 }));

  return {
    documentType: 'rapport_audit',
    confidence: classification.confidence,
    extractedData: {
      constats,
      ...commonData,
      contenuExtrait: textPreview,
      _warning: 'Extraction en mode hors-ligne - verifier les donnees',
    },
  };
}

function buildPlanningResult(
  classification: { type: IADocumentType; confidence: number },
  actions: ExtractedAction[],
  keyParagraphs: string[],
  commonData: Record<string, unknown>,
  textPreview: string,
): ExtractionResult {
  const taches = actions.length > 0
    ? actions.map((a) => ({ description: a.description, responsable: a.responsable, echeance: a.echeance, confidence: a.confidence }))
    : keyParagraphs.slice(0, 10).map((p) => ({ description: p.slice(0, 200), responsable: '', echeance: '', confidence: 0.4 }));

  return {
    documentType: 'planning',
    confidence: classification.confidence,
    extractedData: {
      taches,
      ...commonData,
      contenuExtrait: textPreview,
      _warning: 'Extraction en mode hors-ligne - verifier les donnees',
    },
  };
}

function buildCVResult(
  classification: { type: IADocumentType; confidence: number },
  people: ExtractedPerson[],
  sections: ExtractedSection[],
  commonData: Record<string, unknown>,
  textPreview: string,
): ExtractionResult {
  return {
    documentType: 'cv',
    confidence: classification.confidence,
    extractedData: {
      identite: {
        nom: people[0]?.name || 'A identifier',
        prenom: '',
        email: people[0]?.email,
        telephone: people[0]?.phone,
      },
      competences: sections.slice(0, 10).map((s) => s.title),
      ...commonData,
      contenuExtrait: textPreview,
      _warning: 'Extraction en mode hors-ligne - verifier les donnees',
    },
  };
}

// ============================================================================
// Extraction de texte depuis fichier
// ============================================================================

/**
 * Extraire le texte d'un fichier pour l'analyse
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const mimeType = file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();

  // Pour les fichiers texte et CSV
  if (mimeType.includes('text') || mimeType.includes('csv') || ext === 'csv') {
    return await file.text();
  }

  // Pour les fichiers PDF
  if (mimeType.includes('pdf') || ext === 'pdf') {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString();

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const lines: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        if (pageText.trim()) {
          lines.push(pageText);
        }
      }

      return lines.join('\n') || `[PDF: ${file.name}] - Aucun texte extractible`;
    } catch (e) {
      console.error('Erreur extraction PDF:', e);
      return `[PDF: ${file.name}] - Erreur lors de l'extraction`;
    }
  }

  // Pour les fichiers Word (.docx)
  if (mimeType.includes('word') || mimeType.includes('document') || ext === 'docx' || ext === 'doc') {
    try {
      const mammoth = await import('mammoth');
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value || `[Word: ${file.name}] - Aucun texte extractible`;
    } catch (e) {
      console.error('Erreur extraction Word:', e);
      return `[Word: ${file.name}] - Erreur lors de l'extraction`;
    }
  }

  // Pour les fichiers Excel (.xls, .xlsx)
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || ext === 'xlsx' || ext === 'xls') {
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const lines: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        lines.push(`--- Feuille: ${sheetName} ---`);
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });
        for (const row of jsonData) {
          const values = Object.values(row).filter((v) => v !== null && v !== undefined && v !== '');
          if (values.length > 0) {
            lines.push(values.join(' | '));
          }
        }
      }

      return lines.join('\n') || `[Excel: ${file.name}] - Aucun contenu extractible`;
    } catch (e) {
      console.error('Erreur extraction Excel:', e);
      return `[Excel: ${file.name}] - Erreur lors de l'extraction`;
    }
  }

  // Pour les fichiers PowerPoint (.pptx)
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || ext === 'pptx' || ext === 'ppt') {
    try {
      const JSZip = (await import('jszip')).default;
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const lines: string[] = [];

      const slideFiles = Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
          return numA - numB;
        });

      for (const slidePath of slideFiles) {
        const slideNum = slidePath.match(/slide(\d+)/)?.[1];
        const xml = await zip.files[slidePath].async('text');
        const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
        if (textMatches) {
          const slideText = textMatches
            .map((m) => m.replace(/<\/?a:t>/g, ''))
            .filter((t) => t.trim())
            .join(' ');
          if (slideText.trim()) {
            lines.push(`--- Slide ${slideNum} ---`);
            lines.push(slideText);
          }
        }
      }

      return lines.join('\n') || `[PowerPoint: ${file.name}] - Aucun texte extractible`;
    } catch (e) {
      console.error('Erreur extraction PowerPoint:', e);
      return `[PowerPoint: ${file.name}] - Erreur lors de l'extraction`;
    }
  }

  // Pour les images, on renvoie juste le nom (OCR a implementer)
  if (mimeType.includes('image')) {
    return `[Image: ${file.name}] - OCR requis pour extraction`;
  }

  return `[Fichier: ${file.name}] - Type non supporte pour extraction automatique`;
}
