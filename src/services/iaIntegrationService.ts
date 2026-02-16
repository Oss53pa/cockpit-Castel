import { createAction } from '@/hooks/useActions';
import { createBudgetItem } from '@/hooks/useBudget';
import { createRisque } from '@/hooks/useRisques';
import { createJalon } from '@/hooks/useJalons';
import { saveIAIntegration, integrateIAImport } from '@/hooks/useImportIA';
import type { IADocumentType, IATargetModule } from '@/types';
import { logger } from '@/lib/logger';

/**
 * Résultat d'une intégration IA dans les modules cibles
 */
export interface IntegrationResult {
  success: boolean;
  documentType: IADocumentType;
  targetModule: IATargetModule;
  targetModules: IATargetModule[];
  records: Array<{
    type: 'action' | 'budget' | 'risque' | 'jalon' | 'integration';
    id: number;
    label: string;
    module: IATargetModule;
  }>;
  error?: string;
}

/**
 * Détecte automatiquement les modules pertinents selon le type de document et les données extraites.
 * Retourne les modules recommandés (auto-cochés) dans l'interface.
 */
export function getAutoDetectedModules(
  documentType: IADocumentType,
  extractedData: Record<string, unknown>,
): IATargetModule[] {
  const modules: IATargetModule[] = [];

  // Actions: compte_rendu, pv_reception, planning ont des actions
  if (['compte_rendu', 'pv_reception', 'planning'].includes(documentType)) {
    modules.push('actions');
  }
  // Jalons: planning, pv_reception, compte_rendu peuvent avoir des jalons
  if (['planning', 'pv_reception', 'compte_rendu'].includes(documentType)) {
    modules.push('jalons');
  }
  // Budget: facture, devis, bail_commercial ont des montants
  if (['facture', 'devis', 'bail_commercial'].includes(documentType)) {
    modules.push('budget');
  }
  // Risques: rapport_audit a des constats
  if (documentType === 'rapport_audit') {
    modules.push('risques');
  }

  // Détection dynamique via les données extraites
  if (modules.length === 0) {
    const keys = Object.keys(extractedData);
    const text = JSON.stringify(extractedData).toLowerCase();

    if (keys.some((k) => ['actionsIssues', 'actions', 'taches', 'reserves'].includes(k)) || text.includes('action')) {
      modules.push('actions');
    }
    if (keys.some((k) => ['montants', 'loyer', 'prix', 'facture', 'devis'].includes(k)) || text.includes('montant') || text.includes('prix')) {
      modules.push('budget');
    }
    if (keys.some((k) => ['constats', 'risques', 'nonConformites'].includes(k)) || text.includes('risque') || text.includes('non-conformit')) {
      modules.push('risques');
    }
    if (keys.some((k) => ['jalons', 'phases', 'etapes', 'planning'].includes(k)) || text.includes('jalon') || text.includes('milestone')) {
      modules.push('jalons');
    }
  }

  // Fallback: si rien détecté, proposer documents
  if (modules.length === 0) {
    modules.push('documents');
  }

  return modules;
}

// ============================================================================
// Helpers
// ============================================================================

function toStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

function toNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return val;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function generateRef(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${prefix}-${year}-${rand}`;
}

// ============================================================================
// Intégration vers Actions
// ============================================================================

async function integrateToActions(
  importId: number,
  extractedData: Record<string, unknown>,
  documentType: IADocumentType,
): Promise<IntegrationResult['records']> {
  const records: IntegrationResult['records'] = [];
  const items: Array<{ description: string; responsable?: string; echeance?: string; priorite?: string }> = [];

  if (documentType === 'compte_rendu') {
    const actionsIssues = extractedData.actionsIssues as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(actionsIssues)) {
      for (const a of actionsIssues) {
        items.push({
          description: toStr(a.description || a.action),
          responsable: toStr(a.responsable),
          echeance: toStr(a.echeance),
          priorite: toStr(a.priorite),
        });
      }
    }
  } else if (documentType === 'pv_reception') {
    const reserves = extractedData.reserves as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(reserves)) {
      for (const r of reserves) {
        items.push({
          description: `Lever réserve : ${toStr(r.description || r.localisation || r.lot)}`,
          responsable: toStr(r.entreprise || r.responsable),
          echeance: toStr(r.delaiLevee),
        });
      }
    }
  } else if (documentType === 'planning') {
    const taches = (extractedData.taches || extractedData.lignes || extractedData.phases) as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(taches)) {
      for (const t of taches) {
        items.push({
          description: toStr(t.description || t.titre || t.nom),
          responsable: toStr(t.responsable),
          echeance: toStr(t.fin || t.echeance || t.dateFin),
          priorite: toStr(t.priorite),
        });
      }
    }
  }

  for (const item of items) {
    const titre = item.description.length > 100
      ? item.description.slice(0, 97) + '...'
      : item.description;

    const prioriteMap: Record<string, 'critique' | 'haute' | 'moyenne' | 'basse'> = {
      critique: 'critique',
      haute: 'haute',
      moyenne: 'moyenne',
      basse: 'basse',
      high: 'haute',
      medium: 'moyenne',
      low: 'basse',
    };
    const priorite = prioriteMap[item.priorite?.toLowerCase() || ''] || 'moyenne';

    const dateDebut = today();
    const dateFin = item.echeance || futureDate(30);

    const actionId = await createAction({
      id_action: generateRef('ACT'),
      code_wbs: generateRef('WBS-ACT'),
      titre,
      description: item.description.slice(0, 500),
      axe: 'axe3_technique',
      phase: 'execution',
      categorie: 'technique',
      sous_categorie: null,
      type_action: 'tache',
      date_creation: today(),
      date_debut_prevue: dateDebut,
      date_fin_prevue: dateFin,
      date_debut_reelle: null,
      date_fin_reelle: null,
      duree_prevue_jours: Math.max(1, Math.round((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / 86400000)),
      duree_reelle_jours: null,
      date_butoir: null,
      flexibilite: 'moyenne',
      alerte_j30: null,
      alerte_j15: null,
      alerte_j7: null,
      alerte_j3: null,
      responsable: item.responsable || 'À assigner',
      responsableId: 1,
      approbateur: 'Direction',
      consultes: [],
      informes: [],
      delegue: null,
      escalade_niveau1: 'Chef de projet',
      escalade_niveau2: 'Directeur',
      escalade_niveau3: 'DG',
      predecesseurs: [],
      successeurs: [],
      contraintes_externes: null,
      chemin_critique: false,
      jalonId: null,
      ressources_humaines: item.responsable ? [item.responsable] : [],
      charge_homme_jour: null,
      budget_prevu: null,
      budget_engage: null,
      budget_realise: null,
      ligne_budgetaire: null,
      livrables: [],
      criteres_acceptation: [],
      validateur_qualite: null,
      documents: [],
      lien_sharepoint: null,
      modele_document: null,
      statut: 'a_faire',
      avancement: 0,
      methode_avancement: 'manuel',
      tendance: 'stable',
      sante: 'gris',
      notes_internes: `Import IA - ${documentType}`,
      commentaire_reporting: null,
      historique_commentaires: [],
      visibilite_reporting: ['flash_hebdo'],
      risques_associes: [],
      problemes_ouverts: [],
      points_blocage: null,
      escalade_requise: false,
      niveau_escalade: null,
      priorite,
      score_priorite: null,
      impact_si_retard: 'modere',
      version: 1,
      date_modification: today(),
      modifie_par: 'Import IA',
      motif_modification: null,
    });

    await saveIAIntegration({
      importId,
      targetModule: 'actions',
      targetTable: 'actions',
      recordId: actionId,
      action: 'INSERT',
      data: { titre, description: item.description },
      integratedBy: 1,
    });

    records.push({
      type: 'action',
      id: actionId,
      label: `Action créée : ${titre}`,
      module: 'actions',
    });
  }

  return records;
}

// ============================================================================
// Intégration vers Budget
// ============================================================================

async function integrateToBudget(
  importId: number,
  extractedData: Record<string, unknown>,
  documentType: IADocumentType,
): Promise<IntegrationResult['records']> {
  const records: IntegrationResult['records'] = [];

  if (documentType === 'facture' || documentType === 'devis') {
    const montants = extractedData.montants as Record<string, unknown> | undefined;
    const facture = (extractedData.facture || extractedData.devis) as Record<string, unknown> | undefined;
    const fournisseur = extractedData.fournisseur as Record<string, unknown> | undefined;
    const objet = toStr(extractedData.objet || extractedData.description || '');

    const ttc = toNum(montants?.ttc);
    const ht = toNum(montants?.ht);
    const numero = toStr(facture?.numero);
    const fournisseurNom = toStr(fournisseur?.nom || fournisseur?.raisonSociale);

    const libelle = [
      documentType === 'facture' ? 'Facture' : 'Devis',
      fournisseurNom,
      numero ? `#${numero}` : '',
      objet ? `- ${objet}` : '',
    ].filter(Boolean).join(' ').slice(0, 200);

    const montantRealise = documentType === 'facture' ? (ttc || ht) : 0;
    const montantPrevu = documentType === 'devis' ? (ttc || ht) : (ttc || ht);

    const budgetId = await createBudgetItem({
      libelle,
      categorie: 'divers',
      axe: 'axe4_budget',
      montantPrevu,
      montantEngage: documentType === 'facture' ? montantRealise : 0,
      montantRealise,
      dateEngagement: toStr(facture?.date) || today(),
      dateRealisation: documentType === 'facture' ? (toStr(facture?.date) || today()) : undefined,
      commentaire: `Import IA - ${documentType} ${fournisseurNom} ${numero}`.trim(),
    });

    await saveIAIntegration({
      importId,
      targetModule: 'budget',
      targetTable: 'budget',
      recordId: budgetId,
      action: 'INSERT',
      data: { libelle, montantPrevu, montantRealise },
      integratedBy: 1,
    });

    const devise = toStr(montants?.devise || 'XOF');
    records.push({
      type: 'budget',
      id: budgetId,
      label: `Budget créé : ${libelle} — ${(ttc || ht).toLocaleString('fr-FR')} ${devise}`,
      module: 'budget',
    });

    // Si facture avec lignes détaillées, on crée aussi des sous-items
    const lignes = extractedData.lignes as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(lignes) && lignes.length > 1) {
      for (const ligne of lignes) {
        const descLigne = toStr(ligne.description || ligne.designation);
        const montantLigne = toNum(ligne.montant || ligne.prixUnitaire);
        if (!descLigne || montantLigne === 0) continue;

        const ligneId = await createBudgetItem({
          libelle: `${fournisseurNom} - ${descLigne}`.slice(0, 200),
          categorie: 'divers',
          axe: 'axe4_budget',
          montantPrevu: montantLigne,
          montantEngage: documentType === 'facture' ? montantLigne : 0,
          montantRealise: documentType === 'facture' ? montantLigne : 0,
          commentaire: `Ligne détail - Import IA ${numero}`,
        });

        await saveIAIntegration({
          importId,
          targetModule: 'budget',
          targetTable: 'budget',
          recordId: ligneId,
          action: 'INSERT',
          data: { libelle: descLigne, montant: montantLigne },
          integratedBy: 1,
        });

        records.push({
          type: 'budget',
          id: ligneId,
          label: `Ligne budget : ${descLigne} — ${montantLigne.toLocaleString('fr-FR')} ${devise}`,
          module: 'budget',
        });
      }
    }
  } else if (documentType === 'bail_commercial') {
    const conditions = extractedData.conditions as Record<string, unknown> | undefined;
    const parties = extractedData.parties as Record<string, unknown> | undefined;
    const preneur = parties?.preneur as Record<string, unknown> | undefined;
    const bailleur = toStr(parties?.bailleur);

    const loyerMensuel = toNum(conditions?.loyerMensuel);
    const chargesMensuelles = toNum(conditions?.chargesMensuelles);
    const devise = toStr(conditions?.devise || 'XOF');
    const dureeAns = toNum(conditions?.dureeAns);
    const preneurNom = toStr(preneur?.raisonSociale || preneur?.nom);

    if (loyerMensuel > 0) {
      const loyerAnnuel = loyerMensuel * 12;
      const libelle = `Bail ${preneurNom || bailleur} - Loyer annuel`.slice(0, 200);

      const budgetId = await createBudgetItem({
        libelle,
        categorie: 'divers',
        axe: 'axe2_commercial',
        montantPrevu: loyerAnnuel * Math.max(1, dureeAns),
        montantEngage: loyerAnnuel,
        montantRealise: 0,
        commentaire: `Bail commercial - Loyer mensuel: ${loyerMensuel.toLocaleString('fr-FR')} ${devise}, Charges: ${chargesMensuelles.toLocaleString('fr-FR')} ${devise}`,
      });

      await saveIAIntegration({
        importId,
        targetModule: 'budget',
        targetTable: 'budget',
        recordId: budgetId,
        action: 'INSERT',
        data: { libelle, loyerMensuel, chargesMensuelles, dureeAns },
        integratedBy: 1,
      });

      records.push({
        type: 'budget',
        id: budgetId,
        label: `Budget bail : ${libelle} — ${loyerMensuel.toLocaleString('fr-FR')} ${devise}/mois`,
        module: 'budget',
      });
    }
  }

  return records;
}

// ============================================================================
// Intégration vers Risques
// ============================================================================

async function integrateToRisques(
  importId: number,
  extractedData: Record<string, unknown>,
  documentType: IADocumentType,
): Promise<IntegrationResult['records']> {
  const records: IntegrationResult['records'] = [];

  if (documentType !== 'rapport_audit') return records;

  const constats = (extractedData.constats || extractedData.observations || extractedData.nonConformites) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(constats)) return records;

  for (const constat of constats) {
    const titre = toStr(constat.titre || constat.description || constat.constat).slice(0, 100);
    const description = toStr(constat.description || constat.detail || constat.constat).slice(0, 500);
    if (!titre) continue;

    const graviteLookup: Record<string, 1 | 2 | 3 | 4> = {
      faible: 1, mineur: 1, low: 1,
      moyen: 2, modere: 2, medium: 2,
      eleve: 3, majeur: 3, high: 3, important: 3,
      critique: 4, critical: 4, grave: 4,
    };
    const gravite = toStr(constat.gravite || constat.niveau || constat.severite).toLowerCase();
    const impact: 1 | 2 | 3 | 4 = graviteLookup[gravite] || 2;
    const probabilite: 1 | 2 | 3 | 4 = graviteLookup[gravite] || 2;

    const risqueId = await createRisque({
      id_risque: generateRef('R'),
      code_wbs: generateRef('WBS-RSK'),
      titre,
      description,
      type_risque: 'menace',
      source_risque: 'interne',
      categorie: 'technique',
      sous_categorie: null,
      axe_impacte: 'axe3_technique',
      date_identification: today(),
      identifie_par: 'Import IA',
      probabilite_initiale: probabilite,
      impact_initial: impact,
      score_initial: probabilite * impact,
      probabilite_actuelle: probabilite,
      impact_actuel: impact,
      score_actuel: probabilite * impact,
      tendance_risque: 'stable',
      detectabilite: 2,
      velocite: 'moyenne',
      proximite: 'court_terme',
      impact_cout: null,
      impact_delai_jours: null,
      impact_qualite: impact >= 3 ? 'significatif' : 'modere',
      impact_reputation: 'faible',
      impact_securite: 'faible',
      description_impact: description,
      statut: 'ouvert',
      phase_traitement: 'identification',
      date_derniere_evaluation: today(),
      prochaine_revue: futureDate(30),
      proprietaire: toStr(constat.responsable) || 'À assigner',
      gestionnaire: null,
      validateur: 'Direction',
      equipe_response: [],
      escalade_niveau1: 'Chef de projet',
      escalade_niveau2: 'Directeur',
      escalade_niveau3: 'DG',
      strategie_reponse: 'attenuer',
      plan_mitigation: toStr(constat.recommandation || constat.actionCorrective) || null,
      actions_mitigation: [],
      cout_mitigation: null,
      efficacite_prevue: null,
      plan_contingence: null,
      declencheur_contingence: null,
      cout_contingence: null,
      actions_contingence: [],
      jalons_impactes: [],
      actions_liees: [],
      risques_lies: [],
      opportunites_liees: [],
      documents: [],
      lien_sharepoint: null,
      historique: [{
        date: today(),
        probabilite,
        impact,
        score: probabilite * impact,
        commentaire: `Identifié via Import IA - ${documentType}`,
        auteur: 'Import IA',
      }],
      alertes_actives: impact >= 3,
      seuil_alerte_score: 8,
      canal_alerte: ['app'],
      notifier: [],
      version: 1,
      date_creation: today(),
      cree_par: 'Import IA',
      derniere_modification: today(),
      modifie_par: 'Import IA',
      // Fields used by createRisque for score calculation
      probabilite,
      impact,
    } as never);

    await saveIAIntegration({
      importId,
      targetModule: 'risques',
      targetTable: 'risques',
      recordId: risqueId,
      action: 'INSERT',
      data: { titre, probabilite, impact },
      integratedBy: 1,
    });

    records.push({
      type: 'risque',
      id: risqueId,
      label: `Risque créé : ${titre} (score ${probabilite * impact})`,
      module: 'risques',
    });
  }

  return records;
}

// ============================================================================
// Intégration vers Jalons
// ============================================================================

async function integrateToJalons(
  importId: number,
  extractedData: Record<string, unknown>,
  documentType: IADocumentType,
): Promise<IntegrationResult['records']> {
  const records: IntegrationResult['records'] = [];
  const items: Array<{ titre: string; description?: string; date?: string; responsable?: string }> = [];

  if (documentType === 'planning') {
    const phases = (extractedData.phases || extractedData.etapes || extractedData.jalons) as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(phases)) {
      for (const p of phases) {
        items.push({
          titre: toStr(p.titre || p.nom || p.description).slice(0, 100),
          description: toStr(p.description || p.detail).slice(0, 500),
          date: toStr(p.date || p.dateFin || p.echeance),
          responsable: toStr(p.responsable),
        });
      }
    }
    // Si pas de phases explicites mais des tâches, créer un jalon par lot de tâches
    if (items.length === 0) {
      const taches = (extractedData.taches || extractedData.lignes) as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(taches) && taches.length > 0) {
        items.push({
          titre: `Jalon planning - ${toStr(extractedData.titre || extractedData.objet || 'Import IA')}`.slice(0, 100),
          description: `Planning avec ${taches.length} tâche(s) importé via IA`,
          date: toStr(taches[taches.length - 1]?.fin || taches[taches.length - 1]?.echeance),
        });
      }
    }
  } else if (documentType === 'pv_reception') {
    items.push({
      titre: `Réception - ${toStr(extractedData.objet || extractedData.chantier || 'PV Réception')}`.slice(0, 100),
      description: `PV de réception importé via IA. ${toStr(extractedData.avecReserves) === 'true' ? 'Avec réserves.' : 'Sans réserves.'}`,
      date: toStr((extractedData.reception as Record<string, unknown>)?.date) || today(),
    });
  } else if (documentType === 'compte_rendu') {
    const reunion = extractedData.reunion as Record<string, unknown> | undefined;
    if (reunion) {
      items.push({
        titre: `CR - ${toStr(reunion.type || reunion.objet || 'Réunion')}`.slice(0, 100),
        description: `Compte rendu de réunion du ${toStr(reunion.date)}`,
        date: toStr(reunion.date) || today(),
      });
    }
  }

  for (const item of items) {
    if (!item.titre) continue;

    const datePrevue = item.date || futureDate(30);

    const jalonId = await createJalon({
      id_jalon: generateRef('JAL'),
      code_wbs: generateRef('WBS-JAL'),
      titre: item.titre,
      description: item.description || item.titre,
      axe: 'axe3_technique',
      categorie: 'technique',
      type_jalon: 'technique',
      niveau_importance: 'standard',
      date_prevue: datePrevue,
      date_reelle: null,
      heure_cible: null,
      fuseau_horaire: 'Africa/Abidjan',
      date_butoir_absolue: null,
      flexibilite: 'moyenne',
      alerte_j30: futureDate(-30),
      alerte_j15: futureDate(-15),
      alerte_j7: futureDate(-7),
      statut: 'a_venir',
      avancement_prealables: 0,
      confiance_atteinte: 50,
      tendance: 'stable',
      date_derniere_maj: today(),
      maj_par: 'Import IA',
      responsable: item.responsable || 'À assigner',
      validateur: 'Direction',
      contributeurs: [],
      parties_prenantes: [],
      escalade_niveau1: 'Chef de projet',
      escalade_niveau2: 'Directeur',
      escalade_niveau3: 'DG',
      predecesseurs: [],
      successeurs: [],
      actions_prerequises: [],
      chemin_critique: false,
      impact_retard: 'modere',
      cout_retard_jour: null,
      risques_associes: [],
      probabilite_atteinte: 50,
      plan_contingence: null,
      livrables: [],
      criteres_acceptation: [],
      budget_associe: null,
      budget_consomme: null,
      impact_financier_global: null,
      documents: [],
      lien_sharepoint: null,
      alertes_actives: true,
      canal_alerte: ['app'],
      frequence_rappel: 'quotidien',
      notifier: [],
      notes: `Import IA - ${documentType}`,
      commentaire_reporting: null,
      visibilite: ['flash_hebdo'],
      version: 1,
      date_creation: today(),
      cree_par: 'Import IA',
      derniere_modification: today(),
      modifie_par: 'Import IA',
    });

    await saveIAIntegration({
      importId,
      targetModule: 'jalons',
      targetTable: 'jalons',
      recordId: jalonId,
      action: 'INSERT',
      data: { titre: item.titre, datePrevue },
      integratedBy: 1,
    });

    records.push({
      type: 'jalon',
      id: jalonId,
      label: `Jalon créé : ${item.titre} — ${datePrevue}`,
      module: 'jalons',
    });
  }

  return records;
}

// ============================================================================
// Enregistrement générique dans iaIntegrations (pour types sans module dédié)
// ============================================================================

async function integrateGeneric(
  importId: number,
  extractedData: Record<string, unknown>,
  documentType: IADocumentType,
  targetModule: IATargetModule,
): Promise<IntegrationResult['records']> {
  const records: IntegrationResult['records'] = [];

  const integrationId = await saveIAIntegration({
    importId,
    targetModule,
    targetTable: 'iaIntegrations',
    recordId: importId,
    action: 'INSERT',
    data: extractedData,
    integratedBy: 1,
  });

  records.push({
    type: 'integration',
    id: integrationId,
    label: `Document ${documentType} enregistré dans ${targetModule}`,
    module: targetModule,
  });

  return records;
}

// ============================================================================
// Dispatch par module
// ============================================================================

/**
 * Intègre les données extraites dans UN module cible.
 */
async function integrateToModule(
  importId: number,
  targetModule: IATargetModule,
  extractedData: Record<string, unknown>,
  documentType: IADocumentType,
): Promise<IntegrationResult['records']> {
  if (targetModule === 'actions') {
    if (['compte_rendu', 'pv_reception', 'planning'].includes(documentType)) {
      return integrateToActions(importId, extractedData, documentType);
    }
  } else if (targetModule === 'jalons') {
    if (['planning', 'pv_reception', 'compte_rendu'].includes(documentType)) {
      return integrateToJalons(importId, extractedData, documentType);
    }
  } else if (targetModule === 'budget') {
    if (['facture', 'devis', 'bail_commercial'].includes(documentType)) {
      return integrateToBudget(importId, extractedData, documentType);
    }
  } else if (targetModule === 'risques') {
    if (documentType === 'rapport_audit') {
      return integrateToRisques(importId, extractedData, documentType);
    }
  }
  // Fallback: stockage générique
  return integrateGeneric(importId, extractedData, documentType, targetModule);
}

// ============================================================================
// Dispatch principal — un seul module (rétrocompatibilité)
// ============================================================================

/**
 * Intègre les données extraites d'un import IA dans le module cible.
 * Retourne un résultat détaillé avec les enregistrements créés.
 */
export async function integrateImport(
  importId: number,
  targetModule: IATargetModule,
  extractedData: Record<string, unknown>,
  documentType: IADocumentType,
): Promise<IntegrationResult> {
  try {
    let records = await integrateToModule(importId, targetModule, extractedData, documentType);

    // Si aucun record n'a été créé, enregistrer quand même en générique
    if (records.length === 0) {
      records = await integrateGeneric(importId, extractedData, documentType, targetModule);
    }

    // Marquer l'import comme intégré
    const recordIds = records.map((r) => r.id);
    await integrateIAImport(importId, recordIds, 1);

    return {
      success: true,
      documentType,
      targetModule,
      targetModules: [targetModule],
      records,
    };
  } catch (error) {
    logger.error('Erreur intégration IA:', error);
    return {
      success: false,
      documentType,
      targetModule,
      targetModules: [targetModule],
      records: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// ============================================================================
// Dispatch multi-modules
// ============================================================================

/**
 * Intègre les données extraites dans PLUSIEURS modules cibles simultanément.
 * Retourne un résultat combiné avec tous les enregistrements créés.
 */
export async function integrateImportMultiModule(
  importId: number,
  targetModules: IATargetModule[],
  extractedData: Record<string, unknown>,
  documentType: IADocumentType,
): Promise<IntegrationResult> {
  const allRecords: IntegrationResult['records'] = [];
  const errors: string[] = [];

  for (const module of targetModules) {
    try {
      const records = await integrateToModule(importId, module, extractedData, documentType);
      allRecords.push(...records);
    } catch (error) {
      logger.error(`Erreur intégration IA → ${module}:`, error);
      errors.push(`${module}: ${error instanceof Error ? error.message : 'Erreur'}`);
    }
  }

  // Si aucun enregistrement créé dans aucun module, enregistrer en générique
  if (allRecords.length === 0 && errors.length === 0) {
    const fallback = await integrateGeneric(importId, extractedData, documentType, targetModules[0] || 'documents');
    allRecords.push(...fallback);
  }

  // Marquer l'import comme intégré
  const recordIds = allRecords.map((r) => r.id);
  await integrateIAImport(importId, recordIds, 1);

  const hasErrors = errors.length > 0;
  const hasRecords = allRecords.length > 0;

  return {
    success: hasRecords && !hasErrors,
    documentType,
    targetModule: targetModules[0] || 'documents',
    targetModules,
    records: allRecords,
    error: hasErrors ? errors.join(' | ') : undefined,
  };
}
