import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { db } from '@/db';
import type { Building, BuildingType, BuildingStatus } from '@/types';
import {
  BUILDING_TYPE_LABELS,
  BUILDING_STATUS_LABELS,
  BUILDING_STATUS_COLORS,
} from '@/types';

// Données par défaut des 8 bâtiments COSMOS ANGRÉ
const DEFAULT_BUILDINGS: Building[] = [
  {
    id: 'BAT-CC',
    nom: 'Centre Commercial',
    code: 'CC',
    type: 'centre_commercial',
    description: 'Mall principal avec boutiques, Food Court et espaces de loisirs. Surface commerciale de ~10,000 m².',
    niveaux: 2,
    surface: 10000,
    status: 'en_cours',
    dateDebutTravaux: '2024-06-01',
    dateLivraisonPrevue: '2026-09-30',
    avancement: 45,
    reserves: [],
    zones: [
      { id: 'Z-CC-01', nom: 'Supermarché', type: 'supermarche', surface: 3000, niveau: 0, status: 'livre_avec_reserves', locataire: 'Carrefour' },
      { id: 'Z-CC-02', nom: 'Galerie RDC', type: 'boutique', surface: 2500, niveau: 0, status: 'en_cours' },
      { id: 'Z-CC-03', nom: 'Galerie R+1', type: 'boutique', surface: 2500, niveau: 1, status: 'en_cours' },
      { id: 'Z-CC-04', nom: 'Food Court', type: 'restauration', surface: 1500, niveau: 2, status: 'non_demarre' },
      { id: 'Z-CC-05', nom: 'Loisirs', type: 'loisirs', surface: 500, niveau: 2, status: 'non_demarre' },
    ],
  },
  {
    id: 'BAT-BB1',
    nom: 'Big Box 1',
    code: 'BB1',
    type: 'big_box',
    description: 'Grande surface alimentaire (~1,500 m²).',
    niveaux: 0,
    surface: 1500,
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [
      { id: 'Z-BB1-01', nom: 'Cellule Principale', type: 'supermarche', surface: 1500, niveau: 0, status: 'non_demarre' },
    ],
  },
  {
    id: 'BAT-BB2',
    nom: 'Big Box 2',
    code: 'BB2',
    type: 'big_box',
    description: 'Ameublement / Décoration (~1,500 m²).',
    niveaux: 0,
    surface: 1500,
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [
      { id: 'Z-BB2-01', nom: 'Cellule Principale', type: 'boutique', surface: 1500, niveau: 0, status: 'non_demarre' },
    ],
  },
  {
    id: 'BAT-BB3',
    nom: 'Big Box 3',
    code: 'BB3',
    type: 'big_box',
    description: 'Électronique / High-Tech (~1,500 m²).',
    niveaux: 0,
    surface: 1500,
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [
      { id: 'Z-BB3-01', nom: 'Cellule Principale', type: 'boutique', surface: 1500, niveau: 0, status: 'non_demarre' },
    ],
  },
  {
    id: 'BAT-BB4',
    nom: 'Big Box 4',
    code: 'BB4',
    type: 'big_box',
    description: 'Sport / Loisirs (~1,500 m²).',
    niveaux: 0,
    surface: 1500,
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [
      { id: 'Z-BB4-01', nom: 'Cellule Principale', type: 'boutique', surface: 1500, niveau: 0, status: 'non_demarre' },
    ],
  },
  {
    id: 'BAT-ZE',
    nom: 'Zone Expo',
    code: 'ZE',
    type: 'zone_exposition',
    description: 'Espace événementiel (~800 m²).',
    niveaux: 0,
    surface: 800,
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [
      { id: 'Z-ZE-01', nom: 'Hall Principal', type: 'exposition', surface: 600, niveau: 0, status: 'non_demarre' },
      { id: 'Z-ZE-02', nom: 'Espace Technique', type: 'technique', surface: 200, niveau: 0, status: 'non_demarre' },
    ],
  },
  {
    id: 'BAT-MA',
    nom: 'Marché Artisanal',
    code: 'MA',
    type: 'autre',
    description: 'Artisanat local (~600 m²).',
    niveaux: 0,
    surface: 600,
    status: 'non_demarre',
    dateLivraisonPrevue: '2026-10-15',
    avancement: 0,
    reserves: [],
    zones: [
      { id: 'Z-MA-01', nom: 'Stands Artisans', type: 'boutique', surface: 450, niveau: 0, status: 'non_demarre' },
      { id: 'Z-MA-02', nom: 'Espace Démo', type: 'commun', surface: 150, niveau: 0, status: 'non_demarre' },
    ],
  },
  {
    id: 'BAT-PK',
    nom: 'Parking',
    code: 'PK',
    type: 'parking',
    description: '523 places de stationnement.',
    niveaux: 1,
    surface: 15000,
    status: 'en_cours',
    dateDebutTravaux: '2024-06-01',
    dateLivraisonPrevue: '2026-08-31',
    avancement: 35,
    reserves: [],
    zones: [
      { id: 'Z-PK-01', nom: 'Parking Surface', type: 'parking', surface: 8000, niveau: 0, status: 'en_cours' },
      { id: 'Z-PK-02', nom: 'Parking Sous-sol', type: 'parking', surface: 7000, niveau: -1, status: 'en_cours' },
    ],
  },
];

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
}

function BuildingCard({ building, isExpanded, onToggle, onEdit, onDelete }: BuildingCardProps) {
  const statusColor = BUILDING_STATUS_COLORS[building.status] || '#6B7280';

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

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${building.avancement}%`, backgroundColor: statusColor }}
              />
            </div>
            <span className="text-sm font-medium" style={{ color: statusColor }}>
              {building.avancement}%
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1">
            {getStatusIcon(building.status)}
            <span className="text-sm text-primary-600">{BUILDING_STATUS_LABELS[building.status]}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Info */}
            <div>
              <p className="text-sm text-primary-600 mb-2">{building.description}</p>
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
              </div>
            </div>

            {/* Zones */}
            <div>
              <h4 className="text-sm font-medium text-primary-700 mb-2">
                Zones ({building.zones?.length || 0})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {building.zones?.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between text-xs bg-white p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(zone.status)}
                      <span>{zone.nom}</span>
                      {zone.locataire && (
                        <Badge variant="success" className="text-xs">{zone.locataire}</Badge>
                      )}
                    </div>
                    <span className="text-primary-500">{zone.surface} m²</span>
                  </div>
                ))}
              </div>
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

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-primary-700 mb-1">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BuildingStatus })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(BUILDING_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
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

          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Avancement (%)</label>
              <input
                type="number"
                value={formData.avancement}
                onChange={(e) => setFormData({ ...formData, avancement: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                min={0}
                max={100}
              />
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

export function BuildingsSettings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<Building | null | 'new'>(null);
  const [saving, setSaving] = useState(false);

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
    if (confirm('Réinitialiser les bâtiments aux valeurs par défaut COSMOS ANGRÉ ?')) {
      await saveBuildings(DEFAULT_BUILDINGS);
    }
  };

  // Stats
  const totalSurface = buildings.reduce((sum, b) => sum + (b.surface || 0), 0);
  const avgProgress = buildings.length > 0
    ? Math.round(buildings.reduce((sum, b) => sum + b.avancement, 0) / buildings.length)
    : 0;
  const completedCount = buildings.filter((b) => b.status === 'livre' || b.status === 'en_exploitation').length;

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
              Gérez les 8 structures du complexe COSMOS ANGRÉ
            </p>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-900">{buildings.length}</div>
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
            <div className="text-2xl font-bold text-warning-700">{completedCount}/{buildings.length}</div>
            <div className="text-sm text-warning-600">Livrés</div>
          </div>
        </div>

        {/* Buildings list */}
        <div className="space-y-3">
          {buildings.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              isExpanded={expandedId === building.id}
              onToggle={() => setExpandedId(expandedId === building.id ? null : building.id)}
              onEdit={setEditingBuilding}
              onDelete={handleDeleteBuilding}
            />
          ))}
        </div>
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
