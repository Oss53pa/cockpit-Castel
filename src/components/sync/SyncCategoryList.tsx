import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type { CategoryProgress, SyncDimension } from '@/types/sync.types';

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
          <div className="grid grid-cols-3 gap-4 text-sm">
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

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b" style={{ borderLeftWidth: '4px', borderLeftColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {categories.length} catégories • {completedItems}/{totalItems} éléments terminés
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
            <p>Aucune catégorie disponible</p>
            <p className="text-sm">Les données seront affichées une fois les jalons et actions créés</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncCategoryList;
