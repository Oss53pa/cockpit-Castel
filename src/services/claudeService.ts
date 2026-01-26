/**
 * Claude API Service - Service d'extraction IA via l'API Claude
 *
 * Ce service remplace la simulation par des appels reels a l'API Claude
 * pour l'extraction intelligente de donnees a partir de documents.
 */

import type { IADocumentType } from '@/types';
import { API_ENDPOINTS } from '@/lib/apiEndpoints';

// Configuration API
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
const PROPHET_CONFIG_KEY = 'prophet_ai_config'; // Config partagee avec Prophet AI

/**
 * Recuperer la configuration Claude depuis le stockage securise
 * Reutilise la configuration Prophet AI si disponible
 */
export function getClaudeConfig(): ClaudeConfig | null {
  try {
    // D'abord verifier la config Claude dediee
    const claudeConfig = localStorage.getItem(CONFIG_KEY);
    if (claudeConfig) {
      return JSON.parse(claudeConfig);
    }

    // Sinon, reutiliser la config Prophet AI (Anthropic)
    const prophetConfig = localStorage.getItem(PROPHET_CONFIG_KEY);
    if (prophetConfig) {
      const parsed = JSON.parse(prophetConfig);
      // Utiliser la cle Anthropic de Prophet si configuree
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
 * Verifie la config Claude dediee ou la config Prophet AI
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
 * Extraire les donnees d'un document via l'API Claude
 */
export async function extractWithClaude(
  documentContent: string,
  mimeType: string
): Promise<ExtractionResult> {
  const config = getClaudeConfig();

  if (!config?.apiKey) {
    console.warn('API Claude non configuree, utilisation du mode simulation');
    return simulateFallbackExtraction(documentContent);
  }

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
        model: config.model || 'claude-sonnet-4-20250514',
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

    // Parser la reponse JSON
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

    // En cas d'erreur, utiliser le mode simulation
    return simulateFallbackExtraction(documentContent);
  }
}

/**
 * Extraction de secours basee sur des mots-cles (fallback)
 */
function simulateFallbackExtraction(
  documentText: string
): ExtractionResult {
  const lowerText = documentText.toLowerCase();

  if (lowerText.includes('facture') || lowerText.includes('ttc') || lowerText.includes('tva')) {
    return {
      documentType: 'facture',
      confidence: 0.75,
      extractedData: {
        fournisseur: { nom: 'Fournisseur detecte (mode hors-ligne)' },
        facture: {
          numero: 'F-AUTO-001',
          date: new Date().toISOString().split('T')[0],
        },
        montants: {
          ht: 0,
          tvaTaux: 18,
          tvaMontant: 0,
          ttc: 0,
          devise: 'XOF',
        },
        objet: 'A completer manuellement',
        _warning: 'Extraction en mode hors-ligne - verifier les donnees',
      },
    };
  }

  if (
    lowerText.includes('compte-rendu') ||
    lowerText.includes('reunion') ||
    lowerText.includes('participants')
  ) {
    return {
      documentType: 'compte_rendu',
      confidence: 0.70,
      extractedData: {
        reunion: {
          type: 'A identifier',
          date: new Date().toISOString().split('T')[0],
          lieu: 'A preciser',
          participants: [],
        },
        decisions: [],
        actionsIssues: [],
        _warning: 'Extraction en mode hors-ligne - verifier les donnees',
      },
    };
  }

  if (lowerText.includes('bail') || lowerText.includes('loyer') || lowerText.includes('preneur')) {
    return {
      documentType: 'bail_commercial',
      confidence: 0.70,
      extractedData: {
        parties: {
          bailleur: 'A identifier',
          preneur: { raisonSociale: 'A identifier', representant: '', fonction: '' },
        },
        local: { designation: 'A preciser', surface: 0, unite: 'm2' },
        conditions: {
          loyerMensuel: 0,
          chargesMensuelles: 0,
          devise: 'XOF',
          dureeAns: 0,
          dateEffet: '',
        },
        _warning: 'Extraction en mode hors-ligne - verifier les donnees',
      },
    };
  }

  if (lowerText.includes('reception') || lowerText.includes('reserve') || lowerText.includes('lot')) {
    return {
      documentType: 'pv_reception',
      confidence: 0.70,
      extractedData: {
        lot: { numero: 'A identifier', designation: 'A preciser', entreprise: '' },
        reception: { date: '', type: 'provisoire', avecReserves: true },
        reserves: [],
        _warning: 'Extraction en mode hors-ligne - verifier les donnees',
      },
    };
  }

  return {
    documentType: 'autre',
    confidence: 0.40,
    extractedData: {
      contenu: 'Document non classifie automatiquement',
      _warning: 'Classification automatique impossible - mode hors-ligne',
    },
  };
}

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

      // Les fichiers PPTX sont des archives ZIP contenant des XML
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
        // Extraire le texte des balises <a:t>
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
