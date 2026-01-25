import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Plus } from 'lucide-react';
import { SYNC_CONFIG } from '@/config/syncConfig';
import type { CategoryProgress, SyncDimension, SyncItem } from '@/types/sync.types';
import { useSyncCategoryItems } from '@/hooks/useSync';
import { PROJECT_CATEGORIES, MOBILIZATION_CATEGORIES } from '@/types/sync.types';

interface SyncCategoryListProps {
  title: string;
  dimension: SyncDimension;
  categories: CategoryProgress[];
  projectId: string;
  onEditItem?: (item: SyncItem) => void;
  onAddItem?: (categoryId: string) => void;
  onUpdateProgress?: (itemId: number, progress: number) => void;
}

interface CategoryCardProps {
  category: CategoryProgress;
  dimension: SyncDimension;
  projectId: string;
  onEditItem?: (item: SyncItem) => void;
  onUpdateProgress?: (itemId: number, progress: number) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  dimension,
  projectId,
  onEditItem,
  onUpdateProgress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const items = useSyncCategoryItems(projectId, category.categoryId);

  // Get category config
  const allCategories = dimension === 'PROJECT' ? PROJECT_CATEGORIES : MOBILIZATION_CATEGORIES;
  const categoryConfig = allCategories.find((c) => c.id === category.categoryId);

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
            style={{ backgroundColor: categoryConfig?.color || '#6B7280' }}
          />
          <span className="font-medium text-gray-900">{category.categoryName}</span>
          <span className="text-xs text-gray-500">
            ({category.completedCount}/{category.itemsCount})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${category.progress}%`,
                backgroundColor: categoryConfig?.color || '#6B7280',
              }}
            />
          </div>
          <span className="text-sm font-semibold w-12 text-right" style={{ color: categoryConfig?.color }}>
            {category.progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Items list */}
      {isExpanded && (
        <div className="divide-y">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs text-gray-400 font-mono">{item.code}</span>
                  <span className="text-sm text-gray-700 truncate">{item.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      SYNC_CONFIG.itemStatusStyles[item.status].bg
                    } ${SYNC_CONFIG.itemStatusStyles[item.status].text}`}
                  >
                    {SYNC_CONFIG.itemStatusStyles[item.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Quick progress slider */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={item.progressPercent}
                      onChange={(e) => {
                        if (onUpdateProgress && item.id) {
                          onUpdateProgress(item.id, parseInt(e.target.value));
                        }
                      }}
                      className="w-20 h-1.5 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${categoryConfig?.color || '#3B82F6'} 0%, ${categoryConfig?.color || '#3B82F6'} ${item.progressPercent}%, #E5E7EB ${item.progressPercent}%, #E5E7EB 100%)`,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-medium w-10 text-right">{item.progressPercent}%</span>
                  </div>
                  {onEditItem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditItem(item);
                      }}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              Aucun élément dans cette catégorie
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SyncCategoryList: React.FC<SyncCategoryListProps> = ({
  title,
  dimension,
  categories,
  projectId,
  onEditItem,
  onAddItem,
  onUpdateProgress,
}) => {
  const color = dimension === 'PROJECT' ? SYNC_CONFIG.colors.project : SYNC_CONFIG.colors.mobilization;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b" style={{ borderLeftWidth: '4px', borderLeftColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {categories.length} catégories
            </p>
          </div>
          {onAddItem && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.categoryId}
            category={cat}
            dimension={dimension}
            projectId={projectId}
            onEditItem={onEditItem}
            onUpdateProgress={onUpdateProgress}
          />
        ))}
      </div>
    </div>
  );
};

export default SyncCategoryList;
