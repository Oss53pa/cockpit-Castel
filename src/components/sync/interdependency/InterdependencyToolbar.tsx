/**
 * Barre d'outils pour le diagramme d'interdépendance
 */

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  AlertTriangle,
  GitBranch,
  RefreshCw,
} from 'lucide-react';
import type { Axe } from '@/types';
import type { InterdependencyFilters } from '@/types/interdependency.types';

const AXE_LABELS: Record<Axe, string> = {
  axe1_rh: 'RH',
  axe2_commercial: 'Commercial',
  axe3_technique: 'Technique',
  axe4_budget: 'Budget',
  axe5_marketing: 'Marketing',
  axe6_exploitation: 'Exploitation',
};

interface InterdependencyToolbarProps {
  filters: InterdependencyFilters;
  onFiltersChange: (filters: InterdependencyFilters) => void;
  availableAxes: Axe[];
  availableJalons: Array<{ id: number; titre: string }>;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onRefresh: () => void;
  stats?: {
    totalActions: number;
    criticalActions: number;
    blockedActions: number;
  };
}

export const InterdependencyToolbar: React.FC<InterdependencyToolbarProps> = ({
  filters,
  onFiltersChange,
  availableAxes,
  availableJalons,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onRefresh,
  stats,
}) => {
  const handleAxeChange = (axe: string) => {
    onFiltersChange({
      ...filters,
      axe: axe === '' ? undefined : (axe as Axe),
      jalonId: undefined, // Reset jalon when axe changes
    });
  };

  const handleJalonChange = (jalonId: string) => {
    onFiltersChange({
      ...filters,
      jalonId: jalonId === '' ? undefined : parseInt(jalonId, 10),
    });
  };

  const toggleCriticalOnly = () => {
    onFiltersChange({
      ...filters,
      showCriticalOnly: !filters.showCriticalOnly,
      showBlockedOnly: false, // Mutually exclusive
    });
  };

  const toggleBlockedOnly = () => {
    onFiltersChange({
      ...filters,
      showBlockedOnly: !filters.showBlockedOnly,
      showCriticalOnly: false, // Mutually exclusive
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-white border-b border-gray-200">
      {/* Filtres */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filters.axe || ''}
            onChange={(e) => handleAxeChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les axes</option>
            {availableAxes.map((axe) => (
              <option key={axe} value={axe}>
                {AXE_LABELS[axe]}
              </option>
            ))}
          </select>
        </div>

        {filters.axe && availableJalons.length > 0 && (
          <select
            value={filters.jalonId || ''}
            onChange={(e) => handleJalonChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les jalons</option>
            {availableJalons.map((jalon) => (
              <option key={jalon.id} value={jalon.id}>
                {jalon.titre}
              </option>
            ))}
          </select>
        )}

        <div className="h-6 w-px bg-gray-300" />

        {/* Toggle chemin critique */}
        <button
          onClick={toggleCriticalOnly}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filters.showCriticalOnly
              ? 'bg-orange-100 text-orange-700 border border-orange-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          Chemin critique
        </button>

        {/* Toggle bloqués */}
        <button
          onClick={toggleBlockedOnly}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filters.showBlockedOnly
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Bloqués uniquement
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            <strong>{stats.totalActions}</strong> actions
          </span>
          <span className="text-orange-600">
            <strong>{stats.criticalActions}</strong> critiques
          </span>
          {stats.blockedActions > 0 && (
            <span className="text-red-600">
              <strong>{stats.blockedActions}</strong> bloquées
            </span>
          )}
        </div>
      )}

      {/* Contrôles de zoom */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          title="Actualiser"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <div className="h-6 w-px bg-gray-300" />

        <button
          onClick={onZoomOut}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          title="Zoom arrière"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <span className="text-sm text-gray-600 w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          title="Zoom avant"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <button
          onClick={onResetView}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          title="Réinitialiser la vue"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
