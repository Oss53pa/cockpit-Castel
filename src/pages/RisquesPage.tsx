import { useState } from 'react';
import { Plus, List, Grid3X3, X, AlertTriangle, Calendar, User, Tag, FileText } from 'lucide-react';
import { useAppStore } from '@/stores';
import { Button, Select, SelectOption, Card, Badge } from '@/components/ui';
import { RisquesRegistre, MatriceCriticite, RisqueForm, RisquesTop10 } from '@/components/risques';
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
  const [viewMode, setViewMode] = useState<'list' | 'matrix' | 'top10'>('list');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRisque, setSelectedRisque] = useState<Risque | undefined>();

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
    setSelectedRisque(undefined);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedRisque(undefined);
  };

  const handleCellClick = (probabilite: number, impact: number, risques: Risque[]) => {
    setSelectedCellRisques({ probabilite, impact, risques });
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

        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau risque
        </Button>
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

      {/* Form */}
      <RisqueForm
        risque={selectedRisque}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={() => {}}
      />
    </div>
  );
}
