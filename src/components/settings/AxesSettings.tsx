import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Store,
  Wrench,
  Calculator,
  Megaphone,
  Settings,
  Building,
  TrendingUp,
  Percent,
  Palette,
  Link2,
  MoreHorizontal,
  Flag,
  CheckSquare,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Plus,
  Edit2,
  Save,
  X,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { AXES, AXE_LABELS, AXE_SHORT_LABELS, AXE_CONFIG, type Axe } from '@/types';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { logger } from '@/lib/logger';

// Icones mappees
const AXE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users: Users,
  Store: Store,
  Wrench: Wrench,
  Calculator: Calculator,
  Megaphone: Megaphone,
  Settings: Settings,
  Building: Building,
  MoreHorizontal: MoreHorizontal,
};

const ICON_OPTIONS = [
  { value: 'Users', label: 'Utilisateurs', icon: Users },
  { value: 'Store', label: 'Commerce', icon: Store },
  { value: 'Wrench', label: 'Technique', icon: Wrench },
  { value: 'Calculator', label: 'Finance', icon: Calculator },
  { value: 'Megaphone', label: 'Marketing', icon: Megaphone },
  { value: 'Settings', label: 'Paramètres', icon: Settings },
  { value: 'Building', label: 'Bâtiment', icon: Building },
  { value: 'MoreHorizontal', label: 'Autre', icon: MoreHorizontal },
];

// Type pour un axe personnalisable
interface CustomAxe {
  id: string;           // ex: "axe1_rh"
  code: string;         // ex: "RH"
  nom: string;          // ex: "RH & Organisation"
  nomComplet: string;   // ex: "AXE 1 - RH & Organisation"
  poids: number;        // ex: 15
  couleur: string;      // ex: "#3B82F6"
  icone: string;        // ex: "Users"
  syncCC: boolean;      // synchronise avec Centre Commercial
  ordre: number;        // ordre d'affichage
}

// Valeurs par défaut basées sur AXE_CONFIG
const getDefaultAxes = (): CustomAxe[] => {
  return AXES.map((axe, index) => ({
    id: axe,
    code: AXE_CONFIG[axe].code,
    nom: AXE_SHORT_LABELS[axe],
    nomComplet: AXE_LABELS[axe],
    poids: AXE_CONFIG[axe].poids,
    couleur: AXE_CONFIG[axe].couleur,
    icone: AXE_CONFIG[axe].icone,
    syncCC: AXE_CONFIG[axe].syncCC,
    ordre: index + 1,
  }));
};

interface AxeStats {
  jalonsTotal: number;
  jalonsTermines: number;
  jalonsEnRetard: number;
  actionsTotal: number;
  actionsTerminees: number;
  actionsEnRetard: number;
  risquesTotal: number;
  risquesCritiques: number;
}

interface AxeCardProps {
  axe: Axe;
  config: (typeof AXE_CONFIG)[Axe];
  stats: AxeStats;
  isExpanded: boolean;
  onToggle: () => void;
  customAxe?: CustomAxe;
  onEdit?: (axe: CustomAxe) => void;
  onDelete?: (id: string) => void;
}

// Modal d'édition/ajout d'axe
interface AxeEditModalProps {
  axe: CustomAxe | null;
  onSave: (axe: CustomAxe) => void;
  onClose: () => void;
  existingCodes: string[];
}

function AxeEditModal({ axe, onSave, onClose, existingCodes }: AxeEditModalProps) {
  const isNew = !axe;
  const [formData, setFormData] = useState<CustomAxe>(
    axe || {
      id: `axe_custom_${Date.now()}`,
      code: '',
      nom: '',
      nomComplet: '',
      poids: 0,
      couleur: '#6366F1',
      icone: 'MoreHorizontal',
      syncCC: true,
      ordre: 99,
    }
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.code.trim()) {
      setError('Le code est obligatoire');
      return;
    }
    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    if (isNew && existingCodes.includes(formData.code.toUpperCase())) {
      setError('Ce code existe déjà');
      return;
    }
    if (formData.poids < 0 || formData.poids > 100) {
      setError('Le poids doit être entre 0 et 100');
      return;
    }

    // Auto-générer nomComplet si vide
    const finalData = {
      ...formData,
      code: formData.code.toUpperCase(),
      nomComplet: formData.nomComplet.trim() || `AXE - ${formData.nom}`,
    };

    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary-900">
            {isNew ? 'Nouvel axe stratégique' : 'Modifier l\'axe'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="RH, COM, TECH..."
                maxLength={5}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Poids (%)</label>
              <input
                type="number"
                value={formData.poids}
                onChange={(e) => setFormData({ ...formData, poids: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                min={0}
                max={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Nom court *</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="RH & Organisation"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Nom complet</label>
            <input
              type="text"
              value={formData.nomComplet}
              onChange={(e) => setFormData({ ...formData, nomComplet: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="AXE 1 - RH & Organisation"
            />
            <p className="text-xs text-gray-500 mt-1">Laissez vide pour générer automatiquement</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Couleur</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  className="w-12 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Icône</label>
              <select
                value={formData.icone}
                onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="syncCC"
              checked={formData.syncCC}
              onChange={(e) => setFormData({ ...formData, syncCC: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="syncCC" className="text-sm text-primary-700">
              <span className="font-medium">Synchroniser avec le Centre Commercial</span>
              <p className="text-xs text-gray-500">L'avancement de cet axe suit la progression du bâtiment pilote</p>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {isNew ? 'Créer' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AxeCard({ axe, config, stats, isExpanded, onToggle, customAxe, onEdit, onDelete }: AxeCardProps) {
  const IconComponent = AXE_ICONS[config.icone] || TrendingUp;
  const displayName = customAxe?.nom || AXE_SHORT_LABELS[axe];
  const displayFullName = customAxe?.nomComplet || AXE_LABELS[axe];

  const jalonsProgress = stats.jalonsTotal > 0
    ? Math.round((stats.jalonsTermines / stats.jalonsTotal) * 100)
    : 0;
  const actionsProgress = stats.actionsTotal > 0
    ? Math.round((stats.actionsTerminees / stats.actionsTotal) * 100)
    : 0;

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
            style={{ backgroundColor: `${config.couleur}20`, color: config.couleur }}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary-900">{displayName}</span>
              <Badge variant="secondary" className="text-xs">{config.code}</Badge>
              {config.syncCC && (
                <Badge variant="info" className="text-xs flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Sync CC
                </Badge>
              )}
            </div>
            <p className="text-sm text-primary-500">{displayFullName}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Stats rapides */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1" title="Jalons">
              <Flag className="h-4 w-4 text-primary-400" />
              <span className="text-primary-700">{stats.jalonsTermines}/{stats.jalonsTotal}</span>
            </div>
            <div className="flex items-center gap-1" title="Actions">
              <CheckSquare className="h-4 w-4 text-primary-400" />
              <span className="text-primary-700">{stats.actionsTerminees}/{stats.actionsTotal}</span>
            </div>
            <div className="flex items-center gap-1" title="Risques">
              <AlertTriangle className="h-4 w-4 text-primary-400" />
              <span className="text-primary-700">{stats.risquesTotal}</span>
              {stats.risquesCritiques > 0 && (
                <Badge variant="danger" className="text-xs ml-1">{stats.risquesCritiques}</Badge>
              )}
            </div>
          </div>

          {/* Poids */}
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-primary-400" />
            <span
              className="text-lg font-bold min-w-[3rem] text-right"
              style={{ color: config.couleur }}
            >
              {config.poids}%
            </span>
          </div>

          {/* Couleur */}
          <div
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: config.couleur }}
          />

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
          {/* Stats detaillees */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Jalons */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="h-5 w-5 text-info-500" />
                <span className="font-medium text-primary-900">Jalons</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-600">Total</span>
                  <span className="font-medium">{stats.jalonsTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-success-600">Termines</span>
                  <span className="font-medium text-success-700">{stats.jalonsTermines}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-error-600">En retard</span>
                  <span className="font-medium text-error-700">{stats.jalonsEnRetard}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-info-500 h-2 rounded-full"
                    style={{ width: `${jalonsProgress}%` }}
                  />
                </div>
                <div className="text-xs text-right text-primary-500">{jalonsProgress}% complete</div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="h-5 w-5 text-success-500" />
                <span className="font-medium text-primary-900">Actions</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-600">Total</span>
                  <span className="font-medium">{stats.actionsTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-success-600">Terminees</span>
                  <span className="font-medium text-success-700">{stats.actionsTerminees}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-error-600">En retard</span>
                  <span className="font-medium text-error-700">{stats.actionsEnRetard}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-success-500 h-2 rounded-full"
                    style={{ width: `${actionsProgress}%` }}
                  />
                </div>
                <div className="text-xs text-right text-primary-500">{actionsProgress}% complete</div>
              </div>
            </div>

            {/* Risques */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
                <span className="font-medium text-primary-900">Risques</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-600">Total</span>
                  <span className="font-medium">{stats.risquesTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-error-600">Critiques</span>
                  <span className="font-medium text-error-700">{stats.risquesCritiques}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-success-600">Autres</span>
                  <span className="font-medium text-success-700">{stats.risquesTotal - stats.risquesCritiques}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-primary-500 mb-1">Code</div>
              <div className="font-medium text-primary-900">{config.code}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-primary-500 mb-1">Poids dans le calcul</div>
              <div className="font-medium text-primary-900">{config.poids}%</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-primary-500 mb-1">Couleur</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: config.couleur }}
                />
                <span className="font-mono text-sm text-primary-700">{config.couleur}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-primary-500 mb-1">Synchronisation CC</div>
              <div className="font-medium text-primary-900">
                {config.syncCC ? 'Activee' : 'Desactivee'}
              </div>
            </div>
          </div>

          {config.poids === 0 && (
            <div className="mt-4 p-3 bg-warning-50 rounded-lg text-sm text-warning-700">
              <strong>Note :</strong> Cet axe n'est pas pris en compte dans le calcul global de progression du projet.
            </div>
          )}

          {/* Boutons d'action */}
          {(onEdit || onDelete) && customAxe && (
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              {onEdit && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(customAxe);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Supprimer l'axe "${customAxe.nom}" ? Les actions, jalons et risques associés ne seront pas supprimés.`)) {
                      onDelete(customAxe.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AxesSettings() {
  const [expandedAxe, setExpandedAxe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customAxes, setCustomAxes] = useState<CustomAxe[]>([]);
  const [editingAxe, setEditingAxe] = useState<CustomAxe | null | 'new'>(null);

  // Charger les axes personnalisés depuis la base de données
  const loadCustomAxes = useCallback(async () => {
    try {
      const config = await db.secureConfigs.where('key').equals('customAxes').first();
      if (config?.value) {
        const parsed = JSON.parse(config.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomAxes(parsed);
          return parsed;
        }
      }
      // Utiliser les valeurs par défaut
      const defaults = getDefaultAxes();
      setCustomAxes(defaults);
      return defaults;
    } catch (error) {
      logger.error('Erreur chargement axes:', error);
      const defaults = getDefaultAxes();
      setCustomAxes(defaults);
      return defaults;
    }
  }, []);

  // Sauvegarder les axes personnalisés
  const saveCustomAxes = async (axes: CustomAxe[]) => {
    setSaving(true);
    try {
      const existing = await db.secureConfigs.where('key').equals('customAxes').first();
      const now = new Date().toISOString();

      if (existing?.id) {
        await db.secureConfigs.update(existing.id, {
          value: JSON.stringify(axes),
          updatedAt: now,
        });
      } else {
        await db.secureConfigs.add({
          key: 'customAxes',
          value: JSON.stringify(axes),
          isEncrypted: false,
          createdAt: now,
          updatedAt: now,
        });
      }
      setCustomAxes(axes);
    } catch (error) {
      logger.error('Erreur sauvegarde axes:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Charger les données en temps réel avec useLiveQuery
  const jalons = useLiveQuery(() => db.jalons.toArray(), []) || [];
  const actions = useLiveQuery(() => db.actions.toArray(), []) || [];
  const risques = useLiveQuery(() => db.risques.toArray(), []) || [];

  // Charger les axes personnalisés au montage
  useEffect(() => {
    loadCustomAxes().finally(() => setLoading(false));
  }, [loadCustomAxes]);

  // Calculer les statistiques à partir des données live
  const axeStats = useMemo(() => {
    const stats: Record<string, AxeStats> = {};

    // Mapping des différents formats d'axe vers les IDs standards
    // Les données peuvent avoir: 'axe1_rh', 'AXE 1', 'rh', 'RH', etc.
    const axeVariants: Record<string, string[]> = {
      'axe1_rh': ['axe1_rh', 'AXE 1', 'AXE1', 'rh', 'RH', 'axe_rh', 'Tous'],
      'axe2_commercial': ['axe2_commercial', 'AXE 2', 'AXE2', 'commercial', 'COMMERCIAL', 'axe_commercial'],
      'axe3_technique': ['axe3_technique', 'AXE 3', 'AXE3', 'technique', 'TECHNIQUE', 'axe_technique'],
      'axe4_budget': ['axe4_budget', 'AXE 4', 'AXE4', 'budget', 'BUDGET', 'axe_budget'],
      'axe5_marketing': ['axe5_marketing', 'AXE 5', 'AXE5', 'marketing', 'MARKETING', 'axe_marketing'],
      'axe6_exploitation': ['axe6_exploitation', 'AXE 6', 'AXE6', 'exploitation', 'EXPLOITATION', 'axe_exploitation'],
      'axe7_construction': ['axe7_construction', 'AXE 7', 'AXE7', 'construction', 'CONSTRUCTION', 'axe_construction'],
      'axe8_divers': ['axe8_divers', 'AXE 8', 'AXE8', 'divers', 'DIVERS', 'axe_divers'],
    };

    // Stats pour tous les axes (par défaut et personnalisés)
    const allAxeIds = [...AXES, ...customAxes.filter(a => !AXES.includes(a.id as Axe)).map(a => a.id)];

    for (const axeId of allAxeIds) {
      // Obtenir toutes les variantes possibles pour cet axe
      const variants = axeVariants[axeId] || [axeId];

      const axeJalons = jalons.filter((j) => variants.includes(j.axe));
      const axeActions = actions.filter((a) => variants.includes(a.axe));
      const axeRisques = risques.filter((r) => r.axe_impacte && variants.includes(r.axe_impacte));

      stats[axeId] = {
        jalonsTotal: axeJalons.length,
        jalonsTermines: axeJalons.filter((j) =>
          j.statut === 'atteint' || j.statut === 'ATTEINT'
        ).length,
        jalonsEnRetard: axeJalons.filter((j) =>
          j.statut === 'depasse' || j.statut === 'en_danger'
        ).length,
        actionsTotal: axeActions.length,
        actionsTerminees: axeActions.filter((a) =>
          a.statut === 'termine'
        ).length,
        actionsEnRetard: axeActions.filter((a) =>
          a.statut === 'bloque' || a.statut === 'reporte'
        ).length,
        risquesTotal: axeRisques.length,
        risquesCritiques: axeRisques.filter((r) =>
          r.statut === 'ouvert' && r.score_actuel && r.score_actuel >= 12
        ).length,
      };
    }

    return stats;
  }, [jalons, actions, risques, customAxes]);

  // Ajouter ou modifier un axe
  const handleSaveAxe = async (axe: CustomAxe) => {
    const existingIndex = customAxes.findIndex((a) => a.id === axe.id);
    let newAxes: CustomAxe[];

    if (existingIndex >= 0) {
      newAxes = [...customAxes];
      newAxes[existingIndex] = axe;
    } else {
      axe.ordre = customAxes.length + 1;
      newAxes = [...customAxes, axe];
    }

    await saveCustomAxes(newAxes);
    setEditingAxe(null);
  };

  // Supprimer un axe
  const handleDeleteAxe = async (id: string) => {
    const newAxes = customAxes.filter((a) => a.id !== id);
    await saveCustomAxes(newAxes);
  };

  // Réinitialiser aux valeurs par défaut
  const handleResetToDefault = async () => {
    if (confirm('Réinitialiser tous les axes aux valeurs par défaut ?')) {
      const defaults = getDefaultAxes();
      await saveCustomAxes(defaults);
    }
  };

  // Calculer les totaux basés sur customAxes
  const totalPoids = customAxes.reduce((sum, axe) => sum + axe.poids, 0);
  const axesAvecPoids = customAxes.filter((axe) => axe.poids > 0);
  const axesSyncCC = customAxes.filter((axe) => axe.syncCC);

  // Totaux globaux
  const totals = customAxes.reduce(
    (acc, axe) => {
      const stats = axeStats[axe.id] || {
        jalonsTotal: 0,
        jalonsTermines: 0,
        actionsTotal: 0,
        actionsTerminees: 0,
        risquesTotal: 0,
        risquesCritiques: 0,
      };
      return {
        jalons: acc.jalons + stats.jalonsTotal,
        jalonsTermines: acc.jalonsTermines + stats.jalonsTermines,
        actions: acc.actions + stats.actionsTotal,
        actionsTerminees: acc.actionsTerminees + stats.actionsTerminees,
        risques: acc.risques + stats.risquesTotal,
        risquesCritiques: acc.risquesCritiques + stats.risquesCritiques,
      };
    },
    { jalons: 0, jalonsTermines: 0, actions: 0, actionsTerminees: 0, risques: 0, risquesCritiques: 0 }
  );

  // Liste des codes existants pour validation
  const existingCodes = customAxes.map((a) => a.code);

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
              Axes Stratégiques
            </h3>
            <p className="text-sm text-primary-500">
              Configuration des {customAxes.length} axes du projet
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleResetToDefault}
              disabled={saving}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              Réinitialiser
            </Button>
            <Button
              onClick={() => setEditingAxe('new')}
              disabled={saving}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un axe
            </Button>
          </div>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-900">{customAxes.length}</div>
            <div className="text-sm text-primary-600">Axes</div>
          </div>
          <div className="bg-info-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-info-700">{axesAvecPoids.length}</div>
            <div className="text-sm text-info-600">Avec poids</div>
          </div>
          <div className="bg-success-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success-700">{totalPoids}%</div>
            <div className="text-sm text-success-600">Total poids</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning-700">{axesSyncCC.length}</div>
            <div className="text-sm text-warning-600">Sync. CC</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flag className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold text-blue-700">{totals.jalons}</span>
            </div>
            <div className="text-sm text-blue-600">Jalons</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-green-700">{totals.actions}</span>
            </div>
            <div className="text-sm text-green-600">Actions</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-700">{totals.risques}</span>
            </div>
            <div className="text-sm text-red-600">Risques</div>
          </div>
        </div>

        {/* Répartition graphique */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-700">Répartition des poids</span>
            </div>
            {totalPoids !== 100 && (
              <Badge variant={totalPoids > 100 ? 'danger' : 'warning'} className="text-xs">
                Total: {totalPoids}% {totalPoids !== 100 && '(doit être 100%)'}
              </Badge>
            )}
          </div>
          <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
            {customAxes.filter((axe) => axe.poids > 0).map((axe) => (
              <div
                key={axe.id}
                className="h-full"
                style={{
                  width: `${axe.poids}%`,
                  backgroundColor: axe.couleur,
                }}
                title={`${axe.nom}: ${axe.poids}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {customAxes.filter((axe) => axe.poids > 0).map((axe) => (
              <div key={axe.id} className="flex items-center gap-1 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: axe.couleur }}
                />
                <span className="text-primary-600">{axe.code}: {axe.poids}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Axes list */}
        <div className="space-y-3">
          {customAxes.map((customAxe) => {
            // Créer une config compatible avec le type attendu
            const config = {
              code: customAxe.code,
              poids: customAxe.poids,
              couleur: customAxe.couleur,
              icone: customAxe.icone,
              syncCC: customAxe.syncCC,
            };

            return (
              <AxeCard
                key={customAxe.id}
                axe={customAxe.id as Axe}
                config={config}
                stats={axeStats[customAxe.id] || {
                  jalonsTotal: 0,
                  jalonsTermines: 0,
                  jalonsEnRetard: 0,
                  actionsTotal: 0,
                  actionsTerminees: 0,
                  actionsEnRetard: 0,
                  risquesTotal: 0,
                  risquesCritiques: 0,
                }}
                isExpanded={expandedAxe === customAxe.id}
                onToggle={() => setExpandedAxe(expandedAxe === customAxe.id ? null : customAxe.id)}
                customAxe={customAxe}
                onEdit={(axe) => setEditingAxe(axe)}
                onDelete={handleDeleteAxe}
              />
            );
          })}
        </div>
      </Card>

      {/* Legende */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Legende
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-primary-500" />
              <span className="font-medium text-primary-700">Poids</span>
            </div>
            <p className="text-primary-600">
              Pourcentage de l'axe dans le calcul de la progression globale du projet.
              Le total doit faire 100%.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-info-500" />
              <span className="font-medium text-primary-700">Sync CC</span>
            </div>
            <p className="text-primary-600">
              Indique si l'axe se synchronise avec la progression du Centre Commercial (batiment pilote).
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Flag className="h-4 w-4 text-info-500" />
              <span className="font-medium text-primary-700">Jalons</span>
            </div>
            <p className="text-primary-600">
              Nombre de jalons associes a cet axe. Les jalons marquent les etapes cles du projet.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="h-4 w-4 text-success-500" />
              <span className="font-medium text-primary-700">Actions</span>
            </div>
            <p className="text-primary-600">
              Nombre d'actions associees a cet axe. Les actions sont les taches a realiser.
            </p>
          </div>
        </div>
      </Card>

      {/* Modal d'édition */}
      {editingAxe !== null && (
        <AxeEditModal
          axe={editingAxe === 'new' ? null : editingAxe}
          onSave={handleSaveAxe}
          onClose={() => setEditingAxe(null)}
          existingCodes={editingAxe === 'new' ? existingCodes : existingCodes.filter((c) => c !== (editingAxe as CustomAxe).code)}
        />
      )}
    </div>
  );
}
