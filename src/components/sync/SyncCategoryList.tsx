import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Clock, AlertCircle, CheckSquare, Square, User, Calendar } from 'lucide-react';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type { CategoryProgress, SyncDimension, CategoryActionItem } from '@/types/sync.types';

interface SyncCategoryListProps {
  title: string;
  dimension: SyncDimension;
  categories: CategoryProgress[];
  projectId: string;
  onUpdateProgress?: (itemId: number, progress: number) => void;
}

interface CategoryCardProps {
  category: CategoryProgress;
  dimension: SyncDimension;
}

// Couleurs par défaut pour les catégories
const DEFAULT_COLORS: Record<string, string> = {
  // Phases de construction
  phase1_preparation: '#6366F1',
  phase2_mobilisation: '#F59E0B',
  phase3_lancement: '#10B981',
  phase4_stabilisation: '#3B82F6',
  // Axes de mobilisation
  axe1_rh: '#EF4444',
  axe2_commercial: '#F97316',
  axe3_technique: '#3B82F6',
  axe4_budget: '#10B981',
  axe5_marketing: '#EC4899',
  axe6_exploitation: '#8B5CF6',
};

const getProgressColor = (progress: number): string => {
  if (progress >= 75) return '#10B981'; // green
  if (progress >= 50) return '#F59E0B'; // orange
  if (progress >= 25) return '#3B82F6'; // blue
  return '#EF4444'; // red
};

const getStatusLabel = (statut: string): { label: string; color: string } => {
  switch (statut) {
    case 'termine': return { label: 'Terminé', color: 'bg-green-100 text-green-700' };
    case 'en_cours': return { label: 'En cours', color: 'bg-blue-100 text-blue-700' };
    case 'en_validation': return { label: 'En validation', color: 'bg-purple-100 text-purple-700' };
    case 'bloque': return { label: 'Bloqué', color: 'bg-red-100 text-red-700' };
    case 'en_attente': return { label: 'En attente', color: 'bg-orange-100 text-orange-700' };
    case 'planifie': return { label: 'Planifié', color: 'bg-gray-100 text-gray-700' };
    default: return { label: statut, color: 'bg-gray-100 text-gray-600' };
  }
};

// Composant pour afficher une action avec ses sous-tâches
const ActionItemCard: React.FC<{ item: CategoryActionItem }> = ({ item }) => {
  const [showDetails, setShowDetails] = useState(false);
  const status = getStatusLabel(item.statut);
  const hasSousTaches = item.sousTaches && item.sousTaches.length > 0;
  const completedSousTaches = item.sousTaches?.filter(st => st.fait).length || 0;
  const totalSousTaches = item.sousTaches?.length || 0;

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50">
      {/* Header de l'action */}
      <div
        className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {hasSousTaches && (
                <button className="p-0.5 rounded hover:bg-gray-200">
                  {showDetails ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </button>
              )}
              <span className="text-xs text-gray-400 font-mono">{item.id_action}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 mt-1 truncate">{item.titre}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              {item.responsable && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.responsable}
                </span>
              )}
              {item.date_fin_prevue && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.date_fin_prevue).toLocaleDateString('fr-FR')}
                </span>
              )}
              {hasSousTaches && (
                <span className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {completedSousTaches}/{totalSousTaches} sous-tâches
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.avancement}%`,
                    backgroundColor: getProgressColor(item.avancement),
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">{item.avancement}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des sous-tâches */}
      {showDetails && hasSousTaches && (
        <div className="px-3 pb-3 pt-1 border-t bg-white">
          <p className="text-xs font-medium text-gray-500 mb-2">Sous-tâches</p>
          <div className="space-y-1.5">
            {item.sousTaches!.map((st) => (
              <div
                key={st.id}
                className={`flex items-center gap-2 p-1.5 rounded text-xs ${
                  st.fait ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                {st.fait ? (
                  <CheckSquare className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                )}
                <span className={st.fait ? 'text-green-700 line-through' : 'text-gray-700'}>
                  {st.libelle}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  dimension,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const color = DEFAULT_COLORS[category.categoryCode] ||
    (dimension === 'PROJECT' ? SYNC_CONFIG.colors.project : SYNC_CONFIG.colors.mobilization);

  const progressPercent = Math.round(category.progress);
  const statusIcon = progressPercent >= 100
    ? <CheckCircle className="h-4 w-4 text-green-500" />
    : progressPercent > 0
      ? <Clock className="h-4 w-4 text-orange-500" />
      : <AlertCircle className="h-4 w-4 text-gray-400" />;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <button className="p-1 rounded hover:bg-gray-200 transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-gray-900">{category.categoryName}</span>
          <span className="text-xs text-gray-500">
            ({category.completedCount}/{category.itemsCount})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {statusIcon}
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: getProgressColor(progressPercent),
              }}
            />
          </div>
          <span
            className="text-sm font-semibold w-12 text-right"
            style={{ color: getProgressColor(progressPercent) }}
          >
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="p-4 bg-white border-t">
          {/* Statistiques résumées */}
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Total</p>
              <p className="font-semibold text-lg">{category.itemsCount}</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-green-600">Terminés</p>
              <p className="font-semibold text-lg text-green-700">{category.completedCount}</p>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <p className="text-orange-600">En cours</p>
              <p className="font-semibold text-lg text-orange-700">
                {category.itemsCount - category.completedCount}
              </p>
            </div>
          </div>

          {/* Liste des actions avec sous-tâches */}
          {category.items && category.items.length > 0 && (
            <div className="space-y-3 mt-4">
              <h5 className="text-sm font-medium text-gray-700 border-b pb-2">
                Actions détaillées
              </h5>
              {category.items.map((item) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Code: {category.categoryCode}</span>
            <span>Progression pondérée: {category.progress.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const SyncCategoryList: React.FC<SyncCategoryListProps> = ({
  title,
  dimension,
  categories,
}) => {
  const color = dimension === 'PROJECT' ? SYNC_CONFIG.colors.project : SYNC_CONFIG.colors.mobilization;

  // Calculate overall progress
  const overallProgress = categories.length > 0
    ? categories.reduce((sum, cat) => sum + cat.progress, 0) / categories.length
    : 0;

  const totalItems = categories.reduce((sum, cat) => sum + cat.itemsCount, 0);
  const completedItems = categories.reduce((sum, cat) => sum + cat.completedCount, 0);

  // Label selon la dimension: "phases" pour Construction, "axes" pour Mobilisation
  const itemLabel = dimension === 'PROJECT' ? 'phases' : 'axes';

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b" style={{ borderLeftWidth: '4px', borderLeftColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {categories.length} {itemLabel} • {completedItems}/{totalItems} actions terminées
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold" style={{ color }}>
              {overallProgress.toFixed(0)}%
            </span>
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${overallProgress}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {categories.length > 0 ? (
          categories.map((cat) => (
            <CategoryCard
              key={cat.categoryId}
              category={cat}
              dimension={dimension}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune {dimension === 'PROJECT' ? 'action de construction' : 'action de mobilisation'} disponible</p>
            <p className="text-sm">Les données seront affichées une fois les actions créées</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncCategoryList;
