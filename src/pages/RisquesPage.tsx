import { useState, useRef } from 'react';
import { Plus, List, Grid3X3, X, AlertTriangle, Calendar, User, Tag, FileText, BarChart3, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '@/stores';
import { Button, Select, SelectOption, Card, Badge, Tooltip, useToast } from '@/components/ui';
import { excelService } from '@/services/excelService';
import { useRisques, useJalons, createRisque, updateRisque, usePermissions } from '@/hooks';
import { PROJET_CONFIG } from '@/data/constants';
import { RisquesRegistre, MatriceCriticite, RisqueForm, RisquesTop10, RisquesSynthese } from '@/components/risques';
import { RisqueFormContent, type RisqueFormSaveData } from '@/components/shared/RisqueFormContent';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { Shield } from 'lucide-react';
import {
  RISQUE_CATEGORIES,
  RISQUE_CATEGORY_LABELS,
  RISQUE_STATUSES,
  RISQUE_STATUS_LABELS,
  RISQUE_IMPACT_LABELS,
  RISQUE_PROBABILITE_LABELS,
  BUILDING_CODES,
  BUILDING_CODE_LABELS,
  PROJECT_PHASES,
  PROJECT_PHASE_LABELS,
  type Risque,
} from '@/types';
import { cn } from '@/lib/utils';

export function RisquesPage() {
  const { risqueFilters, setRisqueFilters } = useAppStore();
  const [viewMode, setViewMode] = useState<'list' | 'matrix' | 'top10' | 'synthese'>('list');
  const [formOpen, setFormOpen] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRisque, setSelectedRisque] = useState<Risque | undefined>();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const risques = useRisques(risqueFilters);
  const jalonsAll = useJalons();
  const toast = useToast();
  const { canCreate, canEdit, canImport } = usePermissions();

  // État pour les risques de la cellule sélectionnée dans la matrice
  const [selectedCellRisques, setSelectedCellRisques] = useState<{
    probabilite: number;
    impact: number;
    risques: Risque[];
  } | null>(null);

  const handleEdit = (risque: Risque) => {
    setSelectedRisque(risque);
    setFormOpen(true);
  };

  const handleView = (risque: Risque) => {
    setSelectedRisque(risque);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setCreateFormOpen(true);
  };

  // Génération de l'ID risque
  const generateRisqueId = (): string => {
    const count = risques.length + 1;
    return `R-${String(count).padStart(3, '0')}`;
  };

  // Handler création risque
  const handleCreateRisque = async (data: RisqueFormSaveData) => {
    if (!data.titre || !data.categorie) {
      toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsCreating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await createRisque({
        id_risque: generateRisqueId(),
        titre: data.titre,
        description: data.description || '',
        categorie: data.categorie as any,
        statut: data.statut as any,
        probabilite: data.probabilite,
        impact: data.impact,
        score: data.score,
        proprietaire: data.proprietaire || '',
        responsable: data.proprietaire || '',
        plan_mitigation: data.plan_mitigation || '',
        mesures_attenuation: data.plan_mitigation || '',
        date_identification: today,
        date_derniere_evaluation: today,
        notes_mise_a_jour: data.notes_mise_a_jour || '',
        commentaires_externes: data.commentaires_externes || '[]',
      });

      toast.success('Risque créé', `"${data.titre}" a été enregistré`);
      setCreateFormOpen(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur', 'Impossible de créer le risque');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedRisque(undefined);
  };

  const handleCellClick = (probabilite: number, impact: number, risques: Risque[]) => {
    setSelectedCellRisques({ probabilite, impact, risques });
  };

  // === EXCEL IMPORT/EXPORT ===
  const handleExportExcel = () => {
    excelService.exportRisques(risques);
  };

  const handleDownloadTemplate = () => {
    excelService.downloadTemplate('risques');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await excelService.importRisques(file);

      if (result.errors.length > 0) {
        const errorMessages = result.errors.map(err => `Ligne ${err.row}: ${err.message}`).join(', ');
        toast.error(`Erreurs d'import: ${errorMessages}`);
      }

      for (const risqueData of result.data) {
        const existingRisque = risques.find(r => r.id_risque === risqueData.id_risque);

        if (existingRisque && existingRisque.id) {
          await updateRisque(existingRisque.id, risqueData);
        } else {
          await createRisque(risqueData as Parameters<typeof createRisque>[0]);
        }
      }

      if (result.data.length > 0) {
        toast.success(`Import réussi: ${result.data.length} risque(s) importé(s)`);
      }
    } catch (error) {
      console.error('Erreur import Excel:', error);
      toast.error('Erreur lors de l\'import du fichier Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 12) return 'bg-error-500 text-white';
    if (score >= 9) return 'bg-warning-500 text-white';
    if (score >= 5) return 'bg-info-400 text-white';
    return 'bg-success-400 text-white';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 12) return 'Critique';
    if (score >= 9) return 'Majeur';
    if (score >= 5) return 'Modéré';
    return 'Faible';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Risques</h2>
          <p className="text-sm text-primary-500">
            Gestion des risques du projet
          </p>
        </div>

        {/* Boutons Excel Import/Export */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          {canImport && (
            <Tooltip content="Importer depuis Excel">
              <Button variant="outline" onClick={handleImportClick} disabled={importing}>
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Import...' : 'Importer'}
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Exporter vers Excel">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </Tooltip>
          <Tooltip content="Télécharger le modèle Excel">
            <Button variant="ghost" onClick={handleDownloadTemplate}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Template
            </Button>
          </Tooltip>
          {canCreate && (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau risque
            </Button>
          )}
        </div>
      </div>

      {/* Filters and view toggle */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border">
        <Select
          value={risqueFilters.categorie ?? ''}
          onChange={(e) =>
            setRisqueFilters({
              categorie: e.target.value
                ? (e.target.value as typeof risqueFilters.categorie)
                : undefined,
            })
          }
          className="w-40"
        >
          <SelectOption value="">Toutes catégories</SelectOption>
          {RISQUE_CATEGORIES.map((cat) => (
            <SelectOption key={cat} value={cat}>
              {RISQUE_CATEGORY_LABELS[cat]}
            </SelectOption>
          ))}
        </Select>

        <Select
          value={risqueFilters.status ?? ''}
          onChange={(e) =>
            setRisqueFilters({
              status: e.target.value
                ? (e.target.value as typeof risqueFilters.status)
                : undefined,
            })
          }
          className="w-36"
        >
          <SelectOption value="">Tous statuts</SelectOption>
          {RISQUE_STATUSES.map((status) => (
            <SelectOption key={status} value={status}>
              {RISQUE_STATUS_LABELS[status]}
            </SelectOption>
          ))}
        </Select>

        <Select
          value={risqueFilters.buildingCode ?? ''}
          onChange={(e) =>
            setRisqueFilters({
              buildingCode: e.target.value
                ? (e.target.value as typeof risqueFilters.buildingCode)
                : undefined,
            })
          }
          className="w-44"
        >
          <SelectOption value="">Tous bâtiments</SelectOption>
          {BUILDING_CODES.map((code) => (
            <SelectOption key={code} value={code}>
              {BUILDING_CODE_LABELS[code]}
            </SelectOption>
          ))}
        </Select>

        <Select
          value={risqueFilters.projectPhase ?? ''}
          onChange={(e) =>
            setRisqueFilters({
              projectPhase: e.target.value
                ? (e.target.value as typeof risqueFilters.projectPhase)
                : undefined,
            })
          }
          className="w-52"
        >
          <SelectOption value="">Toutes phases</SelectOption>
          {PROJECT_PHASES.map((phase) => (
            <SelectOption key={phase} value={phase}>
              {PROJECT_PHASE_LABELS[phase]}
            </SelectOption>
          ))}
        </Select>

        <div className="flex-1" />

        <div className="flex rounded-lg border bg-primary-50 p-1">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            Registre
          </Button>
          <Button
            variant={viewMode === 'matrix' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('matrix')}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Matrice
          </Button>
          <Button
            variant={viewMode === 'top10' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('top10')}
          >
            <FileText className="h-4 w-4 mr-1" />
            Top 10
          </Button>
          <Button
            variant={viewMode === 'synthese' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('synthese')}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Synthèse
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <RisquesRegistre
          filters={risqueFilters}
          onEdit={handleEdit}
          onView={handleView}
        />
      ) : viewMode === 'top10' ? (
        <RisquesTop10 />
      ) : viewMode === 'synthese' ? (
        <RisquesSynthese />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Matrice */}
          <MatriceCriticite onCellClick={handleCellClick} />

          {/* Détail des risques de la cellule sélectionnée */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-900">
                Détail des risques
              </h3>
              {selectedCellRisques && (
                <button
                  onClick={() => setSelectedCellRisques(null)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>

            {selectedCellRisques ? (
              <div className="space-y-4">
                {/* Info cellule sélectionnée */}
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-primary-600">Probabilité:</span>
                      <span className="ml-2 font-medium text-primary-900">
                        {RISQUE_PROBABILITE_LABELS[selectedCellRisques.probabilite as keyof typeof RISQUE_PROBABILITE_LABELS] || `Niveau ${selectedCellRisques.probabilite}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-primary-600">Impact:</span>
                      <span className="ml-2 font-medium text-primary-900">
                        {RISQUE_IMPACT_LABELS[selectedCellRisques.impact as keyof typeof RISQUE_IMPACT_LABELS] || `Niveau ${selectedCellRisques.impact}`}
                      </span>
                    </div>
                    <Badge className={cn('ml-2', getScoreColor(selectedCellRisques.probabilite * selectedCellRisques.impact))}>
                      Score: {selectedCellRisques.probabilite * selectedCellRisques.impact} - {getScoreLabel(selectedCellRisques.probabilite * selectedCellRisques.impact)}
                    </Badge>
                  </div>
                </div>

                {/* Liste des risques */}
                {selectedCellRisques.risques.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {selectedCellRisques.risques.map((risque) => (
                      <div
                        key={risque.id}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => handleView(risque)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className={cn(
                                'h-4 w-4',
                                risque.probabilite * risque.impact >= 12 ? 'text-error-500' :
                                risque.probabilite * risque.impact >= 9 ? 'text-warning-500' :
                                risque.probabilite * risque.impact >= 5 ? 'text-info-500' : 'text-success-500'
                              )} />
                              <h4 className="font-medium text-primary-900">{risque.titre}</h4>
                            </div>
                            <p className="text-sm text-primary-600 line-clamp-2 mb-2">
                              {risque.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {risque.categorie && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded">
                                  <Tag className="h-3 w-3" />
                                  {RISQUE_CATEGORY_LABELS[risque.categorie]}
                                </span>
                              )}
                              {risque.responsable && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded">
                                  <User className="h-3 w-3" />
                                  {risque.responsable}
                                </span>
                              )}
                              {risque.date_identification && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(risque.date_identification).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className={cn(getScoreColor(risque.probabilite * risque.impact))}>
                            {risque.probabilite * risque.impact}
                          </Badge>
                        </div>
                        {risque.mesures_attenuation && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-primary-500 font-medium mb-1">Mesures d'atténuation:</p>
                            <p className="text-sm text-primary-700 line-clamp-2">{risque.mesures_attenuation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-primary-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun risque dans cette cellule</p>
                  </div>
                )}

                {/* Actions */}
                {selectedCellRisques.risques.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-primary-500">
                      {selectedCellRisques.risques.length} risque{selectedCellRisques.risques.length > 1 ? 's' : ''} • Cliquez sur un risque pour voir les détails
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-primary-500">
                <Grid3X3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Sélectionnez une cellule</p>
                <p className="text-sm">Cliquez sur une cellule de la matrice pour voir les risques correspondants</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Note de risque */}
      <Card padding="md" className="bg-primary-50 border-primary-200">
        <h4 className="text-sm font-semibold text-primary-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Note de risque
        </h4>
        <div className="text-xs text-primary-600 space-y-2">
          <p>
            <strong>Méthodologie :</strong> Score de risque = Probabilité × Impact (échelle 1-4 chacun).
            Les risques sont classés en 4 niveaux : <span className="text-error-600 font-medium">Critique (12-16)</span>,{' '}
            <span className="text-warning-600 font-medium">Majeur (8-11)</span>,{' '}
            <span className="text-info-600 font-medium">Modéré (4-7)</span>,{' '}
            <span className="text-success-600 font-medium">Faible (1-3)</span>.
          </p>
          <p>
            <strong>Gouvernance :</strong> Les risques critiques sont revus hebdomadairement par la DGA,
            les majeurs bi-mensuellement par les managers, les modérés mensuellement en COPIL,
            et une revue globale trimestrielle est réalisée avec le PDG.
          </p>
          <p>
            <strong>Registre :</strong> {`${risques.length} risques identifiés alignés sur les ${jalonsAll.length} jalons du Référentiel de Mobilisation ${PROJET_CONFIG.nom}.`}
            Chaque risque dispose d'un plan de mitigation avec actions, responsables et échéances.
          </p>
        </div>
      </Card>

      {/* Form modification */}
      <RisqueForm
        risque={selectedRisque}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={() => {}}
      />

      {/* Form création */}
      <Dialog open={createFormOpen} onOpenChange={(isOpen) => !isOpen && setCreateFormOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span>Nouveau risque</span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <RisqueFormContent
              isEditing={true}
              isExternal={false}
              isCreate={true}
              onSave={handleCreateRisque}
              onCancel={() => setCreateFormOpen(false)}
              isSaving={isCreating}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
