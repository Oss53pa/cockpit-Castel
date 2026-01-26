import { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
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
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Select,
  SelectOption,
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
  useIAStats,
  createIAImport,
  updateIAImportStatus,
  updateIAImportExtraction,
  validateIAImport,
  deleteIAImport,
  saveIAFile,
  getIAFile,
  simulateAIExtraction,
} from '@/hooks';
import {
  IA_DOCUMENT_TYPE_LABELS,
  IA_TARGET_MODULE_LABELS,
  IA_IMPORT_STATUS_LABELS,
  IA_IMPORT_STATUS_STYLES,
  IA_SUPPORTED_FORMATS,
  type IAImport,
  type IATargetModule,
} from '@/types';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// Icônes par type de fichier
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('image')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
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
        || /\.(pdf|docx?|xlsx?|jpe?g|png|tiff?|csv)$/i.test(file.name);
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
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.csv"
          className="hidden"
          onChange={handleFileInput}
        />
        <Button variant="secondary" onClick={handleBrowseClick}>
          Parcourir
        </Button>

        <p className="text-xs text-neutral-400 mt-4">
          PDF, Word, Excel, Images, Scans — Max 25 Mo/fichier
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

// Composant Validation Modal
function ValidationModal({
  imp,
  open,
  onClose,
  onValidate,
}: {
  imp: IAImport | null;
  open: boolean;
  onClose: () => void;
  onValidate: (id: number, module: IATargetModule) => void;
}) {
  const [selectedModule, setSelectedModule] = useState<IATargetModule | ''>('');

  if (!imp) return null;

  const handleValidate = () => {
    if (selectedModule && imp.id) {
      onValidate(imp.id, selectedModule);
      onClose();
    }
  };

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
            {/* Prévisualisation du document */}
            {imp.id && (
              <DocumentPreview
                importId={imp.id}
                mimeType={imp.mimeType}
                filename={imp.filename}
              />
            )}

            {/* Informations fichier */}
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
                {imp.processingTimeMs > 0 && (
                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {(imp.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite: Données extraites */}
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

            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Module cible</p>
              <Select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value as IATargetModule)}
              >
                <SelectOption value="">Sélectionner un module...</SelectOption>
                {Object.entries(IA_TARGET_MODULE_LABELS).map(([value, label]) => (
                  <SelectOption key={value} value={value}>
                    {label}
                  </SelectOption>
                ))}
              </Select>
            </div>

            {imp.extractedData && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Données extraites</p>
                <ScrollArea className="h-52 rounded-lg border border-neutral-200 bg-white p-3">
                  <pre className="text-xs text-neutral-600 whitespace-pre-wrap font-mono">
                    {JSON.stringify(imp.extractedData, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
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
            disabled={!selectedModule}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Valider et intégrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Composant Archives
function ArchivesList() {
  const imports = useIAImports({ limit: 50 });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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
                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
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

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(imp.id!)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
              variant="destructive"
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

  const pendingImports = useIAPendingImports();
  const processingImports = useIAProcessingImports();
  const stats = useIAStats();

  // Traitement d'un fichier uploadé
  const processFile = useCallback(async (file: File) => {
    // Créer l'import
    const importId = await createIAImport({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      createdBy: 1, // TODO: utiliser l'utilisateur connecté
    });

    // Sauvegarder le fichier
    await saveIAFile(importId, file);

    // Simuler le traitement
    await updateIAImportStatus(importId, 'processing', 20);
    await new Promise((r) => setTimeout(r, 500));

    await updateIAImportStatus(importId, 'analyzing', 50);

    // Extraire le texte (simulation)
    const text = file.name; // Dans une vraie implémentation, on extrairait le texte du fichier

    // Appeler l'IA pour l'extraction
    try {
      const result = await simulateAIExtraction(text, file.type);

      await updateIAImportExtraction(importId, {
        documentType: result.documentType,
        confidence: result.confidence,
        extractedData: result.extractedData,
        processingTimeMs: 2500,
      });
    } catch (error) {
      console.error('Erreur extraction IA:', error);
      await updateIAImportStatus(importId, 'failed');
    }
  }, []);

  // Gestion des fichiers sélectionnés
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        processFile(file);
      });
    },
    [processFile]
  );

  // Validation d'un import
  const handleValidate = useCallback(
    async (id: number, module: IATargetModule) => {
      await validateIAImport(id, 1, module); // TODO: utiliser l'utilisateur connecté
    },
    []
  );

  return (
    <div className="space-y-6">
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

      {/* Zone principale */}
      <Card padding="lg">
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
