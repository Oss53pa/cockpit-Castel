import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Trash2,
  RefreshCw,
  Archive,
  Bot,
  Sparkles,
  FileSearch,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Download,
  X,
  ExternalLink,
  Eye,
  Database,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useIAImports,
  useIAPendingImports,
  useIAProcessingImports,
  useIAIntegrations,
  useIAStats,
  createIAImport,
  updateIAImportStatus,
  updateIAImportExtraction,
  validateAndIntegrateIAImport,
  deleteIAImport,
  saveIAFile,
  getIAFile,
  simulateAIExtraction,
} from '@/hooks';
import {
  IA_DOCUMENT_TYPE_LABELS,
  IA_TARGET_MODULES,
  IA_TARGET_MODULE_LABELS,
  IA_IMPORT_STATUS_LABELS,
  IA_IMPORT_STATUS_STYLES,
  IA_SUPPORTED_FORMATS,
  type IAImport,
  type IATargetModule,
} from '@/types';
import { useNavigate } from 'react-router-dom';
import { extractTextFromFile, AVAILABLE_MODELS, DEFAULT_MODEL } from '@/services/claudeService';
import { getAutoDetectedModules, type IntegrationResult } from '@/services/iaIntegrationService';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// Icônes par type de fichier
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('image')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return Presentation;
  return FileText;
};

// Composant Zone de dépôt
function UploadZone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.value = '';
  }, []);

  const filterFiles = useCallback((fileList: File[]) => {
    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of fileList) {
      const isFormatOk = IA_SUPPORTED_FORMATS.includes(file.type as (typeof IA_SUPPORTED_FORMATS)[number])
        || /\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|tiff?|csv)$/i.test(file.name);
      const isSizeOk = file.size <= MAX_FILE_SIZE;

      if (isFormatOk && isSizeOk) {
        accepted.push(file);
      } else if (!isFormatOk) {
        rejected.push(`${file.name} : format non supporté`);
      } else {
        rejected.push(`${file.name} : fichier trop volumineux (max 25 Mo)`);
      }
    }

    if (rejected.length > 0) {
      setError(rejected.join(', '));
      setTimeout(() => setError(null), 5000);
    }

    return accepted;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = filterFiles(Array.from(e.dataTransfer.files));
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, filterFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = filterFiles(Array.from(e.target.files || []));
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input pour permettre de re-sélectionner le même fichier
      e.target.value = '';
    },
    [onFilesSelected, filterFiles]
  );

  const handleBrowseClick = useCallback(() => {
    const input = document.getElementById('ia-file-input') as HTMLInputElement;
    input?.click();
  }, []);

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-2xl p-8 text-center transition-all',
        isDragOver
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50'
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
            isDragOver ? 'bg-indigo-100' : 'bg-neutral-100'
          )}
        >
          <Upload className={cn('w-8 h-8', isDragOver ? 'text-primary-600' : 'text-neutral-400')} />
        </div>

        <h3 className="text-lg font-medium text-neutral-900 mb-2">
          Glissez vos documents ici
        </h3>

        <p className="text-sm text-neutral-500 mb-4">ou</p>

        <input
          id="ia-file-input"
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.tiff,.csv"
          className="hidden"
          onChange={handleFileInput}
        />
        <Button variant="secondary" onClick={handleBrowseClick}>
          Parcourir
        </Button>

        <p className="text-xs text-neutral-400 mt-4">
          PDF, Word, Excel, PowerPoint, Images, Scans — Max 25 Mo/fichier
        </p>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant File en cours de traitement
function ProcessingFile({ imp }: { imp: IAImport }) {
  const FileIcon = getFileIcon(imp.mimeType);
  const styles = IA_IMPORT_STATUS_STYLES[imp.status];

  return (
    <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <FileIcon className="w-5 h-5 text-neutral-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{imp.filename}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${imp.progress}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500 whitespace-nowrap">
            {imp.progress}%
          </span>
        </div>
      </div>

      <Badge className={cn(styles.bg, styles.text, 'text-xs')}>
        {imp.status === 'analyzing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
        {IA_IMPORT_STATUS_LABELS[imp.status]}
      </Badge>
    </div>
  );
}

// Composant de prévisualisation de document
function DocumentPreview({ importId, mimeType, filename }: { importId: number; mimeType: string; filename: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      try {
        const file = await getIAFile(importId);
        if (file?.dataBlob) {
          const url = URL.createObjectURL(file.dataBlob);
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error('Erreur chargement preview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importId]);

  const handleDownload = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = filename;
      a.click();
    }
  };

  const isImage = mimeType.includes('image');
  const isPdf = mimeType.includes('pdf');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-700">Aperçu du document</p>
        <div className="flex items-center gap-1">
          {isImage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-neutral-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 w-7 p-0">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
          </div>
        ) : previewUrl ? (
          <div className="h-full overflow-auto">
            {isImage ? (
              <div className="flex items-center justify-center h-full p-2">
                <img
                  src={previewUrl}
                  alt={filename}
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>
            ) : isPdf ? (
              <iframe
                src={previewUrl}
                title={filename}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                <FileText className="w-12 h-12 mb-2" />
                <p className="text-sm">Aperçu non disponible</p>
                <p className="text-xs mt-1">{filename}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <FileText className="w-12 h-12 mb-2" />
            <p className="text-sm">Document non disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Labels lisibles pour les champs extraits
const FIELD_LABELS: Record<string, string> = {
  fournisseur: 'Fournisseur',
  nom: 'Nom',
  siret: 'SIRET',
  adresse: 'Adresse',
  telephone: 'Téléphone',
  email: 'Email',
  facture: 'Facture',
  numero: 'Numéro',
  date: 'Date',
  dateEcheance: 'Date échéance',
  montants: 'Montants',
  ht: 'HT',
  tvaTaux: 'Taux TVA',
  tvaMontant: 'Montant TVA',
  ttc: 'TTC',
  devise: 'Devise',
  objet: 'Objet',
  lignes: 'Lignes',
  description: 'Description',
  quantite: 'Quantité',
  prixUnitaire: 'Prix unitaire',
  montant: 'Montant',
  reunion: 'Réunion',
  type: 'Type',
  lieu: 'Lieu',
  participants: 'Participants',
  present: 'Présent',
  decisions: 'Décisions',
  actionsIssues: 'Actions issues',
  responsable: 'Responsable',
  echeance: 'Échéance',
  priorite: 'Priorité',
  parties: 'Parties',
  bailleur: 'Bailleur',
  preneur: 'Preneur',
  raisonSociale: 'Raison sociale',
  representant: 'Représentant',
  fonction: 'Fonction',
  local: 'Local',
  designation: 'Désignation',
  surface: 'Surface',
  unite: 'Unité',
  niveau: 'Niveau',
  zone: 'Zone',
  conditions: 'Conditions',
  loyerMensuel: 'Loyer mensuel',
  chargesMensuelles: 'Charges mensuelles',
  dureeAns: 'Durée (ans)',
  dateEffet: 'Date effet',
  depotGarantie: 'Dépôt garantie',
  lot: 'Lot',
  entreprise: 'Entreprise',
  reception: 'Réception',
  avecReserves: 'Avec réserves',
  reserves: 'Réserves',
  localisation: 'Localisation',
  delaiLevee: 'Délai levée',
  identite: 'Identité',
  prenom: 'Prénom',
  experience: 'Expérience',
  poste: 'Poste',
  debut: 'Début',
  fin: 'Fin',
  formation: 'Formation',
  diplome: 'Diplôme',
  etablissement: 'Établissement',
  annee: 'Année',
  competences: 'Compétences',
  contenu: 'Contenu',
  contenuExtrait: 'Contenu extrait du document',
  elementsDetecter: 'Éléments détectés',
  constats: 'Constats',
  gravite: 'Gravité',
  taches: 'Tâches',
  recommandation: 'Recommandation',
  devis: 'Devis',
  validite: 'Validité',
  tva: 'TVA',
  // Champs d'extraction intelligente
  datesTrouvees: 'Dates détectées',
  montantsTrouves: 'Montants détectés',
  personnesMentionnees: 'Personnes mentionnées',
  sections: 'Sections du document',
  statistiquesDocument: 'Statistiques document',
  pages: 'Pages',
  lignes: 'Lignes',
  caracteres: 'Caractères',
  pointsAbordes: 'Points abordés',
  resumeParParagraphe: 'Résumé par paragraphe',
  lignesDetectees: 'Lignes de détail',
  resumeContenu: 'Résumé du contenu',
  actionsDetectees: 'Actions détectées',
  contexte: 'Contexte',
  _warning: 'Avertissement',
};

function getLabel(key: string): string {
  return FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') return value.toLocaleString('fr-FR');
  return String(value);
}

// Composant affichage lisible des données extraites
function ExtractedDataView({ data }: { data: Record<string, unknown> }) {
  const renderValue = (value: unknown, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-neutral-400">-</span>;

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-neutral-400">Aucun</span>;
      // Array of strings
      if (typeof value[0] === 'string') {
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((v, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{String(v)}</Badge>
            ))}
          </div>
        );
      }
      // Array of objects
      return (
        <div className="space-y-2 mt-1">
          {value.map((item, i) => (
            <div key={i} className="bg-neutral-50 rounded-lg p-2 border border-neutral-100">
              <span className="text-xs text-neutral-400 mb-1 block">#{i + 1}</span>
              {typeof item === 'object' && item !== null
                ? renderObject(item as Record<string, unknown>, depth + 1)
                : <span className="text-sm">{formatValue(item)}</span>
              }
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return renderObject(value as Record<string, unknown>, depth + 1);
    }

    // Texte long : affichage en bloc scrollable
    if (typeof value === 'string' && value.length > 200) {
      return (
        <pre className="text-xs text-neutral-800 bg-neutral-50 rounded-lg p-2 border border-neutral-100 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans leading-relaxed">
          {value}
        </pre>
      );
    }

    return <span className="text-sm text-neutral-900">{formatValue(value)}</span>;
  };

  const renderObject = (obj: Record<string, unknown>, depth = 0): React.ReactNode => {
    const entries = Object.entries(obj).filter(([k]) => k !== '_warning');
    const warning = obj._warning as string | undefined;

    return (
      <div className={cn('space-y-1', depth > 0 && 'pl-2')}>
        {warning && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mb-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {warning}
          </div>
        )}
        {entries.map(([key, val]) => {
          const isSection = typeof val === 'object' && val !== null && !Array.isArray(val);
          return (
            <div key={key} className={cn(isSection && 'mt-2')}>
              <div className={cn(
                'text-xs font-medium',
                isSection ? 'text-indigo-600 uppercase tracking-wide mb-1' : 'text-neutral-500'
              )}>
                {getLabel(key)}
              </div>
              {renderValue(val, depth)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-3">
      {renderObject(data)}
    </div>
  );
}

// Modules principaux d'intégration (affichés en priorité)
const PRIMARY_MODULES: IATargetModule[] = ['actions', 'jalons', 'budget', 'risques'];

// Composant Validation Modal avec sélection multi-modules
function ValidationModal({
  imp,
  open,
  onClose,
  onValidate,
}: {
  imp: IAImport | null;
  open: boolean;
  onClose: () => void;
  onValidate: (id: number, modules: IATargetModule[]) => void;
}) {
  const [selectedModules, setSelectedModules] = useState<Set<IATargetModule>>(new Set());
  const [showAllModules, setShowAllModules] = useState(false);

  // Auto-detect modules when import changes
  useEffect(() => {
    if (imp?.extractedData && imp.documentType) {
      const detected = getAutoDetectedModules(imp.documentType, imp.extractedData);
      setSelectedModules(new Set(detected));
    }
  }, [imp?.id, imp?.documentType, imp?.extractedData]);

  if (!imp) return null;

  const toggleModule = (mod: IATargetModule) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) {
        next.delete(mod);
      } else {
        next.add(mod);
      }
      return next;
    });
  };

  const handleValidate = () => {
    if (selectedModules.size > 0 && imp.id) {
      onValidate(imp.id, Array.from(selectedModules));
      onClose();
    }
  };

  const autoDetected = imp.extractedData && imp.documentType
    ? new Set(getAutoDetectedModules(imp.documentType, imp.extractedData))
    : new Set<IATargetModule>();

  const secondaryModules = IA_TARGET_MODULES.filter(
    (m) => !PRIMARY_MODULES.includes(m)
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary-600" />
            Validation Import IA
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto">
          {/* Colonne gauche: Aperçu document */}
          <div className="space-y-4">
            {imp.id && (
              <DocumentPreview
                importId={imp.id}
                mimeType={imp.mimeType}
                filename={imp.filename}
              />
            )}

            <div className="bg-neutral-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-neutral-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate text-sm">{imp.filename}</p>
                  <p className="text-xs text-neutral-500">
                    {(imp.sizeBytes / 1024).toFixed(1)} Ko
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{imp.importRef}</Badge>
                {imp.ocrApplied && (
                  <Badge className="bg-purple-100 text-purple-700 text-xs">OCR</Badge>
                )}
                {imp.modelVersion && (
                  <Badge className="bg-sky-100 text-sky-700 text-xs">
                    <Bot className="w-3 h-3 mr-1" />
                    {imp.modelVersion}
                  </Badge>
                )}
                {imp.processingTimeMs > 0 && (
                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {(imp.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite: Données extraites + Modules cibles */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Type détecté</p>
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    'text-sm',
                    imp.confidence >= 0.9
                      ? 'bg-green-100 text-green-700'
                      : imp.confidence >= 0.7
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  )}
                >
                  {imp.documentType
                    ? IA_DOCUMENT_TYPE_LABELS[imp.documentType]
                    : 'Non identifié'}
                </Badge>
                <span className="text-sm text-neutral-500">
                  ({Math.round(imp.confidence * 100)}% confiance)
                </span>
              </div>
            </div>

            {/* Sélection multi-modules */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">
                Intégrer dans les modules
              </p>
              <p className="text-xs text-neutral-500 mb-3">
                Les modules recommandés sont pré-sélectionnés. Cochez/décochez selon vos besoins.
              </p>

              {/* Modules principaux */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {PRIMARY_MODULES.map((mod) => {
                  const isSelected = selectedModules.has(mod);
                  const isRecommended = autoDetected.has(mod);
                  return (
                    <button
                      key={mod}
                      onClick={() => toggleModule(mod)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-neutral-300'
                      )}>
                        {isSelected && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          'text-sm font-medium block',
                          isSelected ? 'text-indigo-700' : 'text-neutral-700'
                        )}>
                          {IA_TARGET_MODULE_LABELS[mod]}
                        </span>
                        {isRecommended && (
                          <span className="text-xs text-indigo-500">Recommandé</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Toggle autres modules */}
              <button
                onClick={() => setShowAllModules(!showAllModules)}
                className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {showAllModules ? 'Masquer les autres modules' : 'Afficher plus de modules...'}
              </button>

              {showAllModules && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {secondaryModules.map((mod) => {
                    const isSelected = selectedModules.has(mod);
                    return (
                      <button
                        key={mod}
                        onClick={() => toggleModule(mod)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all text-sm',
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-neutral-300'
                        )}>
                          {isSelected && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={isSelected ? 'text-indigo-700' : 'text-neutral-600'}>
                          {IA_TARGET_MODULE_LABELS[mod]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {imp.extractedData && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Données extraites</p>
                <ScrollArea className="h-44 rounded-lg border border-neutral-200 bg-white">
                  <ExtractedDataView data={imp.extractedData} />
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center gap-2 mr-auto">
            {selectedModules.size > 0 && (
              <span className="text-xs text-neutral-500">
                {selectedModules.size} module{selectedModules.size > 1 ? 's' : ''} sélectionné{selectedModules.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="secondary" onClick={onClose}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réanalyser
          </Button>
          <Button
            variant="primary"
            onClick={handleValidate}
            disabled={selectedModules.size === 0}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Valider et intégrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Navigation vers module cible (routes existantes uniquement)
const MODULE_ROUTES: Record<string, string> = {
  actions: '/actions',
  jalons: '/jalons',
  budget: '/budget',
  risques: '/risques',
  commercial: '/rapports',
  recrutement: '/rapports',
  technique: '/rapports',
  documents: '/rapports',
  reunions: '/rapports',
};

// Panneau de résultat d'intégration (multi-modules)
function IntegrationResultPanel({
  result,
  onClose,
}: {
  result: IntegrationResult;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const modules = result.targetModules ?? [result.targetModule];

  // Regrouper les records par module
  const recordsByModule = new Map<IATargetModule, IntegrationResult['records']>();
  for (const record of result.records) {
    const mod = record.module ?? result.targetModule;
    if (!recordsByModule.has(mod)) {
      recordsByModule.set(mod, []);
    }
    recordsByModule.get(mod)!.push(record);
  }

  return (
    <Card padding="lg" className={cn(
      'border-2',
      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            result.success ? 'bg-green-100' : 'bg-red-100'
          )}>
            {result.success ? (
              <CheckCircle className="w-7 h-7 text-green-600" />
            ) : (
              <AlertCircle className="w-7 h-7 text-red-600" />
            )}
          </div>
          <div>
            <h3 className={cn(
              'text-lg font-semibold',
              result.success ? 'text-green-900' : 'text-red-900'
            )}>
              {result.success ? 'Document intégré avec succès' : 'Erreur lors de l\'intégration'}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {IA_DOCUMENT_TYPE_LABELS[result.documentType]}
              </Badge>
              <ArrowRight className="w-3 h-3 text-neutral-400" />
              {modules.map((mod) => (
                <Badge key={mod} className="bg-indigo-100 text-indigo-700 text-xs">
                  {IA_TARGET_MODULE_LABELS[mod]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {result.error && (
        <div className="mb-4 p-3 bg-red-100 rounded-lg text-sm text-red-700">
          {result.error}
        </div>
      )}

      {result.records.length > 0 && (
        <div className="space-y-3 mb-4">
          <p className="text-sm font-medium text-neutral-700">
            {result.records.length} enregistrement{result.records.length > 1 ? 's' : ''} créé{result.records.length > 1 ? 's' : ''} dans {recordsByModule.size} module{recordsByModule.size > 1 ? 's' : ''} :
          </p>

          {/* Grouper par module */}
          {Array.from(recordsByModule.entries()).map(([mod, records]) => (
            <div key={mod} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                  {IA_TARGET_MODULE_LABELS[mod]} ({records.length})
                </span>
              </div>
              {records.map((record, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200"
                >
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-neutral-800 flex-1">{record.label}</span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {record.type}
                  </Badge>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {result.success && (
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from(recordsByModule.keys()).map((mod) => {
            const route = MODULE_ROUTES[mod] || '/';
            return (
              <Button
                key={mod}
                variant="primary"
                size="sm"
                onClick={() => navigate(route)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir {IA_TARGET_MODULE_LABELS[mod]}
              </Button>
            );
          })}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      )}
    </Card>
  );
}

// Modale de détail d'un import archivé
function ArchiveDetailModal({
  imp,
  open,
  onClose,
}: {
  imp: IAImport | null;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const integrations = useIAIntegrations(imp?.id ?? null);

  if (!imp) return null;

  const styles = IA_IMPORT_STATUS_STYLES[imp.status];
  const targetRoute = imp.targetModule ? (MODULE_ROUTES[imp.targetModule] || '/') : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary-600" />
            Détail de l&apos;import
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4 max-h-[65vh] overflow-y-auto">
          {/* Colonne gauche: Aperçu + Infos */}
          <div className="space-y-4">
            {/* Prévisualisation du document */}
            {imp.id && (
              <DocumentPreview
                importId={imp.id}
                mimeType={imp.mimeType}
                filename={imp.filename}
              />
            )}

            {/* Informations fichier */}
            <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-neutral-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate text-sm">{imp.filename}</p>
                  <p className="text-xs text-neutral-500">
                    {(imp.sizeBytes / 1024).toFixed(1)} Ko — {imp.importRef}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn(styles.bg, styles.text, 'text-xs')}>
                  {imp.status === 'integrated' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {IA_IMPORT_STATUS_LABELS[imp.status]}
                </Badge>
                {imp.documentType && (
                  <Badge variant="secondary" className="text-xs">
                    {IA_DOCUMENT_TYPE_LABELS[imp.documentType]}
                  </Badge>
                )}
                {imp.targetModule && (
                  <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                    → {IA_TARGET_MODULE_LABELS[imp.targetModule]}
                  </Badge>
                )}
                {imp.ocrApplied && (
                  <Badge className="bg-purple-100 text-purple-700 text-xs">OCR</Badge>
                )}
                {imp.modelVersion && (
                  <Badge className="bg-sky-100 text-sky-700 text-xs">
                    <Bot className="w-3 h-3 mr-1" />
                    {imp.modelVersion}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
                <div>
                  <span className="font-medium">Créé le :</span>{' '}
                  {new Date(imp.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
                {imp.validatedAt && (
                  <div>
                    <span className="font-medium">Validé le :</span>{' '}
                    {new Date(imp.validatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                )}
                {imp.processingTimeMs > 0 && (
                  <div>
                    <span className="font-medium">Traitement :</span>{' '}
                    {(imp.processingTimeMs / 1000).toFixed(1)}s
                  </div>
                )}
                {imp.confidence > 0 && (
                  <div>
                    <span className="font-medium">Confiance :</span>{' '}
                    {Math.round(imp.confidence * 100)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite: Données extraites + Intégrations */}
          <div className="space-y-4">
            {/* Données extraites */}
            {imp.extractedData && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  Données extraites
                </p>
                <ScrollArea className="h-52 rounded-lg border border-neutral-200 bg-white">
                  <ExtractedDataView data={imp.extractedData} />
                </ScrollArea>
              </div>
            )}

            {/* Intégrations réalisées */}
            {integrations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-green-500" />
                  Enregistrements créés ({integrations.length})
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {integrations.map((integ) => (
                    <div
                      key={integ.id}
                      className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-800 truncate">
                          {integ.targetTable === 'actions' && 'Action'}
                          {integ.targetTable === 'jalons' && 'Jalon'}
                          {integ.targetTable === 'budget' && 'Budget'}
                          {integ.targetTable === 'risques' && 'Risque'}
                          {integ.targetTable === 'iaIntegrations' && 'Enregistrement'}
                          {' #'}{integ.recordId}
                          {integ.data && typeof integ.data === 'object' && 'titre' in integ.data && (
                            <> — {String(integ.data.titre)}</>
                          )}
                          {integ.data && typeof integ.data === 'object' && 'libelle' in integ.data && (
                            <> — {String(integ.data.libelle)}</>
                          )}
                          {integ.data && typeof integ.data === 'object' && 'description' in integ.data && !('titre' in integ.data) && !('libelle' in integ.data) && (
                            <> — {String(integ.data.description).slice(0, 60)}</>
                          )}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {IA_TARGET_MODULE_LABELS[integ.targetModule]} — {integ.action} — {new Date(integ.integratedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pas de données */}
            {!imp.extractedData && integrations.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">Aucune donnée extraite disponible</p>
              </div>
            )}

            {/* Erreur */}
            {imp.errorMessage && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-700 mb-1">Erreur</p>
                <p className="text-xs text-red-600">{imp.errorCode}: {imp.errorMessage}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          {targetRoute && imp.status === 'integrated' && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                navigate(targetRoute);
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir dans {IA_TARGET_MODULE_LABELS[imp.targetModule!]}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Composant Archives
function ArchivesList() {
  const imports = useIAImports({ limit: 50 });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [detailImport, setDetailImport] = useState<IAImport | null>(null);

  const handleDelete = async (id: number) => {
    await deleteIAImport(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Archives</h3>
        <Badge variant="secondary">{imports.length} imports</Badge>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-2">
          {imports.map((imp) => {
            const FileIcon = getFileIcon(imp.mimeType);
            const styles = IA_IMPORT_STATUS_STYLES[imp.status];

            return (
              <div
                key={imp.id}
                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                onClick={() => setDetailImport(imp)}
              >
                <div className="p-2 bg-white rounded-lg">
                  <FileIcon className="w-4 h-4 text-neutral-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {imp.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-400">{imp.importRef}</span>
                    <span className="text-xs text-neutral-400">
                      {new Date(imp.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                <Badge className={cn(styles.bg, styles.text, 'text-xs')}>
                  {imp.status === 'integrated' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {imp.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {IA_IMPORT_STATUS_LABELS[imp.status]}
                </Badge>

                {imp.documentType && (
                  <Badge variant="secondary" className="text-xs">
                    {IA_DOCUMENT_TYPE_LABELS[imp.documentType]}
                  </Badge>
                )}

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailImport(imp);
                    }}
                    className="text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(imp.id!);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {imports.length === 0 && (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">Aucun import archivé</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Modale détail archive */}
      <ArchiveDetailModal
        imp={detailImport}
        open={detailImport !== null}
        onClose={() => setDetailImport(null)}
      />

      {/* Delete confirmation */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-neutral-600">
            Êtes-vous sûr de vouloir supprimer cet import ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant principal ImportIA
export function ImportIA() {
  const [showArchives, setShowArchives] = useState(false);
  const [validationImport, setValidationImport] = useState<IAImport | null>(null);
  const [integrationResult, setIntegrationResult] = useState<IntegrationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

  // Ref pour tracker les imports en cours et auto-ouvrir la modale
  const lastProcessedIdsRef = useRef<Set<number>>(new Set());

  const pendingImports = useIAPendingImports();
  const processingImports = useIAProcessingImports();
  const stats = useIAStats();

  // Auto-ouverture de la modale quand un import passe en status "ready"
  useEffect(() => {
    if (pendingImports.length === 0) return;

    for (const imp of pendingImports) {
      if (imp.id && lastProcessedIdsRef.current.has(imp.id)) {
        // Cet import vient de finir, ouvrir la modale automatiquement
        lastProcessedIdsRef.current.delete(imp.id);
        setValidationImport(imp);
        break;
      }
    }
  }, [pendingImports]);

  // Traitement d'un fichier uploadé
  const processFile = useCallback(async (file: File) => {
    // Créer l'import
    const importId = await createIAImport({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      createdBy: 1, // TODO: utiliser l'utilisateur connecté
    });

    // Tracker cet ID pour auto-ouverture de la modale
    lastProcessedIdsRef.current.add(importId);

    // Sauvegarder le fichier
    await saveIAFile(importId, file);

    const startTime = Date.now();

    // Étape 1: Traitement du fichier
    await updateIAImportStatus(importId, 'processing', 20);

    // Étape 2: Extraction du texte réel du document
    let text: string;
    try {
      text = await extractTextFromFile(file);
    } catch {
      text = file.name;
    }
    await updateIAImportStatus(importId, 'analyzing', 50);

    // Étape 3: Analyse IA avec le modèle sélectionné
    try {
      const result = await simulateAIExtraction(text, file.type, selectedModel);
      const processingTimeMs = Date.now() - startTime;

      await updateIAImportExtraction(importId, {
        documentType: result.documentType,
        confidence: result.confidence,
        extractedData: result.extractedData,
        processingTimeMs,
        modelVersion: selectedModel,
      });
    } catch (error) {
      console.error('Erreur extraction IA:', error);
      lastProcessedIdsRef.current.delete(importId);
      await updateIAImportStatus(importId, 'failed');
    }
  }, [selectedModel]);

  // Gestion des fichiers sélectionnés
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      // Fermer le panneau de résultat précédent
      setIntegrationResult(null);
      files.forEach((file) => {
        processFile(file);
      });
    },
    [processFile]
  );

  // Validation et intégration d'un import (multi-modules)
  const handleValidate = useCallback(
    async (id: number, modules: IATargetModule[]) => {
      setIsValidating(true);
      setValidationImport(null);
      try {
        const result = await validateAndIntegrateIAImport(id, 1, modules);
        setIntegrationResult(result);
      } catch (error) {
        console.error('Erreur validation:', error);
        setIntegrationResult({
          success: false,
          documentType: 'autre',
          targetModule: modules[0] || 'documents',
          targetModules: modules,
          records: [],
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Panneau de résultat d'intégration */}
      {integrationResult && (
        <IntegrationResultPanel
          result={integrationResult}
          onClose={() => setIntegrationResult(null)}
        />
      )}

      {/* Indicateur de validation en cours */}
      {isValidating && (
        <Card padding="md" className="border-2 border-indigo-200 bg-indigo-50">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">
              Intégration en cours...
            </span>
          </div>
        </Card>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-4">
        <Card padding="md" className="bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Bot className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-900">{stats.totalImports}</p>
              <p className="text-xs text-indigo-600">Documents traités</p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">
                {Math.round(stats.successRate)}%
              </p>
              <p className="text-xs text-green-600">Taux de succès</p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {Math.round(stats.avgConfidence * 100)}%
              </p>
              <p className="text-xs text-purple-600">Précision moyenne</p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-900">{stats.thisWeek}</p>
              <p className="text-xs text-yellow-600">Cette semaine</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sélecteur de modèle IA + Zone de dépôt */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-neutral-700">Modèle IA</span>
          </div>
          <div className="flex items-center gap-3">
            {AVAILABLE_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={cn(
                  'flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all',
                  selectedModel === m.id
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                )}
              >
                <span className={cn(
                  'text-sm font-medium',
                  selectedModel === m.id ? 'text-indigo-700' : 'text-neutral-700'
                )}>
                  {m.label}
                </span>
                <span className="text-xs text-neutral-500">{m.description}</span>
              </button>
            ))}
          </div>
        </div>
        <UploadZone onFilesSelected={handleFilesSelected} />
      </Card>

      {/* En cours de traitement */}
      {processingImports.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            En cours de traitement
          </h3>
          <div className="space-y-2">
            {processingImports.map((imp) => (
              <ProcessingFile key={imp.id} imp={imp} />
            ))}
          </div>
        </Card>
      )}

      {/* En attente de validation */}
      {pendingImports.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary-500" />
            En attente de validation ({pendingImports.length})
          </h3>
          <div className="space-y-2">
            {pendingImports.map((imp) => {
              const FileIcon = getFileIcon(imp.mimeType);

              return (
                <div
                  key={imp.id}
                  className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <FileIcon className="w-5 h-5 text-neutral-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {imp.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {imp.documentType && (
                        <Badge className="bg-white text-neutral-700 text-xs">
                          {IA_DOCUMENT_TYPE_LABELS[imp.documentType]}
                        </Badge>
                      )}
                      <span className="text-xs text-neutral-500">
                        {Math.round(imp.confidence * 100)}% confiance
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setValidationImport(imp)}
                  >
                    Valider
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Bouton Archives */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => setShowArchives(!showArchives)}>
          <Archive className="w-4 h-4 mr-2" />
          Archives ({stats.totalImports})
        </Button>
      </div>

      {/* Archives panel */}
      {showArchives && (
        <Card padding="md">
          <ArchivesList />
        </Card>
      )}

      {/* Modal de validation */}
      <ValidationModal
        imp={validationImport}
        open={validationImport !== null}
        onClose={() => setValidationImport(null)}
        onValidate={handleValidate}
      />
    </div>
  );
}
