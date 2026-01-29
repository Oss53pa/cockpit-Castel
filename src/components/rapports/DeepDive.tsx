import React, { useState, useMemo, useRef, useEffect } from 'react';
import type PptxGenJS from 'pptxgenjs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Presentation,
  Calendar,
  Plus,
  Trash2,
  Download,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  AlertTriangle,
  CheckCircle,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart2,
  Shield,
  Loader2,
  Building2,
  Zap,
  Eye,
  Settings,
  MessageSquare,
  Palette,
  Type,
  Maximize2,
  Minimize2,
  Save,
  Scale,
  Megaphone,
  Briefcase,
  Wrench,
  GitCompareArrows,
  ListChecks,
  GripVertical,
  Edit2,
  MoreVertical,
  Copy,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Input,
  Textarea,
  Select,
  SelectOption,
} from '@/components/ui';
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useBudget,
  useBudgetSynthese,
  useBudgetParAxe,
  useRisques,
} from '@/hooks';
import { useSync } from '@/hooks/useSync';
import { SYNC_CONFIG } from '@/config/syncConfig';
import { ReportPeriodSelector, type ReportPeriod } from './ReportPeriodSelector';

// Types
type ProjectWeather = 'green' | 'yellow' | 'orange' | 'red';
type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';
type ViewTab = 'config' | 'preview' | 'design';
// 6 axes de mobilisation alignés avec le modèle projet
type AxeType = 'rh' | 'commercialisation' | 'technique' | 'budget' | 'marketing' | 'exploitation' | 'general';

interface DGDecisionPoint {
  id: string;
  subject: string;
  amount: string;
  urgency: UrgencyLevel;
  deadline: string;
  recommendation: string;
  axe: AxeType;
}

interface SlideItem {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  included: boolean;
  comment: string;
  content?: string;
}

interface DesignSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoPosition: 'left' | 'right' | 'center';
  showSlideNumbers: boolean;
  showDate: boolean;
  backgroundStyle: 'solid' | 'gradient' | 'pattern';
  headerStyle: 'full' | 'minimal' | 'none';
}

interface AxeDetailData {
  actions: number;
  actionsTerminees: number;
  actionsEnCours: number;
  actionsEnRetard: number;
  jalons: number;
  jalonsAtteints: number;
  risques: number;
  risquesCritiques: number;
  budgetPrevu: number;
  budgetRealise: number;
  avancement: number;
}

// Axes configuration - 6 axes alignés avec le modèle projet (Construction vs 5 axes Mobilisation)
const axesConfig: Record<AxeType, { label: string; color: string; icon: React.ElementType; shortLabel: string }> = {
  rh: { label: 'RH & Organisation', color: '#EF4444', icon: Users, shortLabel: 'RH' },
  commercialisation: { label: 'Commercialisation', color: '#3B82F6', icon: Building2, shortLabel: 'COM' },
  technique: { label: 'Technique & Handover', color: '#8B5CF6', icon: Wrench, shortLabel: 'TECH' },
  budget: { label: 'Budget & Pilotage', color: '#F59E0B', icon: DollarSign, shortLabel: 'BUD' },
  marketing: { label: 'Marketing & Comm.', color: '#EC4899', icon: Megaphone, shortLabel: 'MKT' },
  exploitation: { label: 'Exploitation & Systèmes', color: '#10B981', icon: Briefcase, shortLabel: 'EXP' },
  general: { label: 'Général / Transverse', color: '#6B7280', icon: Target, shortLabel: 'GEN' },
};

// Mapping entre les axes DeepDive et les codes d'axes de la base de données
const axeToDbCode: Record<AxeType, string> = {
  rh: 'axe1_rh',
  commercialisation: 'axe2_commercial',
  technique: 'axe3_technique',
  budget: 'axe4_budget',
  marketing: 'axe5_marketing',
  exploitation: 'axe6_exploitation',
  general: 'general',
};

// Weather config
const weatherConfig: Record<
  ProjectWeather,
  { label: string; emoji: string; color: string; bgColor: string; textColor: string; icon: React.ElementType }
> = {
  green: {
    label: 'Vert (Sur la bonne voie)',
    emoji: '☀️',
    color: '#10B981',
    bgColor: 'bg-success-100',
    textColor: 'text-success-600',
    icon: Sun,
  },
  yellow: {
    label: 'Jaune (Attention requise)',
    emoji: '⛅',
    color: '#F59E0B',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-600',
    icon: CloudSun,
  },
  orange: {
    label: 'Orange (Vigilance)',
    emoji: '☁️',
    color: '#F97316',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    icon: Cloud,
  },
  red: {
    label: 'Rouge (Critique)',
    emoji: '🌧️',
    color: '#EF4444',
    bgColor: 'bg-error-100',
    textColor: 'text-error-600',
    icon: CloudRain,
  },
};

const urgencyConfig: Record<
  UrgencyLevel,
  { label: string; emoji: string; color: string; bgColor: string }
> = {
  critical: {
    label: 'Critique (Bloquant)',
    emoji: '',
    color: '#EF4444',
    bgColor: 'bg-error-50',
  },
  high: {
    label: 'Haute (Cette semaine)',
    emoji: '',
    color: '#F97316',
    bgColor: 'bg-orange-50',
  },
  medium: {
    label: 'Moyenne (Ce mois)',
    emoji: '🟡',
    color: '#F59E0B',
    bgColor: 'bg-warning-50',
  },
  low: {
    label: 'Basse (Ce trimestre)',
    emoji: '🟢',
    color: '#10B981',
    bgColor: 'bg-success-50',
  },
};

const colorPresets = [
  { name: 'Cosmos Angré', primary: '#1C3163', accent: '#D4AF37' },
  { name: 'Corporate Blue', primary: '#0F172A', accent: '#3B82F6' },
  { name: 'Modern Green', primary: '#14532D', accent: '#22C55E' },
  { name: 'Elegant Purple', primary: '#4C1D95', accent: '#A78BFA' },
  { name: 'Professional Gray', primary: '#374151', accent: '#F59E0B' },
];

const fontOptions = [
  { value: 'Arial', label: 'Arial (Standard)' },
  { value: 'Calibri', label: 'Calibri (Microsoft)' },
  { value: 'Helvetica', label: 'Helvetica (Clean)' },
  { value: 'Georgia', label: 'Georgia (Elegant)' },
  { value: 'Verdana', label: 'Verdana (Readable)' },
];

// Helper to generate slides for each strategic axis
const generateAxeSlides = (axeKey: AxeType, axeConfig: { label: string; icon: React.ElementType }): SlideItem[] => [
  { id: `axe_${axeKey}_intro`, title: `${axeConfig.label}`, icon: axeConfig.icon, description: 'Slide intercalaire avec sommaire des 5 sections', included: true, comment: '' },
  { id: `axe_${axeKey}_actions`, title: `${axeConfig.label} - Actions`, icon: ListChecks, description: 'Tableau des actions avec statut et progression', included: true, comment: '' },
  { id: `axe_${axeKey}_actions_suite`, title: `${axeConfig.label} - Actions (Suite)`, icon: ListChecks, description: 'Suite du tableau des actions', included: false, comment: '' },
  { id: `axe_${axeKey}_jalons`, title: `${axeConfig.label} - Jalons`, icon: Calendar, description: 'Timeline des jalons clés', included: true, comment: '' },
  { id: `axe_${axeKey}_budget`, title: `${axeConfig.label} - Budget`, icon: DollarSign, description: 'Budget alloué vs consommé', included: true, comment: '' },
  { id: `axe_${axeKey}_risques`, title: `${axeConfig.label} - Risques`, icon: Shield, description: 'Matrice et mesures de maîtrise', included: true, comment: '' },
  { id: `axe_${axeKey}_dg`, title: `${axeConfig.label} - Points DG`, icon: AlertTriangle, description: 'Points en attente de validation DG', included: true, comment: '' },
];

const defaultSlides: SlideItem[] = [
  // === SECTION INTRODUCTION ===
  { id: '1', title: 'Page de garde', icon: FileText, description: 'Titre, date, logo', included: true, comment: '' },
  { id: '2', title: 'Agenda', icon: FileText, description: 'Sommaire de la présentation', included: true, comment: '' },
  { id: '3', title: 'Synthèse exécutive & Météo projet', icon: Sun, description: 'Vue d\'ensemble et indicateurs clés', included: true, comment: '' },
  { id: 'copil', title: 'Dashboard COPIL', icon: Users, description: 'Météo, Top 5 risques, Jalons J-30, Budget, Alertes, Décisions', included: true, comment: '' },
  { id: '18', title: 'Tableau de Bord Stratégique', icon: Target, description: 'Scorecard avec objectifs vs réalisé et tendances', included: true, comment: '' },
  { id: '19', title: 'Faits Marquants de la Période', icon: Zap, description: 'Réalisations clés, blocages, et alertes critiques', included: true, comment: '' },
  { id: '4', title: 'Vue d\'ensemble par axe', icon: BarChart2, description: 'Barres de progression par axe stratégique', included: true, comment: '' },

  // === AXE 1 - RH & ORGANISATION ===
  ...generateAxeSlides('rh', axesConfig.rh),

  // === AXE 2 - COMMERCIALISATION ===
  ...generateAxeSlides('commercialisation', axesConfig.commercialisation),

  // === AXE 3 - TECHNIQUE (CONSTRUCTION) ===
  ...generateAxeSlides('technique', axesConfig.technique),

  // === AXE 4 - BUDGET & PILOTAGE ===
  ...generateAxeSlides('budget', axesConfig.budget),

  // === AXE 5 - MARKETING & COMMUNICATION ===
  ...generateAxeSlides('marketing', axesConfig.marketing),

  // === AXE 6 - EXPLOITATION & SYSTÈMES ===
  ...generateAxeSlides('exploitation', axesConfig.exploitation),

  // === SECTION TRANSVERSE ===
  { id: '10', title: 'Synchronisation Construction / Mobilisation', icon: GitCompareArrows, description: 'Construction (AXE 3) vs 5 axes de mobilisation - écarts et alertes', included: true, comment: '' },
  { id: '11', title: 'Budget Global & EVM', icon: DollarSign, description: 'Indicateurs de performance budgétaire consolidés', included: true, comment: '' },
  { id: '20', title: 'Analyse EVM Détaillée', icon: TrendingUp, description: 'SPI, CPI, EAC, VAC avec graphiques de tendance', included: true, comment: '' },
  { id: '12', title: 'Risques Consolidés', icon: Shield, description: 'Top risques tous axes confondus', included: true, comment: '' },
  { id: '21', title: 'Matrice des Risques Globale', icon: Shield, description: 'Heat map Probabilité x Impact avec évolution', included: true, comment: '' },
  { id: '13', title: 'Points DG Consolidés', icon: AlertTriangle, description: 'Toutes les décisions requises par axe', included: true, comment: '' },
  { id: '13_suite', title: 'Points DG (Suite)', icon: AlertTriangle, description: 'Suite des décisions requises', included: false, comment: '' },
  { id: '22', title: 'Actions Critiques & Chemin Critique', icon: Zap, description: 'Top 10 actions critiques avec impacts', included: true, comment: '' },
  { id: '14', title: 'Planning Global & Jalons', icon: Calendar, description: 'Timeline consolidée et jalons clés', included: true, comment: '' },
  { id: '23', title: 'Roadmap & Timeline Visuelle', icon: Calendar, description: 'Gantt simplifié avec jalons majeurs', included: true, comment: '' },

  // === SECTION CONCLUSION ===
  { id: '16', title: 'Synthèse & Prochaines étapes', icon: Target, description: 'Récapitulatif et actions à venir', included: true, comment: '' },
  { id: '26', title: 'Recommandations Stratégiques', icon: Zap, description: 'Arbitrages proposés et quick wins identifiés', included: true, comment: '' },
  { id: '17', title: 'Page de fin', icon: FileText, description: 'Merci, contacts', included: true, comment: '' },
];

// Sortable Slide Item Component for monthly DeepDive
interface SortableSlideItemProps {
  slide: SlideItem;
  index: number;
  onToggle: () => void;
  onEditComment: () => void;
  onEditTitle: () => void;
  onEditSlide: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isEditingComment: boolean;
  isEditingTitle: boolean;
  onCommentChange: (comment: string) => void;
  onTitleChange: (title: string) => void;
  onSaveComment: () => void;
  onSaveTitle: () => void;
}

function SortableSlideItem({
  slide,
  index,
  onToggle,
  onEditComment,
  onEditTitle,
  onEditSlide,
  onDuplicate,
  onDelete,
  isEditingComment,
  isEditingTitle,
  onCommentChange,
  onTitleChange,
  onSaveComment,
  onSaveTitle,
}: SortableSlideItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuAction = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 rounded-lg border transition-all ${slide.included ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200 opacity-60'} ${isDragging ? 'shadow-lg ring-2 ring-primary-400' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${slide.included ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'}`}
        >
          {slide.included ? index + 1 : '-'}
        </div>

        <div
          onClick={(e) => {
            if (!isEditingTitle) {
              e.stopPropagation();
              onToggle();
            }
          }}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        >
          {React.createElement(slide.icon, {
            className: `h-4 w-4 shrink-0 ${slide.included ? 'text-primary-600' : 'text-gray-400'}`,
          })}
          {isEditingTitle ? (
            <input
              type="text"
              value={slide.title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') onSaveTitle();
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="flex-1 text-xs border border-primary-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          ) : (
            <span className={`flex-1 text-left text-xs truncate ${slide.included ? 'text-primary-900' : 'text-gray-500'}`}>
              {slide.title}
            </span>
          )}
          {slide.included ? (
            <CheckCircle className="h-4 w-4 text-success-500 shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditComment();
          }}
          className="p-1 hover:bg-primary-100 rounded"
        >
          <MessageSquare className={`h-3 w-3 ${slide.comment ? 'text-primary-600' : 'text-gray-300'}`} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-xl z-50 py-1 min-w-[150px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction(onEditSlide);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 text-primary-700 flex items-center gap-2 font-medium"
              >
                <FileText className="h-4 w-4" />
                Modifier le contenu
              </button>
              <hr className="my-1" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction(onEditTitle);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Renommer
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction(onDuplicate);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Dupliquer
              </button>
              <hr className="my-1" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction(onDelete);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {slide.included && isEditingComment && (
        <div className="mt-2 pl-8 flex gap-2">
          <Input
            value={slide.comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="text-xs flex-1"
            onClick={(e) => e.stopPropagation()}
          />
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onSaveComment(); }}>
            <Save className="h-3 w-3" />
          </Button>
        </div>
      )}

      {slide.included && slide.comment && !isEditingComment && (
        <div className="mt-1 pl-8">
          <p className="text-xs text-primary-500 italic truncate">
            💬 {slide.comment.length > 30 ? slide.comment.substring(0, 30) + '...' : slide.comment}
          </p>
        </div>
      )}
    </div>
  );
}

export function DeepDive() {
  // Data hooks
  const kpis = useDashboardKPIs();
  const actions = useActions();
  const jalons = useJalons();
  const budgetItems = useBudget(); // Items individuels pour calcul par axe
  const budget = useBudgetSynthese(); // Synthèse globale
  const risques = useRisques();

  // Sync data (new module)
  const syncData = useSync('cosmos-angre');

  // State
  const [activeTab, setActiveTab] = useState<ViewTab>('config');
  const [presentationDate, setPresentationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod | null>(() => {
    // Default to current month
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      type: 'month',
      label: months[month],
      startDate: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`,
      displayText: `${months[month]} ${year}`,
    };
  });
  const [projectWeather, setProjectWeather] = useState<ProjectWeather>('yellow');
  const [generating, setGenerating] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Design settings - chargé depuis localStorage
  const [designSettings, setDesignSettings] = useState<DesignSettings>(() => {
    const saved = localStorage.getItem('deepdive_design_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      primaryColor: '#1C3163',
      accentColor: '#D4AF37',
      fontFamily: 'Arial',
      logoPosition: 'right',
      showSlideNumbers: true,
      showDate: true,
      backgroundStyle: 'solid',
      headerStyle: 'full',
    };
  });
  const [designSaved, setDesignSaved] = useState(true);

  // Marquer comme non sauvegardé quand les paramètres changent
  const updateDesignSettings = (updates: Partial<DesignSettings>) => {
    setDesignSettings((prev) => ({ ...prev, ...updates }));
    setDesignSaved(false);
  };

  // Sauvegarder les paramètres de design
  const saveDesignSettings = () => {
    localStorage.setItem('deepdive_design_settings', JSON.stringify(designSettings));
    setDesignSaved(true);
    alert('Paramètres de design enregistrés !');
  };

  // KPIs state
  const [kpiValues, setKpiValues] = useState({
    occupation: Math.round(kpis.tauxOccupation) || 45,
    budgetConsumed: Math.round((budget.realise / budget.prevu) * 100) || 32,
    milestonesAchieved: kpis.jalonsAtteints || 8,
    teamRecruited: kpis.equipeTaille || 4,
  });

  // DG Decision points with axe
  const [decisionPoints, setDecisionPoints] = useState<DGDecisionPoint[]>([
    {
      id: '1',
      subject: 'Validation budget communication inauguration',
      amount: '150 000 000 FCFA',
      urgency: 'high',
      deadline: '2026-02-15',
      recommendation: 'Approuver pour lancer AO agence',
      axe: 'communication',
    },
    {
      id: '2',
      subject: 'Arbitrage sur profil Security Manager',
      amount: '-',
      urgency: 'critical',
      deadline: '2026-01-31',
      recommendation: 'Privilégier expérience ERP vs coût',
      axe: 'exploitation',
    },
    {
      id: '3',
      subject: 'Choix prestataire nettoyage',
      amount: '85 000 000 FCFA/an',
      urgency: 'medium',
      deadline: '2026-02-28',
      recommendation: 'Retenir offre B (meilleur rapport qualité/prix)',
      axe: 'exploitation',
    },
    {
      id: '4',
      subject: 'Validation des baux commerciaux type',
      amount: '-',
      urgency: 'high',
      deadline: '2026-02-10',
      recommendation: 'Valider version V3 avec modifications mineures',
      axe: 'juridique',
    },
    {
      id: '5',
      subject: 'Réception définitive lot CVC',
      amount: '25 000 000 FCFA',
      urgency: 'medium',
      deadline: '2026-03-15',
      recommendation: 'Lever les réserves avant réception',
      axe: 'technique',
    },
  ]);

  // Slides
  const [slides, setSlides] = useState<SlideItem[]>(defaultSlides);
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    kpis: true,
    decisions: true,
    slides: true,
  });

  // Auto-include/exclude '13_suite' slide based on decision points count
  const MAX_DG_POINTS_PER_SLIDE = 4;
  useMemo(() => {
    const needsSuite = decisionPoints.length > MAX_DG_POINTS_PER_SLIDE;
    const suiteSlide = slides.find(s => s.id === '13_suite');
    const mainSlide = slides.find(s => s.id === '13');

    if (suiteSlide && mainSlide?.included !== suiteSlide.included && needsSuite !== suiteSlide.included) {
      setSlides(prev => prev.map(s =>
        s.id === '13_suite' ? { ...s, included: needsSuite && mainSlide.included } : s
      ));
    }
  }, [decisionPoints.length, slides]);

  // Computed
  const activeSlides = useMemo(() => slides.filter((s) => s.included), [slides]);

  // Calculate detailed data per axe - DONNÉES RÉELLES depuis les hooks
  const axeDetailData = useMemo(() => {
    const axeTypes: AxeType[] = ['rh', 'commercialisation', 'technique', 'budget', 'marketing', 'exploitation'];
    const data: Record<AxeType, AxeDetailData> = {} as Record<AxeType, AxeDetailData>;

    axeTypes.forEach((axe) => {
      const dbCode = axeToDbCode[axe];

      // Filter actions by axe (code DB exact)
      const axeActions = actions.filter((a) => a.axe === dbCode);

      // Filter jalons by axe
      const axeJalons = jalons.filter((j) => j.axe === dbCode);

      // Filter risques by axe
      const axeRisques = risques.filter((r) => r.axe_impacte === dbCode);

      // Filter budget items by axe
      const axeBudgetItems = budgetItems.filter((b) => b.axe === dbCode);
      const budgetPrevu = axeBudgetItems.reduce((sum, b) => sum + (b.montantPrevu || 0), 0);
      const budgetRealise = axeBudgetItems.reduce((sum, b) => sum + (b.montantRealise || 0), 0);

      // Calculate progress
      const totalProgress = axeActions.length > 0
        ? Math.round(axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / axeActions.length)
        : 0;

      // Count statuses
      const today = new Date().toISOString().split('T')[0];
      const actionsEnRetard = axeActions.filter((a) =>
        a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
      ).length;

      data[axe] = {
        actions: axeActions.length,
        actionsTerminees: axeActions.filter((a) => a.statut === 'termine').length,
        actionsEnCours: axeActions.filter((a) => a.statut === 'en_cours').length,
        actionsEnRetard: actionsEnRetard,
        jalons: axeJalons.length,
        jalonsAtteints: axeJalons.filter((j) => j.statut === 'atteint').length,
        risques: axeRisques.length,
        risquesCritiques: axeRisques.filter((r) => (r.score_actuel || r.score_initial || 0) >= 12).length,
        budgetPrevu: budgetPrevu,
        budgetRealise: budgetRealise,
        avancement: totalProgress,
      };
    });

    return data;
  }, [actions, jalons, risques, budgetItems]);

  // Group decision points by axe
  const decisionPointsByAxe = useMemo(() => {
    const grouped: Record<AxeType, DGDecisionPoint[]> = {
      rh: [],
      commercialisation: [],
      technique: [],
      budget: [],
      marketing: [],
      exploitation: [],
      general: [],
    };

    decisionPoints.forEach((point) => {
      grouped[point.axe].push(point);
    });

    // Sort each group by urgency
    const urgencyOrder: UrgencyLevel[] = ['critical', 'high', 'medium', 'low'];
    Object.keys(grouped).forEach((axe) => {
      grouped[axe as AxeType].sort((a, b) =>
        urgencyOrder.indexOf(a.urgency) - urgencyOrder.indexOf(b.urgency)
      );
    });

    return grouped;
  }, [decisionPoints]);

  // Top risques
  const topRisques = useMemo(() => {
    return risques
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  }, [risques]);

  // Upcoming jalons
  const upcomingJalons = useMemo(() => {
    return jalons
      .filter((j) => new Date(j.date_prevue) >= new Date())
      .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())
      .slice(0, 6);
  }, [jalons]);

  // Handlers
  const addDecisionPoint = () => {
    setDecisionPoints((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        subject: '',
        amount: '',
        urgency: 'medium',
        deadline: '',
        recommendation: '',
        axe: 'general',
      },
    ]);
  };

  const updateDecisionPoint = (id: string, field: keyof DGDecisionPoint, value: string) => {
    setDecisionPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removeDecisionPoint = (id: string) => {
    setDecisionPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleSlide = (id: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, included: !s.included } : s))
    );
  };

  const updateSlideComment = (id: string, comment: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, comment } : s))
    );
  };

  const updateSlideTitle = (id: string, title: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

  const updateSlide = (id: string, updates: Partial<SlideItem>) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const duplicateSlide = (id: string) => {
    setSlides((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1) return prev;
      const slide = prev[index];
      const newSlide: SlideItem = {
        ...slide,
        id: `${slide.id}_copy_${Date.now()}`,
        title: `${slide.title} (copie)`,
      };
      const newSlides = [...prev];
      newSlides.splice(index + 1, 0, newSlide);
      return newSlides;
    });
  };

  const deleteSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSlides((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const editingSlide = editingSlideId ? slides.find((s) => s.id === editingSlideId) : null;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    updateDesignSettings({
      primaryColor: preset.primary,
      accentColor: preset.accent,
    });
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && previewSlideIndex > 0) {
      setPreviewSlideIndex(previewSlideIndex - 1);
    } else if (direction === 'next' && previewSlideIndex < activeSlides.length - 1) {
      setPreviewSlideIndex(previewSlideIndex + 1);
    }
  };

  // Get risques for a specific axe (utilise le code DB)
  const getRisquesForAxe = (axe: AxeType) => {
    const dbCode = axeToDbCode[axe];
    return risques.filter((r) => r.axe_impacte === dbCode);
  };

  // Get jalons for a specific axe (utilise le code DB)
  const getJalonsForAxe = (axe: AxeType) => {
    const dbCode = axeToDbCode[axe];
    return jalons.filter((j) => j.axe === dbCode);
  };

  // Get actions for a specific axe (utilise le code DB)
  const getActionsForAxe = (axe: AxeType) => {
    const dbCode = axeToDbCode[axe];
    return actions.filter((a) => a.axe === dbCode);
  };

  // Render axe detail slide
  const renderAxeDetailSlide = (axe: AxeType, slideItem: SlideItem, slideNumber: number, totalSlides: number) => {
    const { primaryColor, fontFamily, headerStyle } = designSettings;
    const axeConfig = axesConfig[axe];
    const data = axeDetailData[axe];
    const axeDecisions = decisionPointsByAxe[axe];
    const axeRisques = getRisquesForAxe(axe);
    const axeJalons = getJalonsForAxe(axe);

    const headerBg = headerStyle === 'full' ? primaryColor : headerStyle === 'minimal' ? `${primaryColor}15` : 'transparent';
    const headerTextColor = headerStyle === 'full' ? '#ffffff' : primaryColor;

    // Risques critiques (score >= 12)
    const risquesCritiques = axeRisques.filter(r => (r.score || 0) >= 12);
    const risquesEleves = axeRisques.filter(r => (r.score || 0) >= 8 && (r.score || 0) < 12);

    // Jalons par statut
    const jalonsAtteints = axeJalons.filter(j => j.statut === 'atteint');
    const jalonsEnDanger = axeJalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse');
    const jalonsAVenir = axeJalons.filter(j => j.statut === 'a_venir' || j.statut === 'en_approche');

    return (
      <div style={{ fontFamily, backgroundColor: '#ffffff' }} className="h-full flex flex-col">
        {headerStyle !== 'none' && (
          <div className="px-6 py-3 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: axeConfig.color }}>
                <axeConfig.icon className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>
                Détail Axe {axeConfig.label}
              </h2>
            </div>
            <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: axeConfig.color, color: '#fff' }}>
              {data.avancement}%
            </span>
          </div>
        )}
        <div className="flex-1 p-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Actions - compact */}
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold" style={{ color: primaryColor }}>Actions</h3>
                <span className="text-lg font-bold" style={{ color: axeConfig.color }}>{data.actions}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div className="text-center p-1 bg-green-100 rounded">
                  <div className="font-bold text-green-700">{data.actionsTerminees}</div>
                  <div className="text-green-600">Terminées</div>
                </div>
                <div className="text-center p-1 bg-blue-100 rounded">
                  <div className="font-bold text-blue-700">{data.actionsEnCours}</div>
                  <div className="text-blue-600">En cours</div>
                </div>
                <div className="text-center p-1 bg-red-100 rounded">
                  <div className="font-bold text-red-700">{data.actionsEnRetard}</div>
                  <div className="text-red-600">Retard</div>
                </div>
              </div>
            </div>

            {/* Jalons - avec détails */}
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold" style={{ color: primaryColor }}>Jalons</h3>
                <span className="text-lg font-bold" style={{ color: axeConfig.color }}>
                  {jalonsAtteints.length}/{axeJalons.length || data.jalons}
                </span>
              </div>
              {jalonsAtteints.length > 0 && (
                <div className="mb-1">
                  <div className="text-[9px] text-green-600 font-medium mb-0.5">✓ Atteints:</div>
                  {jalonsAtteints.slice(0, 2).map((j, idx) => (
                    <div key={idx} className="text-[9px] text-gray-600 truncate pl-2">• {j.titre}</div>
                  ))}
                </div>
              )}
              {jalonsEnDanger.length > 0 && (
                <div className="mb-1">
                  <div className="text-[9px] text-red-600 font-medium mb-0.5">En danger:</div>
                  {jalonsEnDanger.slice(0, 2).map((j, idx) => (
                    <div key={idx} className="text-[9px] text-gray-600 truncate pl-2">• {j.titre}</div>
                  ))}
                </div>
              )}
              {jalonsAVenir.length > 0 && jalonsAtteints.length === 0 && jalonsEnDanger.length === 0 && (
                <div>
                  <div className="text-[9px] text-blue-600 font-medium mb-0.5">A venir:</div>
                  {jalonsAVenir.slice(0, 2).map((j, idx) => (
                    <div key={idx} className="text-[9px] text-gray-600 truncate pl-2">• {j.titre}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Risques - avec détails des critiques */}
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold" style={{ color: primaryColor }}>Risques</h3>
                <span className="text-lg font-bold" style={{ color: axeConfig.color }}>{axeRisques.length || data.risques}</span>
              </div>
              {risquesCritiques.length > 0 && (
                <div className="mb-1">
                  <div className="text-[9px] text-red-600 font-medium mb-0.5">Critiques ({risquesCritiques.length}):</div>
                  {risquesCritiques.slice(0, 2).map((r, idx) => (
                    <div key={idx} className="text-[9px] text-gray-600 truncate pl-2 flex items-center gap-1">
                      <span>• {r.titre}</span>
                      <span className="text-red-500 font-medium">(P{r.probabilite}×I{r.impact}={r.score})</span>
                    </div>
                  ))}
                </div>
              )}
              {risquesEleves.length > 0 && (
                <div>
                  <div className="text-[9px] text-orange-600 font-medium mb-0.5">Eleves ({risquesEleves.length}):</div>
                  {risquesEleves.slice(0, 2).map((r, idx) => (
                    <div key={idx} className="text-[9px] text-gray-600 truncate pl-2">• {r.titre}</div>
                  ))}
                </div>
              )}
              {risquesCritiques.length === 0 && risquesEleves.length === 0 && axeRisques.length > 0 && (
                <div className="text-[9px] text-green-600">✓ Aucun risque critique ou élevé</div>
              )}
            </div>

            {/* Budget - compact */}
            <div className="p-2 bg-gray-50 rounded-lg">
              <h3 className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Budget</h3>
              <div className="text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Prévu:</span>
                  <span className="font-medium">{data.budgetPrevu.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Réalisé:</span>
                  <span className="font-medium" style={{ color: axeConfig.color }}>
                    {data.budgetRealise.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((data.budgetRealise / data.budgetPrevu) * 100, 100)}%`,
                      backgroundColor: axeConfig.color
                    }}
                  />
                </div>
                <div className="text-[9px] text-gray-400 text-right">
                  {Math.round((data.budgetRealise / data.budgetPrevu) * 100)}% consommé
                </div>
              </div>
            </div>
          </div>

          {/* Decisions DG for this axe - avec plus de détails */}
          {axeDecisions.length > 0 && (
            <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: '#9A3412' }}>
                <AlertTriangle className="h-3 w-3" />
                Points DG en attente ({axeDecisions.length})
              </h3>
              <div className="space-y-1">
                {axeDecisions.map((point) => (
                  <div
                    key={point.id}
                    className="p-1.5 bg-white rounded text-[10px]"
                    style={{ borderLeft: `3px solid ${urgencyConfig[point.urgency].color}` }}
                  >
                    <div className="flex items-center gap-1 font-medium text-gray-800">
                      <span>{urgencyConfig[point.urgency].emoji}</span>
                      <span className="flex-1 truncate">{point.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-gray-500">
                      {point.amount && point.amount !== '-' && <span>💰 {point.amount}</span>}
                      <span>{point.deadline ? new Date(point.deadline).toLocaleDateString('fr-FR') : '-'}</span>
                    </div>
                    <div className="text-[9px] italic text-gray-600 mt-0.5">{point.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slideItem.comment && (
            <div className="mt-2 p-1.5 bg-blue-50 rounded-lg border-l-3 border-blue-400">
              <p className="text-[10px] text-blue-800">{slideItem.comment}</p>
            </div>
          )}
        </div>
        {renderSlideFooter(slideNumber, totalSlides)}
      </div>
    );
  };

  // Render axe section slides (new structure)
  const renderAxeSectionSlide = (
    axe: AxeType,
    sectionType: string,
    slideItem: SlideItem,
    slideNumber: number,
    totalSlides: number
  ) => {
    const { primaryColor, accentColor, fontFamily, headerStyle } = designSettings;
    const axeConfig = axesConfig[axe];
    const data = axeDetailData[axe];
    const axeDecisions = decisionPointsByAxe[axe];
    const axeRisques = getRisquesForAxe(axe);
    const axeJalons = getJalonsForAxe(axe);
    const axeActions = getActionsForAxe(axe);

    const headerBg = headerStyle === 'full' ? axeConfig.color : headerStyle === 'minimal' ? `${axeConfig.color}15` : 'transparent';
    const headerTextColor = headerStyle === 'full' ? '#ffffff' : axeConfig.color;

    const baseStyles = { fontFamily, backgroundColor: '#ffffff' };

    // Slide intercalaire (intro) - Utilise les couleurs de base du projet
    if (sectionType === 'intro') {
      return (
        <div style={{ ...baseStyles, backgroundColor: primaryColor }} className="h-full flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center text-white p-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: accentColor }}
            >
              <axeConfig.icon className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <h1 className="text-2xl font-bold mb-2">{axeConfig.label}</h1>
            <p className="text-sm opacity-70 mb-4">{axeConfig.shortLabel}</p>
            <div className="w-20 h-1 mb-6" style={{ backgroundColor: accentColor }} />
            <div className="rounded-xl p-4 max-w-md w-full border" style={{ borderColor: accentColor, backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: accentColor }}>Contenu de cette section</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Actions', desc: 'Tableau des actions avec statut' },
                  { label: 'Jalons', desc: 'Timeline des jalons clés' },
                  { label: 'Budget', desc: 'Alloué vs consommé' },
                  { label: 'Risques', desc: 'Matrice et mesures de maîtrise' },
                  { label: 'Points DG', desc: 'Décisions en attente' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                    <span className="font-medium text-white">{item.label}</span>
                    <span className="text-white/50 text-xs">- {item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // Section Actions
    if (sectionType === 'actions' || sectionType === 'actions_suite') {
      const isSuite = sectionType === 'actions_suite';
      const MAX_ACTIONS = 6;
      const startIdx = isSuite ? MAX_ACTIONS : 0;
      const actionsToShow = axeActions.slice(startIdx, startIdx + MAX_ACTIONS);

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
            <div className="flex items-center gap-2">
              <axeConfig.icon className="h-4 w-4" style={{ color: headerTextColor }} />
              <h2 className="text-lg font-bold" style={{ color: headerTextColor }}>
                {axeConfig.label} - Actions {isSuite && '(Suite)'}
              </h2>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: headerTextColor, color: axeConfig.color }}>
              {isSuite ? `${startIdx + 1}-${Math.min(startIdx + MAX_ACTIONS, axeActions.length)}` : actionsToShow.length} / {axeActions.length}
            </span>
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            <table className="w-full text-[9px]">
              <thead>
                <tr className="border-b-2" style={{ borderColor: axeConfig.color }}>
                  <th className="text-left py-1 px-1 font-semibold" style={{ color: primaryColor }}>Action</th>
                  <th className="text-center py-1 px-1 font-semibold w-16" style={{ color: primaryColor }}>Statut</th>
                  <th className="text-center py-1 px-1 font-semibold w-14" style={{ color: primaryColor }}>Avance.</th>
                  <th className="text-left py-1 px-1 font-semibold w-20" style={{ color: primaryColor }}>Resp.</th>
                  <th className="text-center py-1 px-1 font-semibold w-16" style={{ color: primaryColor }}>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {actionsToShow.map((action, idx) => {
                  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                    termine: { bg: 'bg-green-100', text: 'text-green-700', label: 'Terminé' },
                    en_cours: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En cours' },
                    en_retard: { bg: 'bg-red-100', text: 'text-red-700', label: 'En retard' },
                    bloque: { bg: 'bg-red-100', text: 'text-red-700', label: 'Bloqué' },
                    a_faire: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'À faire' },
                    planifie: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Planifié' },
                  };
                  const status = statusConfig[action.statut] || statusConfig.a_faire;
                  return (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-1 px-1 truncate max-w-[150px]" title={action.titre}>{action.titre}</td>
                      <td className="py-1 px-1 text-center">
                        <span className={`px-1 py-0.5 rounded text-[8px] ${status.bg} ${status.text}`}>{status.label}</span>
                      </td>
                      <td className="py-1 px-1 text-center">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${action.avancement}%`, backgroundColor: axeConfig.color }} />
                          </div>
                          <span className="text-[8px]">{action.avancement}%</span>
                        </div>
                      </td>
                      <td className="py-1 px-1 truncate text-gray-600">{action.responsable || '-'}</td>
                      <td className="py-1 px-1 text-center text-gray-500">
                        {action.date_fin_prevue ? new Date(action.date_fin_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!isSuite && axeActions.length > MAX_ACTIONS && (
              <p className="mt-2 text-[9px] text-gray-500 italic text-center">➔ Suite sur la slide suivante</p>
            )}
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // Section Jalons
    if (sectionType === 'jalons') {
      const jalonsAtteints = axeJalons.filter(j => j.statut === 'atteint');
      const jalonsEnDanger = axeJalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse');
      const jalonsAVenir = axeJalons.filter(j => j.statut === 'a_venir' || j.statut === 'en_approche');

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: headerTextColor }} />
              <h2 className="text-lg font-bold" style={{ color: headerTextColor }}>{axeConfig.label} - Jalons</h2>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: headerTextColor, color: axeConfig.color }}>
              {jalonsAtteints.length}/{axeJalons.length} atteints
            </span>
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            {/* Résumé */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 p-2 bg-green-50 rounded-lg border border-green-200 text-center">
                <div className="text-xl font-bold text-green-600">{jalonsAtteints.length}</div>
                <div className="text-[9px] text-green-700">Atteints</div>
              </div>
              <div className="flex-1 p-2 bg-red-50 rounded-lg border border-red-200 text-center">
                <div className="text-xl font-bold text-red-600">{jalonsEnDanger.length}</div>
                <div className="text-[9px] text-red-700">En danger</div>
              </div>
              <div className="flex-1 p-2 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <div className="text-xl font-bold text-blue-600">{jalonsAVenir.length}</div>
                <div className="text-[9px] text-blue-700">À venir</div>
              </div>
            </div>
            {/* Timeline */}
            <div className="space-y-1.5">
              {axeJalons.slice(0, 6).map((jalon, idx) => {
                const statusColors: Record<string, string> = {
                  atteint: '#22C55E', en_danger: '#EF4444', depasse: '#DC2626', en_approche: '#3B82F6', a_venir: '#6B7280'
                };
                return (
                  <div key={idx} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[jalon.statut] || '#6B7280' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium truncate" style={{ color: primaryColor }}>{jalon.titre}</div>
                      {jalon.responsable && (
                        <div className="text-[8px] text-gray-400 truncate">{jalon.responsable}</div>
                      )}
                    </div>
                    <div className="text-[9px] text-gray-500 whitespace-nowrap">
                      {jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // Section Budget
    if (sectionType === 'budget') {
      const budgetPct = Math.round((data.budgetRealise / data.budgetPrevu) * 100);
      const ecart = data.budgetPrevu - data.budgetRealise;
      const isOverBudget = ecart < 0;

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" style={{ color: headerTextColor }} />
              <h2 className="text-lg font-bold" style={{ color: headerTextColor }}>{axeConfig.label} - Budget</h2>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: headerTextColor, color: axeConfig.color }}>
              {budgetPct}% consommé
            </span>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            {/* KPIs Budget */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center border">
                <div className="text-[10px] text-gray-500 mb-1">Budget Alloué</div>
                <div className="text-lg font-bold" style={{ color: primaryColor }}>
                  {(data.budgetPrevu / 1000000).toFixed(0)}M
                </div>
                <div className="text-[9px] text-gray-400">FCFA</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center border" style={{ borderColor: axeConfig.color }}>
                <div className="text-[10px] text-gray-500 mb-1">Consommé</div>
                <div className="text-lg font-bold" style={{ color: axeConfig.color }}>
                  {(data.budgetRealise / 1000000).toFixed(0)}M
                </div>
                <div className="text-[9px] text-gray-400">FCFA</div>
              </div>
              <div className={`p-3 rounded-lg text-center border ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="text-[10px] text-gray-500 mb-1">Écart</div>
                <div className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {isOverBudget ? '-' : '+'}{(Math.abs(ecart) / 1000000).toFixed(0)}M
                </div>
                <div className="text-[9px] text-gray-400">FCFA</div>
              </div>
            </div>
            {/* Barre de progression */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-500">Progression budgétaire</span>
                <span className="font-medium" style={{ color: budgetPct > 100 ? '#EF4444' : axeConfig.color }}>{budgetPct}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(budgetPct, 100)}%`,
                    backgroundColor: budgetPct > 100 ? '#EF4444' : budgetPct > 80 ? '#F59E0B' : axeConfig.color
                  }}
                />
              </div>
            </div>
            {/* Prévisions */}
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-[10px] font-semibold text-blue-700 mb-1">Prevision de cloture</div>
              <div className="text-[9px] text-blue-600">
                Estimation fin de projet: {((data.budgetRealise / (data.avancement || 1)) * 100 / 1000000).toFixed(0)}M FCFA
                ({Math.round(((data.budgetRealise / (data.avancement || 1)) * 100 / data.budgetPrevu) * 100)}% du budget initial)
              </div>
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // Section Risques
    if (sectionType === 'risques') {
      const risquesCritiques = axeRisques.filter(r => (r.score || 0) >= 12);
      const risquesEleves = axeRisques.filter(r => (r.score || 0) >= 8 && (r.score || 0) < 12);
      const risquesMoyens = axeRisques.filter(r => (r.score || 0) >= 4 && (r.score || 0) < 8);

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" style={{ color: headerTextColor }} />
              <h2 className="text-lg font-bold" style={{ color: headerTextColor }}>{axeConfig.label} - Risques & Mesures</h2>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: headerTextColor, color: axeConfig.color }}>
              {axeRisques.length} risques
            </span>
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            {/* Résumé par niveau */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 p-2 bg-red-50 rounded-lg border border-red-200 text-center">
                <div className="text-xl font-bold text-red-600">{risquesCritiques.length}</div>
                <div className="text-[9px] text-red-700">Critiques</div>
              </div>
              <div className="flex-1 p-2 bg-orange-50 rounded-lg border border-orange-200 text-center">
                <div className="text-xl font-bold text-orange-600">{risquesEleves.length}</div>
                <div className="text-[9px] text-orange-700">Élevés</div>
              </div>
              <div className="flex-1 p-2 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                <div className="text-xl font-bold text-yellow-600">{risquesMoyens.length}</div>
                <div className="text-[9px] text-yellow-700">Moyens</div>
              </div>
            </div>
            {/* Liste des risques avec mesures */}
            <div className="space-y-1.5">
              {axeRisques.slice(0, 4).map((risque, idx) => {
                const score = risque.score || 0;
                const scoreColor = score >= 12 ? '#EF4444' : score >= 8 ? '#F97316' : score >= 4 ? '#EAB308' : '#22C55E';
                return (
                  <div key={idx} className="p-2 bg-gray-50 rounded-lg border-l-3" style={{ borderLeftColor: scoreColor }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium truncate" style={{ color: primaryColor }}>{risque.titre}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5">
                          P{risque.probabilite} × I{risque.impact} = <span className="font-bold" style={{ color: scoreColor }}>{score}</span>
                        </div>
                      </div>
                    </div>
                    {risque.mesures_attenuation && (
                      <div className="mt-1 text-[9px] text-gray-600 bg-white rounded px-1.5 py-1">
                        💡 {risque.mesures_attenuation.substring(0, 60)}...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // Section Points DG
    if (sectionType === 'dg') {
      return (
        <div style={baseStyles} className="h-full flex flex-col">
          <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: headerTextColor }} />
              <h2 className="text-lg font-bold" style={{ color: headerTextColor }}>{axeConfig.label} - Points DG</h2>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: headerTextColor, color: axeConfig.color }}>
              {axeDecisions.length} décision(s)
            </span>
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            {axeDecisions.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-primary-500" />
                  <p className="text-sm">Aucun point en attente de décision DG</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {axeDecisions.slice(0, 4).map((point, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white rounded-lg border-l-3 shadow-sm"
                    style={{ borderLeftColor: urgencyConfig[point.urgency].color }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[11px] font-semibold" style={{ color: primaryColor }}>{point.subject}</h4>
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] font-medium whitespace-nowrap"
                        style={{ backgroundColor: `${urgencyConfig[point.urgency].color}20`, color: urgencyConfig[point.urgency].color }}
                      >
                        {urgencyConfig[point.urgency].emoji} {urgencyConfig[point.urgency].label.split(' ')[0]}
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-500 mb-1">
                      {point.amount && point.amount !== '-' && <span className="mr-2">💰 {point.amount}</span>}
                      <span>{point.deadline ? new Date(point.deadline).toLocaleDateString('fr-FR') : '-'}</span>
                    </div>
                    <div className="text-[9px] text-gray-600 bg-gray-50 rounded px-1.5 py-1">
                      <span className="font-medium">Recommandation:</span> {point.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // Default fallback
    return renderAxeDetailSlide(axe, slideItem, slideNumber, totalSlides);
  };

  // Render slide preview HTML
  const renderSlidePreview = (slideItem: SlideItem) => {
    const { primaryColor, accentColor, fontFamily, headerStyle } = designSettings;
    const currentIndex = activeSlides.findIndex((s) => s.id === slideItem.id);
    const slideNumber = currentIndex + 1;
    const totalSlides = activeSlides.length;

    const baseStyles = {
      fontFamily,
      backgroundColor: '#ffffff',
    };

    const headerBg = headerStyle === 'full' ? primaryColor : headerStyle === 'minimal' ? `${primaryColor}15` : 'transparent';
    const headerTextColor = headerStyle === 'full' ? '#ffffff' : primaryColor;

    // Check if this is a new-style axe slide (axe_X_section format)
    const axeSlideMatch = slideItem.id.match(/^axe_(\w+)_(\w+)$/);
    if (axeSlideMatch) {
      const axeKey = axeSlideMatch[1] as AxeType;
      const sectionType = axeSlideMatch[2]; // intro, actions, actions_suite, jalons, budget, risques, dg
      return renderAxeSectionSlide(axeKey, sectionType, slideItem, slideNumber, totalSlides);
    }

    // Legacy map for old slide IDs (backwards compatibility)
    // 6 axes : RH, Commercial, Technique (Construction), Budget, Marketing, Exploitation
    const axeSlideMap: Record<string, AxeType> = {
      '5': 'rh',
      '6': 'commercialisation',
      '7': 'technique',
      '8': 'budget',
      '9': 'marketing',
      '9b': 'exploitation',
    };

    // Check if this is a legacy axe detail slide
    if (axeSlideMap[slideItem.id]) {
      return renderAxeDetailSlide(axeSlideMap[slideItem.id], slideItem, slideNumber, totalSlides);
    }

    switch (slideItem.id) {
      case '1':
        // Page de garde
        return (
          <div style={{ ...baseStyles, backgroundColor: primaryColor }} className="h-full flex flex-col items-center justify-center text-white p-8">
            <h1 className="text-4xl font-bold mb-2">COSMOS ANGRÉ</h1>
            <div className="w-24 h-1 mb-6" style={{ backgroundColor: accentColor }} />
            <h2 className="text-2xl mb-2" style={{ color: accentColor }}>Deep Dive</h2>
            <p className="text-lg opacity-80">Présentation Direction Générale</p>
            <p className="text-sm opacity-60 mt-4">
              {new Date(presentationDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        );

      case '2': {
        // Agenda simplifié - sections principales uniquement
        const agendaItems = activeSlides
          .filter((s) =>
            s.id !== '1' &&
            s.id !== '2' &&
            s.id !== '17' &&
            !s.id.includes('_suite') &&
            !s.id.includes('_actions') &&
            !s.id.includes('_jalons') &&
            !s.id.includes('_budget') &&
            !s.id.includes('_risques') &&
            !s.id.includes('_dg')
          )
          .map((s, i) => ({ num: i + 1, title: s.title, isIntro: s.id.includes('_intro') }));

        // Split into two columns
        const midPoint = Math.ceil(agendaItems.length / 2);
        const leftColumn = agendaItems.slice(0, midPoint);
        const rightColumn = agendaItems.slice(midPoint);

        const renderAgendaItem = (item: { num: number; title: string; isIntro: boolean }) => (
          <div key={item.num} className="flex items-center gap-3 py-1">
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {item.num}
            </span>
            <span
              className="text-[11px] leading-tight"
              style={{ color: item.isIntro ? accentColor : primaryColor, fontWeight: item.isIntro ? 600 : 400 }}
            >
              {item.title}
            </span>
          </div>
        );

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: primaryColor }}>
                <h2 className="text-lg font-bold text-white">Agenda</h2>
              </div>
            )}
            <div className="flex-1 px-6 py-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-8">
                <div>{leftColumn.map(renderAgendaItem)}</div>
                <div>{rightColumn.map(renderAgendaItem)}</div>
              </div>
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '3':
        // Synthèse & Météo
        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Synthèse Exécutive & Météo Projet</h2>
              </div>
            )}
            <div className="flex-1 p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border-2 text-center" style={{ borderColor: weatherConfig[projectWeather].color, backgroundColor: `${weatherConfig[projectWeather].color}10` }}>
                  <div className="text-3xl mb-2">{weatherConfig[projectWeather].emoji}</div>
                  <div className="text-sm font-semibold" style={{ color: weatherConfig[projectWeather].color }}>
                    {weatherConfig[projectWeather].label.split(' ')[0]}
                  </div>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Occupation', value: `${kpiValues.occupation}%`, color: '#10B981' },
                    { label: 'Budget consommé', value: `${kpiValues.budgetConsumed}%`, color: '#F59E0B' },
                    { label: 'Jalons atteints', value: `${kpiValues.milestonesAchieved}`, color: primaryColor },
                    { label: 'Équipe', value: `${kpiValues.teamRecruited}`, color: accentColor },
                  ].map((kpi) => (
                    <div key={kpi.label} className="p-3 rounded-lg bg-gray-50 border">
                      <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                      <div className="text-xs text-gray-500">{kpi.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {slideItem.comment && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );

      case 'copil': {
        // Dashboard COPIL Preview
        const top5RisquesPreview = risques.filter(r => r.status !== 'closed').sort((a, b) => b.score - a.score).slice(0, 5);
        const nowPreview = new Date();
        const in30DaysPreview = new Date(nowPreview.getTime() + 30 * 24 * 60 * 60 * 1000);
        const jalonsJ30Preview = jalons.filter(j => {
          if (!j.date_prevue || j.statut === 'atteint') return false;
          const date = new Date(j.date_prevue);
          return date >= nowPreview && date <= in30DaysPreview;
        }).sort((a, b) => new Date(a.date_prevue!).getTime() - new Date(b.date_prevue!).getTime()).slice(0, 5);
        const blockedCountPreview = actions.filter(a => a.statut === 'bloque').length;
        const criticalRisksCountPreview = risques.filter(r => r.score >= 12 && r.status !== 'closed').length;

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Dashboard COPIL</h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-auto">
              <div className="grid grid-cols-3 gap-4">
                {/* Météo Projet */}
                <div className="p-3 rounded-lg border" style={{ borderColor: weatherConfig[projectWeather].color, backgroundColor: `${weatherConfig[projectWeather].color}15` }}>
                  <h3 className="text-xs font-semibold text-gray-600 mb-2">Météo Projet</h3>
                  <div className="text-center">
                    <span className="text-2xl">{weatherConfig[projectWeather].emoji}</span>
                    <p className="text-sm font-bold mt-1" style={{ color: weatherConfig[projectWeather].color }}>
                      {weatherConfig[projectWeather].label.split(' ')[0]}
                    </p>
                  </div>
                </div>

                {/* Top 5 Risques */}
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <h3 className="text-xs font-semibold text-red-700 mb-2">Top 5 Risques</h3>
                  <div className="space-y-1">
                    {top5RisquesPreview.map((r, _i) => (
                      <div key={r.id} className="flex items-center gap-2 text-[10px]">
                        <span className={`font-bold ${r.score >= 12 ? 'text-red-600' : r.score >= 8 ? 'text-yellow-600' : 'text-blue-600'}`}>
                          {r.score}
                        </span>
                        <span className="text-gray-700 truncate">{r.titre}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jalons J-30 */}
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <h3 className="text-xs font-semibold text-blue-700 mb-2">Jalons J-30</h3>
                  <div className="space-y-1">
                    {jalonsJ30Preview.map((j) => {
                      const days = Math.ceil((new Date(j.date_prevue!).getTime() - nowPreview.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={j.id} className="flex items-center gap-2 text-[10px]">
                          <span className={`font-bold ${days <= 7 ? 'text-red-600' : days <= 14 ? 'text-yellow-600' : 'text-blue-600'}`}>
                            J-{days}
                          </span>
                          <span className="text-gray-700 truncate">{j.titre}</span>
                        </div>
                      );
                    })}
                    {jalonsJ30Preview.length === 0 && <p className="text-xs text-gray-500">Aucun jalon à venir</p>}
                  </div>
                </div>
              </div>

              {/* Ligne 2: Budget, Alertes, Décisions */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                {/* Budget */}
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <h3 className="text-xs font-semibold text-green-700 mb-2">Budget</h3>
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${budget.tauxRealisation > 100 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.round(budget.tauxRealisation)}%
                    </span>
                    <p className="text-xs text-gray-500">réalisé</p>
                  </div>
                </div>

                {/* Alertes */}
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <h3 className="text-xs font-semibold text-yellow-700 mb-2">Alertes</h3>
                  <div className="space-y-1 text-xs">
                    <p className={blockedCountPreview > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {blockedCountPreview} action(s) bloquée(s)
                    </p>
                    <p className={criticalRisksCountPreview > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {criticalRisksCountPreview} risque(s) critique(s)
                    </p>
                  </div>
                </div>

                {/* Décisions */}
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <h3 className="text-xs font-semibold text-purple-700 mb-2">Décisions</h3>
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${decisionPoints.filter(d => d.urgency === 'critical' || d.urgency === 'high').length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {decisionPoints.filter(d => d.urgency === 'critical' || d.urgency === 'high').length}
                    </span>
                    <p className="text-xs text-gray-500">urgentes</p>
                  </div>
                </div>
              </div>

              {slideItem.comment && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '4': {
        // Vue d'ensemble par axe - avec détails DG
        const axeTypes4: AxeType[] = ['rh', 'commercialisation', 'technique', 'budget', 'marketing', 'exploitation'];

        // Collect all DG decisions for the summary
        const allDGDecisions = decisionPoints.filter(d => d.urgency === 'critical' || d.urgency === 'high');

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Vue d'Ensemble par Axe Stratégique</h2>
              </div>
            )}
            <div className="flex-1 p-4">
              {/* Barres de progression par axe */}
              <div className="space-y-2">
                {axeTypes4.map((axe) => {
                  const config = axesConfig[axe];
                  const data = axeDetailData[axe];
                  const axeDecisions4 = decisionPointsByAxe[axe];
                  const axeRisques4 = getRisquesForAxe(axe);
                  const axeJalons4 = getJalonsForAxe(axe);
                  const jalonsAtteints4 = axeJalons4.filter(j => j.statut === 'atteint').length;
                  const risquesCritiques4 = axeRisques4.filter(r => (r.score || 0) >= 12).length;

                  return (
                    <div key={axe} className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: config.color }}>
                          <config.icon className="h-3 w-3 text-white" />
                        </div>
                        <span className="w-24 text-xs font-medium" style={{ color: primaryColor }}>{config.label.split(' ')[0]}</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${data.avancement}%`, backgroundColor: config.color }}
                          />
                        </div>
                        <span className="w-10 text-xs font-bold text-right" style={{ color: primaryColor }}>{data.avancement}%</span>

                        {/* Indicateurs compacts */}
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
                            J:{jalonsAtteints4}/{axeJalons4.length || data.jalons}
                          </span>
                          {risquesCritiques4 > 0 && (
                            <span className="text-[9px] px-1 py-0.5 bg-red-100 text-red-700 rounded">
                              R:{risquesCritiques4}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* DG Decisions inline */}
                      {axeDecisions4.length > 0 && (
                        <div className="mt-1 ml-8 space-y-0.5">
                          {axeDecisions4.map((decision) => (
                            <div key={decision.id} className="flex items-center gap-1 text-[9px]">
                              <span>{urgencyConfig[decision.urgency].emoji}</span>
                              <span className="text-gray-600 truncate flex-1">{decision.subject}</span>
                              <span className="text-gray-400">{decision.deadline ? new Date(decision.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Résumé global des décisions DG */}
              {allDGDecisions.length > 0 && (
                <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-orange-800">🚨 Décisions DG Prioritaires</span>
                    <span className="text-xs text-orange-600">{decisionPoints.filter(d => d.urgency === 'critical').length} critique(s), {decisionPoints.filter(d => d.urgency === 'high').length} haute(s)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {allDGDecisions.slice(0, 4).map((d) => (
                      <div key={d.id} className="text-[9px] bg-white rounded px-1.5 py-1 border-l-2" style={{ borderLeftColor: urgencyConfig[d.urgency].color }}>
                        <div className="font-medium text-gray-800 truncate">{d.subject}</div>
                        <div className="text-gray-500">{axesConfig[d.axe]?.shortLabel || d.axe} • {d.deadline ? new Date(d.deadline).toLocaleDateString('fr-FR') : '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {slideItem.comment && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border-l-3 border-blue-400">
                  <p className="text-[10px] text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '10': {
        // Synchronisation Projet vs Mobilisation (New Module)
        const syncProjectProgress = syncData.syncStatus?.projectProgress ?? 0;
        const syncMobilizationProgress = syncData.syncStatus?.mobilizationProgress ?? 0;
        const syncGap = syncData.syncStatus?.gap ?? 0;
        const syncGapDays = syncData.syncStatus?.gapDays ?? 0;
        const syncStatusType = syncData.syncStatus?.status ?? 'SYNC';
        const syncAlertLevel = syncData.syncStatus?.alertLevel ?? 'GREEN';

        // Get category details
        const projectCats = syncData.projectCategories || [];
        const mobCats = syncData.mobilizationCategories || [];

        // Get active alerts
        const syncActiveAlerts = syncData.alerts?.filter(a => !a.isAcknowledged) || [];

        // Determine recommendation
        let syncRecommendation = '';
        let syncRecoColor = SYNC_CONFIG.colors.sync;
        if (syncStatusType === 'SYNC') {
          syncRecommendation = 'Les deux dimensions progressent de manière synchrone. Maintenir le rythme actuel.';
          syncRecoColor = SYNC_CONFIG.colors.sync;
        } else if (syncStatusType === 'PROJECT_AHEAD' || syncStatusType === 'CRITICAL') {
          syncRecommendation = 'Accélérer la mobilisation ou ralentir le projet pour éviter les ressources en attente.';
          syncRecoColor = SYNC_CONFIG.colors.warning;
        } else {
          syncRecommendation = 'Accélérer le projet de construction pour être prêt à l\'ouverture.';
          syncRecoColor = SYNC_CONFIG.colors.project;
        }

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Synchronisation Projet / Mobilisation</h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              {/* Vue comparative avec jauge */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="text-center flex-1">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Wrench className="h-4 w-4" style={{ color: SYNC_CONFIG.colors.project }} />
                    <span className="text-xs font-bold" style={{ color: SYNC_CONFIG.colors.project }}>PROJET</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: SYNC_CONFIG.colors.project }}>{syncProjectProgress.toFixed(0)}%</div>
                </div>

                {/* Jauge centrale de synchronisation */}
                <div className="relative w-32 h-16">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-2 bg-gray-200 rounded-full relative">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
                        style={{
                          left: `${Math.min(100, Math.max(0, syncProjectProgress))}%`,
                          backgroundColor: SYNC_CONFIG.colors.project,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
                        style={{
                          left: `${Math.min(100, Math.max(0, syncMobilizationProgress))}%`,
                          backgroundColor: SYNC_CONFIG.colors.mobilization,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      syncAlertLevel === 'GREEN' ? 'bg-green-100 text-green-700' :
                      syncAlertLevel === 'ORANGE' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {syncStatusType === 'SYNC' ? '✓ Synchronisé' : `Écart: ${Math.abs(syncGap).toFixed(0)}% (~${Math.abs(syncGapDays)}j)`}
                    </span>
                  </div>
                </div>

                <div className="text-center flex-1">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Building2 className="h-4 w-4" style={{ color: SYNC_CONFIG.colors.mobilization }} />
                    <span className="text-xs font-bold" style={{ color: SYNC_CONFIG.colors.mobilization }}>MOBILISATION</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: SYNC_CONFIG.colors.mobilization }}>{syncMobilizationProgress.toFixed(0)}%</div>
                </div>
              </div>

              {/* Recommandation */}
              <div
                className="p-2 rounded-lg mb-3 text-center"
                style={{ backgroundColor: `${syncRecoColor}15`, borderLeft: `3px solid ${syncRecoColor}` }}
              >
                <p className="text-xs" style={{ color: syncRecoColor }}>{syncRecommendation}</p>
              </div>

              {/* Categories par dimension */}
              <div className="grid grid-cols-2 gap-3">
                {/* Projet */}
                <div className="rounded-lg p-2" style={{ backgroundColor: `${SYNC_CONFIG.colors.project}10` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: SYNC_CONFIG.colors.project }}>
                      🔧 Projet Construction
                    </span>
                    <span className="text-xs text-gray-500">{projectCats.length} catégories</span>
                  </div>
                  <div className="space-y-1">
                    {projectCats.slice(0, 4).map((cat, idx) => (
                      <div key={cat.categoryId || idx} className="flex items-center gap-2 bg-white rounded px-2 py-1">
                        <span className="text-xs truncate flex-1">{cat.categoryName}</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cat.progress}%`, backgroundColor: SYNC_CONFIG.colors.project }} />
                        </div>
                        <span className="text-xs font-medium w-8 text-right" style={{ color: SYNC_CONFIG.colors.project }}>{cat.progress.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobilisation */}
                <div className="rounded-lg p-2" style={{ backgroundColor: `${SYNC_CONFIG.colors.mobilization}10` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: SYNC_CONFIG.colors.mobilization }}>
                      🏢 Mobilisation
                    </span>
                    <span className="text-xs text-gray-500">{mobCats.length} catégories</span>
                  </div>
                  <div className="space-y-1">
                    {mobCats.slice(0, 4).map((cat, idx) => (
                      <div key={cat.categoryId || idx} className="flex items-center gap-2 bg-white rounded px-2 py-1">
                        <span className="text-xs truncate flex-1">{cat.categoryName}</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cat.progress}%`, backgroundColor: SYNC_CONFIG.colors.mobilization }} />
                        </div>
                        <span className="text-xs font-medium w-8 text-right" style={{ color: SYNC_CONFIG.colors.mobilization }}>{cat.progress.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alertes actives */}
              {syncActiveAlerts.length > 0 && (
                <div className="mt-3 p-2 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <p className="text-xs font-semibold text-orange-800 mb-1">Alertes actives ({syncActiveAlerts.length})</p>
                  {syncActiveAlerts.slice(0, 2).map((alert, idx) => (
                    <p key={alert.id || idx} className="text-xs text-orange-700">• {alert.title}</p>
                  ))}
                </div>
              )}

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '11':
        // Budget & EVM
        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Budget & Ressources (EVM)</h2>
              </div>
            )}
            <div className="flex-1 p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>Vue Budget</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Budget Total', value: budget.prevu.toLocaleString('fr-FR') + ' FCFA' },
                      { label: 'Engagé', value: budget.engage.toLocaleString('fr-FR') + ' FCFA' },
                      { label: 'Réalisé', value: budget.realise.toLocaleString('fr-FR') + ' FCFA' },
                      { label: 'Reste', value: (budget.prevu - budget.realise).toLocaleString('fr-FR') + ' FCFA' },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium" style={{ color: primaryColor }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>Indicateurs EVM</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'SPI', value: '0.95' },
                      { label: 'CPI', value: '1.02' },
                      { label: 'TCPI', value: '0.98' },
                    ].map((item) => (
                      <div key={item.label} className="p-2 bg-gray-50 rounded text-center">
                        <div className="text-lg font-bold" style={{ color: accentColor }}>{item.value}</div>
                        <div className="text-xs text-gray-500">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {slideItem.comment && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );

      case '12': {
        // Risques - avec détails complets
        const criticalRisques12 = risques.filter(r => (r.score || 0) >= 12);
        const highRisques12 = risques.filter(r => (r.score || 0) >= 8 && (r.score || 0) < 12);
        const mediumRisques12 = risques.filter(r => (r.score || 0) >= 4 && (r.score || 0) < 8);

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Risques & Points d'Attention</h2>
              </div>
            )}
            <div className="flex-1 p-3">
              {/* Résumé par niveau */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-red-50 rounded-lg p-2 border border-red-200 text-center">
                  <div className="text-xl font-bold text-red-600">{criticalRisques12.length}</div>
                  <div className="text-[10px] text-red-700">Critiques (≥12)</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 border border-orange-200 text-center">
                  <div className="text-xl font-bold text-orange-600">{highRisques12.length}</div>
                  <div className="text-[10px] text-orange-700">Élevés (8-11)</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200 text-center">
                  <div className="text-xl font-bold text-yellow-600">{mediumRisques12.length}</div>
                  <div className="text-[10px] text-yellow-700">Modérés (4-7)</div>
                </div>
              </div>

              {/* Risques critiques - détails complets */}
              {criticalRisques12.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                    Risques Critiques ({criticalRisques12.length})
                  </h4>
                  <div className="space-y-1">
                    {criticalRisques12.map((risque) => (
                      <div key={risque.id} className="bg-red-50 rounded-lg p-2 border-l-3 border-red-500">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-800">{risque.titre}</div>
                            <div className="text-[9px] text-gray-600 mt-0.5 line-clamp-1">{risque.description}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold text-red-600">P{risque.probabilite}×I{risque.impact}={risque.score}</div>
                            <div className="text-[9px] text-gray-500">{risque.proprietaire}</div>
                          </div>
                        </div>
                        {risque.strategie_reponse && (
                          <div className="mt-1 text-[9px] text-gray-600 bg-white rounded px-1.5 py-0.5">
                            💡 Stratégie: {risque.strategie_reponse}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risques élevés - liste */}
              {highRisques12.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-orange-700 mb-1 flex items-center gap-1">
                    Risques Eleves ({highRisques12.length})
                  </h4>
                  <div className="space-y-1">
                    {highRisques12.slice(0, 3).map((risque) => (
                      <div key={risque.id} className="bg-orange-50 rounded p-1.5 border-l-2 border-orange-400 flex items-center justify-between">
                        <span className="text-[10px] text-gray-700 flex-1 truncate">{risque.titre}</span>
                        <span className="text-[10px] font-bold text-orange-600 ml-2">Score: {risque.score}</span>
                      </div>
                    ))}
                    {highRisques12.length > 3 && (
                      <div className="text-[9px] text-gray-500 italic pl-2">+ {highRisques12.length - 3} autre(s) risque(s) élevé(s)</div>
                    )}
                  </div>
                </div>
              )}

              {/* Message si aucun risque critique */}
              {criticalRisques12.length === 0 && highRisques12.length === 0 && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                  <CheckCircle className="h-6 w-6 text-primary-500 mx-auto mb-1" />
                  <div className="text-sm font-medium text-green-700">Aucun risque critique ou élevé</div>
                  <div className="text-xs text-green-600">Tous les risques sont sous contrôle</div>
                </div>
              )}

              {slideItem.comment && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border-l-3 border-blue-400">
                  <p className="text-[10px] text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '13':
      case '13_suite': {
        // Points DG classés par axe - Design amélioré (avec pagination)
        const isSuite = slideItem.id === '13_suite';
        const MAX_POINTS_PER_SLIDE = 4;

        // Flatten all points for pagination
        const allPoints = decisionPoints;
        const startIdx = isSuite ? MAX_POINTS_PER_SLIDE : 0;
        const endIdx = isSuite ? allPoints.length : MAX_POINTS_PER_SLIDE;
        const pointsToShow = allPoints.slice(startIdx, endIdx);
        const hasMore = !isSuite && allPoints.length > MAX_POINTS_PER_SLIDE;

        // Compteurs par urgence (toujours afficher le total)
        const urgencyCounts = {
          critical: decisionPoints.filter(p => p.urgency === 'critical').length,
          high: decisionPoints.filter(p => p.urgency === 'high').length,
          medium: decisionPoints.filter(p => p.urgency === 'medium').length,
          low: decisionPoints.filter(p => p.urgency === 'low').length,
        };

        // Group points to show by axe
        const pointsToShowByAxe: Record<AxeType, DGDecisionPoint[]> = {
          rh: [],
          commercialisation: [],
          technique: [],
          budget: [],
          marketing: [],
          exploitation: [],
          general: [],
        };
        pointsToShow.forEach(p => {
          if (pointsToShowByAxe[p.axe]) {
            pointsToShowByAxe[p.axe].push(p);
          }
        });
        const axesWithPointsToShow = (Object.keys(pointsToShowByAxe) as AxeType[])
          .filter((axe) => pointsToShowByAxe[axe].length > 0);

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-2 flex items-center justify-between" style={{ backgroundColor: headerBg }}>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: headerTextColor }}>
                  <span className="text-xl">🚨</span>
                  Points en Attente de Décision DG {isSuite && '(Suite)'}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: headerTextColor, color: headerBg }}>
                    {isSuite ? `${startIdx + 1}-${endIdx}` : pointsToShow.length} / {decisionPoints.length}
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 p-3 overflow-hidden">
              {/* Résumé par urgence - compact */}
              {!isSuite && (
                <div className="flex gap-2 mb-3">
                  {urgencyCounts.critical > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 border border-red-200">
                      <span className="text-sm font-bold text-red-700">{urgencyCounts.critical}</span>
                    </div>
                  )}
                  {urgencyCounts.high > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 border border-orange-200">
                      <span className="text-sm font-bold text-orange-700">{urgencyCounts.high}</span>
                    </div>
                  )}
                  {urgencyCounts.medium > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-50 border border-yellow-200">
                      <span className="text-sm">🟡</span>
                      <span className="text-sm font-bold text-yellow-700">{urgencyCounts.medium}</span>
                    </div>
                  )}
                  {urgencyCounts.low > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-sm">🟢</span>
                      <span className="text-sm font-bold text-green-700">{urgencyCounts.low}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Points par axe - compact */}
              <div className="space-y-2">
                {axesWithPointsToShow.map((axe) => {
                  const config = axesConfig[axe];
                  const points = pointsToShowByAxe[axe];
                  return (
                    <div key={axe} className="rounded-lg border" style={{ borderColor: `${config.color}40` }}>
                      {/* Header de l'axe - compact */}
                      <div className="flex items-center gap-2 px-2 py-1" style={{ backgroundColor: `${config.color}15` }}>
                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: config.color }}>
                          <config.icon className="h-3 w-3 text-white" />
                        </div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wide" style={{ color: config.color }}>
                          {config.label}
                        </h3>
                        <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: config.color }}>
                          {points.length}
                        </span>
                      </div>

                      {/* Points de cet axe - très compact */}
                      <div className="divide-y" style={{ borderColor: `${config.color}20` }}>
                        {points.map((point) => (
                          <div key={point.id} className="px-2 py-1.5 bg-white">
                            <div className="flex items-start gap-2">
                              <div
                                className="w-1 self-stretch rounded-full flex-shrink-0"
                                style={{ backgroundColor: urgencyConfig[point.urgency].color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                  <h4 className="text-[10px] font-semibold leading-tight" style={{ color: primaryColor }}>
                                    {point.subject}
                                  </h4>
                                  <span
                                    className="flex-shrink-0 px-1 py-0.5 rounded text-[8px] font-medium"
                                    style={{
                                      backgroundColor: `${urgencyConfig[point.urgency].color}20`,
                                      color: urgencyConfig[point.urgency].color
                                    }}
                                  >
                                    {urgencyConfig[point.urgency].emoji}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                  {point.amount && point.amount !== '-' && (
                                    <span className="font-bold" style={{ color: accentColor }}>💰 {point.amount}</span>
                                  )}
                                  <span>{point.deadline ? new Date(point.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '-'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="mt-2 text-center text-[10px] text-gray-500 italic">
                  ➔ Suite sur la slide suivante ({allPoints.length - MAX_POINTS_PER_SLIDE} points restants)
                </div>
              )}

              {slideItem.comment && (
                <div className="mt-2 p-1.5 bg-blue-50 rounded border-l-2 border-blue-400">
                  <p className="text-[10px] text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '14': {
        // Planning & Jalons - avec détails par statut
        const jalonsAtteints14 = jalons.filter(j => j.statut === 'atteint');
        const jalonsEnDanger14 = jalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse');
        const jalonsEnApproche14 = jalons.filter(j => j.statut === 'en_approche');
        const jalonsAVenir14 = jalons.filter(j => j.statut === 'a_venir');

        const getJalonStatusConfig = (statut: string) => {
          const configs: Record<string, { color: string; bg: string; label: string; icon: string }> = {
            atteint: { color: '#22C55E', bg: 'bg-green-50', label: 'Atteint', icon: '✓' },
            en_danger: { color: '#EF4444', bg: 'bg-red-50', label: 'En danger', icon: '' },
            depasse: { color: '#DC2626', bg: 'bg-red-100', label: 'Dépassé', icon: '✗' },
            en_approche: { color: '#3B82F6', bg: 'bg-blue-50', label: 'En approche', icon: '→' },
            a_venir: { color: '#6B7280', bg: 'bg-gray-50', label: 'A venir', icon: '' },
          };
          return configs[statut] || configs.a_venir;
        };

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Planning & Jalons</h2>
              </div>
            )}
            <div className="flex-1 p-3">
              {/* Résumé des jalons */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-green-50 rounded-lg p-2 border border-green-200 text-center">
                  <div className="text-xl font-bold text-green-600">{jalonsAtteints14.length}</div>
                  <div className="text-[10px] text-green-700">Atteints</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200 text-center">
                  <div className="text-xl font-bold text-blue-600">{jalonsEnApproche14.length}</div>
                  <div className="text-[10px] text-blue-700">En approche</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2 border border-red-200 text-center">
                  <div className="text-xl font-bold text-red-600">{jalonsEnDanger14.length}</div>
                  <div className="text-[10px] text-red-700">En danger</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-600">{jalonsAVenir14.length}</div>
                  <div className="text-[10px] text-gray-700">À venir</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Jalons atteints */}
                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <h4 className="text-xs font-bold text-green-700 mb-1">✓ Jalons Atteints ({jalonsAtteints14.length})</h4>
                  {jalonsAtteints14.length > 0 ? (
                    <div className="space-y-1">
                      {jalonsAtteints14.slice(0, 4).map((j, idx) => (
                        <div key={idx} className="bg-white rounded p-1.5 text-[10px]">
                          <div className="font-medium text-gray-800 line-clamp-1">{j.titre}</div>
                          <div className="text-gray-500">✓ {j.date_reelle ? new Date(j.date_reelle).toLocaleDateString('fr-FR') : new Date(j.date_prevue).toLocaleDateString('fr-FR')}</div>
                        </div>
                      ))}
                      {jalonsAtteints14.length > 4 && (
                        <div className="text-[9px] text-gray-500 italic">+ {jalonsAtteints14.length - 4} autre(s)</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500 italic">Aucun jalon atteint</div>
                  )}
                </div>

                {/* Jalons en danger ou dépassés */}
                <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                  <h4 className="text-xs font-bold text-red-700 mb-1">Jalons En Danger ({jalonsEnDanger14.length})</h4>
                  {jalonsEnDanger14.length > 0 ? (
                    <div className="space-y-1">
                      {jalonsEnDanger14.slice(0, 4).map((j, idx) => (
                        <div key={idx} className="bg-white rounded p-1.5 text-[10px] border-l-2 border-red-400">
                          <div className="font-medium text-gray-800 line-clamp-1">{j.titre}</div>
                          <div className="text-red-600">{new Date(j.date_prevue).toLocaleDateString('fr-FR')}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-green-600">✓ Aucun jalon en danger</div>
                  )}
                </div>

                {/* Prochains jalons */}
                <div className="col-span-2 bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-700 mb-1">→ Prochains Jalons ({jalonsEnApproche14.length + jalonsAVenir14.length})</h4>
                  <div className="grid grid-cols-3 gap-1">
                    {[...jalonsEnApproche14, ...jalonsAVenir14].slice(0, 6).map((j, idx) => {
                      const config = getJalonStatusConfig(j.statut);
                      return (
                        <div key={idx} className="bg-white rounded p-1.5 text-[10px]" style={{ borderLeft: `2px solid ${config.color}` }}>
                          <div className="font-medium text-gray-800 line-clamp-1">{j.titre}</div>
                          <div className="text-gray-500">{new Date(j.date_prevue).toLocaleDateString('fr-FR')}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {slideItem.comment && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border-l-3 border-blue-400">
                  <p className="text-[10px] text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '15': {
        // Actions par Jalons
        // Group actions by their target milestone
        const actionsParJalon: Record<string, typeof actions.data> = {};
        const actionsData = actions.data || [];
        const jalonsData = jalons.data || [];

        // Create a map of jalon titles by ID
        const jalonTitlesMap: Record<number, string> = {};
        jalonsData.forEach(j => {
          if (j.id) jalonTitlesMap[j.id] = j.titre;
        });

        // Group actions by jalon
        actionsData.forEach(action => {
          const jalonId = action.jalonId;
          const jalonTitle = jalonId ? (jalonTitlesMap[jalonId] || `Jalon #${jalonId}`) : 'Sans jalon associé';
          if (!actionsParJalon[jalonTitle]) {
            actionsParJalon[jalonTitle] = [];
          }
          actionsParJalon[jalonTitle]?.push(action);
        });

        // Sort jalons by number of actions (descending)
        const sortedJalons = Object.entries(actionsParJalon)
          .filter(([title]) => title !== 'Sans jalon associé')
          .sort((a, b) => (b[1]?.length || 0) - (a[1]?.length || 0))
          .slice(0, 4); // Top 4 jalons

        const statusColors: Record<string, string> = {
          termine: '#10B981',
          en_cours: '#3B82F6',
          en_retard: '#EF4444',
          bloque: '#EF4444',
          planifie: '#6B7280',
          a_faire: '#F59E0B',
        };

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Actions par Jalons</h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                {sortedJalons.map(([jalonTitle, jalonActions]) => {
                  const actionsList = jalonActions || [];
                  const terminees = actionsList.filter(a => a.statut === 'termine').length;
                  const enCours = actionsList.filter(a => a.statut === 'en_cours').length;
                  const enRetard = actionsList.filter(a => a.statut === 'bloque' || a.sante === 'rouge').length;

                  return (
                    <div key={jalonTitle} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold truncate" style={{ color: primaryColor }} title={jalonTitle}>
                          {jalonTitle.length > 30 ? jalonTitle.substring(0, 30) + '...' : jalonTitle}
                        </h4>
                        <span className="text-xs font-bold" style={{ color: accentColor }}>{actionsList.length}</span>
                      </div>

                      {/* Progress indicators */}
                      <div className="flex gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
                          <span className="text-xs text-gray-600">{terminees}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                          <span className="text-xs text-gray-600">{enCours}</span>
                        </div>
                        {enRetard > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                            <span className="text-xs text-gray-600">{enRetard}</span>
                          </div>
                        )}
                      </div>

                      {/* Action list */}
                      <div className="space-y-1">
                        {actionsList.slice(0, 3).map(action => (
                          <div key={action.id} className="flex items-center gap-2 text-xs">
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: statusColors[action.statut] || '#6B7280' }}
                            />
                            <span className="truncate text-gray-700" title={action.titre}>
                              {action.titre.length > 25 ? action.titre.substring(0, 25) + '...' : action.titre}
                            </span>
                            <span className="text-gray-400 flex-shrink-0">{action.avancement}%</span>
                          </div>
                        ))}
                        {actionsList.length > 3 && (
                          <div className="text-xs text-gray-400 italic">
                            +{actionsList.length - 3} autres actions
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
                  <span className="text-xs text-gray-500">Terminée</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                  <span className="text-xs text-gray-500">En cours</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                  <span className="text-xs text-gray-500">En retard/Bloquée</span>
                </div>
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '16':
        // Synthèse & Next steps
        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Synthèse & Prochaines Étapes</h2>
              </div>
            )}
            <div className="flex-1 p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>Points clés</h3>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" style={{ color: weatherConfig[projectWeather].color }} />
                      Météo: {weatherConfig[projectWeather].label.split(' ')[0]}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-gray-400" />
                      Occupation: {kpiValues.occupation}% (cible 85%)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-gray-400" />
                      Budget: {kpiValues.budgetConsumed}% consommé
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-primary-500" />
                      {decisionPoints.length} décision(s) DG en attente
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>Prochaines étapes</h3>
                  <ol className="space-y-2 text-xs list-decimal list-inside">
                    <li>Finaliser les arbitrages en attente</li>
                    <li>Poursuivre la commercialisation</li>
                    <li>Suivre la levée des réserves</li>
                    <li>Préparer l'inauguration</li>
                  </ol>
                </div>
              </div>
              {slideItem.comment && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );

      case '17':
        // Page de fin
        return (
          <div style={{ ...baseStyles, backgroundColor: primaryColor }} className="h-full flex flex-col items-center justify-center text-white p-8">
            <h1 className="text-3xl font-bold mb-4">Merci de votre attention</h1>
            <div className="w-16 h-1 mb-6" style={{ backgroundColor: accentColor }} />
            <p className="text-xl opacity-80 mb-8">Questions ?</p>
            <p className="text-sm" style={{ color: accentColor }}>COSMOS ANGRÉ</p>
          </div>
        );

      case '18': {
        // Tableau de Bord Stratégique - Scorecard avec objectifs vs réalisé
        const strategicKPIs = [
          { label: 'Taux d\'occupation', target: 85, current: kpiValues.occupation, unit: '%', trend: 'up' },
          { label: 'Budget consommé', target: 35, current: kpiValues.budgetConsumed, unit: '%', trend: 'stable' },
          { label: 'Jalons atteints', target: 12, current: kpiValues.milestonesAchieved, unit: '', trend: 'up' },
          { label: 'Actions terminées', target: 50, current: actions.filter(a => a.statut === 'termine').length || 32, unit: '', trend: 'up' },
          { label: 'Risques critiques', target: 0, current: risques.filter(r => (r.score || 0) >= 12).length || 3, unit: '', trend: 'down', inverse: true },
          { label: 'Équipe mobilisée', target: 25, current: kpiValues.teamRecruited, unit: '', trend: 'up' },
        ];

        const getStatusColor = (current: number, target: number, inverse?: boolean) => {
          const ratio = current / target;
          if (inverse) {
            if (ratio <= 0.5) return '#22C55E';
            if (ratio <= 1) return '#F59E0B';
            return '#EF4444';
          }
          if (ratio >= 0.9) return '#22C55E';
          if (ratio >= 0.7) return '#F59E0B';
          return '#EF4444';
        };

        const getTrendIcon = (trend: string) => {
          if (trend === 'up') return '↑';
          if (trend === 'down') return '↓';
          return '→';
        };

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Tableau de Bord Stratégique</h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="grid grid-cols-3 gap-3">
                {strategicKPIs.map((kpi, idx) => {
                  const statusColor = getStatusColor(kpi.current, kpi.target, kpi.inverse);
                  const progressPct = Math.min(100, (kpi.current / kpi.target) * 100);
                  return (
                    <div key={idx} className="bg-white border rounded-xl p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">{kpi.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                          {getTrendIcon(kpi.trend)} {kpi.trend === 'up' ? '+5%' : kpi.trend === 'down' ? '-3%' : '0%'}
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold" style={{ color: statusColor }}>
                          {kpi.current}{kpi.unit}
                        </span>
                        <span className="text-xs text-gray-400 mb-1">/ {kpi.target}{kpi.unit}</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: statusColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Résumé global */}
              <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: `${primaryColor}10` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: weatherConfig[projectWeather].color }}>
                      {weatherConfig[projectWeather].emoji}
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: primaryColor }}>Score Global Projet</div>
                      <div className="text-xs text-gray-500">Basé sur {strategicKPIs.length} indicateurs clés</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {Math.round(strategicKPIs.reduce((sum, k) => sum + Math.min(100, (k.current / k.target) * 100), 0) / strategicKPIs.length)}%
                    </div>
                    <div className="text-xs text-gray-500">Atteinte des objectifs</div>
                  </div>
                </div>
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '19': {
        // Faits Marquants de la Période - avec données réelles
        const criticalDecisions19 = decisionPoints.filter(d => d.urgency === 'critical');
        const highDecisions19 = decisionPoints.filter(d => d.urgency === 'high');
        const criticalRisques19 = risques.filter(r => (r.score || 0) >= 12);
        const highRisques19 = risques.filter(r => (r.score || 0) >= 8 && (r.score || 0) < 12);
        const blockedActions19 = actions.filter(a => a.statut === 'bloque' || a.sante === 'rouge');
        const completedActions19 = actions.filter(a => a.statut === 'termine');
        const achievedJalons19 = jalons.filter(j => j.statut === 'atteint');

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: headerTextColor }}>
                  <Zap className="h-5 w-5" />
                  Faits Marquants de la Période
                </h2>
              </div>
            )}
            <div className="flex-1 p-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Réalisations - données réelles */}
                <div className="bg-green-50 rounded-xl p-2 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-primary-500" />
                    <span className="text-xs font-bold text-green-800">Réalisations Clés</span>
                  </div>
                  <div className="space-y-1">
                    {completedActions19.length > 0 ? (
                      completedActions19.slice(0, 3).map((action, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 bg-white rounded p-1.5">
                          <span className="w-1.5 h-1.5 rounded-full mt-1 bg-green-500" />
                          <span className="text-[10px] text-gray-700 line-clamp-1">{action.titre}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-gray-500 italic">Aucune action terminée récemment</div>
                    )}
                    {achievedJalons19.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-green-200">
                        <div className="text-[9px] text-green-700 font-medium mb-0.5">Jalons atteints:</div>
                        {achievedJalons19.slice(0, 2).map((j, idx) => (
                          <div key={idx} className="text-[9px] text-gray-600 pl-2">✓ {j.titre}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Points de Blocage - données réelles */}
                <div className="bg-red-50 rounded-xl p-2 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-primary-500" />
                    <span className="text-xs font-bold text-red-800">Points de Blocage ({blockedActions19.length})</span>
                  </div>
                  <div className="space-y-1">
                    {blockedActions19.length > 0 ? (
                      blockedActions19.slice(0, 3).map((action, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 bg-white rounded p-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1 ${action.statut === 'bloque' ? 'bg-red-500' : 'bg-orange-500'}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-gray-700 line-clamp-1">{action.titre}</span>
                            <span className="text-[9px] text-gray-400"> - {action.responsable}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-green-600">✓ Aucun blocage actif</div>
                    )}
                  </div>
                </div>

                {/* Décisions DG en attente - détails précis */}
                <div className="bg-orange-50 rounded-xl p-2 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-primary-500" />
                    <span className="text-xs font-bold text-orange-800">
                      Décisions DG ({criticalDecisions19.length} critique, {highDecisions19.length} haute)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {criticalDecisions19.length > 0 && (
                      <div>
                        <div className="text-[9px] text-red-600 font-medium mb-0.5">Critiques:</div>
                        {criticalDecisions19.map((d, idx) => (
                          <div key={idx} className="bg-white rounded p-1 mb-0.5 border-l-2 border-red-500">
                            <div className="text-[9px] font-medium text-gray-800">{d.subject}</div>
                            <div className="text-[8px] text-gray-500">{d.deadline ? new Date(d.deadline).toLocaleDateString('fr-FR') : '-'} | {axesConfig[d.axe]?.shortLabel}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {highDecisions19.length > 0 && (
                      <div>
                        <div className="text-[9px] text-orange-600 font-medium mb-0.5">Haute priorite:</div>
                        {highDecisions19.slice(0, 2).map((d, idx) => (
                          <div key={idx} className="bg-white rounded p-1 mb-0.5 border-l-2 border-orange-500">
                            <div className="text-[9px] font-medium text-gray-800">{d.subject}</div>
                            <div className="text-[8px] text-gray-500">{d.deadline ? new Date(d.deadline).toLocaleDateString('fr-FR') : '-'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {criticalDecisions19.length === 0 && highDecisions19.length === 0 && (
                      <div className="text-[10px] text-green-600">✓ Aucune décision urgente</div>
                    )}
                  </div>
                </div>

                {/* Risques à surveiller - détails précis */}
                <div className="bg-purple-50 rounded-xl p-2 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-bold text-purple-800">
                      Risques ({criticalRisques19.length} critique, {highRisques19.length} élevé)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {criticalRisques19.length > 0 && (
                      <div>
                        <div className="text-[9px] text-red-600 font-medium mb-0.5">Critiques (score {'\u2265'}12):</div>
                        {criticalRisques19.slice(0, 2).map((r, idx) => (
                          <div key={idx} className="bg-white rounded p-1 mb-0.5 border-l-2 border-red-500">
                            <div className="text-[9px] font-medium text-gray-800">{r.titre}</div>
                            <div className="text-[8px] text-gray-500">Score: P{r.probabilite}×I{r.impact}={r.score}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {highRisques19.length > 0 && (
                      <div>
                        <div className="text-[9px] text-orange-600 font-medium mb-0.5">Eleves (score 8-11):</div>
                        {highRisques19.slice(0, 2).map((r, idx) => (
                          <div key={idx} className="bg-white rounded p-1 mb-0.5 border-l-2 border-orange-500">
                            <div className="text-[9px] font-medium text-gray-800">{r.titre}</div>
                            <div className="text-[8px] text-gray-500">Score: {r.score}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {criticalRisques19.length === 0 && highRisques19.length === 0 && (
                      <div className="text-[10px] text-green-600">✓ Aucun risque critique ou élevé</div>
                    )}
                  </div>
                </div>
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '20': {
        // Analyse EVM Détaillée
        const evmData = {
          BAC: budget.prevu || 5000000000, // Budget at Completion
          AC: budget.realise || 1600000000, // Actual Cost
          PV: (budget.prevu || 5000000000) * 0.35, // Planned Value (35% du projet devrait être fait)
          EV: (budget.prevu || 5000000000) * 0.32, // Earned Value (32% réellement accompli)
        };

        const SPI = evmData.EV / evmData.PV; // Schedule Performance Index
        const CPI = evmData.EV / evmData.AC; // Cost Performance Index
        const SV = evmData.EV - evmData.PV; // Schedule Variance
        const CV = evmData.EV - evmData.AC; // Cost Variance
        const EAC = evmData.BAC / CPI; // Estimate at Completion
        const ETC = EAC - evmData.AC; // Estimate to Complete
        const VAC = evmData.BAC - EAC; // Variance at Completion
        const TCPI = (evmData.BAC - evmData.EV) / (evmData.BAC - evmData.AC); // To-Complete Performance Index

        const formatCurrency = (val: number) => {
          if (Math.abs(val) >= 1000000000) return `${(val / 1000000000).toFixed(1)} Mrd`;
          if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(0)} M`;
          return val.toLocaleString('fr-FR');
        };

        const getIndexColor = (value: number, isInverse?: boolean) => {
          if (isInverse) {
            if (value <= 1) return '#22C55E';
            if (value <= 1.1) return '#F59E0B';
            return '#EF4444';
          }
          if (value >= 1) return '#22C55E';
          if (value >= 0.9) return '#F59E0B';
          return '#EF4444';
        };

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: headerTextColor }}>
                  <TrendingUp className="h-5 w-5" />
                  Analyse EVM Détaillée
                </h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              {/* Indices principaux */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'SPI', value: SPI, desc: 'Schedule Performance', target: 1 },
                  { label: 'CPI', value: CPI, desc: 'Cost Performance', target: 1 },
                  { label: 'TCPI', value: TCPI, desc: 'To-Complete Performance', target: 1, inverse: true },
                  { label: 'EAC', value: EAC, desc: 'Estimate at Completion', isCurrency: true },
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3 text-center border">
                    <div className="text-xs text-gray-500 mb-1">{item.desc}</div>
                    <div className="text-2xl font-bold" style={{ color: item.isCurrency ? primaryColor : getIndexColor(item.value, item.inverse) }}>
                      {item.isCurrency ? formatCurrency(item.value) : item.value.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium" style={{ color: primaryColor }}>{item.label}</div>
                    {!item.isCurrency && (
                      <div className="mt-1 text-xs" style={{ color: getIndexColor(item.value, item.inverse) }}>
                        {item.value >= 1 ? 'OK' : 'Attention'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Détail des valeurs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-3 border">
                  <h4 className="text-sm font-bold mb-3" style={{ color: primaryColor }}>Valeurs Fondamentales</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'BAC (Budget Total)', value: formatCurrency(evmData.BAC), color: primaryColor },
                      { label: 'PV (Valeur Planifiée)', value: formatCurrency(evmData.PV), color: '#6B7280' },
                      { label: 'EV (Valeur Acquise)', value: formatCurrency(evmData.EV), color: '#3B82F6' },
                      { label: 'AC (Coût Réel)', value: formatCurrency(evmData.AC), color: '#F59E0B' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-xs text-gray-600">{item.label}</span>
                        <span className="text-sm font-bold" style={{ color: item.color }}>{item.value} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border">
                  <h4 className="text-sm font-bold mb-3" style={{ color: primaryColor }}>Écarts & Prévisions</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'SV (Écart Planning)', value: formatCurrency(SV), positive: SV >= 0 },
                      { label: 'CV (Écart Coût)', value: formatCurrency(CV), positive: CV >= 0 },
                      { label: 'ETC (Reste à dépenser)', value: formatCurrency(ETC), color: '#6B7280' },
                      { label: 'VAC (Écart final prévu)', value: formatCurrency(VAC), positive: VAC >= 0 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-xs text-gray-600">{item.label}</span>
                        <span className="text-sm font-bold" style={{ color: item.color || (item.positive ? '#22C55E' : '#EF4444') }}>
                          {item.positive !== undefined && (item.positive ? '+' : '')}{item.value} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interprétation */}
              <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: SPI >= 1 && CPI >= 1 ? '#DCFCE7' : SPI >= 0.9 && CPI >= 0.9 ? '#FEF9C3' : '#FEE2E2' }}>
                <div className="text-sm font-bold mb-1" style={{ color: SPI >= 1 && CPI >= 1 ? '#166534' : SPI >= 0.9 && CPI >= 0.9 ? '#854D0E' : '#991B1B' }}>
                  {SPI >= 1 && CPI >= 1 ? 'Projet sous controle' : SPI >= 0.9 && CPI >= 0.9 ? 'Vigilance requise' : 'Actions correctives necessaires'}
                </div>
                <p className="text-xs" style={{ color: SPI >= 1 && CPI >= 1 ? '#166534' : SPI >= 0.9 && CPI >= 0.9 ? '#854D0E' : '#991B1B' }}>
                  {SPI < 1 ? `Retard planning de ${((1 - SPI) * 100).toFixed(0)}%. ` : ''}
                  {CPI < 1 ? `Dépassement coût de ${((1 - CPI) * 100).toFixed(0)}%. ` : ''}
                  {SPI >= 1 && CPI >= 1 ? 'Performance conforme aux objectifs.' : `Prévision finale: ${formatCurrency(EAC)} FCFA`}
                </p>
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '21': {
        // Matrice des Risques - Heat map
        const riskMatrix = Array(4).fill(null).map(() => Array(4).fill([]));
        risques.forEach(r => {
          const p = Math.min(4, Math.max(1, r.probabilite || 2)) - 1;
          const i = Math.min(4, Math.max(1, r.impact || 2)) - 1;
          if (!riskMatrix[3 - i][p]) riskMatrix[3 - i][p] = [];
          riskMatrix[3 - i][p].push(r);
        });

        const getCellColor = (row: number, col: number) => {
          const score = (4 - row) * (col + 1);
          if (score >= 12) return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' };
          if (score >= 8) return { bg: '#FFEDD5', border: '#F97316', text: '#9A3412' };
          if (score >= 4) return { bg: '#FEF9C3', border: '#EAB308', text: '#854D0E' };
          return { bg: '#DCFCE7', border: '#22C55E', text: '#166534' };
        };

        const impactLabels = ['Critique', 'Fort', 'Modéré', 'Faible'];
        const probaLabels = ['Rare', 'Possible', 'Probable', 'Quasi-certain'];

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: headerTextColor }}>
                  <Shield className="h-5 w-5" />
                  Matrice des Risques
                </h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="flex gap-4">
                {/* Matrice */}
                <div className="flex-1">
                  <div className="flex">
                    {/* Label axe Y */}
                    <div className="w-16 flex flex-col justify-center">
                      <div className="transform -rotate-90 text-xs font-bold text-gray-500 whitespace-nowrap">IMPACT</div>
                    </div>

                    {/* Grille */}
                    <div className="flex-1">
                      {/* Labels Y */}
                      <div className="grid grid-cols-5 gap-1">
                        <div />
                        {probaLabels.map((label, idx) => (
                          <div key={idx} className="text-center text-[9px] text-gray-500 pb-1">{label}</div>
                        ))}
                      </div>

                      {/* Cellules */}
                      {riskMatrix.map((row, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-5 gap-1 mb-1">
                          <div className="text-right text-[9px] text-gray-500 pr-1 flex items-center justify-end">
                            {impactLabels[rowIdx]}
                          </div>
                          {row.map((cell, colIdx) => {
                            const colors = getCellColor(rowIdx, colIdx);
                            const cellRisks = cell as typeof risques;
                            return (
                              <div
                                key={colIdx}
                                className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold border-2"
                                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                              >
                                {cellRisks.length > 0 ? cellRisks.length : ''}
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Label axe X */}
                      <div className="text-center text-xs font-bold text-gray-500 mt-2">PROBABILITÉ</div>
                    </div>
                  </div>
                </div>

                {/* Liste des risques critiques */}
                <div className="w-48">
                  <h4 className="text-xs font-bold mb-2" style={{ color: primaryColor }}>Top Risques Critiques</h4>
                  <div className="space-y-1">
                    {topRisques.slice(0, 5).map((r, idx) => {
                      const score = r.score || 0;
                      const color = score >= 12 ? '#EF4444' : score >= 8 ? '#F97316' : '#F59E0B';
                      return (
                        <div key={idx} className="p-2 rounded bg-gray-50 border-l-3" style={{ borderLeftColor: color }}>
                          <div className="text-[10px] font-medium text-gray-800 line-clamp-2">{r.titre}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
                              P{r.probabilite} × I{r.impact} = {score}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Légende */}
              <div className="flex justify-center gap-4 mt-3 pt-3 border-t">
                {[
                  { label: 'Critique (≥12)', color: '#EF4444' },
                  { label: 'Élevé (8-11)', color: '#F97316' },
                  { label: 'Modéré (4-7)', color: '#EAB308' },
                  { label: 'Faible (1-3)', color: '#22C55E' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '22': {
        // Actions Critiques & Chemin Critique
        const criticalActions = actions
          .filter(a => a.chemin_critique || a.priorite === 'critique' || a.sante === 'rouge')
          .sort((a, b) => {
            const priorityOrder = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
            return (priorityOrder[a.priorite as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priorite as keyof typeof priorityOrder] || 3);
          })
          .slice(0, 8);

        const getHealthColor = (sante: string) => {
          const colors: Record<string, string> = {
            vert: '#22C55E',
            jaune: '#EAB308',
            orange: '#F97316',
            rouge: '#EF4444',
            gris: '#6B7280',
            bleu: '#3B82F6',
          };
          return colors[sante] || '#6B7280';
        };

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: headerTextColor }}>
                  <Zap className="h-5 w-5" />
                  Actions Critiques & Chemin Critique
                </h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              {/* Stats rapides */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Sur chemin critique', value: actions.filter(a => a.chemin_critique).length, color: '#EF4444' },
                  { label: 'Priorité critique', value: actions.filter(a => a.priorite === 'critique').length, color: '#F97316' },
                  { label: 'Santé rouge', value: actions.filter(a => a.sante === 'rouge').length, color: '#EF4444' },
                  { label: 'Bloquées', value: actions.filter(a => a.statut === 'bloque').length, color: '#991B1B' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-[9px] text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Liste des actions critiques */}
              <div className="space-y-2">
                {criticalActions.map((action, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border" style={{ borderLeftWidth: 3, borderLeftColor: getHealthColor(action.sante || 'gris') }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: getHealthColor(action.sante || 'gris') }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-800 truncate">{action.titre}</span>
                        {action.chemin_critique && (
                          <span className="text-[8px] px-1 py-0.5 bg-red-100 text-red-700 rounded font-medium">CRITIQUE</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-gray-500">{action.responsable}</span>
                        <span className="text-[9px] text-gray-400">•</span>
                        <span className="text-[9px] text-gray-500">{action.date_fin_prevue ? new Date(action.date_fin_prevue).toLocaleDateString('fr-FR') : '-'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: primaryColor }}>{action.avancement}%</div>
                      <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${action.avancement}%`, backgroundColor: getHealthColor(action.sante || 'gris') }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '23': {
        // Roadmap & Timeline Visuelle (Gantt simplifié)
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const currentMonth = new Date().getMonth();
        const displayMonths = months.slice(currentMonth, currentMonth + 6).concat(months.slice(0, Math.max(0, currentMonth + 6 - 12)));

        const milestones = upcomingJalons.slice(0, 6).map(j => ({
          title: j.titre,
          date: new Date(j.date_prevue),
          status: j.statut,
        }));

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: headerTextColor }}>
                  <Calendar className="h-5 w-5" />
                  Roadmap & Timeline
                </h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              {/* Timeline header */}
              <div className="flex border-b pb-2 mb-4">
                <div className="w-32" />
                {displayMonths.map((month, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <span className={`text-xs font-medium ${idx === 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                      {month}
                    </span>
                  </div>
                ))}
              </div>

              {/* Axes avec barres */}
              {(['rh', 'commercialisation', 'technique', 'budget', 'marketing', 'exploitation'] as AxeType[]).map((axe) => {
                const config = axesConfig[axe];
                const data = axeDetailData[axe];
                return (
                  <div key={axe} className="flex items-center mb-3">
                    <div className="w-32 flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: config.color }}>
                        <config.icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-medium" style={{ color: primaryColor }}>{config.shortLabel}</span>
                    </div>
                    <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{ width: `${data.avancement}%`, backgroundColor: config.color }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-700">
                        {data.avancement}%
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Jalons sur la timeline */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-xs font-bold mb-3" style={{ color: primaryColor }}>Jalons Majeurs</h4>
                <div className="relative">
                  <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200" />
                  <div className="flex justify-between relative">
                    {milestones.slice(0, 5).map((m, idx) => {
                      const color = m.status === 'atteint' ? '#22C55E' : m.status === 'en_danger' ? '#EF4444' : primaryColor;
                      return (
                        <div key={idx} className="flex flex-col items-center" style={{ width: '18%' }}>
                          <div className="w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center z-10" style={{ borderColor: color }}>
                            {m.status === 'atteint' ? (
                              <CheckCircle className="h-4 w-4" style={{ color }} />
                            ) : (
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            )}
                          </div>
                          <div className="text-center mt-2">
                            <div className="text-[9px] text-gray-500">{m.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
                            <div className="text-[10px] font-medium text-gray-700 line-clamp-2">{m.title}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '24': {
        // Performance Équipe & Ressources
        const teams = [
          { name: 'Direction Projet', members: 3, load: 95, productivity: 88 },
          { name: 'Commercial', members: 5, load: 78, productivity: 92 },
          { name: 'Technique', members: 8, load: 85, productivity: 76 },
          { name: 'Exploitation', members: 4, load: 45, productivity: 82 },
          { name: 'Support', members: 2, load: 60, productivity: 95 },
        ];

        const getLoadColor = (load: number) => {
          if (load > 90) return '#EF4444';
          if (load > 75) return '#F59E0B';
          return '#22C55E';
        };

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: headerTextColor }}>
                  <Users className="h-5 w-5" />
                  Performance Équipe & Ressources
                </h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              {/* Vue globale */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Effectif Total', value: teams.reduce((s, t) => s + t.members, 0), unit: '', color: primaryColor },
                  { label: 'Charge Moyenne', value: Math.round(teams.reduce((s, t) => s + t.load, 0) / teams.length), unit: '%', color: '#F59E0B' },
                  { label: 'Productivité', value: Math.round(teams.reduce((s, t) => s + t.productivity, 0) / teams.length), unit: '%', color: '#22C55E' },
                  { label: 'À recruter', value: 8, unit: '', color: '#3B82F6' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3 text-center border">
                    <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}{stat.unit}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Détail par équipe */}
              <div className="space-y-2">
                {teams.map((team, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                    <div className="w-32">
                      <div className="text-xs font-medium" style={{ color: primaryColor }}>{team.name}</div>
                      <div className="text-[10px] text-gray-500">{team.members} membres</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-gray-500 w-16">Charge</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${team.load}%`, backgroundColor: getLoadColor(team.load) }} />
                        </div>
                        <span className="text-xs font-medium w-10 text-right" style={{ color: getLoadColor(team.load) }}>{team.load}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 w-16">Productivité</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${team.productivity}%`, backgroundColor: '#22C55E' }} />
                        </div>
                        <span className="text-xs font-medium w-10 text-right text-green-600">{team.productivity}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '25': {
        // Analyse Comparative Périodes
        const periodsData = {
          current: { label: 'Cette semaine', actions: 12, jalons: 2, risques: 1, budget: 85000000 },
          previous: { label: 'Semaine -1', actions: 8, jalons: 1, risques: 2, budget: 72000000 },
          monthAgo: { label: 'Mois -1', actions: 35, jalons: 4, risques: 3, budget: 320000000 },
        };

        const calculateTrend = (current: number, previous: number) => {
          if (previous === 0) return { value: 100, direction: 'up' };
          const change = ((current - previous) / previous) * 100;
          return { value: Math.abs(change), direction: change >= 0 ? 'up' : 'down' };
        };

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: headerTextColor }}>
                  <BarChart2 className="h-5 w-5" />
                  Analyse Comparative
                </h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              {/* Comparaison semaine */}
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-3" style={{ color: primaryColor }}>Évolution Hebdomadaire</h4>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Actions terminées', current: periodsData.current.actions, previous: periodsData.previous.actions, good: 'up' },
                    { label: 'Jalons atteints', current: periodsData.current.jalons, previous: periodsData.previous.jalons, good: 'up' },
                    { label: 'Nouveaux risques', current: periodsData.current.risques, previous: periodsData.previous.risques, good: 'down' },
                    { label: 'Budget engagé', current: periodsData.current.budget / 1000000, previous: periodsData.previous.budget / 1000000, unit: 'M', good: 'neutral' },
                  ].map((item, idx) => {
                    const trend = calculateTrend(item.current, item.previous);
                    const isGood = item.good === 'neutral' || (item.good === 'up' && trend.direction === 'up') || (item.good === 'down' && trend.direction === 'down');
                    return (
                      <div key={idx} className="bg-white rounded-xl p-3 border text-center">
                        <div className="text-lg font-bold" style={{ color: primaryColor }}>
                          {item.current}{item.unit || ''}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                        <div className={`text-[10px] font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                          {trend.direction === 'up' ? '↑' : '↓'} {trend.value.toFixed(0)}% vs S-1
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Graphique tendance simulé */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <h4 className="text-sm font-bold mb-3" style={{ color: primaryColor }}>Tendance sur 4 semaines</h4>
                <div className="flex items-end gap-2 h-24">
                  {[45, 52, 48, 58, 62, 55, 68, 72].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t"
                        style={{ height: `${val}%`, backgroundColor: idx >= 6 ? accentColor : `${primaryColor}60` }}
                      />
                      <span className="text-[8px] text-gray-400 mt-1">S{idx - 7 || ''}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 mt-3 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: `${primaryColor}60` }} />
                    <span className="text-[9px] text-gray-500">Semaines précédentes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: accentColor }} />
                    <span className="text-[9px] text-gray-500">Cette semaine</span>
                  </div>
                </div>
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      case '26': {
        // Recommandations Stratégiques
        const recommendations = [
          { priority: 'critical', category: 'Commercial', title: 'Accélérer la signature des 5 baux en négociation', impact: '+15% occupation', effort: 'Moyen' },
          { priority: 'high', category: 'Technique', title: 'Résoudre le blocage CVC avec le fournisseur', impact: 'Déblocage J+15', effort: 'Élevé' },
          { priority: 'high', category: 'RH', title: 'Finaliser recrutement Security Manager', impact: 'Poste clé', effort: 'Faible' },
          { priority: 'medium', category: 'Budget', title: 'Valider budget communication inauguration', impact: '150M FCFA', effort: 'Faible' },
          { priority: 'medium', category: 'Juridique', title: 'Finaliser modèle de bail V3', impact: 'Accélération signatures', effort: 'Moyen' },
        ];

        const quickWins = [
          { action: 'Planifier réunion arbitrage DG cette semaine', owner: 'Direction', deadline: 'J+3' },
          { action: 'Relancer prospects chauds commercialisation', owner: 'Commercial', deadline: 'J+5' },
          { action: 'Confirmer date inauguration avec mairie', owner: 'Communication', deadline: 'J+7' },
        ];

        const getPriorityColor = (priority: string) => {
          const colors: Record<string, string> = {
            critical: '#EF4444',
            high: '#F97316',
            medium: '#EAB308',
            low: '#22C55E',
          };
          return colors[priority] || '#6B7280';
        };

        return (
          <div style={baseStyles} className="h-full flex flex-col">
            {headerStyle !== 'none' && (
              <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: headerTextColor }}>
                  <Zap className="h-5 w-5" />
                  Recommandations Stratégiques
                </h2>
              </div>
            )}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                {/* Recommandations prioritaires */}
                <div>
                  <h4 className="text-sm font-bold mb-3" style={{ color: primaryColor }}>Arbitrages Prioritaires</h4>
                  <div className="space-y-2">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border" style={{ borderLeftWidth: 3, borderLeftColor: getPriorityColor(rec.priority) }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium text-white" style={{ backgroundColor: getPriorityColor(rec.priority) }}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="text-[9px] text-gray-500">{rec.category}</span>
                        </div>
                        <div className="text-xs font-medium text-gray-800">{rec.title}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] text-green-600">Impact: {rec.impact}</span>
                          <span className="text-[9px] text-gray-400">Effort: {rec.effort}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Wins */}
                <div>
                  <h4 className="text-sm font-bold mb-3" style={{ color: primaryColor }}>Quick Wins Cette Semaine</h4>
                  <div className="space-y-2">
                    {quickWins.map((qw, idx) => (
                      <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-start gap-2">
                          <Zap className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-gray-800">{qw.action}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-gray-500">{qw.owner}</span>
                              <span className="text-[9px] font-medium text-primary-600">{qw.deadline}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message clé */}
                  <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: `${accentColor}20` }}>
                    <div className="text-xs font-bold mb-1" style={{ color: primaryColor }}>Message Clé</div>
                    <p className="text-xs text-gray-700">
                      Focus sur les 3 arbitrages critiques cette semaine permettrait de débloquer
                      la commercialisation et le planning technique. ROI estimé: +20% d'avancement global.
                    </p>
                  </div>
                </div>
              </div>

              {slideItem.comment && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800">{slideItem.comment}</p>
                </div>
              )}
            </div>
            {renderSlideFooter(slideNumber, totalSlides)}
          </div>
        );
      }

      default:
        return (
          <div style={baseStyles} className="h-full flex items-center justify-center text-gray-400">
            <p>Aperçu non disponible</p>
          </div>
        );
    }
  };

  const renderSlideFooter = (slideNumber: number, totalSlides: number) => {
    const { showSlideNumbers, showDate, primaryColor } = designSettings;
    if (!showSlideNumbers && !showDate) return null;

    return (
      <div className="px-6 py-2 border-t flex items-center justify-between text-xs text-gray-400">
        {showDate ? (
          <span>Deep Dive Cosmos Angré - {new Date(presentationDate).toLocaleDateString('fr-FR')}</span>
        ) : <span />}
        {showSlideNumbers && (
          <span style={{ color: primaryColor }}>{slideNumber} / {totalSlides}</span>
        )}
      </div>
    );
  };

  // Generate PowerPoint
  const generatePowerPoint = async () => {
    setGenerating(true);

    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();

      pptx.author = 'Cockpit Cosmos Angré';
      pptx.title = `Deep Dive Cosmos Angré - ${reportPeriod?.displayText || new Date(presentationDate).toLocaleDateString('fr-FR')}`;
      pptx.subject = 'Présentation Direction Générale';
      pptx.company = 'Cosmos Angré';

      const periodText = reportPeriod?.displayText || new Date(presentationDate).toLocaleDateString('fr-FR');

      const { primaryColor, accentColor, fontFamily, showSlideNumbers, showDate, headerStyle } = designSettings;
      const primaryHex = primaryColor.replace('#', '');
      const accentHex = accentColor.replace('#', '');

      const weatherColors: Record<ProjectWeather, string> = {
        green: '10B981',
        yellow: 'F59E0B',
        orange: 'F97316',
        red: 'EF4444',
      };

      const addSlideHeader = (slide: PptxGenJS.Slide, title: string, axeColor?: string) => {
        if (headerStyle === 'none') return;

        const bgColor = headerStyle === 'full' ? primaryHex : 'F8F9FA';
        const textColor = headerStyle === 'full' ? 'FFFFFF' : primaryHex;

        slide.addShape('rect', {
          x: 0,
          y: 0,
          w: '100%',
          h: 0.8,
          fill: { color: bgColor },
        });

        if (axeColor) {
          slide.addShape('rect', {
            x: 0.3,
            y: 0.2,
            w: 0.4,
            h: 0.4,
            fill: { color: axeColor.replace('#', '') },
          });
        }

        slide.addText(title, {
          x: axeColor ? 0.9 : 0.5,
          y: 0.2,
          w: 7,
          h: 0.5,
          fontSize: 24,
          fontFace: fontFamily,
          color: textColor,
          bold: true,
        });
        slide.addText('COSMOS ANGRÉ', {
          x: 7.5,
          y: 0.2,
          w: 2,
          h: 0.5,
          fontSize: 12,
          fontFace: fontFamily,
          color: accentHex,
          align: 'right',
        });
      };

      const addSlideFooter = (slide: PptxGenJS.Slide, pageNum: number, total: number) => {
        if (showDate) {
          slide.addText(
            `Deep Dive Cosmos Angré - ${periodText}`,
            {
              x: 0.5,
              y: 5.2,
              w: 4,
              h: 0.3,
              fontSize: 8,
              fontFace: fontFamily,
              color: '666666',
            }
          );
        }
        if (showSlideNumbers) {
          slide.addText(`${pageNum} / ${total}`, {
            x: 8.5,
            y: 5.2,
            w: 1,
            h: 0.3,
            fontSize: 8,
            fontFace: fontFamily,
            color: primaryHex,
            align: 'right',
          });
        }
      };

      const addComment = (slide: PptxGenJS.Slide, comment: string, y: number) => {
        if (comment) {
          slide.addShape('rect', {
            x: 0.5,
            y,
            w: 9,
            h: 0.5,
            fill: { color: 'EFF6FF' },
            line: { color: '3B82F6', width: 1 },
          });
          slide.addText(comment, {
            x: 0.6,
            y: y + 0.1,
            w: 8.8,
            h: 0.3,
            fontSize: 9,
            fontFace: fontFamily,
            color: '1E40AF',
            italic: true,
          });
        }
      };

      // Generate axe detail slide
      const generateAxeDetailSlide = (slide: PptxGenJS.Slide, axe: AxeType, slideItem: SlideItem, pageNum: number, totalPages: number) => {
        const config = axesConfig[axe];
        const data = axeDetailData[axe];
        const axeDecisions = decisionPointsByAxe[axe];
        const axeColorHex = config.color.replace('#', '');

        addSlideHeader(slide, `Détail Axe ${config.label}`, config.color);

        // Progress badge
        slide.addShape('rect', {
          x: 8.5,
          y: 0.15,
          w: 0.8,
          h: 0.5,
          fill: { color: axeColorHex },
        });
        slide.addText(`${data.avancement}%`, {
          x: 8.5,
          y: 0.25,
          w: 0.8,
          h: 0.3,
          fontSize: 12,
          fontFace: fontFamily,
          color: 'FFFFFF',
          bold: true,
          align: 'center',
        });

        // Actions box
        slide.addShape('rect', { x: 0.5, y: 1.0, w: 4.3, h: 1.8, fill: { color: 'F9FAFB' }, line: { color: 'E5E7EB', width: 1 } });
        slide.addText('Actions', { x: 0.6, y: 1.1, w: 2, h: 0.3, fontSize: 12, fontFace: fontFamily, color: primaryHex, bold: true });
        slide.addText(`${data.actions}`, { x: 0.6, y: 1.4, w: 1.5, h: 0.5, fontSize: 28, fontFace: fontFamily, color: axeColorHex, bold: true });
        slide.addText(`${data.actionsTerminees} terminées`, { x: 2.2, y: 1.5, w: 2, h: 0.25, fontSize: 9, fontFace: fontFamily, color: '10B981' });
        slide.addText(`${data.actionsEnCours} en cours`, { x: 2.2, y: 1.8, w: 2, h: 0.25, fontSize: 9, fontFace: fontFamily, color: '3B82F6' });
        slide.addText(`${data.actionsEnRetard} en retard`, { x: 2.2, y: 2.1, w: 2, h: 0.25, fontSize: 9, fontFace: fontFamily, color: 'EF4444' });

        // Jalons box
        slide.addShape('rect', { x: 5.2, y: 1.0, w: 4.3, h: 1.8, fill: { color: 'F9FAFB' }, line: { color: 'E5E7EB', width: 1 } });
        slide.addText('Jalons', { x: 5.3, y: 1.1, w: 2, h: 0.3, fontSize: 12, fontFace: fontFamily, color: primaryHex, bold: true });
        slide.addText(`${data.jalonsAtteints}/${data.jalons}`, { x: 5.3, y: 1.4, w: 2, h: 0.5, fontSize: 28, fontFace: fontFamily, color: axeColorHex, bold: true });
        slide.addShape('rect', { x: 5.3, y: 2.1, w: 3.8, h: 0.2, fill: { color: 'E5E7EB' } });
        const jalonProgress = data.jalons > 0 ? (data.jalonsAtteints / data.jalons) * 3.8 : 0;
        slide.addShape('rect', { x: 5.3, y: 2.1, w: jalonProgress, h: 0.2, fill: { color: axeColorHex } });
        slide.addText('jalons atteints', { x: 5.3, y: 2.4, w: 2, h: 0.2, fontSize: 8, fontFace: fontFamily, color: '666666' });

        // Risques box
        slide.addShape('rect', { x: 0.5, y: 3.0, w: 4.3, h: 1.2, fill: { color: 'F9FAFB' }, line: { color: 'E5E7EB', width: 1 } });
        slide.addText('Risques', { x: 0.6, y: 3.1, w: 2, h: 0.3, fontSize: 12, fontFace: fontFamily, color: primaryHex, bold: true });
        slide.addText(`${data.risques}`, { x: 0.6, y: 3.4, w: 1, h: 0.5, fontSize: 28, fontFace: fontFamily, color: axeColorHex, bold: true });
        if (data.risquesCritiques > 0) {
          slide.addText(`dont ${data.risquesCritiques} critique(s)`, { x: 1.6, y: 3.5, w: 2.5, h: 0.3, fontSize: 10, fontFace: fontFamily, color: 'EF4444' });
        }

        // Budget box
        slide.addShape('rect', { x: 5.2, y: 3.0, w: 4.3, h: 1.2, fill: { color: 'F9FAFB' }, line: { color: 'E5E7EB', width: 1 } });
        slide.addText('Budget', { x: 5.3, y: 3.1, w: 2, h: 0.3, fontSize: 12, fontFace: fontFamily, color: primaryHex, bold: true });
        slide.addText(`Prévu: ${data.budgetPrevu.toLocaleString('fr-FR')} FCFA`, { x: 5.3, y: 3.45, w: 4, h: 0.2, fontSize: 9, fontFace: fontFamily, color: '666666' });
        slide.addText(`Réalisé: ${data.budgetRealise.toLocaleString('fr-FR')} FCFA`, { x: 5.3, y: 3.7, w: 4, h: 0.2, fontSize: 9, fontFace: fontFamily, color: axeColorHex, bold: true });

        // DG Decisions for this axe
        if (axeDecisions.length > 0) {
          slide.addText(`🚨 Points DG en attente (${axeDecisions.length})`, { x: 0.5, y: 4.4, w: 4, h: 0.3, fontSize: 10, fontFace: fontFamily, color: 'F97316', bold: true });
          axeDecisions.slice(0, 2).forEach((point, i) => {
            const urgColor = urgencyConfig[point.urgency].color.replace('#', '');
            slide.addShape('rect', { x: 0.5, y: 4.75 + i * 0.4, w: 9, h: 0.35, fill: { color: urgColor + '15' }, line: { color: urgColor, width: 1 } });
            slide.addText(`${urgencyConfig[point.urgency].emoji} ${point.subject}`, { x: 0.6, y: 4.8 + i * 0.4, w: 8.8, h: 0.25, fontSize: 9, fontFace: fontFamily, color: primaryHex });
          });
        }

        addComment(slide, slideItem.comment, axeDecisions.length > 0 ? 5.6 : 4.4);
        addSlideFooter(slide, pageNum, totalPages);
      };

      let pageNum = 0;
      const totalPages = activeSlides.length;

      // Map slide IDs to axe types - 6 axes alignés
      const axeSlideMap: Record<string, AxeType> = {
        '5': 'rh',
        '6': 'commercialisation',
        '7': 'technique',
        '8': 'budget',
        '9': 'marketing',
        '9b': 'exploitation',
      };

      for (const slideItem of activeSlides) {
        pageNum++;
        const slide = pptx.addSlide();

        // Check if this is an axe detail slide
        if (axeSlideMap[slideItem.id]) {
          generateAxeDetailSlide(slide, axeSlideMap[slideItem.id], slideItem, pageNum, totalPages);
          continue;
        }

        // Check if this is a new axe section slide (axe_*_intro, axe_*_actions, etc.)
        const pptAxeMatch = slideItem.id.match(/^axe_(\w+)_(\w+)$/);
        if (pptAxeMatch) {
          const axeKey = pptAxeMatch[1] as AxeType;
          const sectionType = pptAxeMatch[2];
          const axeConf = axesConfig[axeKey];

          if (sectionType === 'intro') {
            // Intercalaire - Full slide with primary color background
            slide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: primaryHex } });

            // Accent rectangle for icon
            slide.addShape('rect', { x: 4.25, y: 1.5, w: 1.5, h: 1.5, fill: { color: accentHex } });

            // Axe title
            slide.addText(axeConf.label, { x: 0, y: 3.2, w: '100%', h: 0.6, fontSize: 32, fontFace: fontFamily, color: 'FFFFFF', bold: true, align: 'center' });

            // Short label
            slide.addText(axeConf.shortLabel, { x: 0, y: 3.8, w: '100%', h: 0.4, fontSize: 14, fontFace: fontFamily, color: 'CCCCCC', align: 'center' });

            // Accent line
            slide.addShape('rect', { x: 4, y: 4.3, w: 2, h: 0.08, fill: { color: accentHex } });

            // Content box
            slide.addShape('rect', { x: 2.5, y: 4.6, w: 5, h: 1.5, line: { color: accentHex, width: 1 } });
            slide.addText('Contenu de cette section', { x: 2.7, y: 4.7, w: 4.6, h: 0.3, fontSize: 11, fontFace: fontFamily, color: accentHex, bold: true });

            const sections = ['Actions', 'Jalons', 'Budget', 'Risques', 'Points DG'];
            sections.forEach((sec, i) => {
              slide.addShape('circle', { x: 2.8, y: 5.1 + i * 0.25, w: 0.1, h: 0.1, fill: { color: accentHex } });
              slide.addText(sec, { x: 3.0, y: 5.05 + i * 0.25, w: 2, h: 0.2, fontSize: 10, fontFace: fontFamily, color: 'FFFFFF' });
            });

            addSlideFooter(slide, pageNum, totalPages);
          } else {
            // Other axe sections (actions, jalons, budget, risques, dg) - simple header slide
            addSlideHeader(slide, `${axeConf.label} - ${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}`);
            slide.addText('Contenu détaillé disponible dans la présentation web', { x: 0, y: 2.5, w: '100%', h: 0.5, fontSize: 14, fontFace: fontFamily, color: '666666', align: 'center' });
            addSlideFooter(slide, pageNum, totalPages);
          }
          continue;
        }

        switch (slideItem.id) {
          case '1': {
            slide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: primaryHex } });
            slide.addShape('rect', { x: 0, y: 2.5, w: '100%', h: 0.1, fill: { color: accentHex } });
            slide.addText('COSMOS ANGRÉ', { x: 0, y: 1.3, w: '100%', h: 0.8, fontSize: 48, fontFace: fontFamily, color: 'FFFFFF', bold: true, align: 'center' });
            slide.addText('Deep Dive', { x: 0, y: 2.6, w: '100%', h: 0.6, fontSize: 32, fontFace: fontFamily, color: accentHex, align: 'center' });
            // Période du rapport
            slide.addText(periodText, { x: 0, y: 3.3, w: '100%', h: 0.5, fontSize: 24, fontFace: fontFamily, color: 'FFFFFF', bold: true, align: 'center' });
            slide.addText('Présentation Direction Générale', { x: 0, y: 3.9, w: '100%', h: 0.4, fontSize: 16, fontFace: fontFamily, color: 'CCCCCC', align: 'center' });
            slide.addText(new Date(presentationDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), { x: 0, y: 4.4, w: '100%', h: 0.3, fontSize: 12, fontFace: fontFamily, color: '999999', align: 'center' });
            break;
          }

          case '2': {
            addSlideHeader(slide, 'Agenda');
            const pptAgendaItems = activeSlides
              .filter((s) =>
                s.id !== '1' &&
                s.id !== '2' &&
                s.id !== '17' &&
                !s.id.includes('_suite') &&
                !s.id.includes('_actions') &&
                !s.id.includes('_jalons') &&
                !s.id.includes('_budget') &&
                !s.id.includes('_risques') &&
                !s.id.includes('_dg')
              )
              .map((s, i) => ({ num: i + 1, title: s.title, isIntro: s.id.includes('_intro') }));

            const pptMidPoint = Math.ceil(pptAgendaItems.length / 2);
            const pptLeftColumn = pptAgendaItems.slice(0, pptMidPoint);
            const pptRightColumn = pptAgendaItems.slice(pptMidPoint);

            // Left column - aligned with consistent spacing
            pptLeftColumn.forEach((item, i) => {
              const yPos = 1.0 + i * 0.28;
              slide.addShape('rect', { x: 0.5, y: yPos, w: 0.22, h: 0.22, fill: { color: primaryHex } });
              slide.addText(String(item.num), { x: 0.5, y: yPos, w: 0.22, h: 0.22, fontSize: 9, fontFace: fontFamily, color: 'FFFFFF', align: 'center', valign: 'middle', bold: true });
              slide.addText(item.title, { x: 0.8, y: yPos, w: 4.2, h: 0.22, fontSize: 10, fontFace: fontFamily, color: item.isIntro ? accentHex : primaryHex, bold: item.isIntro, valign: 'middle' });
            });

            // Right column - aligned with consistent spacing
            pptRightColumn.forEach((item, i) => {
              const yPos = 1.0 + i * 0.28;
              slide.addShape('rect', { x: 5.2, y: yPos, w: 0.22, h: 0.22, fill: { color: primaryHex } });
              slide.addText(String(item.num), { x: 5.2, y: yPos, w: 0.22, h: 0.22, fontSize: 9, fontFace: fontFamily, color: 'FFFFFF', align: 'center', valign: 'middle', bold: true });
              slide.addText(item.title, { x: 5.5, y: yPos, w: 4.2, h: 0.22, fontSize: 10, fontFace: fontFamily, color: item.isIntro ? accentHex : primaryHex, bold: item.isIntro, valign: 'middle' });
            });

            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '3': {
            addSlideHeader(slide, 'Synthèse Exécutive & Météo Projet');
            slide.addShape('rect', { x: 0.5, y: 1.2, w: 3, h: 1.5, fill: { color: weatherColors[projectWeather] + '20' }, line: { color: weatherColors[projectWeather], width: 2 } });
            slide.addText(weatherConfig[projectWeather].emoji, { x: 0.5, y: 1.3, w: 3, h: 0.8, fontSize: 40, align: 'center' });
            slide.addText(weatherConfig[projectWeather].label.split(' ')[0], { x: 0.5, y: 2.1, w: 3, h: 0.4, fontSize: 16, fontFace: fontFamily, color: weatherColors[projectWeather], bold: true, align: 'center' });
            const kpiData = [
              { label: 'Occupation', value: `${kpiValues.occupation}%`, color: '10B981' },
              { label: 'Budget consommé', value: `${kpiValues.budgetConsumed}%`, color: 'F59E0B' },
              { label: 'Jalons atteints', value: `${kpiValues.milestonesAchieved}`, color: primaryHex },
              { label: 'Équipe', value: `${kpiValues.teamRecruited}`, color: accentHex },
            ];
            kpiData.forEach((kpi, i) => {
              const x = 4 + (i % 2) * 2.8;
              const y = 1.2 + Math.floor(i / 2) * 1.2;
              slide.addShape('rect', { x, y, w: 2.5, h: 1, fill: { color: 'F8F9FA' }, line: { color: 'E5E7EB', width: 1 } });
              slide.addText(kpi.value, { x, y: y + 0.1, w: 2.5, h: 0.5, fontSize: 24, fontFace: fontFamily, color: kpi.color, bold: true, align: 'center' });
              slide.addText(kpi.label, { x, y: y + 0.6, w: 2.5, h: 0.3, fontSize: 10, fontFace: fontFamily, color: '666666', align: 'center' });
            });
            addComment(slide, slideItem.comment, 4.0);
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case 'copil': {
            // Dashboard COPIL slide
            addSlideHeader(slide, 'Dashboard COPIL');

            // Météo global
            slide.addText('Météo Projet', { x: 0.5, y: 1.1, w: 2, h: 0.3, fontSize: 10, fontFace: fontFamily, color: '333333', bold: true });
            slide.addShape('rect', { x: 0.5, y: 1.4, w: 2, h: 0.6, fill: { color: weatherColors[projectWeather] + '30' }, line: { color: weatherColors[projectWeather], width: 1 } });
            slide.addText(`${weatherConfig[projectWeather].emoji} ${weatherConfig[projectWeather].label.split(' ')[0]}`, { x: 0.5, y: 1.45, w: 2, h: 0.5, fontSize: 12, fontFace: fontFamily, color: weatherColors[projectWeather], bold: true, align: 'center' });

            // Top 5 Risques
            slide.addText('Top 5 Risques', { x: 2.7, y: 1.1, w: 3, h: 0.3, fontSize: 10, fontFace: fontFamily, color: '333333', bold: true });
            const top5Risques = risques.filter(r => r.status !== 'closed').sort((a, b) => b.score - a.score).slice(0, 5);
            top5Risques.forEach((r, i) => {
              const scoreColor = r.score >= 12 ? 'DC2626' : r.score >= 8 ? 'F59E0B' : '3B82F6';
              slide.addText(`${r.score}`, { x: 2.7, y: 1.4 + i * 0.35, w: 0.4, h: 0.3, fontSize: 10, fontFace: fontFamily, color: scoreColor, bold: true, align: 'center' });
              slide.addText(r.titre.substring(0, 30), { x: 3.1, y: 1.4 + i * 0.35, w: 2.6, h: 0.3, fontSize: 8, fontFace: fontFamily, color: '333333' });
            });

            // Jalons J-30
            slide.addText('Jalons J-30', { x: 5.9, y: 1.1, w: 3.5, h: 0.3, fontSize: 10, fontFace: fontFamily, color: '333333', bold: true });
            const now = new Date();
            const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const jalonsJ30 = jalons.filter(j => {
              if (!j.date_prevue || j.statut === 'atteint') return false;
              const date = new Date(j.date_prevue);
              return date >= now && date <= in30Days;
            }).sort((a, b) => new Date(a.date_prevue!).getTime() - new Date(b.date_prevue!).getTime()).slice(0, 5);
            jalonsJ30.forEach((j, i) => {
              const days = Math.ceil((new Date(j.date_prevue!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const dayColor = days <= 7 ? 'DC2626' : days <= 14 ? 'F59E0B' : '3B82F6';
              slide.addText(`J-${days}`, { x: 5.9, y: 1.4 + i * 0.35, w: 0.5, h: 0.3, fontSize: 9, fontFace: fontFamily, color: dayColor, bold: true });
              slide.addText(j.titre.substring(0, 25), { x: 6.4, y: 1.4 + i * 0.35, w: 3, h: 0.3, fontSize: 8, fontFace: fontFamily, color: '333333' });
            });

            // Budget
            slide.addText('Budget', { x: 0.5, y: 3.2, w: 2, h: 0.3, fontSize: 10, fontFace: fontFamily, color: '333333', bold: true });
            const budgetRealized = Math.round(budget.tauxRealisation);
            const budgetColor = budgetRealized > 100 ? 'DC2626' : '10B981';
            slide.addText(`${budgetRealized}%`, { x: 0.5, y: 3.5, w: 1, h: 0.4, fontSize: 18, fontFace: fontFamily, color: budgetColor, bold: true });
            slide.addText('réalisé', { x: 1.5, y: 3.55, w: 1, h: 0.3, fontSize: 9, fontFace: fontFamily, color: '666666' });

            // Alertes
            slide.addText('Alertes', { x: 2.7, y: 3.2, w: 3, h: 0.3, fontSize: 10, fontFace: fontFamily, color: '333333', bold: true });
            const blockedCount = actions.filter(a => a.statut === 'bloque').length;
            const criticalRisksCount = risques.filter(r => r.score >= 12 && r.status !== 'closed').length;
            slide.addText(`${blockedCount} actions bloquées`, { x: 2.7, y: 3.5, w: 2.5, h: 0.25, fontSize: 9, fontFace: fontFamily, color: blockedCount > 0 ? 'DC2626' : '666666' });
            slide.addText(`${criticalRisksCount} risques critiques`, { x: 2.7, y: 3.75, w: 2.5, h: 0.25, fontSize: 9, fontFace: fontFamily, color: criticalRisksCount > 0 ? 'DC2626' : '666666' });

            // Décisions
            slide.addText('Décisions à prendre', { x: 5.9, y: 3.2, w: 3.5, h: 0.3, fontSize: 10, fontFace: fontFamily, color: '333333', bold: true });
            const decisionCount = decisionPoints.filter(d => d.urgency === 'critical' || d.urgency === 'high').length;
            slide.addText(`${decisionCount} décisions urgentes`, { x: 5.9, y: 3.5, w: 3, h: 0.3, fontSize: 10, fontFace: fontFamily, color: decisionCount > 0 ? 'F59E0B' : '10B981', bold: true });

            addComment(slide, slideItem.comment, 4.2);
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '4': {
            addSlideHeader(slide, 'Vue d\'Ensemble par Axe Stratégique');
            const axeTypes: AxeType[] = ['rh', 'commercialisation', 'technique', 'budget', 'marketing', 'exploitation'];
            axeTypes.forEach((axe, i) => {
              const config = axesConfig[axe];
              const data = axeDetailData[axe];
              const axeDecisions = decisionPointsByAxe[axe];
              const y = 1.1 + i * 0.75;
              const axeColorHex = config.color.replace('#', '');

              // Axe icon
              slide.addShape('rect', { x: 0.5, y, w: 0.5, h: 0.5, fill: { color: axeColorHex } });

              // Axe label
              slide.addText(config.label.split(' ')[0], { x: 1.1, y, w: 2.2, h: 0.5, fontSize: 11, fontFace: fontFamily, color: primaryHex, bold: true });

              // Progress bar background
              slide.addShape('rect', { x: 3.4, y: y + 0.15, w: 4.5, h: 0.3, fill: { color: 'E5E7EB' } });

              // Progress bar fill
              slide.addShape('rect', { x: 3.4, y: y + 0.15, w: (4.5 * data.avancement) / 100, h: 0.3, fill: { color: axeColorHex } });

              // Percentage
              slide.addText(`${data.avancement}%`, { x: 8.0, y, w: 0.8, h: 0.5, fontSize: 12, fontFace: fontFamily, color: primaryHex, bold: true });

              // DG badge if any
              if (axeDecisions.length > 0) {
                slide.addShape('rect', { x: 8.9, y: y + 0.1, w: 0.6, h: 0.35, fill: { color: 'F97316' } });
                slide.addText(`${axeDecisions.length}`, { x: 8.9, y: y + 0.15, w: 0.6, h: 0.25, fontSize: 10, fontFace: fontFamily, color: 'FFFFFF', align: 'center' });
              }
            });
            addComment(slide, slideItem.comment, 4.9);
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '10': {
            // Synchronisation Projet vs Mobilisation (New Module)
            addSlideHeader(slide, 'Synchronisation Projet / Mobilisation');

            const pptSyncProjectProgress = syncData.syncStatus?.projectProgress ?? 0;
            const pptSyncMobProgress = syncData.syncStatus?.mobilizationProgress ?? 0;
            const pptSyncGap = syncData.syncStatus?.gap ?? 0;
            const pptSyncGapDays = syncData.syncStatus?.gapDays ?? 0;
            const pptSyncStatus = syncData.syncStatus?.status ?? 'SYNC';
            const pptSyncAlertLevel = syncData.syncStatus?.alertLevel ?? 'GREEN';

            const pptProjectCats = syncData.projectCategories || [];
            const pptMobCats = syncData.mobilizationCategories || [];
            const pptSyncAlerts = syncData.alerts?.filter(a => !a.isAcknowledged) || [];

            // Determine colors
            const pptProjectColor = '3B82F6';
            const pptMobColor = '10B981';
            let pptSyncRecoColor = '22C55E';
            let pptSyncReco = 'Synchronise - Maintenir le rythme actuel';
            if (pptSyncStatus === 'PROJECT_AHEAD' || pptSyncStatus === 'CRITICAL') {
              pptSyncRecoColor = 'F59E0B';
              pptSyncReco = 'Accelerer la mobilisation ou ralentir le projet';
            } else if (pptSyncStatus === 'MOBILIZATION_AHEAD') {
              pptSyncRecoColor = '3B82F6';
              pptSyncReco = 'Accelerer le projet de construction';
            }

            // Header avec pourcentages
            slide.addText('🔧 PROJET', { x: 0.5, y: 1.0, w: 2, h: 0.3, fontSize: 12, fontFace: fontFamily, color: pptProjectColor, bold: true });
            slide.addText(`${pptSyncProjectProgress.toFixed(0)}%`, { x: 0.5, y: 1.3, w: 2, h: 0.5, fontSize: 28, fontFace: fontFamily, color: pptProjectColor, bold: true });

            // Jauge centrale
            const pptSyncCenterColor = pptSyncAlertLevel === 'GREEN' ? '22C55E' : pptSyncAlertLevel === 'ORANGE' ? 'F59E0B' : 'EF4444';
            slide.addShape('rect', { x: 4.3, y: 1.4, w: 1.4, h: 0.4, fill: { color: pptSyncCenterColor + '20' }, line: { color: pptSyncCenterColor, width: 1 } });
            slide.addText(pptSyncStatus === 'SYNC' ? '✓ SYNC' : `${Math.abs(pptSyncGap).toFixed(0)}% (~${Math.abs(pptSyncGapDays)}j)`, { x: 4.3, y: 1.45, w: 1.4, h: 0.3, fontSize: 9, fontFace: fontFamily, color: pptSyncCenterColor, bold: true, align: 'center' });

            slide.addText('🏢 MOBILISATION', { x: 6.5, y: 1.0, w: 2.5, h: 0.3, fontSize: 12, fontFace: fontFamily, color: pptMobColor, bold: true });
            slide.addText(`${pptSyncMobProgress.toFixed(0)}%`, { x: 7.5, y: 1.3, w: 2, h: 0.5, fontSize: 28, fontFace: fontFamily, color: pptMobColor, bold: true, align: 'right' });

            // Recommandation
            slide.addShape('rect', { x: 0.5, y: 1.95, w: 9, h: 0.4, fill: { color: pptSyncRecoColor + '15' }, line: { color: pptSyncRecoColor, width: 1 } });
            slide.addText(pptSyncReco, { x: 0.6, y: 2.0, w: 8.8, h: 0.3, fontSize: 10, fontFace: fontFamily, color: pptSyncRecoColor, align: 'center' });

            // Categories Projet
            slide.addShape('rect', { x: 0.5, y: 2.5, w: 4.4, h: 2.2, fill: { color: pptProjectColor + '10' } });
            slide.addText('🔧 Projet Construction', { x: 0.6, y: 2.55, w: 4.2, h: 0.3, fontSize: 10, fontFace: fontFamily, color: pptProjectColor, bold: true });
            slide.addText(`${pptProjectCats.length} catégories`, { x: 0.6, y: 2.85, w: 4.2, h: 0.2, fontSize: 8, fontFace: fontFamily, color: '666666' });

            pptProjectCats.slice(0, 4).forEach((cat, i) => {
              slide.addText(cat.categoryName.substring(0, 25), { x: 0.7, y: 3.1 + i * 0.4, w: 2.5, h: 0.25, fontSize: 8, fontFace: fontFamily, color: '333333' });
              slide.addShape('rect', { x: 3.3, y: 3.15 + i * 0.4, w: 1, h: 0.15, fill: { color: 'E5E7EB' } });
              slide.addShape('rect', { x: 3.3, y: 3.15 + i * 0.4, w: cat.progress / 100, h: 0.15, fill: { color: pptProjectColor } });
              slide.addText(`${cat.progress.toFixed(0)}%`, { x: 4.4, y: 3.1 + i * 0.4, w: 0.5, h: 0.25, fontSize: 8, fontFace: fontFamily, color: pptProjectColor, align: 'right' });
            });

            // Categories Mobilisation
            slide.addShape('rect', { x: 5.1, y: 2.5, w: 4.4, h: 2.2, fill: { color: pptMobColor + '10' } });
            slide.addText('🏢 Mobilisation', { x: 5.2, y: 2.55, w: 4.2, h: 0.3, fontSize: 10, fontFace: fontFamily, color: pptMobColor, bold: true });
            slide.addText(`${pptMobCats.length} catégories`, { x: 5.2, y: 2.85, w: 4.2, h: 0.2, fontSize: 8, fontFace: fontFamily, color: '666666' });

            pptMobCats.slice(0, 4).forEach((cat, i) => {
              slide.addText(cat.categoryName.substring(0, 25), { x: 5.3, y: 3.1 + i * 0.4, w: 2.5, h: 0.25, fontSize: 8, fontFace: fontFamily, color: '333333' });
              slide.addShape('rect', { x: 7.9, y: 3.15 + i * 0.4, w: 1, h: 0.15, fill: { color: 'E5E7EB' } });
              slide.addShape('rect', { x: 7.9, y: 3.15 + i * 0.4, w: cat.progress / 100, h: 0.15, fill: { color: pptMobColor } });
              slide.addText(`${cat.progress.toFixed(0)}%`, { x: 9, y: 3.1 + i * 0.4, w: 0.5, h: 0.25, fontSize: 8, fontFace: fontFamily, color: pptMobColor, align: 'right' });
            });

            // Alertes si présentes
            if (pptSyncAlerts.length > 0) {
              slide.addText(`${pptSyncAlerts.length} alerte(s) active(s)`, { x: 0.5, y: 4.8, w: 9, h: 0.25, fontSize: 9, fontFace: fontFamily, color: 'F59E0B' });
            }

            addComment(slide, slideItem.comment, 5.1);
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '11': {
            addSlideHeader(slide, 'Budget & Ressources (EVM)');
            const budgetData = [
              { label: 'Budget Total', value: budget.prevu.toLocaleString('fr-FR') + ' FCFA' },
              { label: 'Engagé', value: budget.engage.toLocaleString('fr-FR') + ' FCFA' },
              { label: 'Réalisé', value: budget.realise.toLocaleString('fr-FR') + ' FCFA' },
              { label: 'Reste à dépenser', value: (budget.prevu - budget.realise).toLocaleString('fr-FR') + ' FCFA' },
            ];
            budgetData.forEach((item, i) => {
              slide.addText(item.label, { x: 0.5, y: 1.2 + i * 0.5, w: 3, h: 0.4, fontSize: 11, fontFace: fontFamily, color: '666666' });
              slide.addText(item.value, { x: 3.5, y: 1.2 + i * 0.5, w: 3, h: 0.4, fontSize: 11, fontFace: fontFamily, color: primaryHex, bold: true });
            });
            slide.addText('Indicateurs EVM', { x: 6.5, y: 1.1, w: 3, h: 0.4, fontSize: 12, fontFace: fontFamily, color: primaryHex, bold: true });
            [{ label: 'SPI', value: '0.95' }, { label: 'CPI', value: '1.02' }, { label: 'TCPI', value: '0.98' }].forEach((item, i) => {
              slide.addText(`${item.label}: ${item.value}`, { x: 6.5, y: 1.6 + i * 0.4, w: 3, h: 0.35, fontSize: 10, fontFace: fontFamily, color: '666666' });
            });
            addComment(slide, slideItem.comment, 4.0);
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '12': {
            addSlideHeader(slide, 'Risques & Points d\'Attention');
            slide.addText('Top 5 Risques', { x: 0.5, y: 1.1, w: 4, h: 0.4, fontSize: 12, fontFace: fontFamily, color: primaryHex, bold: true });
            topRisques.forEach((risque, i) => {
              const color = (risque.score || 0) >= 15 ? 'EF4444' : (risque.score || 0) >= 10 ? 'F59E0B' : '10B981';
              slide.addShape('circle', { x: 0.5, y: 1.55 + i * 0.6, w: 0.2, h: 0.2, fill: { color } });
              slide.addText(risque.titre.substring(0, 50), { x: 0.85, y: 1.5 + i * 0.6, w: 6, h: 0.3, fontSize: 10, fontFace: fontFamily, color: primaryHex });
              slide.addText(`Score: ${risque.score || '-'}`, { x: 7, y: 1.5 + i * 0.6, w: 1.5, h: 0.3, fontSize: 10, fontFace: fontFamily, color, bold: true });
            });
            addComment(slide, slideItem.comment, 4.6);
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '13': {
            addSlideHeader(slide, '🚨 Points en Attente de Décision DG');
            let yPos = 1.0;
            const pptAxesWithDecisions = (Object.keys(decisionPointsByAxe) as AxeType[])
              .filter((axe) => decisionPointsByAxe[axe].length > 0);

            pptAxesWithDecisions.forEach((axe) => {
              const config = axesConfig[axe];
              const points = decisionPointsByAxe[axe];
              const axeColorHex = config.color.replace('#', '');

              // Axe header
              slide.addShape('rect', { x: 0.5, y: yPos, w: 0.4, h: 0.35, fill: { color: axeColorHex } });
              slide.addText(`${config.label} (${points.length})`, { x: 1.0, y: yPos, w: 4, h: 0.35, fontSize: 11, fontFace: fontFamily, color: axeColorHex, bold: true });
              yPos += 0.4;

              // Points
              points.slice(0, 2).forEach((point) => {
                const urgColor = urgencyConfig[point.urgency].color.replace('#', '');
                slide.addShape('rect', { x: 1.0, y: yPos, w: 8.5, h: 0.55, fill: { color: urgColor + '10' }, line: { color: urgColor, width: 1 } });
                slide.addText(`${urgencyConfig[point.urgency].emoji} ${point.subject}`, { x: 1.1, y: yPos + 0.05, w: 5.5, h: 0.25, fontSize: 9, fontFace: fontFamily, color: primaryHex, bold: true });
                if (point.amount && point.amount !== '-') {
                  slide.addText(point.amount, { x: 6.8, y: yPos + 0.05, w: 2.5, h: 0.25, fontSize: 9, fontFace: fontFamily, color: accentHex, bold: true, align: 'right' });
                }
                slide.addText(`Butoir: ${point.deadline ? new Date(point.deadline).toLocaleDateString('fr-FR') : '-'} | ${point.recommendation.substring(0, 40)}`, { x: 1.1, y: yPos + 0.3, w: 8, h: 0.2, fontSize: 8, fontFace: fontFamily, color: '666666' });
                yPos += 0.6;
              });
              yPos += 0.1;
            });
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '14': {
            addSlideHeader(slide, 'Planning & Jalons');
            slide.addText('Prochains Jalons', { x: 0.5, y: 1.1, w: 4, h: 0.4, fontSize: 12, fontFace: fontFamily, color: primaryHex, bold: true });
            upcomingJalons.forEach((jalon, i) => {
              const status = jalon.statut === 'atteint' ? '10B981' : jalon.statut === 'en_risque' ? 'F59E0B' : primaryHex;
              slide.addShape('circle', { x: 0.5, y: 1.55 + i * 0.55, w: 0.2, h: 0.2, fill: { color: status } });
              slide.addText(jalon.titre.substring(0, 45), { x: 0.8, y: 1.5 + i * 0.55, w: 5.5, h: 0.35, fontSize: 10, fontFace: fontFamily, color: primaryHex });
              slide.addText(jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR') : '-', { x: 6.5, y: 1.5 + i * 0.55, w: 1.2, h: 0.35, fontSize: 10, fontFace: fontFamily, color: '666666' });
              if (jalon.responsable) {
                slide.addText(jalon.responsable.substring(0, 15), { x: 7.8, y: 1.5 + i * 0.55, w: 1.5, h: 0.35, fontSize: 8, fontFace: fontFamily, color: '999999' });
              }
            });
            addComment(slide, slideItem.comment, 4.6);
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '15': {
            // Actions par Jalons
            addSlideHeader(slide, 'Actions par Jalons');

            // Group actions by their target milestone
            const pptActionsParJalon: Record<string, typeof actions.data> = {};
            const pptActionsData = actions.data || [];
            const pptJalonsData = jalons.data || [];

            // Create a map of jalon titles by ID
            const pptJalonTitlesMap: Record<number, string> = {};
            pptJalonsData.forEach(j => {
              if (j.id) pptJalonTitlesMap[j.id] = j.titre;
            });

            // Group actions by jalon
            pptActionsData.forEach(action => {
              const jalonId = action.jalonId;
              const jalonTitle = jalonId ? (pptJalonTitlesMap[jalonId] || `Jalon #${jalonId}`) : 'Sans jalon associé';
              if (!pptActionsParJalon[jalonTitle]) {
                pptActionsParJalon[jalonTitle] = [];
              }
              pptActionsParJalon[jalonTitle]?.push(action);
            });

            // Sort jalons by number of actions (descending)
            const pptSortedJalons = Object.entries(pptActionsParJalon)
              .filter(([title]) => title !== 'Sans jalon associé')
              .sort((a, b) => (b[1]?.length || 0) - (a[1]?.length || 0))
              .slice(0, 4);

            const pptStatusColors: Record<string, string> = {
              termine: '10B981',
              en_cours: '3B82F6',
              en_retard: 'EF4444',
              bloque: 'EF4444',
              planifie: '6B7280',
              a_faire: 'F59E0B',
            };

            let colIdx = 0;
            pptSortedJalons.forEach(([jalonTitle, jalonActions]) => {
              const actionsList = jalonActions || [];
              const xPos = 0.5 + (colIdx % 2) * 4.8;
              const yPos = 1.0 + Math.floor(colIdx / 2) * 2.0;

              // Jalon card background
              slide.addShape('rect', { x: xPos, y: yPos, w: 4.5, h: 1.8, fill: { color: 'F3F4F6' }, line: { color: 'E5E7EB', width: 1 } });

              // Jalon title
              slide.addText(jalonTitle.substring(0, 35), { x: xPos + 0.1, y: yPos + 0.1, w: 3.5, h: 0.3, fontSize: 10, fontFace: fontFamily, color: primaryHex, bold: true });

              // Actions count
              slide.addText(`${actionsList.length}`, { x: xPos + 3.8, y: yPos + 0.1, w: 0.6, h: 0.3, fontSize: 12, fontFace: fontFamily, color: accentHex, bold: true, align: 'right' });

              // Status indicators
              const terminees = actionsList.filter(a => a.statut === 'termine').length;
              const enCours = actionsList.filter(a => a.statut === 'en_cours').length;
              const enRetard = actionsList.filter(a => a.statut === 'bloque' || a.sante === 'rouge').length;

              slide.addShape('circle', { x: xPos + 0.1, y: yPos + 0.45, w: 0.15, h: 0.15, fill: { color: '10B981' } });
              slide.addText(`${terminees}`, { x: xPos + 0.3, y: yPos + 0.4, w: 0.4, h: 0.2, fontSize: 9, fontFace: fontFamily, color: '666666' });

              slide.addShape('circle', { x: xPos + 0.7, y: yPos + 0.45, w: 0.15, h: 0.15, fill: { color: '3B82F6' } });
              slide.addText(`${enCours}`, { x: xPos + 0.9, y: yPos + 0.4, w: 0.4, h: 0.2, fontSize: 9, fontFace: fontFamily, color: '666666' });

              if (enRetard > 0) {
                slide.addShape('circle', { x: xPos + 1.3, y: yPos + 0.45, w: 0.15, h: 0.15, fill: { color: 'EF4444' } });
                slide.addText(`${enRetard}`, { x: xPos + 1.5, y: yPos + 0.4, w: 0.4, h: 0.2, fontSize: 9, fontFace: fontFamily, color: '666666' });
              }

              // Top 3 actions
              actionsList.slice(0, 3).forEach((action, aIdx) => {
                const statusColor = pptStatusColors[action.statut] || '6B7280';
                slide.addShape('circle', { x: xPos + 0.15, y: yPos + 0.7 + aIdx * 0.35, w: 0.1, h: 0.1, fill: { color: statusColor } });
                slide.addText(action.titre.substring(0, 30), { x: xPos + 0.35, y: yPos + 0.65 + aIdx * 0.35, w: 3.2, h: 0.25, fontSize: 8, fontFace: fontFamily, color: '444444' });
                slide.addText(`${action.avancement}%`, { x: xPos + 3.6, y: yPos + 0.65 + aIdx * 0.35, w: 0.7, h: 0.25, fontSize: 8, fontFace: fontFamily, color: '999999', align: 'right' });
              });

              if (actionsList.length > 3) {
                slide.addText(`+${actionsList.length - 3} autres`, { x: xPos + 0.35, y: yPos + 1.55, w: 2, h: 0.2, fontSize: 7, fontFace: fontFamily, color: '999999', italic: true });
              }

              colIdx++;
            });

            // Legend
            slide.addShape('circle', { x: 0.5, y: 4.8, w: 0.15, h: 0.15, fill: { color: '10B981' } });
            slide.addText('Terminée', { x: 0.7, y: 4.75, w: 1, h: 0.2, fontSize: 8, fontFace: fontFamily, color: '666666' });
            slide.addShape('circle', { x: 2, y: 4.8, w: 0.15, h: 0.15, fill: { color: '3B82F6' } });
            slide.addText('En cours', { x: 2.2, y: 4.75, w: 1, h: 0.2, fontSize: 8, fontFace: fontFamily, color: '666666' });
            slide.addShape('circle', { x: 3.5, y: 4.8, w: 0.15, h: 0.15, fill: { color: 'EF4444' } });
            slide.addText('En retard', { x: 3.7, y: 4.75, w: 1, h: 0.2, fontSize: 8, fontFace: fontFamily, color: '666666' });

            addComment(slide, slideItem.comment, 5.1);
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '16': {
            addSlideHeader(slide, 'Synthèse & Prochaines Étapes');
            slide.addText('Points clés', { x: 0.5, y: 1.1, w: 4, h: 0.4, fontSize: 14, fontFace: fontFamily, color: primaryHex, bold: true });
            const keyPoints = [
              `Météo projet: ${weatherConfig[projectWeather].label.split(' ')[0]}`,
              `Occupation: ${kpiValues.occupation}% (cible 85%)`,
              `Budget: ${kpiValues.budgetConsumed}% consommé`,
              `${decisionPoints.length} décision(s) en attente DG`,
            ];
            keyPoints.forEach((point, i) => {
              slide.addText(`• ${point}`, { x: 0.7, y: 1.6 + i * 0.4, w: 4, h: 0.35, fontSize: 12, fontFace: fontFamily, color: '444444' });
            });
            slide.addText('Prochaines étapes', { x: 5, y: 1.1, w: 4, h: 0.4, fontSize: 14, fontFace: fontFamily, color: primaryHex, bold: true });
            ['Finaliser les arbitrages', 'Poursuivre commercialisation', 'Suivre levée réserves', 'Préparer inauguration'].forEach((step, i) => {
              slide.addText(`${i + 1}. ${step}`, { x: 5.2, y: 1.6 + i * 0.4, w: 4, h: 0.35, fontSize: 12, fontFace: fontFamily, color: '444444' });
            });
            addComment(slide, slideItem.comment, 4.0);
            addSlideFooter(slide, pageNum, totalPages);
            break;
          }

          case '17': {
            slide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: primaryHex } });
            slide.addText('Merci de votre attention', { x: 0, y: 2, w: '100%', h: 0.8, fontSize: 36, fontFace: fontFamily, color: 'FFFFFF', bold: true, align: 'center' });
            slide.addShape('rect', { x: 3.5, y: 2.9, w: 3, h: 0.05, fill: { color: accentHex } });
            slide.addText('Questions ?', { x: 0, y: 3.2, w: '100%', h: 0.5, fontSize: 18, fontFace: fontFamily, color: 'CCCCCC', align: 'center' });
            slide.addText('COSMOS ANGRÉ', { x: 0, y: 4.5, w: '100%', h: 0.4, fontSize: 14, fontFace: fontFamily, color: accentHex, align: 'center' });
            break;
          }
        }
      }

      const fileName = `DeepDive_CosmosAngre_${new Date(presentationDate).toISOString().split('T')[0]}.pptx`;
      await pptx.writeFile({ fileName });
    } catch (error) {
      console.error('Error generating PowerPoint:', error);
      alert('Erreur lors de la génération du PowerPoint. Veuillez réessayer.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Presentation className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              Deep Dive Cosmos Angré — Générateur PowerPoint
            </h3>
            <p className="text-sm text-primary-500">
              Préparez votre présentation Direction Générale
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={generatePowerPoint}
          disabled={generating || activeSlides.length === 0}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Générer PowerPoint
            </>
          )}
        </Button>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'config', label: 'Configuration', icon: Settings },
          { id: 'preview', label: 'Aperçu HTML', icon: Eye },
          { id: 'design', label: 'Design', icon: Palette },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ViewTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Informations générales */}
            <Card padding="md">
              <button type="button" className="w-full flex items-center justify-between" onClick={() => toggleSection('info')}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-500" />
                  <h4 className="font-semibold text-primary-900">Informations générales</h4>
                </div>
                {expandedSections.info ? <ChevronUp className="h-5 w-5 text-primary-400" /> : <ChevronDown className="h-5 w-5 text-primary-400" />}
              </button>
              {expandedSections.info && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">Date présentation</label>
                      <Input type="date" value={presentationDate} onChange={(e) => setPresentationDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">Météo projet</label>
                      <Select value={projectWeather} onChange={(e) => setProjectWeather(e.target.value as ProjectWeather)}>
                        {Object.entries(weatherConfig).map(([key, config]) => (
                          <SelectOption key={key} value={key}>{config.emoji} {config.label}</SelectOption>
                        ))}
                      </Select>
                    </div>
                  </div>
                  {/* Période du rapport */}
                  <ReportPeriodSelector
                    value={reportPeriod}
                    onChange={setReportPeriod}
                  />
                </div>
              )}
            </Card>

            {/* KPIs */}
            <Card padding="md">
              <button type="button" className="w-full flex items-center justify-between" onClick={() => toggleSection('kpis')}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary-500" />
                  <h4 className="font-semibold text-primary-900">KPIs principaux</h4>
                </div>
                {expandedSections.kpis ? <ChevronUp className="h-5 w-5 text-primary-400" /> : <ChevronDown className="h-5 w-5 text-primary-400" />}
              </button>
              {expandedSections.kpis && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">Occupation (%)</label>
                    <Input type="number" min="0" max="100" value={kpiValues.occupation} onChange={(e) => setKpiValues((prev) => ({ ...prev, occupation: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">Budget consommé (%)</label>
                    <Input type="number" min="0" max="100" value={kpiValues.budgetConsumed} onChange={(e) => setKpiValues((prev) => ({ ...prev, budgetConsumed: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">Jalons atteints</label>
                    <Input type="number" min="0" value={kpiValues.milestonesAchieved} onChange={(e) => setKpiValues((prev) => ({ ...prev, milestonesAchieved: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">Équipe recrutée</label>
                    <Input type="number" min="0" value={kpiValues.teamRecruited} onChange={(e) => setKpiValues((prev) => ({ ...prev, teamRecruited: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
              )}
            </Card>

            {/* Points DG avec Axe - Design amélioré */}
            <Card padding="md" className="border-2 border-red-100">
              <button type="button" className="w-full flex items-center justify-between" onClick={() => toggleSection('decisions')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-primary-900">Points en attente de décision DG</h4>
                    <p className="text-xs text-primary-500">Décisions requises classées par priorité</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="error" className="text-lg px-3 py-1">{decisionPoints.length}</Badge>
                  {expandedSections.decisions ? <ChevronUp className="h-5 w-5 text-primary-400" /> : <ChevronDown className="h-5 w-5 text-primary-400" />}
                </div>
              </button>

              {expandedSections.decisions && (
                <div className="mt-4 space-y-4">
                  {/* Résumé par urgence */}
                  <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl">
                    {(['critical', 'high', 'medium', 'low'] as const).map((level) => {
                      const count = decisionPoints.filter(p => p.urgency === level).length;
                      const cfg = urgencyConfig[level];
                      return (
                        <div key={level} className={`text-center p-2 rounded-lg ${count > 0 ? 'bg-white shadow-sm' : 'opacity-50'}`}>
                          <div className="text-xl mb-1">{cfg.emoji}</div>
                          <div className="text-lg font-bold" style={{ color: cfg.color }}>{count}</div>
                          <div className="text-[10px] text-gray-500">{cfg.label.split(' ')[0]}</div>
                        </div>
                      );
                    })}
                  </div>

                  <Button variant="primary" size="sm" onClick={addDecisionPoint} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un point de décision
                  </Button>

                  {/* Group by axe display */}
                  {(Object.keys(axesConfig) as AxeType[]).map((axe) => {
                    const axePoints = decisionPoints.filter((p) => p.axe === axe);
                    if (axePoints.length === 0) return null;

                    const config = axesConfig[axe];
                    return (
                      <div key={axe} className="rounded-xl border overflow-hidden" style={{ borderColor: `${config.color}40` }}>
                        {/* Header axe */}
                        <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: `${config.color}10` }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.color }}>
                            <config.icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-bold" style={{ color: config.color }}>
                            {config.label}
                          </span>
                          <Badge className="ml-auto" style={{ backgroundColor: config.color, color: 'white' }}>
                            {axePoints.length}
                          </Badge>
                        </div>

                        {/* Points */}
                        <div className="divide-y bg-white">
                          {axePoints.map((point) => (
                            <div key={point.id} className="p-4">
                              {/* Header du point */}
                              <div className="flex items-center justify-between mb-3 pb-2 border-b">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="px-2 py-1 rounded-lg text-xs font-medium"
                                    style={{
                                      backgroundColor: `${urgencyConfig[point.urgency].color}15`,
                                      color: urgencyConfig[point.urgency].color,
                                      border: `1px solid ${urgencyConfig[point.urgency].color}40`
                                    }}
                                  >
                                    {urgencyConfig[point.urgency].emoji} {urgencyConfig[point.urgency].label}
                                  </span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-error-500 hover:text-error-700 hover:bg-error-50" onClick={() => removeDecisionPoint(point.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Formulaire */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold text-primary-700 mb-1">Sujet</label>
                                  <Input value={point.subject} onChange={(e) => updateDecisionPoint(point.id, 'subject', e.target.value)} placeholder="Description du point à décider" className="font-medium" />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-primary-700 mb-1">🏷️ Axe concerné</label>
                                  <Select value={point.axe} onChange={(e) => updateDecisionPoint(point.id, 'axe', e.target.value)}>
                                    {Object.entries(axesConfig).map(([key, cfg]) => (
                                      <SelectOption key={key} value={key}>
                                        {cfg.shortLabel} - {cfg.label}
                                      </SelectOption>
                                    ))}
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-primary-700 mb-1">Montant</label>
                                  <Input value={point.amount} onChange={(e) => updateDecisionPoint(point.id, 'amount', e.target.value)} placeholder="Ex: 150 000 000 FCFA" />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-primary-700 mb-1">Urgence</label>
                                  <Select value={point.urgency} onChange={(e) => updateDecisionPoint(point.id, 'urgency', e.target.value)}>
                                    {Object.entries(urgencyConfig).map(([key, cfg]) => (
                                      <SelectOption key={key} value={key}>{cfg.label}</SelectOption>
                                    ))}
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-primary-700 mb-1">Date butoir</label>
                                  <Input type="date" value={point.deadline} onChange={(e) => updateDecisionPoint(point.id, 'deadline', e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold text-primary-700 mb-1">💡 Recommandation DGA</label>
                                  <Input value={point.recommendation} onChange={(e) => updateDecisionPoint(point.id, 'recommendation', e.target.value)} placeholder="Votre recommandation pour la DG" className="bg-blue-50 border-blue-200" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Message si aucun point */}
                  {decisionPoints.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucun point de décision DG</p>
                      <p className="text-sm text-gray-400">Cliquez sur "Ajouter" pour créer un nouveau point</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Slides list */}
          <div className="space-y-4">
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <h4 className="font-semibold text-primary-900">Slides</h4>
                  <Badge variant="info">{activeSlides.length}</Badge>
                </div>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={slides.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {slides.map((slide) => (
                      <SortableSlideItem
                        key={slide.id}
                        slide={slide}
                        index={activeSlides.findIndex((s) => s.id === slide.id)}
                        onToggle={() => toggleSlide(slide.id)}
                        onEditComment={() => setEditingComment(editingComment === slide.id ? null : slide.id)}
                        onEditTitle={() => setEditingTitle(slide.id)}
                        onEditSlide={() => setEditingSlideId(slide.id)}
                        onDuplicate={() => duplicateSlide(slide.id)}
                        onDelete={() => deleteSlide(slide.id)}
                        isEditingComment={editingComment === slide.id}
                        isEditingTitle={editingTitle === slide.id}
                        onCommentChange={(comment) => updateSlideComment(slide.id, comment)}
                        onTitleChange={(title) => updateSlideTitle(slide.id, title)}
                        onSaveComment={() => setEditingComment(null)}
                        onSaveTitle={() => setEditingTitle(null)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </Card>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-4' : ''}`}>
          <Card padding="md" className={isFullscreen ? 'h-full flex flex-col' : ''}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h4 className="font-semibold text-primary-900">
                  Slide {previewSlideIndex + 1} / {activeSlides.length}
                </h4>
                <span className="text-sm text-primary-500">
                  {activeSlides[previewSlideIndex]?.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigatePreview('prev')} disabled={previewSlideIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigatePreview('next')} disabled={previewSlideIndex === activeSlides.length - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className={`bg-gray-100 rounded-lg p-4 ${isFullscreen ? 'flex-1' : ''}`}>
              <div
                className={`bg-white shadow-lg mx-auto overflow-hidden ${isFullscreen ? 'h-full' : 'aspect-[16/9]'}`}
                style={{ maxWidth: isFullscreen ? '100%' : '900px' }}
              >
                {activeSlides[previewSlideIndex] && renderSlidePreview(activeSlides[previewSlideIndex])}
              </div>
            </div>

            {!isFullscreen && (
              <div className="mt-4 flex gap-2 overflow-x-auto py-2">
                {activeSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setPreviewSlideIndex(index)}
                    className={`flex-shrink-0 w-20 h-14 rounded border-2 overflow-hidden transition-all ${
                      index === previewSlideIndex ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-xs text-gray-500">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeSlides[previewSlideIndex] && !isFullscreen && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  Commentaire pour cette slide
                </label>
                <Textarea
                  value={activeSlides[previewSlideIndex].comment}
                  onChange={(e) => updateSlideComment(activeSlides[previewSlideIndex].id, e.target.value)}
                  placeholder="Ajoutez un commentaire..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Design Tab */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="md">
            <h4 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Couleurs
            </h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-primary-700 mb-2">Thèmes prédéfinis</label>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primary }} />
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.accent }} />
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Couleur principale</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designSettings.primaryColor}
                    onChange={(e) => updateDesignSettings({ primaryColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={designSettings.primaryColor}
                    onChange={(e) => updateDesignSettings({ primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Couleur d'accent</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designSettings.accentColor}
                    onChange={(e) => updateDesignSettings({ accentColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={designSettings.accentColor}
                    onChange={(e) => updateDesignSettings({ accentColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Bouton Enregistrer */}
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={saveDesignSettings}
                disabled={designSaved}
                className={designSaved ? 'opacity-50' : ''}
              >
                <Save className="h-4 w-4 mr-2" />
                {designSaved ? 'Modifications enregistrées' : 'Enregistrer les modifications'}
              </Button>
              {!designSaved && (
                <span className="ml-3 text-sm text-warning-600">
                  Modifications non enregistrees
                </span>
              )}
            </div>
          </Card>

          <Card padding="md">
            <h4 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typographie & Style
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Police</label>
                <Select
                  value={designSettings.fontFamily}
                  onChange={(e) => updateDesignSettings({ fontFamily: e.target.value })}
                >
                  {fontOptions.map((font) => (
                    <SelectOption key={font.value} value={font.value}>{font.label}</SelectOption>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Style d'en-tête</label>
                <Select
                  value={designSettings.headerStyle}
                  onChange={(e) => updateDesignSettings({ headerStyle: e.target.value as 'full' | 'minimal' | 'none' })}
                >
                  <SelectOption value="full">Bandeau complet</SelectOption>
                  <SelectOption value="minimal">Minimaliste</SelectOption>
                  <SelectOption value="none">Sans en-tête</SelectOption>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={designSettings.showSlideNumbers}
                    onChange={(e) => updateDesignSettings({ showSlideNumbers: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Numéros de page</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={designSettings.showDate}
                    onChange={(e) => updateDesignSettings({ showDate: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Afficher la date</span>
                </label>
              </div>
            </div>
          </Card>

          <Card padding="md" className="lg:col-span-2">
            <h4 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu du design
            </h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="bg-white shadow-lg mx-auto aspect-[16/9] max-w-xl overflow-hidden">
                {renderSlidePreview(activeSlides[2] || defaultSlides[2])}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Slide Editor Modal */}
      {editingSlide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: designSettings.primaryColor }}>
              <div className="flex items-center gap-3 text-white">
                {React.createElement(editingSlide.icon, { className: 'h-5 w-5' })}
                <h3 className="font-semibold">Modifier la slide</h3>
              </div>
              <button
                onClick={() => setEditingSlideId(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Titre de la slide
                </label>
                <Input
                  value={editingSlide.title}
                  onChange={(e) => updateSlide(editingSlide.id, { title: e.target.value })}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Description / Sous-titre
                </label>
                <Input
                  value={editingSlide.description}
                  onChange={(e) => updateSlide(editingSlide.id, { description: e.target.value })}
                />
              </div>

              {/* Custom Content */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Contenu personnalisé
                </label>
                <Textarea
                  value={editingSlide.content || ''}
                  onChange={(e) => updateSlide(editingSlide.id, { content: e.target.value })}
                  placeholder="Ajoutez du contenu personnalisé pour cette slide..."
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ce contenu sera affiché dans la slide lors de la prévisualisation.
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Notes du présentateur
                </label>
                <Textarea
                  value={editingSlide.comment}
                  onChange={(e) => updateSlide(editingSlide.id, { comment: e.target.value })}
                  placeholder="Notes visibles uniquement par le présentateur..."
                  rows={3}
                />
              </div>

              {/* Include toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="slide-included-monthly"
                  checked={editingSlide.included}
                  onChange={(e) => updateSlide(editingSlide.id, { included: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="slide-included-monthly" className="flex-1">
                  <span className="font-medium text-primary-900">Inclure cette slide</span>
                  <p className="text-xs text-gray-500">Décochez pour exclure cette slide de la présentation</p>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  deleteSlide(editingSlide.id);
                  setEditingSlideId(null);
                }}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setEditingSlideId(null)}>
                  Annuler
                </Button>
                <Button onClick={() => setEditingSlideId(null)}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
