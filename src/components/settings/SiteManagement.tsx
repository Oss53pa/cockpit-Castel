import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Building2, MapPin, Calendar, Ruler, Store, Banknote, Warehouse } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useSites, createSite, updateSite, deleteSite, cleanupDuplicateSites } from '@/hooks/useSites';
import { useSiteStore } from '@/stores/siteStore';
import type { Site } from '@/types/site';
import { cn } from '@/lib/utils';

interface SiteFormData {
  code: string;
  nom: string;
  description: string;
  localisation: string;
  dateOuverture: string;
  dateInauguration: string;
  surface: number;
  boutiquesMin: number;
  boutiquesMax: number;
  investissement: number;
  nombreBatiments: number;
  couleur: string;
}

const defaultFormData: SiteFormData = {
  code: '',
  nom: '',
  description: '',
  localisation: '',
  dateOuverture: '',
  dateInauguration: '',
  surface: 0,
  boutiquesMin: 0,
  boutiquesMax: 0,
  investissement: 0,
  nombreBatiments: 0,
  couleur: '#18181b',
};

const colorOptions = [
  '#18181b', // Zinc 900
  '#1e40af', // Blue 800
  '#166534', // Green 800
  '#9333ea', // Purple 600
  '#dc2626', // Red 600
  '#ea580c', // Orange 600
  '#0891b2', // Cyan 600
  '#4f46e5', // Indigo 600
];

export function SiteManagement() {
  const sites = useSites();
  const currentSite = useSiteStore((state) => state.currentSite);
  const setCurrentSite = useSiteStore((state) => state.setCurrentSite);
  const updateSiteInStore = useSiteStore((state) => state.updateSite);

  const [isEditing, setIsEditing] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<SiteFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nettoyer les sites en double au chargement
  useEffect(() => {
    cleanupDuplicateSites().then((count) => {
      if (count > 0) {
        console.log(`[SiteManagement] ${count} site(s) en double nettoyé(s)`);
      }
    });
  }, []);

  const handleAdd = () => {
    setEditingSite(null);
    setFormData(defaultFormData);
    setIsEditing(true);
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setFormData({
      code: site.code,
      nom: site.nom,
      description: site.description ?? '',
      localisation: site.localisation ?? '',
      dateOuverture: site.dateOuverture ?? '',
      dateInauguration: site.dateInauguration ?? '',
      surface: site.surface ?? 0,
      boutiquesMin: site.boutiquesMin ?? 0,
      boutiquesMax: site.boutiquesMax ?? 0,
      investissement: site.investissement ?? 0,
      nombreBatiments: site.nombreBatiments ?? 0,
      couleur: site.couleur,
    });
    setIsEditing(true);
  };

  const handleDelete = async (site: Site) => {
    if (!site.id) return;
    if (!confirm(`Voulez-vous vraiment supprimer le site "${site.nom}" ?`)) return;

    await deleteSite(site.id);

    // If deleted site was current, select another one
    if (currentSite?.id === site.id && sites.length > 1) {
      const otherSite = sites.find((s) => s.id !== site.id);
      if (otherSite) setCurrentSite(otherSite);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingSite?.id) {
        const updatedData = {
          ...formData,
          actif: true,
        };
        await updateSite(editingSite.id, updatedData);

        // Synchroniser le store Zustand avec les nouvelles données
        const updatedSite: Site = {
          ...editingSite,
          ...updatedData,
          updatedAt: new Date().toISOString(),
        };
        updateSiteInStore(updatedSite);
      } else {
        await createSite({
          ...formData,
          actif: true,
        });
      }
      setIsEditing(false);
      setEditingSite(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Error saving site:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingSite(null);
    setFormData(defaultFormData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">Gestion des sites</h2>
          <p className="text-sm text-primary-500">
            Gérez vos différents projets et sites
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un site
        </Button>
      </div>

      {/* Site Form Modal */}
      {isEditing && (
        <Card className="border-primary-300 shadow-lg">
          <CardHeader>
            <CardTitle>
              {editingSite ? 'Modifier le site' : 'Nouveau site'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="COSMOS"
                    required
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="COSMOS ANGRE"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Description du projet..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={formData.localisation}
                    onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Angré, Abidjan, Côte d'Ivoire"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Surface GLA (m²)
                  </label>
                  <input
                    type="number"
                    value={formData.surface || ''}
                    onChange={(e) => setFormData({ ...formData, surface: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="45000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Soft Opening
                  </label>
                  <input
                    type="date"
                    value={formData.dateOuverture}
                    onChange={(e) => setFormData({ ...formData, dateOuverture: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Inauguration
                  </label>
                  <input
                    type="date"
                    value={formData.dateInauguration}
                    onChange={(e) => setFormData({ ...formData, dateInauguration: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Boutiques (min)
                  </label>
                  <input
                    type="number"
                    value={formData.boutiquesMin || ''}
                    onChange={(e) => setFormData({ ...formData, boutiquesMin: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Boutiques (max)
                  </label>
                  <input
                    type="number"
                    value={formData.boutiquesMax || ''}
                    onChange={(e) => setFormData({ ...formData, boutiquesMax: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Nb Bâtiments
                  </label>
                  <input
                    type="number"
                    value={formData.nombreBatiments || ''}
                    onChange={(e) => setFormData({ ...formData, nombreBatiments: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="6"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Investissement (FCFA)
                  </label>
                  <input
                    type="number"
                    value={formData.investissement || ''}
                    onChange={(e) => setFormData({ ...formData, investissement: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="85000000000"
                  />
                  <p className="text-xs text-primary-400 mt-1">
                    {formData.investissement > 0 && `${(formData.investissement / 1_000_000_000).toFixed(0)} milliards FCFA`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Couleur
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, couleur: color })}
                        className={cn(
                          'w-8 h-8 rounded-lg transition-all',
                          formData.couleur === color && 'ring-2 ring-offset-2 ring-primary-500'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-primary-100">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : editingSite ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sites List */}
      <div className="grid gap-4">
        {sites.map((site) => (
          <Card
            key={site.id}
            className={cn(
              'transition-all',
              currentSite?.id === site.id && 'ring-2 ring-primary-500'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                  style={{ backgroundColor: site.couleur }}
                >
                  {site.code?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-primary-900">{site.nom}</h3>
                    <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full">
                      {site.code}
                    </span>
                    {currentSite?.id === site.id && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        Actif
                      </span>
                    )}
                  </div>
                  {site.description && (
                    <p className="text-sm text-primary-500 mt-1">{site.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-primary-500">
                    {site.localisation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {site.localisation}
                      </span>
                    )}
                    {site.surface && (
                      <span className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        {site.surface.toLocaleString()} m²
                      </span>
                    )}
                    {(site.boutiquesMin || site.boutiquesMax) && (
                      <span className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {site.boutiquesMin && site.boutiquesMax
                          ? `${site.boutiquesMin} - ${site.boutiquesMax} boutiques`
                          : `${site.boutiquesMin || site.boutiquesMax} boutiques`
                        }
                      </span>
                    )}
                    {site.investissement && (
                      <span className="flex items-center gap-1">
                        <Banknote className="h-3 w-3" />
                        {(site.investissement / 1_000_000_000).toFixed(0)} Mds FCFA
                      </span>
                    )}
                    {site.dateOuverture && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Soft: {new Date(site.dateOuverture).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {site.dateInauguration && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Inaug: {new Date(site.dateInauguration).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {site.nombreBatiments && (
                      <span className="flex items-center gap-1">
                        <Warehouse className="h-3 w-3" />
                        {site.nombreBatiments} bâtiments
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(site)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {sites.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(site)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sites.length === 0 && (
          <div className="text-center py-12 text-primary-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun site configuré</p>
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Créer votre premier site
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
