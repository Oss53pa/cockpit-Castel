import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type {
  IAImport,
  IAFile,
  IAImportStatus,
  IADocumentType,
  IATargetModule,
  IAStats,
} from '@/types';
import { integrateImport, type IntegrationResult } from '@/services/iaIntegrationService';

/**
 * Hook pour récupérer tous les imports
 */
export function useIAImports(options?: {
  status?: IAImportStatus;
  documentType?: IADocumentType;
  limit?: number;
}) {
  return useLiveQuery(async () => {
    const query = db.iaImports.orderBy('createdAt').reverse();

    const imports = await query.toArray();

    let filtered = imports;

    if (options?.status) {
      filtered = filtered.filter((i) => i.status === options.status);
    }

    if (options?.documentType) {
      filtered = filtered.filter((i) => i.documentType === options.documentType);
    }

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }, [options?.status, options?.documentType, options?.limit]) ?? [];
}

/**
 * Hook pour récupérer un import par ID
 */
export function useIAImport(id: number | null) {
  return useLiveQuery(async () => {
    if (!id) return null;
    return db.iaImports.get(id);
  }, [id]);
}

/**
 * Hook pour récupérer les imports en attente de validation
 */
export function useIAPendingImports() {
  return useLiveQuery(async () => {
    return db.iaImports.filter((i) => i.status === 'ready').toArray();
  }) ?? [];
}

/**
 * Hook pour récupérer les imports en cours de traitement
 */
export function useIAProcessingImports() {
  return useLiveQuery(async () => {
    return db.iaImports
      .filter((i) => ['uploading', 'processing', 'ocr', 'analyzing'].includes(i.status))
      .toArray();
  }) ?? [];
}

/**
 * Hook pour récupérer les statistiques d'import
 */
export function useIAStats(): IAStats {
  const stats = useLiveQuery(async () => {
    const imports = await db.iaImports.toArray();

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const importsByStatus: Record<IAImportStatus, number> = {
      uploading: 0,
      processing: 0,
      ocr: 0,
      analyzing: 0,
      ready: 0,
      validated: 0,
      integrated: 0,
      failed: 0,
    };

    const importsByType: Record<IADocumentType, number> = {
      facture: 0,
      devis: 0,
      compte_rendu: 0,
      bail_commercial: 0,
      pv_reception: 0,
      cv: 0,
      contrat_travail: 0,
      rapport_audit: 0,
      planning: 0,
      courrier_officiel: 0,
      photo_reserve: 0,
      doe: 0,
      autre: 0,
    };

    let totalConfidence = 0;
    let totalProcessingTime = 0;
    let successCount = 0;
    let thisWeek = 0;
    let thisMonth = 0;

    for (const imp of imports) {
      importsByStatus[imp.status]++;

      if (imp.documentType) {
        importsByType[imp.documentType]++;
      }

      if (imp.confidence) {
        totalConfidence += imp.confidence;
      }

      if (imp.processingTimeMs) {
        totalProcessingTime += imp.processingTimeMs;
      }

      if (imp.status === 'integrated' || imp.status === 'validated') {
        successCount++;
      }

      const createdAt = new Date(imp.createdAt);
      if (createdAt >= oneWeekAgo) {
        thisWeek++;
      }
      if (createdAt >= oneMonthAgo) {
        thisMonth++;
      }
    }

    return {
      totalImports: imports.length,
      importsByStatus,
      importsByType,
      avgConfidence: imports.length > 0 ? totalConfidence / imports.length : 0,
      avgProcessingTime: imports.length > 0 ? totalProcessingTime / imports.length : 0,
      successRate: imports.length > 0 ? (successCount / imports.length) * 100 : 0,
      thisWeek,
      thisMonth,
    };
  });

  return stats ?? {
    totalImports: 0,
    importsByStatus: {
      uploading: 0,
      processing: 0,
      ocr: 0,
      analyzing: 0,
      ready: 0,
      validated: 0,
      integrated: 0,
      failed: 0,
    },
    importsByType: {
      facture: 0,
      devis: 0,
      compte_rendu: 0,
      bail_commercial: 0,
      pv_reception: 0,
      cv: 0,
      contrat_travail: 0,
      rapport_audit: 0,
      planning: 0,
      courrier_officiel: 0,
      photo_reserve: 0,
      doe: 0,
      autre: 0,
    },
    avgConfidence: 0,
    avgProcessingTime: 0,
    successRate: 0,
    thisWeek: 0,
    thisMonth: 0,
  };
}

/**
 * Générer une référence d'import unique
 */
function generateImportRef(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, '0');
  return `IMP-${year}-${random}`;
}

/**
 * Créer un nouvel import
 */
export async function createIAImport(data: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdBy: number;
}): Promise<number> {
  const importRef = generateImportRef();

  return db.iaImports.add({
    importRef,
    filename: data.filename,
    mimeType: data.mimeType,
    sizeBytes: data.sizeBytes,
    hashSHA256: undefined,
    status: 'uploading',
    progress: 0,
    documentType: null,
    confidence: 0,
    ocrApplied: false,
    languageDetected: 'fr',
    modelVersion: 'claude-sonnet-4-20250514',
    processingTimeMs: 0,
    extractedData: null,
    targetModule: null,
    integratedRecordIds: [],
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy,
    validatedAt: null,
    validatedBy: null,
    errorCode: null,
    errorMessage: null,
  });
}

/**
 * Mettre à jour le statut d'un import
 */
export async function updateIAImportStatus(
  id: number,
  status: IAImportStatus,
  progress?: number
): Promise<void> {
  const updates: Partial<IAImport> = { status };

  if (progress !== undefined) {
    updates.progress = progress;
  }

  if (status === 'failed') {
    updates.progress = 0;
  }

  if (status === 'integrated' || status === 'validated') {
    updates.progress = 100;
  }

  await db.iaImports.update(id, updates);
}

/**
 * Mettre à jour les données extraites
 */
export async function updateIAImportExtraction(
  id: number,
  data: {
    documentType: IADocumentType;
    confidence: number;
    extractedData: Record<string, unknown>;
    ocrApplied?: boolean;
    processingTimeMs?: number;
  }
): Promise<void> {
  await db.iaImports.update(id, {
    documentType: data.documentType,
    confidence: data.confidence,
    extractedData: data.extractedData,
    ocrApplied: data.ocrApplied ?? false,
    processingTimeMs: data.processingTimeMs ?? 0,
    status: 'ready',
    progress: 100,
  });
}

/**
 * Valider un import
 */
export async function validateIAImport(
  id: number,
  validatedBy: number,
  targetModule: IATargetModule
): Promise<void> {
  await db.iaImports.update(id, {
    status: 'validated',
    validatedAt: new Date().toISOString(),
    validatedBy,
    targetModule,
  });
}

/**
 * Valider et intégrer un import en une seule opération.
 * Valide l'import, puis appelle le service d'intégration pour créer
 * les enregistrements dans les modules cibles.
 */
export async function validateAndIntegrateIAImport(
  id: number,
  validatedBy: number,
  targetModule: IATargetModule
): Promise<IntegrationResult> {
  // 1. Marquer comme validé
  await db.iaImports.update(id, {
    status: 'validated',
    validatedAt: new Date().toISOString(),
    validatedBy,
    targetModule,
  });

  // 2. Récupérer les données de l'import
  const imp = await db.iaImports.get(id);
  if (!imp || !imp.extractedData || !imp.documentType) {
    return {
      success: false,
      documentType: imp?.documentType || 'autre',
      targetModule,
      records: [],
      error: 'Données extraites non disponibles',
    };
  }

  // 3. Intégrer dans le module cible
  return integrateImport(id, targetModule, imp.extractedData, imp.documentType);
}

/**
 * Marquer un import comme intégré
 */
export async function integrateIAImport(
  id: number,
  recordIds: number[],
  integratedBy: number
): Promise<void> {
  await db.iaImports.update(id, {
    status: 'integrated',
    integratedRecordIds: recordIds,
    validatedAt: new Date().toISOString(),
    validatedBy: integratedBy,
  });
}

/**
 * Marquer un import comme échoué
 */
export async function failIAImport(
  id: number,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  await db.iaImports.update(id, {
    status: 'failed',
    errorCode,
    errorMessage,
    progress: 0,
  });
}

/**
 * Supprimer un import
 */
export async function deleteIAImport(id: number): Promise<void> {
  await db.transaction('rw', [db.iaImports, db.iaExtractions, db.iaIntegrations, db.iaFiles], async () => {
    await db.iaExtractions.where('importId').equals(id).delete();
    await db.iaIntegrations.where('importId').equals(id).delete();
    await db.iaFiles.where('importId').equals(id).delete();
    await db.iaImports.delete(id);
  });
}

/**
 * Sauvegarder un fichier associé à un import
 */
export async function saveIAFile(
  importId: number,
  file: File
): Promise<number> {
  return db.iaFiles.add({
    importId,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    dataBlob: file,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Récupérer le fichier d'un import
 */
export async function getIAFile(importId: number): Promise<IAFile | undefined> {
  return db.iaFiles.where('importId').equals(importId).first();
}

/**
 * Enregistrer une correction utilisateur
 */
export async function saveIAExtraction(data: {
  importId: number;
  field: string;
  originalValue: unknown;
  correctedValue: unknown;
  correctedBy: number;
}): Promise<number> {
  return db.iaExtractions.add({
    importId: data.importId,
    field: data.field,
    originalValue: data.originalValue,
    correctedValue: data.correctedValue,
    correctedAt: new Date().toISOString(),
    correctedBy: data.correctedBy,
  });
}

/**
 * Enregistrer une intégration
 */
export async function saveIAIntegration(data: {
  importId: number;
  targetModule: IATargetModule;
  targetTable: string;
  recordId: number;
  action: 'INSERT' | 'UPDATE';
  data: Record<string, unknown>;
  integratedBy: number;
}): Promise<number> {
  return db.iaIntegrations.add({
    importId: data.importId,
    targetModule: data.targetModule,
    targetTable: data.targetTable,
    recordId: data.recordId,
    action: data.action,
    data: data.data,
    integratedAt: new Date().toISOString(),
    integratedBy: data.integratedBy,
  });
}

/**
 * Récupérer les intégrations d'un import
 */
export function useIAIntegrations(importId: number | null) {
  return useLiveQuery(async () => {
    if (!importId) return [];
    return db.iaIntegrations.where('importId').equals(importId).toArray();
  }, [importId]) ?? [];
}

/**
 * Récupérer les corrections d'un import
 */
export function useIAExtractions(importId: number | null) {
  return useLiveQuery(async () => {
    if (!importId) return [];
    return db.iaExtractions.where('importId').equals(importId).toArray();
  }, [importId]) ?? [];
}

/**
 * Extraction IA via l'API Claude
 * Utilise le service claudeService pour les appels reels a l'API
 * Avec fallback automatique vers le mode simulation si API non configuree
 */
export { extractWithClaude as performAIExtraction } from '@/services/claudeService';

/**
 * Fonction d'extraction IA (wrapper pour compatibilite)
 * Appelle l'API Claude si configuree, sinon utilise le mode simulation
 */
export async function simulateAIExtraction(
  documentText: string,
  mimeType: string
): Promise<{
  documentType: IADocumentType;
  confidence: number;
  extractedData: Record<string, unknown>;
}> {
  // Importer dynamiquement pour eviter les dependances circulaires
  const { extractWithClaude, isClaudeConfigured } = await import('@/services/claudeService');

  // Utiliser l'API Claude si configuree
  if (isClaudeConfigured()) {
    return extractWithClaude(documentText, mimeType);
  }

  // Sinon, utiliser le mode simulation (fallback)
  console.info('API Claude non configuree - Mode simulation active');
  return extractWithClaude(documentText, mimeType);
}
