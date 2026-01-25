import React, { useState, useMemo } from 'react';
import {
  Book,
  Calendar,
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Trash2,
  Archive,
  CheckCircle,
  FileText,
  Presentation,
  AlertTriangle,
  Users,
  Tag,
  Sun,
  Cloud,
  CloudRain,
  Zap,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@/hooks/useDeepDives';
import type { DeepDive, ProjectWeather } from '@/types/deepDive';
import { WEATHER_CONFIG } from '@/types/deepDive';
import { useNavigate } from 'react-router-dom';

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
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
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

function DeepDiveCard({
  deepDive,
  onView,
  onDuplicate,
  onArchive,
  onDelete,
  onMarkPresented,
}: DeepDiveCardProps) {
  const status = statusConfig[deepDive.status];
  const weather = WEATHER_CONFIG[deepDive.weather];

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4" style={{ borderLeftColor: weather.color }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {weatherIcons[deepDive.weather]}
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {deepDive.titre}
              </h3>
              <p className="text-sm text-gray-500">{deepDive.projectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="flex items-center gap-1"
              style={{ backgroundColor: status.bgColor, color: status.color }}
            >
              {status.icon}
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir le détail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
                {deepDive.status === 'finalized' && (
                  <DropdownMenuItem onClick={onMarkPresented}>
                    <Presentation className="h-4 w-4 mr-2" />
                    Marquer comme présenté
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* KPIs Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{deepDive.kpis.avancementGlobal}%</div>
            <div className="text-xs text-gray-500">Avancement</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {deepDive.kpis.jalonsAtteints}/{deepDive.kpis.jalonsTotal}
            </div>
            <div className="text-xs text-gray-500">Jalons</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {Math.round((deepDive.kpis.budgetConsomme / deepDive.kpis.budgetTotal) * 100)}%
            </div>
            <div className="text-xs text-gray-500">Budget</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{deepDive.decisionPoints.length}</div>
            <div className="text-xs text-gray-500">Décisions</div>
          </div>
        </div>

        {/* Top risks indicator */}
        {deepDive.topRisks.length > 0 && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-primary-500" />
            <span className="text-sm text-red-700">
              {deepDive.topRisks.filter(r => r.score >= 15).length} risque(s) critique(s)
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatRelativeDate(deepDive.createdAt)}
          </div>
          {deepDive.presentedAt && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Présenté à {deepDive.presentedTo}
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">par</span>
            <span className="font-medium">{deepDive.createdBy}</span>
          </div>
        </div>

        {/* Tags */}
        {deepDive.tags && deepDive.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {deepDive.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {deepDive.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">+{deepDive.tags.length - 3}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function JournalPage() {
  const navigate = useNavigate();
  const deepDives = useDeepDives();
  const stats = useDeepDiveStats();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [weatherFilter, setWeatherFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'weather' | 'name'>('date');
  const [deleteConfirm, setDeleteConfirm] = useState<DeepDive | null>(null);
  const [presentedModal, setPresentedModal] = useState<DeepDive | null>(null);
  const [presentedTo, setPresentedTo] = useState('');

  // Filter and sort deep dives
  const filteredDeepDives = useMemo(() => {
    let result = [...deepDives];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        d =>
          d.titre.toLowerCase().includes(query) ||
          d.projectName.toLowerCase().includes(query) ||
          d.createdBy.toLowerCase().includes(query) ||
          d.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    // Weather filter
    if (weatherFilter !== 'all') {
      result = result.filter(d => d.weather === weatherFilter);
    }

    // Sort
    switch (sortBy) {
      case 'date':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'weather': {
        const weatherOrder = { red: 0, orange: 1, yellow: 2, green: 3 };
        result.sort((a, b) => weatherOrder[a.weather] - weatherOrder[b.weather]);
        break;
      }
      case 'name':
        result.sort((a, b) => a.titre.localeCompare(b.titre));
        break;
    }

    return result;
  }, [deepDives, searchQuery, statusFilter, weatherFilter, sortBy]);

  const handleDelete = async () => {
    if (deleteConfirm?.id) {
      await deleteDeepDive(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    await duplicateDeepDive(id);
  };

  const handleArchive = async (id: number) => {
    await archiveDeepDive(id);
  };

  const handleMarkPresented = async () => {
    if (presentedModal?.id && presentedTo) {
      await markDeepDiveAsPresented(presentedModal.id, presentedTo);
      setPresentedModal(null);
      setPresentedTo('');
    }
  };

  const handleNewDeepDive = () => {
    navigate('/rapports?view=deep_dive');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Book className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Journal des DeepDives</h1>
              <p className="text-sm text-gray-500">Historique complet des présentations DG</p>
            </div>
          </div>
          <Button onClick={handleNewDeepDive} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau DeepDive
          </Button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-6 gap-4 mb-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-700">Total</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-gray-600">{stats.drafts}</div>
                <div className="text-sm text-gray-700">Brouillons</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.finalized}</div>
                <div className="text-sm text-blue-700">Finalisés</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{stats.presented}</div>
                <div className="text-sm text-green-700">Présentés</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.thisMonth}</div>
                <div className="text-sm text-purple-700">Ce mois</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center gap-1">
                  <span className="text-green-500">{stats.byWeather.green}</span>
                  <span className="text-yellow-500">{stats.byWeather.yellow}</span>
                  <span className="text-orange-500">{stats.byWeather.orange}</span>
                  <span className="text-red-500">{stats.byWeather.red}</span>
                </div>
                <div className="text-sm text-amber-700">Par météo</div>
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
              <SelectItem value="green">🟢 Vert</SelectItem>
              <SelectItem value="yellow">🟡 Jaune</SelectItem>
              <SelectItem value="orange">🟠 Orange</SelectItem>
              <SelectItem value="red">🔴 Rouge</SelectItem>
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
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        {filteredDeepDives.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDeepDives.map((deepDive) => (
              <DeepDiveCard
                key={deepDive.id}
                deepDive={deepDive}
                onView={() => navigate(`/rapports?view=deep_dive&id=${deepDive.id}`)}
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
      </ScrollArea>

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

export default JournalPage;
