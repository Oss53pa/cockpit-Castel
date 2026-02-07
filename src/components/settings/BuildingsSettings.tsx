import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Building2,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Warehouse,
  MapPin,
  Layers,
  Square,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  LayoutGrid,
  Table,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Building, BuildingType, BuildingStatus, Action, BuildingCode } from '@/types';
import {
  BUILDING_TYPE_LABELS,
  BUILDING_STATUS_LABELS,
  BUILDING_STATUS_COLORS,
  BATIMENTS_CONFIG,
  TOTAL_GLA,
} from '@/types';
import { PROJET_CONFIG } from '@/data/constants';

// ============================================================================
// CALCUL AUTOMATIQUE - Avancement et Statut des bâtiments
// ============================================================================

interface BuildingProgress {
  avancement: number;
  status: BuildingStatus;
  actionsCount: number;
  actionsTerminees: number;
}

/**
 * Calcule l'avancement et le statut d'un bâtiment à partir de ses actions
 */
function calculateBuildingProgress(
  buildingCode: string,
  actions: Action[],
  currentStatus: BuildingStatus,
  hasReserves: boolean
): BuildingProgress {
  // Filtrer les actions liées à ce bâtiment
  const buildingActions = actions.filter(
    (a) => a.buildingCode === buildingCode && a.statut !== 'annule'
  );

  if (buildingActions.length === 0) {
    return {
      avancement: 0,
      status: 'non_demarre',
      actionsCount: 0,
      actionsTerminees: 0,
    };
  }

  // Calculer l'avancement moyen pondéré
  const totalAvancement = buildingActions.reduce((sum, a) => sum + a.avancement, 0);
  const avancement = Math.round(totalAvancement / buildingActions.length);
  const actionsTerminees = buildingActions.filter((a) => a.statut === 'termine').length;

  // Déterminer le statut automatiquement
  let status: BuildingStatus;
  if (avancement === 0) {
    status = 'non_demarre';
  } else if (avancement === 100) {
    status = hasReserves ? 'livre_avec_reserves' : 'livre';
  } else {
    status = 'en_cours';
  }

  // Si déjà en exploitation, ne pas rétrograder
  if (currentStatus === 'en_exploitation') {
    status = 'en_exploitation';
  }

  return {
    avancement,
    status,
    actionsCount: buildingActions.length,
    actionsTerminees,
  };
}

// ============================================================================
// DONNÉES PAR DÉFAUT - 6 BÂTIMENTS COSMOS ANGRÉ (spécifications v2.0)
// ============================================================================
// CC = Centre Commercial (PILOTE - synchronisation avec mobilisation)
// MKT = Market (hypermarché)
// BB1, BB2, BB3, BB4 = Big Boxes
// Total GLA: ~45,000 m²
// ============================================================================

// Génère DEFAULT_BUILDINGS à partir de BATIMENTS_CONFIG pour garantir la cohérence
const DEFAULT_BUILDINGS: Building[] = [
  {
    id: BATIMENTS_CONFIG.CC.id,
    nom: BATIMENTS_CONFIG.CC.nom,
    code: 'CC',
    type: 'centre_commercial',
    description: BATIMENTS_CONFIG.CC.description,
    niveaux: 3,
    surface: BATIMENTS_CONFIG.CC.surface, // 15 000 m² (depuis BATIMENTS_CONFIG)
    status: 'en_cours',
    dateDebutTravaux: '2024-01-15',
    dateLivraisonPrevue: '2026-09-30',
    avancement: 0, // Calculé automatiquement
    reserves: [],
    zones: [],
  },
  {
    id: BATIMENTS_CONFIG.MKT.id,
    nom: BATIMENTS_CONFIG.MKT.nom,
    code: 'MKT',
    type: 'big_box',
    description: BATIMENTS_CONFIG.MKT.description,
    niveaux: 1,
    surface: BATIMENTS_CONFIG.MKT.surface, // 6 000 m² (depuis BATIMENTS_CONFIG)
    status: 'en_cours',
    dateDebutTravaux: '2024-03-01',
    dateLivraisonPrevue: '2026-08-31',
    avancement: 0, // Calculé automatiquement
    reserves: [],
    zones: [],
  },
  {
    id: BATIMENTS_CONFIG.BB1.id,
    nom: BATIMENTS_CONFIG.BB1.nom,
    code: 'BB1',
    type: 'big_box',
    description: BATIMENTS_CONFIG.BB1.description,
    niveaux: 1,
    surface: BATIMENTS_CONFIG.BB1.surface, // 6 000 m²
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [],
  },
  {
    id: BATIMENTS_CONFIG.BB2.id,
    nom: BATIMENTS_CONFIG.BB2.nom,
    code: 'BB2',
    type: 'big_box',
    description: BATIMENTS_CONFIG.BB2.description,
    niveaux: 1,
    surface: BATIMENTS_CONFIG.BB2.surface, // 6 000 m²
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [],
  },
  {
    id: BATIMENTS_CONFIG.BB3.id,
    nom: BATIMENTS_CONFIG.BB3.nom,
    code: 'BB3',
    type: 'big_box',
    description: BATIMENTS_CONFIG.BB3.description,
    niveaux: 1,
    surface: BATIMENTS_CONFIG.BB3.surface, // 6 000 m²
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [],
  },
  {
    id: BATIMENTS_CONFIG.BB4.id,
    nom: BATIMENTS_CONFIG.BB4.nom,
    code: 'BB4',
    type: 'big_box',
    description: BATIMENTS_CONFIG.BB4.description,
    niveaux: 1,
    surface: BATIMENTS_CONFIG.BB4.surface, // 6 000 m²
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [],
  },
];
// Total GLA calculé automatiquement: TOTAL_GLA = 45 000 m²

const getStatusIcon = (status: BuildingStatus) => {
  switch (status) {
    case 'livre':
    case 'en_exploitation':
      return <CheckCircle className="h-4 w-4 text-success-500" />;
    case 'livre_avec_reserves':
      return <AlertTriangle className="h-4 w-4 text-warning-500" />;
    case 'en_cours':
      return <TrendingUp className="h-4 w-4 text-info-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getBuildingIcon = (type: BuildingType) => {
  switch (type) {
    case 'centre_commercial':
      return <Building2 className="h-5 w-5" />;
    case 'big_box':
      return <Warehouse className="h-5 w-5" />;
    case 'parking':
      return <Car className="h-5 w-5" />;
    case 'zone_exposition':
      return <MapPin className="h-5 w-5" />;
    default:
      return <Square className="h-5 w-5" />;
  }
};

interface BuildingCardProps {
  building: Building;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (building: Building) => void;
  onDelete: (id: string) => void;
  onQuickUpdate: (id: string, field: 'avancement' | 'status', value: number | BuildingStatus) => void;
  progress?: BuildingProgress;
  autoCalcEnabled?: boolean;
}

function BuildingCard({ building, isExpanded, onToggle, onEdit, onDelete, onQuickUpdate, progress, autoCalcEnabled }: BuildingCardProps) {
  const statusColor = BUILDING_STATUS_COLORS[building.status] || '#6B7280';
  const isAutoCalc = autoCalcEnabled && progress && progress.actionsCount > 0;

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            {getBuildingIcon(building.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary-900">{building.nom}</span>
              <Badge variant="secondary" className="text-xs">{building.code}</Badge>
              {building.code === 'CC' && (
                <Badge variant="info" className="text-xs">PILOTE</Badge>
              )}
            </div>
            <p className="text-sm text-primary-500">{BUILDING_TYPE_LABELS[building.type]}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-primary-600">
              <Square className="h-4 w-4" />
              <span>{building.surface?.toLocaleString()} m²</span>
            </div>
            <div className="flex items-center gap-1 text-primary-600">
              <Layers className="h-4 w-4" />
              <span>R+{building.niveaux}</span>
            </div>
          </div>

          {/* Progress Display */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isAutoCalc ? (
              <>
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${building.avancement}%`, backgroundColor: statusColor }}
                  />
                </div>
                <span className="text-sm font-medium" style={{ color: statusColor }}>
                  {building.avancement}%
                </span>
                <span
                  className="text-xs text-gray-500"
                  title={`${progress.actionsTerminees}/${progress.actionsCount} actions terminées`}
                >
                  ({progress.actionsTerminees}/{progress.actionsCount})
                </span>
              </>
            ) : (
              <>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={building.avancement}
                  onChange={(e) => onQuickUpdate(building.id, 'avancement', parseInt(e.target.value))}
                  className="w-16 h-2 accent-primary-500 cursor-pointer"
                  title="Modifier l'avancement"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={building.avancement}
                  onChange={(e) => onQuickUpdate(building.id, 'avancement', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-12 px-1 py-0.5 text-sm text-center border rounded focus:ring-1 focus:ring-primary-500"
                  style={{ color: statusColor }}
                />
                <span className="text-sm" style={{ color: statusColor }}>%</span>
              </>
            )}
          </div>

          {/* Status Display */}
          <div onClick={(e) => e.stopPropagation()}>
            {isAutoCalc ? (
              <Badge
                variant="secondary"
                className="text-xs"
                style={{ color: statusColor, backgroundColor: `${statusColor}20` }}
              >
                {BUILDING_STATUS_LABELS[building.status]}
              </Badge>
            ) : (
              <select
                value={building.status}
                onChange={(e) => onQuickUpdate(building.id, 'status', e.target.value as BuildingStatus)}
                className="text-sm px-2 py-1 border rounded focus:ring-1 focus:ring-primary-500 cursor-pointer"
                style={{ color: statusColor }}
              >
                {Object.entries(BUILDING_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Chevron */}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t p-4 bg-gray-50">
          <div className="mb-4">
            {/* Info */}
            <p className="text-sm text-primary-600 mb-3">{building.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {building.dateDebutTravaux && (
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  Début: {new Date(building.dateDebutTravaux).toLocaleDateString('fr-FR')}
                </Badge>
              )}
              {building.dateLivraisonPrevue && (
                <Badge variant="info">
                  <Calendar className="h-3 w-3 mr-1" />
                  Livraison: {new Date(building.dateLivraisonPrevue).toLocaleDateString('fr-FR')}
                </Badge>
              )}
              {isAutoCalc && (
                <Badge variant="success">
                  <Calculator className="h-3 w-3 mr-1" />
                  Avancement auto: {progress.actionsTerminees}/{progress.actionsCount} actions
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(building);
              }}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Supprimer le bâtiment "${building.nom}" ?`)) {
                  onDelete(building.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface BuildingEditModalProps {
  building: Building | null;
  onSave: (building: Building) => void;
  onClose: () => void;
}

function BuildingEditModal({ building, onSave, onClose }: BuildingEditModalProps) {
  const [formData, setFormData] = useState<Building>(
    building || {
      id: `BAT-NEW-${Date.now()}`,
      nom: '',
      code: '',
      type: 'autre',
      description: '',
      niveaux: 0,
      surface: 0,
      status: 'non_demarre',
      avancement: 0,
      reserves: [],
      zones: [],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary-900">
            {building ? 'Modifier le bâtiment' : 'Nouveau bâtiment'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Nom</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as BuildingType })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(BUILDING_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Surface (m²)</label>
              <input
                type="number"
                value={formData.surface || 0}
                onChange={(e) => setFormData({ ...formData, surface: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Niveaux (R+X)</label>
              <input
                type="number"
                value={formData.niveaux}
                onChange={(e) => setFormData({ ...formData, niveaux: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                min={0}
              />
            </div>
          </div>

          {/* Info avancement automatique */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Calculator className="h-4 w-4" />
              <span>
                <strong>Avancement automatique :</strong> L'avancement et le statut sont calculés automatiquement
                en fonction des actions liées à ce bâtiment (code: {formData.code || 'non défini'}).
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Date début travaux</label>
              <input
                type="date"
                value={formData.dateDebutTravaux || ''}
                onChange={(e) => setFormData({ ...formData, dateDebutTravaux: e.target.value || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Date livraison prévue</label>
              <input
                type="date"
                value={formData.dateLivraisonPrevue || ''}
                onChange={(e) => setFormData({ ...formData, dateLivraisonPrevue: e.target.value || undefined })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Vue Tableau Compacte
// ============================================================================
interface BuildingsTableProps {
  buildings: Building[];
  onQuickUpdate: (id: string, field: keyof Building, value: unknown) => void;
  onEdit: (building: Building) => void;
  onDelete: (id: string) => void;
  progressMap?: Record<string, BuildingProgress>;
  autoCalcEnabled?: boolean;
}

function BuildingsTable({ buildings, onQuickUpdate, onEdit, onDelete, progressMap, autoCalcEnabled }: BuildingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left p-3 font-medium text-primary-700">Bâtiment</th>
            <th className="text-left p-3 font-medium text-primary-700">Type</th>
            <th className="text-right p-3 font-medium text-primary-700">Surface</th>
            <th className="text-center p-3 font-medium text-primary-700">Niveaux</th>
            <th className="text-center p-3 font-medium text-primary-700 w-48">Avancement</th>
            <th className="text-center p-3 font-medium text-primary-700">Statut</th>
            <th className="text-center p-3 font-medium text-primary-700">Début</th>
            <th className="text-center p-3 font-medium text-primary-700">Livraison</th>
            <th className="text-center p-3 font-medium text-primary-700 w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {buildings.map((building) => {
            const statusColor = BUILDING_STATUS_COLORS[building.status] || '#6B7280';
            return (
              <tr key={building.id} className="border-b hover:bg-gray-50">
                {/* Nom & Code */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                    >
                      {getBuildingIcon(building.type)}
                    </div>
                    <div>
                      <div className="font-medium text-primary-900">{building.nom}</div>
                      <div className="text-xs text-primary-500">{building.code}</div>
                    </div>
                  </div>
                </td>

                {/* Type */}
                <td className="p-3">
                  <select
                    value={building.type}
                    onChange={(e) => onQuickUpdate(building.id, 'type', e.target.value)}
                    className="text-xs px-2 py-1 border rounded w-full focus:ring-1 focus:ring-primary-500"
                  >
                    {Object.entries(BUILDING_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </td>

                {/* Surface */}
                <td className="p-3 text-right">
                  <input
                    type="number"
                    value={building.surface || 0}
                    onChange={(e) => onQuickUpdate(building.id, 'surface', parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-right text-xs border rounded focus:ring-1 focus:ring-primary-500"
                  />
                  <span className="text-xs text-primary-500 ml-1">m²</span>
                </td>

                {/* Niveaux */}
                <td className="p-3 text-center">
                  <input
                    type="number"
                    min={0}
                    value={building.niveaux}
                    onChange={(e) => onQuickUpdate(building.id, 'niveaux', parseInt(e.target.value) || 0)}
                    className="w-12 px-2 py-1 text-center text-xs border rounded focus:ring-1 focus:ring-primary-500"
                  />
                </td>

                {/* Avancement */}
                <td className="p-3">
                  {(() => {
                    const progress = progressMap?.[building.code];
                    const isAutoCalc = autoCalcEnabled && progress && progress.actionsCount > 0;

                    return (
                      <div className="flex items-center gap-2">
                        {isAutoCalc ? (
                          <>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full transition-all"
                                style={{ width: `${building.avancement}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{building.avancement}%</span>
                            <span className="text-xs text-gray-500" title={`${progress.actionsTerminees}/${progress.actionsCount} actions terminées`}>
                              ({progress.actionsTerminees}/{progress.actionsCount})
                            </span>
                          </>
                        ) : (
                          <>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={building.avancement}
                              onChange={(e) => onQuickUpdate(building.id, 'avancement', parseInt(e.target.value))}
                              className="flex-1 h-2 accent-primary-500"
                            />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={building.avancement}
                              onChange={(e) => onQuickUpdate(building.id, 'avancement', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-12 px-1 py-1 text-center text-xs border rounded focus:ring-1 focus:ring-primary-500"
                            />
                            <span className="text-xs">%</span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </td>

                {/* Statut */}
                <td className="p-3 text-center">
                  {(() => {
                    const progress = progressMap?.[building.code];
                    const isAutoCalc = autoCalcEnabled && progress && progress.actionsCount > 0;

                    return isAutoCalc ? (
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{ color: statusColor, backgroundColor: `${statusColor}20` }}
                      >
                        {BUILDING_STATUS_LABELS[building.status]}
                      </Badge>
                    ) : (
                      <select
                        value={building.status}
                        onChange={(e) => onQuickUpdate(building.id, 'status', e.target.value)}
                        className="text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-primary-500"
                        style={{ color: statusColor }}
                      >
                        {Object.entries(BUILDING_STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    );
                  })()}
                </td>

                {/* Date début */}
                <td className="p-3 text-center">
                  <input
                    type="date"
                    value={building.dateDebutTravaux || ''}
                    onChange={(e) => onQuickUpdate(building.id, 'dateDebutTravaux', e.target.value || undefined)}
                    className="text-xs px-1 py-1 border rounded focus:ring-1 focus:ring-primary-500"
                  />
                </td>

                {/* Date livraison */}
                <td className="p-3 text-center">
                  <input
                    type="date"
                    value={building.dateLivraisonPrevue || ''}
                    onChange={(e) => onQuickUpdate(building.id, 'dateLivraisonPrevue', e.target.value || undefined)}
                    className="text-xs px-1 py-1 border rounded focus:ring-1 focus:ring-primary-500"
                  />
                </td>

                {/* Actions */}
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(building)}
                      className="p-1 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded"
                      title="Modifier les détails"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer "${building.nom}" ?`)) {
                          onDelete(building.id);
                        }
                      }}
                      className="p-1 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function BuildingsSettings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<Building | null | 'new'>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [autoCalcEnabled, setAutoCalcEnabled] = useState(true);

  // Récupérer toutes les actions en temps réel
  const actions = useLiveQuery(() => db.actions.toArray(), []) || [];

  // Calculer les avancements pour chaque bâtiment
  const buildingsProgress = useMemo(() => {
    const progressMap: Record<string, BuildingProgress> = {};
    buildings.forEach((building) => {
      progressMap[building.code] = calculateBuildingProgress(
        building.code,
        actions,
        building.status,
        (building.reserves?.length || 0) > 0
      );
    });
    return progressMap;
  }, [buildings, actions]);

  // Bâtiments avec avancement calculé
  const buildingsWithCalculatedProgress = useMemo(() => {
    if (!autoCalcEnabled) return buildings;

    return buildings.map((building) => {
      const progress = buildingsProgress[building.code];
      if (!progress || progress.actionsCount === 0) return building;

      return {
        ...building,
        avancement: progress.avancement,
        status: progress.status,
      };
    });
  }, [buildings, buildingsProgress, autoCalcEnabled]);

  // Load buildings from project
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const project = await db.project.toCollection().first();
        if (project?.buildings && project.buildings.length > 0) {
          setBuildings(project.buildings);
        } else {
          // Use default buildings if none exist
          setBuildings(DEFAULT_BUILDINGS);
        }
      } catch (error) {
        console.error('Error loading buildings:', error);
        setBuildings(DEFAULT_BUILDINGS);
      } finally {
        setLoading(false);
      }
    };
    loadBuildings();
  }, []);

  // Save buildings to project
  const saveBuildings = async (newBuildings: Building[]) => {
    setSaving(true);
    try {
      const project = await db.project.toCollection().first();
      if (project?.id) {
        await db.project.update(project.id, {
          buildings: newBuildings,
          updatedAt: new Date().toISOString(),
        });
      }
      setBuildings(newBuildings);
    } catch (error) {
      console.error('Error saving buildings:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBuilding = async (building: Building) => {
    const existingIndex = buildings.findIndex((b) => b.id === building.id);
    let newBuildings: Building[];

    if (existingIndex >= 0) {
      newBuildings = [...buildings];
      newBuildings[existingIndex] = building;
    } else {
      newBuildings = [...buildings, building];
    }

    await saveBuildings(newBuildings);
    setEditingBuilding(null);
  };

  const handleDeleteBuilding = async (id: string) => {
    const newBuildings = buildings.filter((b) => b.id !== id);
    await saveBuildings(newBuildings);
  };

  const handleResetToDefault = async () => {
    if (confirm(`Réinitialiser les bâtiments aux valeurs par défaut ${PROJET_CONFIG.nom} ?`)) {
      await saveBuildings(DEFAULT_BUILDINGS);
    }
  };

  // Synchroniser les avancements calculés vers la base de données
  const handleSyncProgress = async () => {
    if (!confirm('Synchroniser l\'avancement de tous les bâtiments avec les actions ?')) return;

    setSaving(true);
    try {
      const updatedBuildings = buildings.map((building) => {
        const progress = buildingsProgress[building.code];
        if (!progress || progress.actionsCount === 0) return building;

        return {
          ...building,
          avancement: progress.avancement,
          status: progress.status,
        };
      });

      await saveBuildings(updatedBuildings);
    } catch (error) {
      console.error('Error syncing progress:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setSaving(false);
    }
  };

  // Track pending saves for beforeunload protection
  const pendingBuildingsRef = useRef<Building[] | null>(null);

  // Save immediately (used for beforeunload and explicit saves)
  const saveImmediately = useCallback(async (buildingsToSave: Building[]) => {
    try {
      const project = await db.project.toCollection().first();
      if (project?.id) {
        await db.project.update(project.id, {
          buildings: buildingsToSave,
          updatedAt: new Date().toISOString(),
        });
      }
      pendingBuildingsRef.current = null;
    } catch (error) {
      console.error('Error saving building update:', error);
    }
  }, []);

  // Protect against data loss on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingBuildingsRef.current) {
        // Synchronous save attempt (best effort)
        const project = db.project.toCollection().first();
        if (project) {
          saveImmediately(pendingBuildingsRef.current);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveImmediately]);

  // Quick update for inline editing (with debounce)
  const handleQuickUpdate = useCallback(async (id: string, field: keyof Building, value: unknown) => {
    const buildingIndex = buildings.findIndex((b) => b.id === id);
    if (buildingIndex < 0) return;

    const updatedBuilding = { ...buildings[buildingIndex], [field]: value };
    const newBuildings = [...buildings];
    newBuildings[buildingIndex] = updatedBuilding;

    // Update local state immediately for responsiveness
    setBuildings(newBuildings);
    pendingBuildingsRef.current = newBuildings;

    // Debounce save to database
    clearTimeout((window as unknown as { _buildingSaveTimeout?: ReturnType<typeof setTimeout> })._buildingSaveTimeout);
    (window as unknown as { _buildingSaveTimeout?: ReturnType<typeof setTimeout> })._buildingSaveTimeout = setTimeout(async () => {
      await saveImmediately(newBuildings);
    }, 500);
  }, [buildings, saveImmediately]);

  // Stats (basées sur les données affichées)
  const displayedBuildings = buildingsWithCalculatedProgress;
  const totalSurface = displayedBuildings.reduce((sum, b) => sum + (b.surface || 0), 0);
  const avgProgress = displayedBuildings.length > 0
    ? Math.round(displayedBuildings.reduce((sum, b) => sum + b.avancement, 0) / displayedBuildings.length)
    : 0;
  const completedCount = displayedBuildings.filter((b) => b.status === 'livre' || b.status === 'en_exploitation').length;
  const totalActions = Object.values(buildingsProgress).reduce((sum, p) => sum + p.actionsCount, 0);

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          <span className="ml-2 text-primary-500">Chargement...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              Bâtiments du Projet
            </h3>
            <p className="text-sm text-primary-500">
              {`Gérez les ${buildings.length} bâtiments du complexe ${PROJET_CONFIG.nom} (GLA: ${buildings.reduce((sum, b) => sum + b.surface, 0).toLocaleString('fr-FR')} m²)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-calc Toggle */}
            <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
              <input
                type="checkbox"
                checked={autoCalcEnabled}
                onChange={(e) => setAutoCalcEnabled(e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <Calculator className="h-4 w-4 text-primary-600" />
              <span className="text-xs text-primary-700">Auto</span>
            </label>

            {/* Sync Button */}
            <Button
              variant="secondary"
              onClick={handleSyncProgress}
              disabled={saving || !autoCalcEnabled}
              title="Synchroniser les avancements avec les actions"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${saving ? 'animate-spin' : ''}`} />
              Sync
            </Button>

            {/* View Toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 ${viewMode === 'cards' ? 'bg-primary-100 text-primary-700' : 'text-primary-500 hover:bg-gray-50'}`}
                title="Vue cartes"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-primary-100 text-primary-700' : 'text-primary-500 hover:bg-gray-50'}`}
                title="Vue tableau"
              >
                <Table className="h-4 w-4" />
              </button>
            </div>
            <Button variant="secondary" onClick={handleResetToDefault} disabled={saving}>
              Réinitialiser
            </Button>
            <Button onClick={() => setEditingBuilding('new')} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-900">{displayedBuildings.length}</div>
            <div className="text-sm text-primary-600">Bâtiments</div>
          </div>
          <div className="bg-info-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-info-700">{totalSurface.toLocaleString()}</div>
            <div className="text-sm text-info-600">m² total</div>
          </div>
          <div className="bg-success-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success-700">{avgProgress}%</div>
            <div className="text-sm text-success-600">Avancement moyen</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning-700">{completedCount}/{displayedBuildings.length}</div>
            <div className="text-sm text-warning-600">Livrés</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{totalActions}</div>
            <div className="text-sm text-purple-600">Actions liées</div>
          </div>
        </div>

        {/* Info calcul automatique */}
        {autoCalcEnabled && totalActions > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
            <Calculator className="h-4 w-4" />
            <span>
              L'avancement et le statut sont calculés automatiquement à partir des {totalActions} actions liées aux bâtiments.
              Cliquez sur <strong>Sync</strong> pour enregistrer les valeurs calculées.
            </span>
          </div>
        )}

        {/* Buildings list */}
        {viewMode === 'cards' ? (
          <div className="space-y-3">
            {displayedBuildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                isExpanded={expandedId === building.id}
                onToggle={() => setExpandedId(expandedId === building.id ? null : building.id)}
                onEdit={setEditingBuilding}
                onDelete={handleDeleteBuilding}
                onQuickUpdate={handleQuickUpdate}
                progress={buildingsProgress[building.code]}
                autoCalcEnabled={autoCalcEnabled}
              />
            ))}
          </div>
        ) : (
          <BuildingsTable
            buildings={displayedBuildings}
            onQuickUpdate={handleQuickUpdate}
            onEdit={setEditingBuilding}
            onDelete={handleDeleteBuilding}
            progressMap={buildingsProgress}
            autoCalcEnabled={autoCalcEnabled}
          />
        )}
      </Card>

      {/* Edit Modal */}
      {editingBuilding !== null && (
        <BuildingEditModal
          building={editingBuilding === 'new' ? null : editingBuilding}
          onSave={handleSaveBuilding}
          onClose={() => setEditingBuilding(null)}
        />
      )}
    </div>
  );
}
