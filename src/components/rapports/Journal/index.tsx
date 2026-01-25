import React, { useState, useMemo } from 'react';
import {
  Book,
  Calendar,
  Clock,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Archive,
  CheckCircle,
  FileText,
  Presentation,
  Target,
  Tag,
  Sun,
  Cloud,
  CloudRain,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useDeepDives,
  useDeepDiveStats,
  deleteDeepDive,
  duplicateDeepDive,
  archiveDeepDive,
  markDeepDiveAsPresented,
  createDeepDive,
} from '@/hooks/useDeepDives';
import type { DeepDive, ProjectWeather } from '@/types/deepDive';
import { WEATHER_CONFIG } from '@/types/deepDive';

interface JournalProps {
  onOpenDeepDive: (id: number) => void;
}

const statusConfig: Record<DeepDive['status'], { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', color: '#6B7280', bgColor: '#F3F4F6', icon: <FileText className="h-4 w-4" /> },
  finalized: { label: 'Finalisé', color: '#3B82F6', bgColor: '#DBEAFE', icon: <CheckCircle className="h-4 w-4" /> },
  presented: { label: 'Présenté', color: '#22C55E', bgColor: '#DCFCE7', icon: <Presentation className="h-4 w-4" /> },
  archived: { label: 'Archivé', color: '#9CA3AF', bgColor: '#E5E7EB', icon: <Archive className="h-4 w-4" /> },
};

const weatherIcons: Record<ProjectWeather, React.ReactNode> = {
  green: <Sun className="h-5 w-5 text-primary-500" />,
  yellow: <Cloud className="h-5 w-5 text-primary-500" />,
  orange: <CloudRain className="h-5 w-5 text-primary-500" />,
  red: <Zap className="h-5 w-5 text-primary-500" />,
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  return formatDate(dateString);
}

interface DeepDiveCardProps {
  deepDive: DeepDive;
  onView: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMarkPresented: () => void;
}

function DeepDiveCard({ deepDive, onView, onDuplicate, onArchive, onDelete, onMarkPresented }: DeepDiveCardProps) {
  const status = statusConfig[deepDive.status];
  const weather = WEATHER_CONFIG[deepDive.meteoGlobale];

  return (
    <Card className="group hover:shadow-lg transition-all cursor-pointer" onClick={onView}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: weather.bgColor }}
            >
              {weatherIcons[deepDive.meteoGlobale]}
            </div>
            <div>
              <CardTitle className="text-base line-clamp-1">{deepDive.titre}</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">{deepDive.projet}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                <Eye className="h-4 w-4 mr-2" />
                Voir / Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              {deepDive.status === 'finalized' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkPresented(); }}>
                  <Presentation className="h-4 w-4 mr-2" />
                  Marquer comme présenté
                </DropdownMenuItem>
              )}
              {deepDive.status !== 'archived' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Weather and Status badges */}
          <div className="flex items-center gap-2">
            <Badge
              style={{ backgroundColor: weather.bgColor, color: weather.color }}
              className="text-xs"
            >
              {weather.label}
            </Badge>
            <Badge
              style={{ backgroundColor: status.bgColor, color: status.color }}
              className="text-xs flex items-center gap-1"
            >
              {status.icon}
              {status.label}
            </Badge>
          </div>

          {/* Axes summary */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Target className="h-3.5 w-3.5" />
            <span>
              {Object.entries(deepDive.axes)
                .filter(([, data]) => data.actif)
                .length} axes actifs
            </span>
          </div>

          {/* Tags */}
          {deepDive.tags && deepDive.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {deepDive.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
              {deepDive.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{deepDive.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRelativeDate(deepDive.updatedAt)}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Période {deepDive.periodeDebut} - {deepDive.periodeFin}
            </div>
          </div>

          {/* Presented info */}
          {deepDive.status === 'presented' && deepDive.presentedTo && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-2 py-1">
              <Presentation className="h-3.5 w-3.5" />
              Présenté à: {deepDive.presentedTo}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Journal({ onOpenDeepDive }: JournalProps) {
  const deepDives = useDeepDives();
  const stats = useDeepDiveStats();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [weatherFilter, setWeatherFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'weather' | 'name'>('date');
  const [deleteConfirm, setDeleteConfirm] = useState<DeepDive | null>(null);
  const [presentedModal, setPresentedModal] = useState<DeepDive | null>(null);
  const [presentedTo, setPresentedTo] = useState('');

  const filteredDeepDives = useMemo(() => {
    let result = [...deepDives];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (dd) =>
          dd.titre.toLowerCase().includes(query) ||
          dd.projet.toLowerCase().includes(query) ||
          dd.auteur.toLowerCase().includes(query) ||
          dd.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((dd) => dd.status === statusFilter);
    }

    // Weather filter
    if (weatherFilter !== 'all') {
      result = result.filter((dd) => dd.meteoGlobale === weatherFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'weather': {
          const weatherOrder: Record<ProjectWeather, number> = { red: 0, orange: 1, yellow: 2, green: 3 };
          return weatherOrder[a.meteoGlobale] - weatherOrder[b.meteoGlobale];
        }
        case 'name':
          return a.titre.localeCompare(b.titre);
        default:
          return 0;
      }
    });

    return result;
  }, [deepDives, searchQuery, statusFilter, weatherFilter, sortBy]);

  const handleNewDeepDive = async () => {
    const newId = await createDeepDive({
      titre: 'Nouveau DeepDive',
      projet: 'COSMOS ANGRE',
      periode: new Date().toISOString().slice(0, 7),
      periodeDebut: new Date().toISOString().slice(0, 7),
      periodeFin: new Date().toISOString().slice(0, 7),
      auteur: 'Utilisateur',
      status: 'draft',
      meteoGlobale: 'yellow',
      tags: [],
      axes: {
        axe1: { actif: true, meteo: 'yellow', commentaire: '' },
        axe2: { actif: true, meteo: 'yellow', commentaire: '' },
        axe3: { actif: true, meteo: 'yellow', commentaire: '' },
        axe4: { actif: false, meteo: 'green', commentaire: '' },
      },
      faitsMarquants: [],
      risques: [],
      budgetCommentaire: '',
      planningCommentaire: '',
      recommandations: [],
      prochainJalon: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (newId) {
      onOpenDeepDive(newId);
    }
  };

  const handleDuplicate = async (id: number) => {
    const newId = await duplicateDeepDive(id);
    if (newId) {
      onOpenDeepDive(newId);
    }
  };

  const handleArchive = async (id: number) => {
    await archiveDeepDive(id);
  };

  const handleDelete = async () => {
    if (deleteConfirm?.id) {
      await deleteDeepDive(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleMarkPresented = async () => {
    if (presentedModal?.id && presentedTo) {
      await markDeepDiveAsPresented(presentedModal.id, presentedTo);
      setPresentedModal(null);
      setPresentedTo('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Journal DeepDive</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos présentations DG et suivez l'historique du projet
          </p>
        </div>
        <Button onClick={handleNewDeepDive}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau DeepDive
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
              <div className="text-sm text-blue-600">Total DeepDives</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-amber-700">{stats.drafts}</div>
              <div className="text-sm text-amber-600">Brouillons</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-green-700">{stats.presented}</div>
              <div className="text-sm text-green-600">Présentés</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex gap-2 text-lg font-bold">
                <span className="text-green-500">{stats.byWeather.green}</span>
                <span className="text-yellow-500">{stats.byWeather.yellow}</span>
                <span className="text-orange-500">{stats.byWeather.orange}</span>
                <span className="text-red-500">{stats.byWeather.red}</span>
              </div>
              <div className="text-sm text-purple-600">Par météo</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par titre, projet, auteur, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
            <SelectItem value="finalized">Finalisés</SelectItem>
            <SelectItem value="presented">Présentés</SelectItem>
            <SelectItem value="archived">Archivés</SelectItem>
          </SelectContent>
        </Select>
        <Select value={weatherFilter} onValueChange={setWeatherFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Météo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes météos</SelectItem>
            <SelectItem value="green">Vert</SelectItem>
            <SelectItem value="yellow">Jaune</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
            <SelectItem value="red">Rouge</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="weather">Météo</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {filteredDeepDives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDeepDives.map((deepDive) => (
            <DeepDiveCard
              key={deepDive.id}
              deepDive={deepDive}
              onView={() => deepDive.id && onOpenDeepDive(deepDive.id)}
              onDuplicate={() => deepDive.id && handleDuplicate(deepDive.id)}
              onArchive={() => deepDive.id && handleArchive(deepDive.id)}
              onDelete={() => setDeleteConfirm(deepDive)}
              onMarkPresented={() => setPresentedModal(deepDive)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Book className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchQuery || statusFilter !== 'all' || weatherFilter !== 'all'
              ? 'Aucun DeepDive trouvé'
              : 'Aucun DeepDive enregistré'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md">
            {searchQuery || statusFilter !== 'all' || weatherFilter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Créez votre premier DeepDive pour commencer à suivre vos présentations DG'}
          </p>
          <Button onClick={handleNewDeepDive}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un DeepDive
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le DeepDive</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteConfirm?.titre}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Presented Dialog */}
      <Dialog open={!!presentedModal} onOpenChange={() => setPresentedModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme présenté</DialogTitle>
            <DialogDescription>
              À qui avez-vous présenté ce DeepDive ?
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Ex: Comité de Direction, DG, COPIL..."
            value={presentedTo}
            onChange={(e) => setPresentedTo(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPresentedModal(null)}>
              Annuler
            </Button>
            <Button onClick={handleMarkPresented} disabled={!presentedTo}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Journal;
