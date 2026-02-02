import { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  CheckCircle,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  ArrowDownLeft,
  Plus,
  MessageSquare,
  Paperclip,
  Eye,
  Pencil,
  Trash2,
  Filter,
  X,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  Card,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
  Input,
  MoneyInput,
} from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import {
  LigneBudgetaireModal,
  ConfirmDeleteModal,
  type LigneBudgetaireComplete,
} from './LigneBudgetaireModal';
import { BudgetImportExport } from './BudgetImportExport';
import { BudgetEditModal } from './BudgetEditModal';
import { useBudgetExploitation } from '@/hooks/useBudgetExploitation';
import type { LigneBudgetExploitation } from '@/types/budgetExploitation.types';

// Types pour le budget mobilisation
interface PosteBudgetaire {
  id: string;
  poste: string;
  budgetPrevu: number;
  engage: number;
  consomme: number;
  disponible: number;
  tauxConso: number;
}

// NOTE: Les données budgétaires sont maintenant chargées depuis la base de données
// via le hook useBudgetExploitation. Les constantes ci-dessous servent uniquement
// de fallback pendant le chargement initial.

// Données par poste (agrégation) - utilisées comme fallback
const POSTES_BUDGET_MOBILISATION: PosteBudgetaire[] = [
  { id: 'recrutement', poste: 'Recrutement', budgetPrevu: 118_000_000, engage: 112_000_000, consomme: 81_500_000, disponible: 36_500_000, tauxConso: 69 },
  { id: 'formation', poste: 'Formation', budgetPrevu: 40_000_000, engage: 35_000_000, consomme: 23_000_000, disponible: 17_000_000, tauxConso: 57 },
  { id: 'marketing', poste: 'Marketing', budgetPrevu: 100_000_000, engage: 75_000_000, consomme: 48_000_000, disponible: 52_000_000, tauxConso: 48 },
  { id: 'evenements', poste: 'Événements', budgetPrevu: 100_000_000, engage: 45_000_000, consomme: 0, disponible: 100_000_000, tauxConso: 0 },
  { id: 'it_equipements', poste: 'IT & Équipements', budgetPrevu: 72_000_000, engage: 67_000_000, consomme: 53_000_000, disponible: 19_000_000, tauxConso: 74 },
  { id: 'amenagement', poste: 'Aménagement', budgetPrevu: 33_000_000, engage: 33_000_000, consomme: 30_000_000, disponible: 3_000_000, tauxConso: 91 },
  { id: 'frais_generaux', poste: 'Frais généraux', budgetPrevu: 40_000_000, engage: 32_000_000, consomme: 25_000_000, disponible: 15_000_000, tauxConso: 63 },
  { id: 'provisions', poste: 'Provisions', budgetPrevu: 65_500_000, engage: 0, consomme: 0, disponible: 65_500_000, tauxConso: 0 },
];

// Calcul des totaux
const TOTAUX_MOBILISATION = POSTES_BUDGET_MOBILISATION.reduce(
  (acc, poste) => ({
    budgetPrevu: acc.budgetPrevu + poste.budgetPrevu,
    engage: acc.engage + poste.engage,
    consomme: acc.consomme + poste.consomme,
    disponible: acc.disponible + poste.disponible,
  }),
  { budgetPrevu: 0, engage: 0, consomme: 0, disponible: 0 }
);

// Format montant en FCFA
function formatMontant(value: number): string {
  if (value === 0) return '0';
  if (value >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 1)} Md`;
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)} M`;
  if (value >= 1_000) return `${formatNumber(value / 1_000, 1)} K`;
  return formatNumber(value, 0);
}

// Couleurs pour les graphiques
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];

// Couleurs par poste
const POSTE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  'Recrutement': { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  'Formation': { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  'Marketing': { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  'Événements': { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  'IT & Équipements': { bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
  'Aménagement': { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  'Frais généraux': { bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
  'Provisions': { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' },
};

// Interface pour les données de phase détaillées
interface PhaseDetail {
  phase: string;
  prevu: number;
  engage: number;
  consomme: number;
  description: string;
  periode: string;
  responsable: string;
  lignes: Array<{
    poste: string;
    description: string;
    prevu: number;
    engage: number;
    consomme: number;
    statut: 'termine' | 'en_cours' | 'a_venir';
  }>;
  risques: string[];
  alertes: string[];
}

// NOTE: Les données de phases sont maintenant calculées dynamiquement dans VueParPhase
// à partir des lignes budgétaires chargées depuis la base de données.

// Composant KPI Card
function KPICard({ label, value, subValue, icon: Icon, color, bgColor }: {
  label: string; value: string; subValue?: string; icon: React.ElementType; color: string; bgColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-primary-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-primary-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-primary-900">{value}</p>
          {subValue && <p className="text-xs text-primary-400 mt-1">{subValue}</p>}
        </div>
        <div className={cn('rounded-lg p-2', bgColor)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

// Composant Progress Bar
function ProgressBar({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const getVariant = (v: number) => {
    if (v >= 100) return 'success';
    if (v >= 75) return 'success';
    if (v >= 50) return 'warning';
    if (v >= 25) return 'default';
    return 'error';
  };
  return (
    <div className="flex items-center gap-2">
      <Progress value={value} variant={getVariant(value)} size={size} className="flex-1" />
      <span className={cn('font-medium text-primary-600', size === 'sm' ? 'text-xs w-10' : 'text-sm w-12')}>{value}%</span>
    </div>
  );
}

// NOTE: VueSynthese et VueDetail ont été remplacés par VueSyntheseEditable et VueDetailEditable
// qui utilisent les données du hook useBudgetExploitation (base de données)

// Modal d'ajout de nouvelle ligne budgétaire
function BudgetAddModal({
  open,
  onClose,
  onSave,
  existingCategories,
  nextOrdre,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (ligne: Omit<LigneBudgetExploitation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  existingCategories: string[];
  nextOrdre: number;
}) {
  const [poste, setPoste] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('');
  const [prevu, setPrevu] = useState(0);
  const [engage, setEngage] = useState(0);
  const [consomme, setConsomme] = useState(0);
  const [couleur, setCouleur] = useState('#3B82F6');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catégories disponibles
  const CATEGORIES = [
    { id: 'recrutement', label: 'Recrutement' },
    { id: 'formation', label: 'Formation' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'evenements', label: 'Événements' },
    { id: 'it_equipements', label: 'IT & Équipements' },
    { id: 'amenagement', label: 'Aménagement' },
    { id: 'frais_generaux', label: 'Frais généraux' },
    { id: 'provisions', label: 'Provisions' },
  ];

  // Couleurs par défaut par catégorie
  const CATEGORY_COLORS: Record<string, string> = {
    recrutement: '#3B82F6',
    formation: '#22C55E',
    marketing: '#8B5CF6',
    evenements: '#F59E0B',
    it_equipements: '#06B6D4',
    amenagement: '#F97316',
    frais_generaux: '#64748B',
    provisions: '#71717A',
  };

  // Mettre à jour la couleur quand la catégorie change
  useEffect(() => {
    if (categorie && CATEGORY_COLORS[categorie]) {
      setCouleur(CATEGORY_COLORS[categorie]);
    }
  }, [categorie]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPoste('');
      setDescription('');
      setCategorie('');
      setPrevu(0);
      setEngage(0);
      setConsomme(0);
      setCouleur('#3B82F6');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    setError(null);

    // Validation
    if (!poste.trim()) {
      setError('Le nom du poste est obligatoire');
      return;
    }
    if (!categorie) {
      setError('La catégorie est obligatoire');
      return;
    }
    if (engage > prevu) {
      setError('Le montant engagé ne peut pas dépasser le montant prévu');
      return;
    }
    if (consomme > engage) {
      setError('Le montant consommé ne peut pas dépasser le montant engagé');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        budgetType: 'mobilisation',
        annee: 2026,
        ordre: nextOrdre,
        poste: poste.trim(),
        description: description.trim() || undefined,
        categorie,
        montantPrevu: prevu,
        montantEngage: engage,
        montantConsomme: consomme,
        couleur,
      });
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Ajouter une ligne budgétaire</h2>
              <p className="text-primary-100 text-sm">Nouvelle entrée dans le budget mobilisation</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Erreur */}
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error-500" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Nom du poste */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Nom du poste *
            </label>
            <Input
              type="text"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              placeholder="Ex: Formation sécurité"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Catégorie *
            </label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="w-full text-sm border border-primary-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Description
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée (optionnel)"
            />
          </div>

          {/* Montants */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Prévu
              </label>
              <MoneyInput value={prevu} onChange={setPrevu} className="text-right font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Engagé
              </label>
              <MoneyInput value={engage} onChange={setEngage} className="text-right font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Consommé
              </label>
              <MoneyInput value={consomme} onChange={setConsomme} className="text-right font-mono" />
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Couleur
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-primary-200"
              />
              <div
                className="px-3 py-1 rounded text-white text-sm"
                style={{ backgroundColor: couleur }}
              >
                Aperçu
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-primary-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            <Plus className="h-4 w-4 mr-2" />
            {isSaving ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Vue Graphiques - utilise les données du hook
function VueGraphiques({ lignes }: { lignes: LigneBudgetExploitation[] }) {
  // Transformer les données du hook pour les graphiques
  const chartData = lignes
    .filter((l) => l.categorie !== 'provisions')
    .map((ligne) => ({
      name: ligne.poste,
      prevu: ligne.montantPrevu / 1_000_000,
      engage: ligne.montantEngage / 1_000_000,
      consomme: ligne.montantConsomme / 1_000_000,
    }));

  const pieData = lignes
    .filter((l) => l.categorie !== 'provisions')
    .map((ligne, index) => ({
      name: ligne.poste,
      value: ligne.montantPrevu,
      color: ligne.couleur || COLORS[index % COLORS.length],
    }));

  // Calculer le taux de consommation pour chaque poste
  const tauxConsoData = lignes
    .filter((l) => l.categorie !== 'provisions')
    .map((ligne, index) => ({
      id: ligne.id,
      poste: ligne.poste,
      tauxConso: ligne.montantPrevu > 0
        ? Math.round((ligne.montantConsomme / ligne.montantPrevu) * 100)
        : 0,
      color: ligne.couleur || COLORS[index % COLORS.length],
    }));

  return (
    <div className="space-y-6">
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Budget par poste</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e4e4e7' }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e4e4e7' }} tickFormatter={(value) => `${value}M`} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)} M FCFA`} contentStyle={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="prevu" name="Prévu" fill="#71717a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="engage" name="Engagé" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="consomme" name="Consommé" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card padding="md">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Répartition du budget</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMontant(value)} contentStyle={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-primary-600 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Taux de consommation</h3>
          <div className="space-y-4">
            {tauxConsoData.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-primary-600">{item.poste}</span>
                  <span className="font-medium">{item.tauxConso}%</span>
                </div>
                <div className="h-2 rounded-full bg-primary-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.tauxConso}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Modal de détail de phase
function PhaseDetailModal({ phase, open, onClose }: { phase: PhaseDetail | null; open: boolean; onClose: () => void }) {
  if (!phase || !open) return null;

  const tauxConso = (phase.consomme / phase.prevu) * 100;
  const tauxEngagement = (phase.engage / phase.prevu) * 100;
  const reste = phase.prevu - phase.consomme;

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'termine': return <CheckCircle2 className="h-4 w-4 text-success-500" />;
      case 'en_cours': return <Clock className="h-4 w-4 text-info-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'termine': return 'Terminé';
      case 'en_cours': return 'En cours';
      default: return 'À venir';
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'termine': return 'bg-success-100 text-success-700';
      case 'en_cours': return 'bg-info-100 text-info-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{phase.phase}</h2>
              <p className="text-primary-100 text-sm mt-1">{phase.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Metadata */}
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2 text-primary-600">
              <Calendar className="h-4 w-4" />
              <span>{phase.periode}</span>
            </div>
            <div className="flex items-center gap-2 text-primary-600">
              <User className="h-4 w-4" />
              <span>{phase.responsable}</span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-primary-50 rounded-xl p-4 text-center">
              <p className="text-xs text-primary-500 mb-1">Budget prévu</p>
              <p className="text-xl font-bold text-primary-900">{formatMontant(phase.prevu)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-500 mb-1">Engagé</p>
              <p className="text-xl font-bold text-blue-700">{formatMontant(phase.engage)}</p>
              <p className="text-xs text-blue-400">{tauxEngagement.toFixed(0)}%</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-green-500 mb-1">Consommé</p>
              <p className="text-xl font-bold text-green-700">{formatMontant(phase.consomme)}</p>
              <p className="text-xs text-green-400">{tauxConso.toFixed(0)}%</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-xs text-orange-500 mb-1">Reste à consommer</p>
              <p className="text-xl font-bold text-orange-700">{formatMontant(reste)}</p>
              <p className="text-xs text-orange-400">{(100 - tauxConso).toFixed(0)}%</p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-primary-600">Taux d'engagement</span>
                <span className="font-semibold text-blue-600">{tauxEngagement.toFixed(1)}%</span>
              </div>
              <Progress value={tauxEngagement} variant="default" size="md" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-primary-600">Taux de consommation</span>
                <span className="font-semibold text-green-600">{tauxConso.toFixed(1)}%</span>
              </div>
              <Progress value={tauxConso} variant="success" size="md" />
            </div>
          </div>

          {/* Lignes budgétaires */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-500" />
              Détail des lignes budgétaires
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-primary-600">Poste</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-primary-600">Prévu</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-primary-600">Engagé</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-primary-600">Consommé</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-primary-600">Statut</th>
                    <th className="px-4 py-3 text-xs font-semibold text-primary-600 w-24">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {phase.lignes.map((ligne, index) => {
                    const ligneAvancement = ligne.prevu > 0 ? (ligne.consomme / ligne.prevu) * 100 : 0;
                    return (
                      <tr key={index} className="hover:bg-primary-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-primary-900">{ligne.poste}</p>
                          <p className="text-xs text-primary-500">{ligne.description}</p>
                        </td>
                        <td className="text-right px-4 py-3 font-medium text-primary-700">{formatMontant(ligne.prevu)}</td>
                        <td className="text-right px-4 py-3 text-blue-600">{formatMontant(ligne.engage)}</td>
                        <td className="text-right px-4 py-3 text-green-600">{formatMontant(ligne.consomme)}</td>
                        <td className="text-center px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', getStatutBadge(ligne.statut))}>
                            {getStatutIcon(ligne.statut)}
                            {getStatutLabel(ligne.statut)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${Math.min(ligneAvancement, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-primary-600 w-10">{ligneAvancement.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-primary-100">
                  <tr>
                    <td className="px-4 py-3 font-bold text-primary-900">Total</td>
                    <td className="text-right px-4 py-3 font-bold text-primary-900">{formatMontant(phase.prevu)}</td>
                    <td className="text-right px-4 py-3 font-bold text-blue-700">{formatMontant(phase.engage)}</td>
                    <td className="text-right px-4 py-3 font-bold text-green-700">{formatMontant(phase.consomme)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Risques et Alertes */}
          <div className="grid grid-cols-2 gap-6">
            {phase.risques.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-4">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risques identifiés
                </h4>
                <ul className="space-y-2">
                  {phase.risques.map((risque, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                      <span className="text-orange-400 mt-1">•</span>
                      {risque}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {phase.alertes.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Alertes actives
                </h4>
                <ul className="space-y-2">
                  {phase.alertes.map((alerte, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="text-red-400 mt-1">•</span>
                      {alerte}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {phase.risques.length === 0 && phase.alertes.length === 0 && (
              <div className="col-span-2 bg-green-50 rounded-xl p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Aucun risque ni alerte active</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-primary-50 flex justify-end">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

// Vue Par Phase - utilise les données du hook
function VueParPhase({ lignes }: { lignes: LigneBudgetExploitation[] }) {
  const [selectedPhase, setSelectedPhase] = useState<PhaseDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Définition des mappings catégorie -> phase
  const PHASE_MAPPING: Record<string, string> = {
    'recrutement': 'Pré-ouverture',
    'it_equipements': 'Pré-ouverture',
    'amenagement': 'Pré-ouverture',
    'frais_generaux': 'Pré-ouverture',
    'formation': 'Formation',
    'marketing': 'Lancement',
    'evenements': 'Lancement',
    'provisions': 'Pré-ouverture', // Les provisions sont généralement pré-ouverture
  };

  // Construire les données de phases depuis les lignes du hook
  const phasesData = useMemo(() => {
    const phaseMap: Record<string, { prevu: number; engage: number; consomme: number; lignes: typeof lignes }> = {
      'Pré-ouverture': { prevu: 0, engage: 0, consomme: 0, lignes: [] },
      'Formation': { prevu: 0, engage: 0, consomme: 0, lignes: [] },
      'Lancement': { prevu: 0, engage: 0, consomme: 0, lignes: [] },
    };

    lignes.forEach((ligne) => {
      const phaseName = PHASE_MAPPING[ligne.categorie] || 'Pré-ouverture';
      if (phaseMap[phaseName]) {
        phaseMap[phaseName].prevu += ligne.montantPrevu;
        phaseMap[phaseName].engage += ligne.montantEngage;
        phaseMap[phaseName].consomme += ligne.montantConsomme;
        phaseMap[phaseName].lignes.push(ligne);
      }
    });

    // Convertir en tableau avec métadonnées
    const phases: PhaseDetail[] = [
      {
        phase: 'Pré-ouverture',
        description: 'Phase de préparation : recrutement, aménagement, IT et frais généraux',
        periode: 'Janvier - Septembre 2026',
        responsable: 'Center Manager',
        prevu: phaseMap['Pré-ouverture'].prevu,
        engage: phaseMap['Pré-ouverture'].engage,
        consomme: phaseMap['Pré-ouverture'].consomme,
        lignes: phaseMap['Pré-ouverture'].lignes.map((l) => ({
          poste: l.poste,
          description: l.description || l.poste,
          prevu: l.montantPrevu,
          engage: l.montantEngage,
          consomme: l.montantConsomme,
          statut: l.montantConsomme >= l.montantPrevu ? 'termine' : l.montantConsomme > 0 ? 'en_cours' : 'a_venir',
        })),
        risques: [],
        alertes: [],
      },
      {
        phase: 'Formation',
        description: 'Formation des équipes : formations internes et externes',
        periode: 'Juillet - Octobre 2026',
        responsable: 'RH Manager',
        prevu: phaseMap['Formation'].prevu,
        engage: phaseMap['Formation'].engage,
        consomme: phaseMap['Formation'].consomme,
        lignes: phaseMap['Formation'].lignes.map((l) => ({
          poste: l.poste,
          description: l.description || l.poste,
          prevu: l.montantPrevu,
          engage: l.montantEngage,
          consomme: l.montantConsomme,
          statut: l.montantConsomme >= l.montantPrevu ? 'termine' : l.montantConsomme > 0 ? 'en_cours' : 'a_venir',
        })),
        risques: [],
        alertes: [],
      },
      {
        phase: 'Lancement',
        description: 'Marketing, événements et animations d\'ouverture',
        periode: 'Octobre - Décembre 2026',
        responsable: 'Marketing Manager',
        prevu: phaseMap['Lancement'].prevu,
        engage: phaseMap['Lancement'].engage,
        consomme: phaseMap['Lancement'].consomme,
        lignes: phaseMap['Lancement'].lignes.map((l) => ({
          poste: l.poste,
          description: l.description || l.poste,
          prevu: l.montantPrevu,
          engage: l.montantEngage,
          consomme: l.montantConsomme,
          statut: l.montantConsomme >= l.montantPrevu ? 'termine' : l.montantConsomme > 0 ? 'en_cours' : 'a_venir',
        })),
        risques: [],
        alertes: [],
      },
    ];

    return phases.filter((p) => p.prevu > 0); // Ne montrer que les phases avec budget
  }, [lignes]);

  const handlePhaseClick = (phase: PhaseDetail) => {
    setSelectedPhase(phase);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Budget par phase de mobilisation</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={phasesData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e4e4e7' }} tickFormatter={(value) => `${value / 1_000_000}M`} />
              <YAxis type="category" dataKey="phase" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e4e4e7' }} />
              <Tooltip formatter={(value: number) => `${formatMontant(value)} FCFA`} contentStyle={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="prevu" name="Prévu" fill="#71717a" radius={[0, 4, 4, 0]} />
              <Bar dataKey="engage" name="Engagé" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="consomme" name="Consommé" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {phasesData.map((phase) => {
          const tauxConso = phase.prevu > 0 ? (phase.consomme / phase.prevu) * 100 : 0;
          const tauxEngagement = phase.prevu > 0 ? (phase.engage / phase.prevu) * 100 : 0;
          return (
            <Card
              key={phase.phase}
              padding="md"
              className="cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all duration-200 group"
              onClick={() => handlePhaseClick(phase)}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-primary-900">{phase.phase}</h4>
                <Eye className="h-5 w-5 text-primary-300 group-hover:text-primary-500 transition-colors" />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-primary-500 mb-1">Budget prévu</p>
                  <p className="text-xl font-bold text-primary-900">{formatMontant(phase.prevu)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-500 mb-1">Engagé</p>
                    <p className="text-lg font-semibold text-blue-900">{formatMontant(phase.engage)}</p>
                    <p className="text-xs text-primary-400">{tauxEngagement.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-500 mb-1">Consommé</p>
                    <p className="text-lg font-semibold text-green-900">{formatMontant(phase.consomme)}</p>
                    <p className="text-xs text-primary-400">{tauxConso.toFixed(0)}%</p>
                  </div>
                </div>
                <Progress value={tauxConso} variant={tauxConso >= 50 ? 'success' : 'default'} size="md" />
                <p className="text-xs text-primary-400 text-center group-hover:text-primary-600 transition-colors">
                  Cliquer pour voir les détails
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de détail */}
      <PhaseDetailModal
        phase={selectedPhase}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

// Vue Synthèse Éditable (avec données du hook)
function VueSyntheseEditable({
  lignes,
  totaux,
  onEdit,
  isLoading,
}: {
  lignes: LigneBudgetExploitation[];
  totaux: { prevu: number; engage: number; consomme: number; reste: number };
  onEdit: (ligne: LigneBudgetExploitation) => void;
  isLoading?: boolean;
}) {
  // Afficher un message de chargement si les données sont en cours d'initialisation
  if (isLoading || lignes.length === 0) {
    return (
      <Card padding="md">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
          <p className="text-primary-600">Initialisation des données budgétaires...</p>
          <p className="text-sm text-primary-400 mt-2">
            Les lignes budgétaires seront créées automatiquement.
          </p>
        </div>
      </Card>
    );
  }

  const tauxEngagement = totaux.prevu > 0 ? (totaux.engage / totaux.prevu) * 100 : 0;
  const tauxConsommation = totaux.prevu > 0 ? (totaux.consomme / totaux.prevu) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">Synthèse Budget Mobilisation</h3>
            <p className="text-sm text-primary-500">Récapitulatif calculé depuis les détails (lecture seule)</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Poste</TableHead>
              <TableHead className="text-right">Budget Prévu</TableHead>
              <TableHead className="text-right">Engagé</TableHead>
              <TableHead className="text-right">Consommé</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead className="w-32">% Conso.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lignes.map((ligne) => {
              const tauxConso = ligne.montantPrevu > 0 ? (ligne.montantConsomme / ligne.montantPrevu) * 100 : 0;
              const disponible = ligne.montantPrevu - ligne.montantConsomme;
              return (
                <TableRow key={ligne.id}>
                  <TableCell className="font-medium">{ligne.poste}</TableCell>
                  <TableCell className="text-right">{formatMontant(ligne.montantPrevu)}</TableCell>
                  <TableCell className="text-right text-blue-600">{formatMontant(ligne.montantEngage)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatMontant(ligne.montantConsomme)}</TableCell>
                  <TableCell className="text-right text-orange-600">{formatMontant(disponible)}</TableCell>
                  <TableCell><ProgressBar value={Math.round(tauxConso)} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-primary-100">
              <TableCell className="font-bold">TOTAL</TableCell>
              <TableCell className="text-right font-bold">{formatMontant(totaux.prevu)}</TableCell>
              <TableCell className="text-right font-bold text-blue-700">{formatMontant(totaux.engage)}</TableCell>
              <TableCell className="text-right font-bold text-green-700">{formatMontant(totaux.consomme)}</TableCell>
              <TableCell className="text-right font-bold text-orange-700">{formatMontant(totaux.reste)}</TableCell>
              <TableCell className="font-bold"><ProgressBar value={Math.round(tauxConsommation)} /></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-primary-600">Taux d'engagement</span>
              <span className="font-semibold">{tauxEngagement.toFixed(1)}%</span>
            </div>
            <Progress value={tauxEngagement} variant="default" size="md" />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-primary-600">Taux de consommation</span>
              <span className="font-semibold">{tauxConsommation.toFixed(1)}%</span>
            </div>
            <Progress value={tauxConsommation} variant="success" size="md" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// Vue Détail Éditable (avec données du hook)
function VueDetailEditable({
  lignes,
  totaux,
  onEdit,
  onAdd,
  onDelete,
  isLoading,
}: {
  lignes: LigneBudgetExploitation[];
  totaux: { prevu: number; engage: number; consomme: number; reste: number };
  onEdit: (ligne: LigneBudgetExploitation) => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}) {
  const [filterCategorie, setFilterCategorie] = useState<string>('all');

  if (isLoading || lignes.length === 0) {
    return (
      <Card padding="md">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
          <p className="text-primary-600">Chargement des lignes budgétaires...</p>
        </div>
      </Card>
    );
  }

  const categories = ['all', ...new Set(lignes.map(l => l.categorie))];
  const lignesFiltrees = filterCategorie === 'all'
    ? lignes
    : lignes.filter(l => l.categorie === filterCategorie);

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">Détail des lignes budgétaires</h3>
            <p className="text-sm text-primary-500">Cliquez sur une ligne pour modifier ou utilisez les boutons d'action</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary-400" />
              <select
                value={filterCategorie}
                onChange={(e) => setFilterCategorie(e.target.value)}
                className="text-sm border border-primary-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Toutes les catégories</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <Button size="sm" variant="primary" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une ligne
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Poste</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="text-right">Prévu</TableHead>
                <TableHead className="text-right">Engagé</TableHead>
                <TableHead className="text-right">Consommé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead className="w-[120px]">Avancement</TableHead>
                <TableHead className="w-[100px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignesFiltrees.map((ligne) => {
                const disponible = ligne.montantPrevu - ligne.montantConsomme;
                const tauxConso = ligne.montantPrevu > 0
                  ? Math.round((ligne.montantConsomme / ligne.montantPrevu) * 100)
                  : 0;

                return (
                  <TableRow
                    key={ligne.id}
                    className="hover:bg-primary-50 cursor-pointer transition-colors"
                    onClick={() => onEdit(ligne)}
                  >
                    <TableCell>
                      <Badge
                        className="text-xs"
                        style={{ backgroundColor: ligne.couleur || '#6B7280', color: 'white' }}
                      >
                        {ligne.poste}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-primary-900">{ligne.description || ligne.poste}</p>
                        {ligne.note && <p className="text-xs text-primary-500 mt-1">{ligne.note}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatMontant(ligne.montantPrevu)}</TableCell>
                    <TableCell className="text-right text-blue-600">{formatMontant(ligne.montantEngage)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatMontant(ligne.montantConsomme)}</TableCell>
                    <TableCell className="text-right text-orange-600">{formatMontant(disponible)}</TableCell>
                    <TableCell><ProgressBar value={tauxConso} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(ligne);
                          }}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4 text-primary-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (ligne.id) onDelete(ligne.id);
                          }}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-error-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-primary-100">
                <TableCell className="font-bold" colSpan={2}>Total</TableCell>
                <TableCell className="text-right font-bold">{formatMontant(totaux.prevu)}</TableCell>
                <TableCell className="text-right font-bold text-blue-700">{formatMontant(totaux.engage)}</TableCell>
                <TableCell className="text-right font-bold text-green-700">{formatMontant(totaux.consomme)}</TableCell>
                <TableCell className="text-right font-bold text-orange-700">{formatMontant(totaux.reste)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// Composant principal Budget Mobilisation
export function BudgetMobilisation() {
  const [activeTab, setActiveTab] = useState('synthese');
  const [editingLigne, setEditingLigne] = useState<LigneBudgetExploitation | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // State pour la modale d'ajout
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Hook pour les données persistées
  const {
    lignes,
    isLoading,
    error,
    totaux,
    updateLigne,
    addLigne,
    deleteLigne,
    resetToDefaults,
  } = useBudgetExploitation({
    budgetType: 'mobilisation',
    annee: 2026,
  });

  // Handler de sauvegarde
  const handleSave = async (id: number, prevu: number, engage: number, consomme: number, note?: string) => {
    await updateLigne(id, {
      montantPrevu: prevu,
      montantEngage: engage,
      montantConsomme: consomme,
      note,
    });
  };

  // Handler d'ajout de nouvelle ligne
  const handleAdd = async (newLigne: Omit<LigneBudgetExploitation, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addLigne(newLigne);
    setIsAddModalOpen(false);
  };

  // Handler de suppression
  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne budgétaire ?')) {
      return;
    }
    await deleteLigne(id);
  };

  // Handler de reset
  const handleReset = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les montants aux valeurs par défaut ?')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetToDefaults();
    } finally {
      setIsResetting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-primary-600">Chargement du budget...</span>
      </div>
    );
  }

  // Use hook data if available, otherwise fallback to static data
  const useHookData = lignes.length > 0;

  const provisions = useHookData
    ? lignes.find((l) => l.categorie === 'provisions')
    : POSTES_BUDGET_MOBILISATION.find((p) => p.id === 'provisions');

  const budgetTotal = useHookData ? totaux.prevu : TOTAUX_MOBILISATION.budgetPrevu;
  const budgetEngage = useHookData ? totaux.engage : TOTAUX_MOBILISATION.engage;
  const budgetConsomme = useHookData ? totaux.consomme : TOTAUX_MOBILISATION.consomme;
  const budgetDisponible = useHookData ? totaux.reste : TOTAUX_MOBILISATION.disponible;
  const provisionsValue = useHookData
    ? (provisions as LigneBudgetExploitation)?.montantPrevu || 0
    : (provisions as PosteBudgetaire)?.budgetPrevu || 0;

  const tauxProvisions = budgetTotal > 0 ? (provisionsValue / budgetTotal) * 100 : 0;
  const tauxEngagement = budgetTotal > 0 ? (budgetEngage / budgetTotal) * 100 : 0;
  const tauxConsommation = budgetTotal > 0 ? (budgetConsomme / budgetTotal) * 100 : 0;
  const ecart = budgetEngage - budgetConsomme;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Budget Mobilisation</h2>
          <p className="text-sm text-primary-500">Budget de lancement et demarrage (hors construction) - Éditable</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting}
          >
            <RotateCcw className={cn('h-4 w-4 mr-2', isResetting && 'animate-spin')} />
            {isResetting ? 'Réinitialisation...' : 'Réinitialiser'}
          </Button>
          <BudgetImportExport budgetType="mobilisation" />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card padding="md" className="bg-error-50 border-error-200">
          <p className="text-error-700">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Budget total" value={formatMontant(budgetTotal)} subValue="FCFA" icon={Wallet} color="text-primary-600" bgColor="bg-primary-100" />
        <KPICard label="Engagé" value={formatMontant(budgetEngage)} subValue={`${tauxEngagement.toFixed(1)}%`} icon={ArrowDownLeft} color="text-blue-600" bgColor="bg-blue-100" />
        <KPICard label="Consommé" value={formatMontant(budgetConsomme)} subValue={`${tauxConsommation.toFixed(1)}%`} icon={CheckCircle} color="text-green-600" bgColor="bg-green-100" />
        <KPICard label="Restant" value={formatMontant(budgetDisponible)} subValue="" icon={TrendingDown} color="text-orange-600" bgColor="bg-orange-100" />
        <KPICard label="Provisions" value={formatMontant(provisionsValue)} subValue={`${tauxProvisions.toFixed(1)}%`} icon={PiggyBank} color="text-purple-600" bgColor="bg-purple-100" />
        <KPICard label="Écart" value={ecart >= 0 ? `+${formatMontant(ecart)}` : `-${formatMontant(Math.abs(ecart))}`} subValue="Engagé - Consommé" icon={AlertTriangle} color={ecart >= 0 ? 'text-success-600' : 'text-error-600'} bgColor={ecart >= 0 ? 'bg-success-100' : 'bg-error-100'} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="detail">Détail</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
          <TabsTrigger value="par-phase">Par phase</TabsTrigger>
        </TabsList>
        <TabsContent value="synthese">
          <VueSyntheseEditable lignes={lignes} totaux={totaux} onEdit={setEditingLigne} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="detail">
          <VueDetailEditable
            lignes={lignes}
            totaux={totaux}
            onEdit={setEditingLigne}
            onAdd={() => setIsAddModalOpen(true)}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="graphiques"><VueGraphiques lignes={lignes} /></TabsContent>
        <TabsContent value="par-phase"><VueParPhase lignes={lignes} /></TabsContent>
      </Tabs>

      {/* Modal d'édition */}
      <BudgetEditModal
        ligne={editingLigne}
        open={!!editingLigne}
        onClose={() => setEditingLigne(null)}
        onSave={handleSave}
      />

      {/* Modal d'ajout */}
      <BudgetAddModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAdd}
        existingCategories={[...new Set(lignes.map(l => l.categorie))]}
        nextOrdre={lignes.length > 0 ? Math.max(...lignes.map(l => l.ordre)) + 1 : 1}
      />
    </div>
  );
}
