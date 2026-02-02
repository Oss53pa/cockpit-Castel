import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Maximize2,
  Minimize2,
  Save,
  Scale,
  Megaphone,
  Briefcase,
  Wrench,
  GitCompareArrows,
  RefreshCw,
  ClipboardList,
  Clock,
  AlertCircle,
  FileEdit,
  Lightbulb,
  ListChecks,
  Flag,
  BookOpen,
  Compass,
  Map,
  Layers,
  Network,
  CheckSquare,
  Award,
  Play,
  GripVertical,
  Edit2,
  MoreVertical,
  Copy,
  Brain,
  Cpu,
  Sparkles,
  Send,
  Store,
  Car,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Input,
  Textarea,
} from '@/components/ui';
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useBudgetSynthese,
  useBudgetParAxe,
  useRisques,
} from '@/hooks';
import { PROJET_CONFIG } from '@/data/constants';

// Types
type ProjectWeather = 'green' | 'yellow' | 'orange' | 'red';
type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';
type ViewTab = 'config' | 'preview' | 'design';
type AxeType = 'commercialisation' | 'rh' | 'technique' | 'budget' | 'marketing' | 'exploitation' | 'general';

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
  content?: string; // Custom content for the slide
  section?: string;
  duration?: string;
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

// Axes configuration - 6 axes du projet (couleurs officielles)
const axesConfig: Record<AxeType, { label: string; color: string; icon: React.ElementType; shortLabel: string }> = {
  commercialisation: { label: 'Commercialisation', color: '#1C3163', icon: Building2, shortLabel: 'AX1' },
  rh: { label: 'RH & Organisation', color: '#D4AF37', icon: Users, shortLabel: 'AX2' },
  technique: { label: 'Technique & Handover', color: '#10B981', icon: Wrench, shortLabel: 'AX3' },
  budget: { label: 'Budget & Pilotage', color: '#F59E0B', icon: DollarSign, shortLabel: 'AX4' },
  marketing: { label: 'Marketing & Communication', color: '#EF4444', icon: Megaphone, shortLabel: 'AX5' },
  exploitation: { label: 'Exploitation & Système', color: '#8B5CF6', icon: Settings, shortLabel: 'AX6' },
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
  { label: string; color: string; bgColor: string; textColor: string; icon: React.ElementType }
> = {
  green: {
    label: 'Vert (Sur la bonne voie)',
    color: '#10B981',
    bgColor: 'bg-success-100',
    textColor: 'text-success-600',
    icon: Sun,
  },
  yellow: {
    label: 'Jaune (Attention requise)',
    color: '#F59E0B',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-600',
    icon: CloudSun,
  },
  orange: {
    label: 'Orange (Vigilance)',
    color: '#F97316',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    icon: Cloud,
  },
  red: {
    label: 'Rouge (Critique)',
    color: '#EF4444',
    bgColor: 'bg-error-100',
    textColor: 'text-error-600',
    icon: CloudRain,
  },
};

const urgencyConfig: Record<
  UrgencyLevel,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  critical: {
    label: 'Critique (Bloquant)',
    color: '#EF4444',
    bgColor: 'bg-error-50',
    icon: AlertCircle,
  },
  high: {
    label: 'Haute (Cette semaine)',
    color: '#F97316',
    bgColor: 'bg-orange-50',
    icon: AlertTriangle,
  },
  medium: {
    label: 'Moyenne (Ce mois)',
    color: '#F59E0B',
    bgColor: 'bg-warning-50',
    icon: Clock,
  },
  low: {
    label: 'Basse (Ce trimestre)',
    color: '#10B981',
    bgColor: 'bg-success-50',
    icon: CheckCircle,
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
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia (Serif)' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
];

// Contenu spécifique par axe - 6 axes du projet
const axeContents: Record<Exclude<AxeType, 'general'>, {
  intro: string;
  situation: string;
  objectifs: string;
  risques: string;
  decisions: string;
}> = {
  commercialisation: {
    intro: `AXE 1 - COMMERCIALISATION

Pilote: Directeur Commercial
Sponsor: DG

PÉRIMÈTRE
• Stratégie de pré-commercialisation
• Positionnement prix et offre
• Pipeline prospects et négociations
• Partenariats stratégiques
• Contrats et baux commerciaux`,
    situation: `SITUATION ACTUELLE - COMMERCIALISATION

PIPELINE PROSPECTS
┌─────────────────┬──────────┬───────────┐
│ Catégorie       │ Nombre   │ Surface   │
├─────────────────┼──────────┼───────────┤
│ LOI signées     │ [X]      │ [X] m²    │
│ Négociation     │ [X]      │ [X] m²    │
│ Qualifiés       │ [X]      │ [X] m²    │
│ En prospection  │ [X]      │ [X] m²    │
└─────────────────┴──────────┴───────────┘

TAUX DE PRÉ-COMMERCIALISATION
• Objectif ouverture: 70%
• Actuel: [X]%

NÉGOCIATIONS EN COURS
• [Enseigne 1]: [statut]
• [Enseigne 2]: [statut]
• [Enseigne 3]: [statut]`,
    objectifs: `OBJECTIFS & JALONS - COMMERCIALISATION

OBJECTIFS CLÉS
┌─────────────────────────────────────────┐
│ - 70% pré-commercialisation ouverture   │
│ - Signature locomotives avant M-6       │
│ - Mix merchandising équilibré           │
│ - Revenus annexes contractualisés       │
└─────────────────────────────────────────┘

JALONS CRITIQUES
• [Date]: Signature enseigne locomotive 1
• [Date]: Finalisation plan merchandising
• [Date]: Signature enseignes secondaires
• [Date]: Contractualisation revenus annexes

KPIs DE SUIVI
• Taux de transformation prospects
• Loyer moyen FCFA/m²
• Durée moyenne baux`,
    risques: `RISQUES IDENTIFIÉS - COMMERCIALISATION

RISQUE 1: RETARD SIGNATURES LOCOMOTIVES
• Impact: Critique (effet domino)
• Probabilité: Moyenne
• Mitigation: Plan B enseignes alternatives

RISQUE 2: PRESSION SUR LES LOYERS
• Impact: Élevé (revenus)
• Probabilité: Élevée (contexte marché)
• Mitigation: Flexibilité conditions

RISQUE 3: MIX COMMERCIAL DÉSÉQUILIBRÉ
• Impact: Moyen (attractivité)
• Probabilité: Moyenne
• Mitigation: Arbitrages catégoriels`,
    decisions: `DÉCISIONS ATTENDUES DG - COMMERCIALISATION

ARBITRAGES REQUIS

1. POLITIQUE TARIFAIRE
   □ Validation grille loyers
   □ Marge négociation autorisée
   □ Conditions franchises

2. ENSEIGNES STRATÉGIQUES
   □ Validation shortlist locomotives
   □ Go/No-Go négociations exclusives
   □ Budget incentives

3. MIX MERCHANDISING
   □ Répartition par catégorie
   □ Arbitrage local vs national`
  },
  rh: {
    intro: `AXE 2 - RH & ORGANISATION

Pilote: DRH
Sponsor: DG

PÉRIMÈTRE
• Stratégie de recrutement
• Organisation cible
• Politique de rémunération
• Formation et intégration
• Relations sociales`,
    situation: `SITUATION ACTUELLE - RH & ORGANISATION

EFFECTIFS CIBLES
┌─────────────────┬──────────┬───────────┐
│ Catégorie       │ Cible    │ Pourvu    │
├─────────────────┼──────────┼───────────┤
│ Direction       │ 3        │ [X]       │
│ Encadrement     │ 5        │ [X]       │
│ Opérationnels   │ 25       │ [X]       │
└─────────────────┴──────────┴───────────┘

AVANCEMENT RECRUTEMENT
• Postes ouverts: [X]
• Candidatures reçues: [X]
• Entretiens réalisés: [X]
• Offres envoyées: [X]

ORGANISATION
• Organigramme: [Statut]
• Fiches de poste: [Statut]
• Grille salariale: [Statut]`,
    objectifs: `OBJECTIFS & JALONS - RH & ORGANISATION

OBJECTIFS CLÉS
┌─────────────────────────────────────────┐
│ - 100% postes clés pourvus J-90        │
│ - Organisation validée J-120            │
│ - Formation complète J-30               │
│ - Équipe opérationnelle J-Day           │
└─────────────────────────────────────────┘

JALONS CRITIQUES
• [Date]: Validation organigramme
• [Date]: Recrutement direction
• [Date]: Recrutement encadrement
• [Date]: Formation initiale
• [Date]: Dry-run équipes

PLANNING RECRUTEMENT
• Phase 1 (J-120): Équipe direction
• Phase 2 (J-90): Encadrement
• Phase 3 (J-60): Opérationnels`,
    risques: `RISQUES IDENTIFIÉS - RH & ORGANISATION

RISQUE 1: DIFFICULTÉ RECRUTEMENT
• Impact: Critique (ouverture)
• Probabilité: Moyenne
• Mitigation: Chasseurs de têtes, sourcing actif

RISQUE 2: TURNOVER PRÉ-OUVERTURE
• Impact: Élevé (continuité)
• Probabilité: Faible
• Mitigation: Package attractif, engagement

RISQUE 3: FORMATION INSUFFISANTE
• Impact: Moyen (qualité service)
• Probabilité: Moyenne
• Mitigation: Programme structuré, mentoring`,
    decisions: `DÉCISIONS ATTENDUES DG - RH & ORGANISATION

ARBITRAGES REQUIS

1. ORGANISATION
   □ Validation organigramme final
   □ Effectif cible par service
   □ Politique de délégation

2. RÉMUNÉRATION
   □ Grille salariale
   □ Variable et primes
   □ Avantages sociaux

3. RECRUTEMENT
   □ Budget recrutement
   □ Prestataires RH
   □ Critères de sélection`
  },
  technique: {
    intro: `AXE 3 - TECHNIQUE & HANDOVER

Pilote: Directeur Technique
Sponsor: DG

PÉRIMÈTRE
• Avancement travaux TCE
• Coordination MOE/Entreprises
• Livraisons et réceptions
• Handover exploitation
• Levée de réserves`,
    situation: `SITUATION ACTUELLE - TECHNIQUE

AVANCEMENT GLOBAL
┌────────────────────────────────────────┐
│ ████████████░░░░░░░░ 60%               │
└────────────────────────────────────────┘

PAR LOT
┌─────────────────┬──────────┬───────────┐
│ Lot             │ Prévu    │ Réalisé   │
├─────────────────┼──────────┼───────────┤
│ Gros œuvre      │ 100%     │ [X]%      │
│ Façades         │ [X]%     │ [X]%      │
│ CVC             │ [X]%     │ [X]%      │
│ Électricité     │ [X]%     │ [X]%      │
│ Aménagements    │ [X]%     │ [X]%      │
└─────────────────┴──────────┴───────────┘

HANDOVER
• Documentation: [Statut]
• Formation: [Statut]
• Tests: [Statut]`,
    objectifs: `OBJECTIFS & JALONS - TECHNIQUE

OBJECTIFS CLÉS
┌─────────────────────────────────────────┐
│ - Livraison conforme au planning        │
│ - Zéro réserve majeure à réception      │
│ - Handover complet J-30                 │
│ - Certifications obtenues               │
└─────────────────────────────────────────┘

JALONS CRITIQUES
• [Date]: Clos couvert
• [Date]: Mise hors d'eau
• [Date]: Livraison zones techniques
• [Date]: Réception parties communes
• [Date]: Livraison cellules preneurs

CHEMIN CRITIQUE
1. [Tâche critique 1]
2. [Tâche critique 2]
3. [Tâche critique 3]`,
    risques: `RISQUES IDENTIFIÉS - TECHNIQUE

RISQUE 1: RETARD APPROVISIONNEMENTS
• Impact: Critique (planning)
• Probabilité: Moyenne
• Mitigation: Stock sécurité, backup

RISQUE 2: NON-CONFORMITÉS
• Impact: Élevé (réception)
• Probabilité: Faible
• Mitigation: Contrôles renforcés

RISQUE 3: HANDOVER INCOMPLET
• Impact: Moyen (exploitation)
• Probabilité: Moyenne
• Mitigation: Checklist détaillée`,
    decisions: `DÉCISIONS ATTENDUES DG - TECHNIQUE

ARBITRAGES REQUIS

1. PLANNING
   □ Priorisation lots critiques
   □ Ressources supplémentaires
   □ Travail week-end/nuit

2. RÉCEPTION
   □ Critères d'acceptation
   □ Réserves acceptables
   □ Planning OPR

3. HANDOVER
   □ Périmètre documentation
   □ Formation exploitation
   □ Garanties et SAV`
  },
  budget: {
    intro: `AXE 4 - BUDGET & PILOTAGE

Pilote: DAF
Sponsor: DG

PÉRIMÈTRE
• Suivi budgétaire global
• Pilotage EVM
• Reporting financier
• Trésorerie et financement
• Contrôle de gestion`,
    situation: `SITUATION ACTUELLE - BUDGET & PILOTAGE

SYNTHÈSE BUDGÉTAIRE
┌─────────────────┬──────────────────────┐
│ Poste           │ Montant              │
├─────────────────┼──────────────────────┤
│ Budget total    │ [X] Mds FCFA         │
│ Engagé          │ [X] Mds FCFA         │
│ Réalisé         │ [X] Mds FCFA         │
│ Reste à engager │ [X] Mds FCFA         │
└─────────────────┴──────────────────────┘

INDICATEURS EVM
• CPI (Coût): [X]
• SPI (Planning): [X]
• EAC: [X] Mds FCFA

TRÉSORERIE
• Solde actuel: [X] FCFA
• Besoin M+3: [X] FCFA`,
    objectifs: `OBJECTIFS & JALONS - BUDGET & PILOTAGE

OBJECTIFS CLÉS
┌─────────────────────────────────────────┐
│ - Budget respecté (±5%)                 │
│ - CPI > 0.95                            │
│ - Reporting mensuel fiable              │
│ - Trésorerie sécurisée                  │
└─────────────────────────────────────────┘

JALONS CRITIQUES
• [Date]: Clôture engagements travaux
• [Date]: Validation budget exploitation
• [Date]: Mise en place reporting
• [Date]: Audit pré-ouverture

LIVRABLES
• Tableau de bord mensuel
• Prévisions trésorerie
• Analyse des écarts`,
    risques: `RISQUES IDENTIFIÉS - BUDGET & PILOTAGE

RISQUE 1: DÉPASSEMENT BUDGET
• Impact: Critique (rentabilité)
• Probabilité: Moyenne
• Mitigation: Suivi hebdo, provisions

RISQUE 2: TENSION TRÉSORERIE
• Impact: Élevé (continuité)
• Probabilité: Faible
• Mitigation: Ligne de crédit, échéancier

RISQUE 3: REPORTING DÉFAILLANT
• Impact: Moyen (décisions)
• Probabilité: Faible
• Mitigation: Automatisation, contrôles`,
    decisions: `DÉCISIONS ATTENDUES DG - BUDGET & PILOTAGE

ARBITRAGES REQUIS

1. BUDGET
   □ Validation avenants
   □ Provisions complémentaires
   □ Arbitrages priorités

2. FINANCEMENT
   □ Appels de fonds
   □ Négociation banques
   □ Garanties

3. REPORTING
   □ Fréquence et format
   □ Indicateurs clés
   □ Seuils d'alerte`
  },
  marketing: {
    intro: `AXE 5 - MARKETING & COMMUNICATION

Pilote: Directeur Marketing
Sponsor: DG

PÉRIMÈTRE
• Stratégie de marque
• Plan de communication
• Digital et réseaux sociaux
• Événements et RP
• Signalétique`,
    situation: `SITUATION ACTUELLE - MARKETING & COMMUNICATION

IDENTITÉ DE MARQUE
• Nom: Cosmos Angré
• Baseline: [À définir]
• Charte graphique: [Statut]
• Site web: [Statut]

VISIBILITÉ
┌─────────────────────┬───────────────────┐
│ Canal               │ Statut            │
├─────────────────────┼───────────────────┤
│ Site web            │ [En cours]        │
│ Réseaux sociaux     │ [Actif/Inactif]   │
│ Relations presse    │ [Statut]          │
│ Signalétique        │ [Statut]          │
└─────────────────────┴───────────────────┘

BUDGET COMMUNICATION
• Pré-ouverture: [X] FCFA
• Lancement: [X] FCFA
• Engagé: [X]%`,
    objectifs: `OBJECTIFS & JALONS - MARKETING & COMMUNICATION

OBJECTIFS CLÉS
┌─────────────────────────────────────────┐
│ - Notoriété 60% cible J-ouverture       │
│ - 10 000 followers réseaux sociaux      │
│ - 50 retombées presse                   │
│ - Inauguration réussie                  │
└─────────────────────────────────────────┘

JALONS CRITIQUES
• [Date]: Lancement identité visuelle
• [Date]: Mise en ligne site web
• [Date]: Campagne teasing
• [Date]: Conférence de presse
• [Date]: Inauguration officielle

PLAN MÉDIA
• Phase 1: Teasing [Dates]
• Phase 2: Révélation [Dates]
• Phase 3: Lancement [Dates]`,
    risques: `RISQUES IDENTIFIÉS - MARKETING & COMMUNICATION

RISQUE 1: FAIBLE NOTORIÉTÉ
• Impact: Élevé (fréquentation)
• Probabilité: Moyenne
• Mitigation: Budget média renforcé

RISQUE 2: BAD BUZZ
• Impact: Élevé (image)
• Probabilité: Faible
• Mitigation: Veille, plan de crise

RISQUE 3: ÉVÉNEMENT INAUGURATION
• Impact: Moyen (RP)
• Probabilité: Faible
• Mitigation: Plan B météo, sécurité`,
    decisions: `DÉCISIONS ATTENDUES DG - MARKETING & COMMUNICATION

ARBITRAGES REQUIS

1. STRATÉGIE
   □ Positionnement définitif
   □ Message clé / baseline
   □ Cibles prioritaires

2. BUDGET
   □ Enveloppe pré-ouverture
   □ Budget inauguration
   □ Plan média année 1

3. ÉVÉNEMENTS
   □ Format inauguration
   □ Liste invités VIP
   □ Partenaires officiels`
  },
  exploitation: {
    intro: `AXE 6 - EXPLOITATION & SYSTÈME

Pilote: Directeur Exploitation
Sponsor: DG

PÉRIMÈTRE
• Contrats prestataires
• Systèmes d'information
• Équipements techniques
• Procédures opérationnelles
• Maintenance et énergie`,
    situation: `SITUATION ACTUELLE - EXPLOITATION & SYSTÈME

CONTRATS PRESTATAIRES
┌─────────────────────┬───────────────────┐
│ Prestataire         │ Statut            │
├─────────────────────┼───────────────────┤
│ Sécurité            │ [Statut]          │
│ Nettoyage           │ [Statut]          │
│ Maintenance         │ [Statut]          │
│ Espaces verts       │ [Statut]          │
└─────────────────────┴───────────────────┘

SYSTÈMES
• GTC: [Statut]
• Gestion parking: [Statut]
• Affichage dynamique: [Statut]
• Wifi/Réseau: [Statut]
• Caisse centralisée: [Statut]

ÉNERGIE
• Contrat électricité: [Statut]
• Groupe électrogène: [Statut]`,
    objectifs: `OBJECTIFS & JALONS - EXPLOITATION & SYSTÈME

OBJECTIFS CLÉS
┌─────────────────────────────────────────┐
│ - Contrats signés J-90                  │
│ - Systèmes opérationnels J-30           │
│ - Tests complets J-15                   │
│ - Dry-run réussi J-7                    │
└─────────────────────────────────────────┘

JALONS CRITIQUES
• [Date]: Signature contrats majeurs
• [Date]: Installation systèmes
• [Date]: Intégration et tests
• [Date]: Formation utilisateurs
• [Date]: Mise en service

BUDGET EXPLOITATION
• Prestataires: [X] FCFA/an
• Énergie: [X] FCFA/an
• Maintenance: [X] FCFA/an`,
    risques: `RISQUES IDENTIFIÉS - EXPLOITATION & SYSTÈME

RISQUE 1: RETARD SYSTÈMES
• Impact: Critique (opérations)
• Probabilité: Moyenne
• Mitigation: Plan dégradé, backup manuel

RISQUE 2: DÉFAILLANCE PRESTATAIRE
• Impact: Élevé (continuité)
• Probabilité: Faible
• Mitigation: Backup, pénalités

RISQUE 3: COÛTS ÉNERGIE
• Impact: Moyen (budget)
• Probabilité: Moyenne
• Mitigation: Optimisation, négociation`,
    decisions: `DÉCISIONS ATTENDUES DG - EXPLOITATION & SYSTÈME

ARBITRAGES REQUIS

1. PRESTATAIRES
   □ Choix fournisseurs clés
   □ Durée contrats
   □ Niveaux de service (SLA)

2. SYSTÈMES
   □ Périmètre fonctionnel
   □ Budget IT
   □ Intégrateur

3. ÉNERGIE
   □ Fournisseur électricité
   □ Puissance souscrite
   □ Budget énergie`
  }
};

// Helper to generate slides for each axis in launch mode
const generateLaunchAxeSlides = (axeKey: AxeType, axeConfig: { label: string; icon: React.ElementType }): SlideItem[] => [
  {
    id: `launch_axe_${axeKey}_intro`,
    title: `Axe ${axeConfig.label}`,
    icon: axeConfig.icon,
    description: `Intercalaire de l'axe ${axeConfig.label}`,
    included: true,
    comment: '',
    section: 'axes',
    duration: '2 min',
    content: axeContents[axeKey].intro
  },
  {
    id: `launch_axe_${axeKey}_situation`,
    title: `${axeConfig.label} - Situation actuelle`,
    icon: Eye,
    description: 'État des lieux actuel, pipeline, négociations',
    included: true,
    comment: '',
    section: 'axes',
    duration: '3 min',
    content: axeContents[axeKey].situation
  },
  {
    id: `launch_axe_${axeKey}_objectifs`,
    title: `${axeConfig.label} - Objectifs & jalons`,
    icon: Target,
    description: 'Objectifs et jalons clés jusqu\'à l\'ouverture',
    included: true,
    comment: '',
    section: 'axes',
    duration: '3 min',
    content: axeContents[axeKey].objectifs
  },
  {
    id: `launch_axe_${axeKey}_risques`,
    title: `${axeConfig.label} - Risques identifiés`,
    icon: AlertTriangle,
    description: 'Risques identifiés et premières alertes',
    included: true,
    comment: '',
    section: 'axes',
    duration: '2 min',
    content: axeContents[axeKey].risques
  },
  {
    id: `launch_axe_${axeKey}_decisions`,
    title: `${axeConfig.label} - Décisions DG`,
    icon: CheckSquare,
    description: 'Décisions et arbitrages attendus de la DG',
    included: true,
    comment: '',
    section: 'axes',
    duration: '2 min',
    content: axeContents[axeKey].decisions
  },
];

// === SLIDES DE LANCEMENT ===
const launchSlides: SlideItem[] = [
  // === PARTIE 1: INTRODUCTION & CADRE DE GOUVERNANCE (20 min) ===
  {
    id: 'launch_1',
    title: 'Page de garde',
    icon: FileText,
    description: 'Deep Dive #1 : Lancement & Cadrage - 9 février 2026',
    included: true,
    comment: '',
    section: 'intro',
    duration: '1 min'
  },
  {
    id: 'launch_2',
    title: 'Agenda de la session',
    icon: ListChecks,
    description: 'Sommaire des 6 parties de la présentation',
    included: true,
    comment: '',
    section: 'intro',
    duration: '2 min'
  },
  {
    id: 'launch_3',
    title: 'Ouverture & Objectifs',
    icon: Play,
    description: 'Pourquoi ce rituel mensuel ? Ce qu\'on attend de chaque participant',
    included: false,
    comment: '',
    section: 'intro',
    duration: '3 min',
    content: `OBJECTIFS DU DEEP DIVE

• Créer un rituel mensuel de pilotage stratégique
• Assurer la visibilité Direction Générale sur l'avancement
• Identifier et débloquer les points de décision critiques
• Synchroniser tous les axes du projet

CE QU'ON ATTEND DE CHAQUE PARTICIPANT

-Préparation : données à jour dans COCKPIT J-5
-Transparence : remonter les alertes sans filtre
-Engagement : porter les décisions prises
-Collaboration : vision transverse, pas en silo`
  },
  {
    id: 'launch_4',
    title: 'Méthodologie Deep Dive',
    icon: BookOpen,
    description: 'Fréquence, structure des revues, rôles et responsabilités',
    included: true,
    comment: '',
    section: 'intro',
    duration: '5 min',
    content: `FRÉQUENCE & PLANNING

• Deep Dive mensuel : 1er lundi de chaque mois
• Durée : 2h à 2h30
• Préparation : J-5 (données COCKPIT à jour)

STRUCTURE TYPE

1. Synthèse exécutive & météo (10 min)
2. Tour d'horizon par axe (60 min)
3. Points de décision DG (20 min)
4. Plan d'actions & prochaines étapes (15 min)

RÔLES & RESPONSABILITÉS

• DG : Arbitrage, décisions stratégiques
• Pilotes d'axe : Reporting, alertes, propositions
• PMO : Animation, consolidation, suivi`
  },
  {
    id: 'launch_5',
    title: 'Outils & Reporting - COCKPIT',
    icon: BarChart2,
    description: 'Présentation du tableau de bord, KPIs suivis',
    included: false,
    comment: '',
    section: 'intro',
    duration: '5 min',
    content: `COCKPIT - TABLEAU DE BORD PROJET

Modules disponibles :
• Dashboard KPIs temps réel
• Suivi des actions par axe
• Gestion des jalons et planning
• Matrice des risques
• Suivi budgétaire EVM
• Synchronisation Projet/Mobilisation

KPIs CLÉS SUIVIS

Avancement global (%)
Budget : Prévu / Engagé / Réalisé
Jalons : Atteints / En cours / En retard
Risques : Score global et top 5
Équipe : Recrutement vs plan`
  },
  {
    id: 'launch_6',
    title: 'Circuit de validation & Escalade',
    icon: Network,
    description: 'Processus de validation et règles de fonctionnement',
    included: false,
    comment: '',
    section: 'intro',
    duration: '4 min',
    content: `CIRCUIT DE VALIDATION

Niveau 1 - Pilote d'axe
• Décisions opérationnelles < 50M FCFA
• Délai : 48h

Niveau 2 - Comité de pilotage
• Décisions tactiques 50-500M FCFA
• Délai : 1 semaine

Niveau 3 - Direction Générale (Deep Dive)
• Décisions stratégiques > 500M FCFA
• Arbitrages inter-axes

RÈGLES D'ESCALADE

[CRITIQUE] Escalade immédiate + email DG
[HAUTE] Inscription Deep Dive suivant
[MOYENNE] Traitement comité pilotage`
  },

  // === PARTIE 2: VISION PROJET & OBJECTIFS (15 min) ===
  {
    id: 'launch_7',
    title: 'Intercalaire - Vision & Objectifs',
    icon: Compass,
    description: 'Section Vision Projet & Objectifs',
    included: true,
    comment: '',
    section: 'vision',
    duration: '1 min'
  },
  {
    id: 'launch_8',
    title: 'Vision Cosmos Angré',
    icon: Flag,
    description: 'Ambition, positionnement, cible Q4 2026, facteurs clés de succès',
    included: false,
    comment: '',
    section: 'vision',
    duration: '5 min',
    content: `NOTRE AMBITION

Faire de Cosmos Angré la référence du retail
premium en Côte d'Ivoire d'ici fin 2026

POSITIONNEMENT

• Centre commercial nouvelle génération
• Mix retail + loisirs + services
• Expérience client digitalisée
• Engagement développement durable

CIBLE : OUVERTURE Q4 2026

Date cible : Novembre 2026
Localisation : Angré, Abidjan
Surface : XX 000 m² GLA
Capacité : XXX enseignes

FACTEURS CLÉS DE SUCCÈS

1. Commercialisation > 70% à l'ouverture
2. Respect du planning travaux
3. Excellence opérationnelle dès J1
4. Communication impactante`
  },
  {
    id: 'launch_9',
    title: 'Les 6 Axes Stratégiques',
    icon: Layers,
    description: 'Présentation des axes et leurs interdépendances',
    included: true,
    comment: '',
    section: 'vision',
    duration: '5 min',
    content: `LES 6 AXES DU PROJET

AXE 1 - COMMERCIALISATION
Leasing, mix enseignes, négociations

AXE 2 - RH & ORGANISATION
Recrutement, formation, structure

AXE 3 - TECHNIQUE & HANDOVER
Construction, aménagements, réception

AXE 4 - BUDGET & PILOTAGE
Suivi budgétaire, EVM, reporting

AXE 5 - MARKETING & COMMUNICATION
Marque, médias, événements

AXE 6 - EXPLOITATION & SYSTÈME
Prestataires, IT, énergie

INTERDÉPENDANCES CLÉS
• Commercialisation ↔ Technique : Plans locataires
• Technique ↔ Exploitation : Handover
• RH ↔ Exploitation : Équipes
• Budget ↔ Tous : Arbitrages financiers`
  },
  {
    id: 'launch_10',
    title: 'Sponsors, Pilotes & Livrables',
    icon: Users,
    description: 'Sponsors et pilotes par axe, livrables attendus',
    included: false,
    comment: '',
    section: 'vision',
    duration: '4 min',
    content: `GOUVERNANCE PAR AXE

AXE COMMERCIALISATION
• Sponsor : [Nom]
• Pilote : [Nom]
• Livrables : Plan leasing, pipeline, baux signés

AXE TECHNIQUE
• Sponsor : [Nom]
• Pilote : [Nom]
• Livrables : Planning travaux, réception, handover

AXE EXPLOITATION
• Sponsor : [Nom]
• Pilote : [Nom]
• Livrables : Organisation, équipes, procédures

AXE JURIDIQUE
• Sponsor : [Nom]
• Pilote : [Nom]
• Livrables : Baux, autorisations, conformité

AXE COMMUNICATION
• Sponsor : [Nom]
• Pilote : [Nom]
• Livrables : Plan com, événements, RP`
  },

  // === PARTIE 3: ÉTAT DES LIEUX GLOBAL (20 min) ===
  {
    id: 'launch_11',
    title: 'Intercalaire - État des Lieux',
    icon: Map,
    description: 'Section État des Lieux Global',
    included: true,
    comment: '',
    section: 'etat',
    duration: '1 min'
  },
  {
    id: 'launch_12',
    title: 'Météo Projet',
    icon: CloudSun,
    description: 'Synthèse santé projet (Coût / Délai / Qualité / Risques)',
    included: true,
    comment: '',
    section: 'etat',
    duration: '4 min'
  },
  {
    id: 'launch_12b',
    title: 'Les 8 Structures du Projet',
    icon: Building2,
    description: 'Présentation des 8 structures: Centre Commercial, 4 Big Box, Zone Exposition, Marché Artisanal, Parking',
    included: true,
    comment: '',
    section: 'etat',
    duration: '6 min',
    content: `LES ${PROJET_CONFIG.nombreBatiments} BÂTIMENTS DU PROJET ${PROJET_CONFIG.nom}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CENTRE COMMERCIAL (${PROJET_CONFIG.nom})
• Surface GLA: 15 000 m² | Niveaux: R+3
• Galeries commerciales, Food Court, Espaces loisirs
• Bâtiment PILOTE - Synchronisation Construction/Mobilisation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HYPERMARCHÉ CARREFOUR
• Surface GLA: 6 000 m² | Niveaux: R+1
• Ancre alimentaire principale

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BIG BOX 1 à 4 (x4)
• Surface GLA: 6 000 m² chacun | Niveaux: R+1
• Grandes surfaces spécialisées
• Destinations: Ameublement, High-Tech, Sport, Bricolage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SURFACE GLA TOTALE: ${PROJET_CONFIG.surfaceGLA.toLocaleString()} m²`
  },
  {
    id: 'launch_13',
    title: 'Jalons Majeurs & Countdown',
    icon: Calendar,
    description: 'Jalons majeurs et compte à rebours ouverture',
    included: true,
    comment: '',
    section: 'etat',
    duration: '3 min'
  },
  {
    id: 'launch_14',
    title: 'Planning Directeur',
    icon: BarChart2,
    description: 'Macro-planning jusqu\'à l\'ouverture',
    included: true,
    comment: '',
    section: 'etat',
    duration: '4 min',
    content: `PLANNING DIRECTEUR - JALONS CLÉS

Q1 2026 (Janv-Mars)
• Lancement Deep Dives
• Finalisation plans techniques
• Démarrage phase commercialisation active

Q2 2026 (Avr-Juin)
• 50% commercialisation atteint
• Fin gros œuvre
• Recrutement équipe exploitation

Q3 2026 (Juil-Sept)
• 70% commercialisation
• Début aménagements locataires
• Formation équipes

Q4 2026 (Oct-Nov)
• Réception technique
• Handover exploitation
• OUVERTURE`
  },
  {
    id: 'launch_15',
    title: 'Phases Critiques & Dépendances',
    icon: GitCompareArrows,
    description: 'Phases critiques identifiées, dépendances inter-axes',
    included: true,
    comment: '',
    section: 'etat',
    duration: '4 min',
    content: `PHASES CRITIQUES IDENTIFIÉES

[CRITIQUE] PHASE 1 : Commercialisation locomotives (M1-M4)
• Risque : Délai signature grands comptes
• Impact : Retard cascade sur autres enseignes

[CRITIQUE] PHASE 2 : Livraison clos-couvert (M5-M6)
• Risque : Intempéries, approvisionnement
• Impact : Décalage aménagements

[CRITIQUE] PHASE 3 : Handover exploitation (M8-M9)
• Risque : Formation, procédures incomplètes
• Impact : Qualité service à l'ouverture

DÉPENDANCES INTER-AXES

Commercialisation → Technique
• Plans locataires requis pour aménagements

Technique → Exploitation
• Livraison zones communes pour formation

Juridique → Commercialisation
• Modèle bail validé avant négociations`
  },
  {
    id: 'launch_16',
    title: 'Budget Global - Cadrage',
    icon: DollarSign,
    description: 'Enveloppe globale par axe, principes EVM',
    included: true,
    comment: '',
    section: 'etat',
    duration: '4 min'
  },
  {
    id: 'launch_16b',
    title: 'Stratégie de Recrutement',
    icon: Users,
    description: 'Plan de recrutement et organisation cible',
    included: true,
    comment: '',
    section: 'etat',
    duration: '5 min',
    content: `STRATÉGIE DE RECRUTEMENT

ORGANISATION CIBLE
┌─────────────────────────────────────────┐
│           Direction Centre              │
│                  │                      │
│    ┌─────────────┼─────────────┐       │
│    │             │             │       │
│ Technique    Exploitation   Commercial │
└─────────────────────────────────────────┘

EFFECTIFS CIBLES
• Direction: 3 postes
• Technique & Maintenance: 8 postes
• Sécurité: 12 postes
• Accueil & Services: 6 postes
• Commercial & Marketing: 4 postes
TOTAL: 33 postes

PLANNING RECRUTEMENT
• Phase 1 (J-120): Équipe direction
• Phase 2 (J-90): Équipes techniques
• Phase 3 (J-60): Équipes opérationnelles
• Phase 4 (J-30): Formation & intégration`
  },
  {
    id: 'launch_16c',
    title: 'Budget Mobilisation',
    icon: Briefcase,
    description: 'Budget de mobilisation pré-ouverture',
    included: true,
    comment: '',
    section: 'etat',
    duration: '4 min',
    content: `BUDGET MOBILISATION PRÉ-OUVERTURE

RÉPARTITION PAR POSTE
┌─────────────────────┬──────────────┬─────────┐
│ Poste               │ Montant      │ %       │
├─────────────────────┼──────────────┼─────────┤
│ Recrutement         │ XXX M FCFA   │ 25%     │
│ Formation           │ XXX M FCFA   │ 15%     │
│ Équipements         │ XXX M FCFA   │ 30%     │
│ IT & Systèmes       │ XXX M FCFA   │ 20%     │
│ Divers & Imprévus   │ XXX M FCFA   │ 10%     │
├─────────────────────┼──────────────┼─────────┤
│ TOTAL               │ X XXX M FCFA │ 100%    │
└─────────────────────┴──────────────┴─────────┘

DÉCAISSEMENTS PRÉVISIONNELS
• T1 2026: 20% - Recrutements clés
• T2 2026: 40% - Équipements & IT
• T3 2026: 30% - Formation intensive
• T4 2026: 10% - Ajustements

[DECISION DG REQUISE]
Validation enveloppe mobilisation`
  },
  {
    id: 'launch_16d',
    title: 'Budget Exploitation Prévisionnel',
    icon: Scale,
    description: 'Budget d\'exploitation annuel à valider',
    included: true,
    comment: '',
    section: 'etat',
    duration: '4 min',
    content: `BUDGET EXPLOITATION ANNÉE 1

CHARGES D'EXPLOITATION
┌─────────────────────┬──────────────┬─────────┐
│ Poste               │ Annuel       │ %       │
├─────────────────────┼──────────────┼─────────┤
│ Masse salariale     │ XXX M FCFA   │ 35%     │
│ Énergie             │ XXX M FCFA   │ 20%     │
│ Maintenance         │ XXX M FCFA   │ 15%     │
│ Sécurité            │ XXX M FCFA   │ 12%     │
│ Nettoyage           │ XXX M FCFA   │ 8%      │
│ Marketing local     │ XXX M FCFA   │ 5%      │
│ Divers              │ XXX M FCFA   │ 5%      │
├─────────────────────┼──────────────┼─────────┤
│ TOTAL CHARGES       │ X XXX M FCFA │ 100%    │
└─────────────────────┴──────────────┴─────────┘

RATIO CIBLE
• Charges / CA brut: < 25%
• Point mort: Mois XX

[DECISION DG REQUISE]
Validation budget exploitation Y1`
  },

  // === PARTIE 4: REVUE PAR AXE (60 min) ===
  {
    id: 'launch_17',
    title: 'Revue des 6 Axes Stratégiques',
    icon: Layers,
    description: 'Revue détaillée de chaque axe du projet',
    included: true,
    comment: '',
    section: 'axes',
    duration: '1 min',
    content: `PARTIE 4

REVUE DES 5 AXES STRATÉGIQUES

━━━━━━━━━━━━━━━━━━━━━

Commercialisation
Technique
Exploitation
Juridique
Communication

Pour chaque axe :
• Situation actuelle
• Objectifs & Jalons
• Risques identifiés
• Décisions DG requises`
  },

  // AXE 1 - Commercialisation (10 min)
  ...generateLaunchAxeSlides('commercialisation', axesConfig.commercialisation),

  // AXE 2 - RH & Organisation (10 min)
  ...generateLaunchAxeSlides('rh', axesConfig.rh),

  // AXE 3 - Technique & Handover (10 min)
  ...generateLaunchAxeSlides('technique', axesConfig.technique),

  // AXE 4 - Budget & Pilotage (10 min)
  ...generateLaunchAxeSlides('budget', axesConfig.budget),

  // AXE 5 - Marketing & Communication (10 min)
  ...generateLaunchAxeSlides('marketing', axesConfig.marketing),

  // AXE 6 - Exploitation & Système (10 min)
  ...generateLaunchAxeSlides('exploitation', axesConfig.exploitation),

  // === PARTIE 5: CONSOLIDATION & DÉCISIONS (20 min) ===
  {
    id: 'launch_43',
    title: 'Intercalaire - Consolidation',
    icon: Shield,
    description: 'Section Consolidation & Décisions',
    included: true,
    comment: '',
    section: 'consolidation',
    duration: '1 min',
    content: `PARTIE 5

CONSOLIDATION
& DÉCISIONS

━━━━━━━━━━━━━━━━━━━━━

Vue d'ensemble des risques
Arbitrages DG requis
Plan d'actions prioritaires`
  },
  {
    id: 'launch_44',
    title: 'Matrice des Risques Globale',
    icon: Shield,
    description: 'Top 10 risques projet avec heat map',
    included: true,
    comment: '',
    section: 'consolidation',
    duration: '5 min',
    content: `MATRICE DES RISQUES GLOBALE

                IMPACT
         Faible  Moyen  Élevé  Critique
        ┌───────┬───────┬───────┬───────┐
Élevée  │       │  R7   │  R3   │  R1   │
        ├───────┼───────┼───────┼───────┤
Moyenne │  R10  │  R6   │  R4   │  R2   │
P       ├───────┼───────┼───────┼───────┤
R       │  R9   │  R8   │  R5   │       │
O       ├───────┼───────┼───────┼───────┤
B       │       │       │       │       │
        └───────┴───────┴───────┴───────┘

TOP 5 RISQUES CRITIQUES

R1: Retard signatures locomotives
    → Impact ouverture, revenus

R2: Dépassement budget construction
    → Rentabilité projet

R3: Non-obtention autorisations ERP
    → Blocage ouverture

R4: Retard approvisionnements
    → Planning travaux

R5: Recrutement équipes
    → Opérationnalité J-Day`
  },
  {
    id: 'launch_45',
    title: 'Plans de Mitigation',
    icon: CheckCircle,
    description: 'Plans de mitigation prioritaires',
    included: true,
    comment: '',
    section: 'consolidation',
    duration: '4 min',
    content: `PLANS DE MITIGATION PRIORITAIRES

RISQUE #1 : Retard commercialisation locomotives
-Action : Task force dédiée grands comptes
-Responsable : Directeur Commercial
-Échéance : M+2
-Budget : Inclus

RISQUE #2 : Dépassement budget construction
-Action : Revue value engineering
-Responsable : Directeur Technique
-Échéance : En cours
-Budget : À valider

RISQUE #3 : Délai autorisations administratives
-Action : Anticipation dossiers + suivi hebdo
-Responsable : Directeur Juridique
-Échéance : Continu
-Budget : Inclus

SUIVI MENSUEL

Chaque risque critique sera revu en Deep Dive
avec mise à jour du plan de mitigation.`
  },
  {
    id: 'launch_46',
    title: 'Points DG Consolidés',
    icon: AlertTriangle,
    description: 'Récapitulatif des décisions à prendre, priorisation',
    included: true,
    comment: '',
    section: 'consolidation',
    duration: '5 min',
    content: `DÉCISIONS DG REQUISES

PRIORITÉ 1 - URGENTES (cette session)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Validation budget marketing pré-ouverture
□ Go/No-Go négociation exclusive [Enseigne X]
□ Arbitrage options techniques façades

PRIORITÉ 2 - COURT TERME (30 jours)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Validation organigramme exploitation
□ Choix prestataires clés (sécurité, nettoyage)
□ Grille tarifaire loyers finalisée

PRIORITÉ 3 - MOYEN TERME (60 jours)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Plan média lancement
□ Politique incentives commerciales
□ Stratégie certifications

RÉCAPITULATIF
• Total décisions en attente: [X]
• Bloquantes pour planning: [X]
• Impact financier potentiel: [X] FCFA`
  },
  {
    id: 'launch_47',
    title: 'Plan d\'Actions Prioritaires',
    icon: Zap,
    description: 'Actions critiques des 30 prochains jours',
    included: true,
    comment: '',
    section: 'consolidation',
    duration: '5 min',
    content: `ACTIONS CRITIQUES - 30 PROCHAINS JOURS

SEMAINE 1-2
□ Valider gouvernance et rôles (DG)
□ Finaliser nomination pilotes d'axe
□ Lancer formation COCKPIT équipes

SEMAINE 2-3
□ Première revue pipeline commercial
□ Point planning travaux avec MOE
□ Kick-off recrutement exploitation

SEMAINE 3-4
□ Revue modèle bail avec juridique
□ Brief agence communication
□ Consolidation budget par axe

LIVRABLES ATTENDUS POUR DEEP DIVE #2

- Pipeline commercial qualifié
- Planning travaux détaillé M+6
- Organigramme exploitation cible
- Plan de communication validé`
  },

  // === PARTIE 6: CLÔTURE (10 min) ===
  {
    id: 'launch_48',
    title: 'Intercalaire - Clôture',
    icon: Award,
    description: 'Section Clôture',
    included: true,
    comment: '',
    section: 'cloture',
    duration: '1 min',
    content: `PARTIE 6

CLÔTURE

━━━━━━━━━━━━━━━━━━━━━

Calendrier 2026
Engagements collectifs
Prochaines étapes`
  },
  {
    id: 'launch_49',
    title: 'Calendrier Deep Dives 2026',
    icon: Calendar,
    description: 'Dates mensuelles, préparation attendue de chaque pilote',
    included: true,
    comment: '',
    section: 'cloture',
    duration: '3 min',
    content: `CALENDRIER DEEP DIVES 2026

┌──────────┬──────────┬─────────────────────┐
│ Mois     │ Date     │ Type                │
├──────────┼──────────┼─────────────────────┤
│ Février  │ 9 fév    │ * LANCEMENT         │
│ Mars     │ 9 mars   │ Mensuel             │
│ Avril    │ 6 avril  │ Mensuel             │
│ Mai      │ 4 mai    │ Mensuel             │
│ Juin     │ 1 juin   │ Mensuel             │
│ Juillet  │ 6 juil   │ Mensuel             │
│ Août     │ 3 août   │ Mensuel             │
│ Septembre│ 7 sept   │ Mensuel             │
│ Octobre  │ 5 oct    │ * PRÉ-OUVERTURE     │
│ Novembre │ 2 nov    │ * OUVERTURE         │
│ Décembre │ 7 déc    │ Bilan Année 1       │
└──────────┴──────────┴─────────────────────┘

PRÉPARATION ATTENDUE (J-5)
• Mise à jour COCKPIT par chaque pilote
• Consolidation alertes et décisions
• Préparation supports par section`
  },
  {
    id: 'launch_50',
    title: 'Synthèse & Mot Direction',
    icon: MessageSquare,
    description: 'Messages clés, engagements collectifs',
    included: false,
    comment: '',
    section: 'cloture',
    duration: '4 min',
    content: `MESSAGES CLÉS

-Cosmos Angré est un projet stratégique majeur
-L'ouverture Q4 2026 est notre objectif commun
-Le Deep Dive mensuel est notre outil de pilotage
-Transparence et collaboration sont essentielles

ENGAGEMENTS COLLECTIFS

En tant qu'équipe projet, nous nous engageons à :

1. Mettre à jour COCKPIT avant chaque Deep Dive
2. Remonter les alertes sans délai
3. Porter les décisions prises collectivement
4. Travailler en transverse, pas en silo

MOT DE LA DIRECTION

[Espace pour le message personnalisé
de la Direction Générale]

"Ensemble, faisons de Cosmos Angré
une réussite exceptionnelle."`
  },
  {
    id: 'launch_51',
    title: 'Page de fin',
    icon: FileText,
    description: 'Merci, contacts, prochaines étapes',
    included: true,
    comment: '',
    section: 'cloture',
    duration: '2 min',
    content: `MERCI

━━━━━━━━━━━━━━━━━━━━━

PROCHAINE SESSION
Deep Dive #2 - 9 mars 2026

CONTACTS
• Direction Projet: [email]
• Support COCKPIT: [email]
• Coordination: [email]

DOCUMENTS
• Supports de présentation disponibles sur SharePoint
• COCKPIT accessible: cockpit.cosmos-angre.ci
• Questions: projet@cosmos-angre.ci

━━━━━━━━━━━━━━━━━━━━━

${PROJET_CONFIG.nom}
Opening Q4 2026`
  },
];

// Section definitions for the launch deep dive
const launchSections = [
  { id: 'intro', title: 'Partie 1: Introduction & Gouvernance', duration: '20 min', slides: 6, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'vision', title: 'Partie 2: Vision & Objectifs', duration: '15 min', slides: 4, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'etat', title: 'Partie 3: État des Lieux Global', duration: '20 min', slides: 6, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'axes', title: 'Partie 4: Revue des 6 Axes', duration: '60 min', slides: 26, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'consolidation', title: 'Partie 5: Consolidation & Décisions', duration: '20 min', slides: 5, color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'cloture', title: 'Partie 6: Clôture', duration: '10 min', slides: 4, color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

// Sortable Slide Item Component
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

  // Close menu when clicking outside
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
      className={`p-3 ${slide.included ? 'bg-white' : 'bg-gray-50 opacity-60'} ${isDragging ? 'shadow-lg ring-2 ring-primary-400' : ''}`}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <span className="text-xs text-primary-400 w-5">{index + 1}</span>

        {/* Main slide content */}
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
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={onSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveTitle();
                  if (e.key === 'Escape') onSaveTitle();
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="w-full text-sm font-medium border border-primary-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <>
                <p className={`text-sm font-medium truncate ${slide.included ? 'text-primary-900' : 'text-gray-500'}`}>
                  {slide.title}
                </p>
                <p className="text-xs text-primary-400 truncate">{slide.description}</p>
              </>
            )}
          </div>
          {slide.duration && (
            <span className="text-xs text-primary-400 shrink-0">{slide.duration}</span>
          )}
          {slide.included ? (
            <CheckCircle className="h-4 w-4 text-success-500 shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
          )}
        </div>

        {/* Comment button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditComment();
          }}
          className="p-1 hover:bg-primary-100 rounded"
        >
          <MessageSquare className={`h-4 w-4 ${slide.comment ? 'text-primary-600' : 'text-gray-300'}`} />
        </button>

        {/* More options menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
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

      {/* Inline comment editing */}
      {slide.included && isEditingComment && (
        <div className="mt-2 ml-8 flex gap-2">
          <Input
            value={slide.comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Ajouter un commentaire pour cette slide..."
            className="text-xs flex-1"
            onClick={(e) => e.stopPropagation()}
          />
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onSaveComment(); }}>
            <Save className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Show existing comment preview */}
      {slide.included && slide.comment && !isEditingComment && (
        <div className="mt-1 ml-8">
          <p className="text-xs text-primary-500 italic truncate flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {slide.comment.length > 50 ? slide.comment.substring(0, 50) + '...' : slide.comment}
          </p>
        </div>
      )}
    </div>
  );
}

export function DeepDiveLaunch() {
  // Data hooks - données réelles du projet
  const kpis = useDashboardKPIs();
  const actions = useActions();
  const jalons = useJalons();
  const budget = useBudgetSynthese();
  const budgetParAxe = useBudgetParAxe();
  const risques = useRisques();

  // Helper functions pour récupérer les données par axe
  const getActionsForAxe = (axe: AxeType) => {
    const dbCode = axeToDbCode[axe];
    return (actions || []).filter((a) => a.axe === dbCode);
  };

  const getJalonsForAxe = (axe: AxeType) => {
    const dbCode = axeToDbCode[axe];
    const filtered = (jalons || []).filter((j) => j.axe === dbCode);
    console.log(`[DeepDive] getJalonsForAxe(${axe}) -> dbCode=${dbCode}, total jalons=${(jalons || []).length}, filtered=${filtered.length}`);
    if (filtered.length === 0 && (jalons || []).length > 0) {
      console.log('[DeepDive] Sample jalon axes:', (jalons || []).slice(0, 5).map(j => j.axe));
    }
    return filtered;
  };

  const getRisquesForAxe = (axe: AxeType) => {
    const dbCode = axeToDbCode[axe];
    return (risques || []).filter((r) => r.axe === dbCode);
  };

  const getBudgetForAxe = (axe: AxeType) => {
    const dbCode = axeToDbCode[axe];
    return budgetParAxe?.[dbCode] || { prevu: 0, engage: 0, realise: 0 };
  };

  // Calcul des données par axe pour l'affichage
  const axeDetailData = useMemo(() => {
    const axeKeys = Object.keys(axesConfig).filter(k => k !== 'general') as AxeType[];
    return axeKeys.map((axeKey) => {
      const axeActions = getActionsForAxe(axeKey);
      const axeJalons = getJalonsForAxe(axeKey);
      const axeRisques = getRisquesForAxe(axeKey);
      const axeBudget = getBudgetForAxe(axeKey);

      const actionsTerminees = axeActions.filter((a) => a.statut === 'termine').length;
      const actionsEnCours = axeActions.filter((a) => a.statut === 'en_cours').length;
      const actionsEnRetard = axeActions.filter((a) => {
        if (a.statut === 'termine') return false;
        const dateFin = new Date(a.date_fin_prevue);
        return dateFin < new Date();
      }).length;

      const jalonsAtteints = axeJalons.filter((j) => j.statut === 'atteint').length;
      const risquesCritiques = axeRisques.filter((r) => (r.score || 0) >= 12).length;

      const avancement = axeActions.length > 0
        ? Math.round(axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / axeActions.length)
        : 0;

      return {
        axe: axeKey,
        actions: axeActions.length,
        actionsTerminees,
        actionsEnCours,
        actionsEnRetard,
        jalons: axeJalons.length,
        jalonsAtteints,
        risques: axeRisques.length,
        risquesCritiques,
        budgetPrevu: axeBudget.prevu,
        budgetRealise: axeBudget.realise,
        budgetEngage: axeBudget.engage,
        avancement,
      };
    });
  }, [actions, jalons, risques, budgetParAxe]);

  // State
  const [activeTab, setActiveTab] = useState<ViewTab>('config');
  const [presentationDate, setPresentationDate] = useState('2026-02-09');
  const [projectStartDate, setProjectStartDate] = useState('2025-01-15');
  const [softOpeningDate, setSoftOpeningDate] = useState('2026-10-15');
  const [projectEndDate, setProjectEndDate] = useState('2026-11-30');
  const [projectWeather, setProjectWeather] = useState<ProjectWeather>('yellow');
  const [generating, setGenerating] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  // AI Modes - Les 3 modes peuvent être utilisés simultanément
  const [aiModes, setAiModes] = useState({
    local: { enabled: true, status: 'ready' as 'ready' | 'running' | 'error', lastResult: '' },
    openrouter: { enabled: false, status: 'ready' as 'ready' | 'running' | 'error', lastResult: '' },
    anthropic: { enabled: false, status: 'ready' as 'ready' | 'running' | 'error', lastResult: '' },
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [_aiResults, _setAiResults] = useState<{ mode: string; result: string; timestamp: Date }[]>([]);

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

  // Design settings
  const [designSettings, setDesignSettings] = useState<DesignSettings>(() => {
    const saved = localStorage.getItem('deepdive_launch_design_settings');
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

  // Slides state
  const [slides, setSlides] = useState<SlideItem[]>(launchSlides);
  const [expandedSections, setExpandedSections] = useState({
    intro: true,
    vision: true,
    etat: true,
    axes: false,
    consolidation: true,
    cloture: true,
  });

  // DG Decision points
  const [decisionPoints, setDecisionPoints] = useState<DGDecisionPoint[]>([
    {
      id: '1',
      subject: 'Validation méthodologie Deep Dive',
      amount: '-',
      urgency: 'high',
      deadline: '2026-02-09',
      recommendation: 'Valider le format et la fréquence proposés',
      axe: 'general',
    },
    {
      id: '2',
      subject: 'Enveloppe budgétaire globale',
      amount: '15 000 000 000 FCFA',
      urgency: 'critical',
      deadline: '2026-02-15',
      recommendation: 'Confirmer l\'enveloppe et la répartition par axe',
      axe: 'general',
    },
    {
      id: '3',
      subject: 'Nomination des pilotes d\'axe',
      amount: '-',
      urgency: 'critical',
      deadline: '2026-02-09',
      recommendation: 'Valider les nominations proposées',
      axe: 'general',
    },
  ]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Toggle slide inclusion
  const toggleSlide = (slideId: string) => {
    setSlides(prev =>
      prev.map(s => (s.id === slideId ? { ...s, included: !s.included } : s))
    );
  };

  // Update slide comment
  const updateSlideComment = (slideId: string, comment: string) => {
    setSlides(prev =>
      prev.map(s => (s.id === slideId ? { ...s, comment } : s))
    );
  };

  // Update slide title
  const updateSlideTitle = (slideId: string, title: string) => {
    setSlides(prev =>
      prev.map(s => (s.id === slideId ? { ...s, title } : s))
    );
  };

  // Update slide (multiple fields)
  const updateSlide = (slideId: string, updates: Partial<SlideItem>) => {
    setSlides(prev =>
      prev.map(s => (s.id === slideId ? { ...s, ...updates } : s))
    );
  };

  // Get slide being edited
  const editingSlide = editingSlideId ? slides.find(s => s.id === editingSlideId) : null;

  // Duplicate slide
  const duplicateSlide = (slideId: string) => {
    setSlides(prev => {
      const index = prev.findIndex(s => s.id === slideId);
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

  // Delete slide
  const deleteSlide = (slideId: string) => {
    setSlides(prev => prev.filter(s => s.id !== slideId));
  };

  // Handle drag end for reordering within a section
  const handleDragEnd = (event: DragEndEvent, sectionId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSlides(prev => {
        const sectionSlides = prev.filter(s => s.section === sectionId);

        const oldIndex = sectionSlides.findIndex(s => s.id === active.id);
        const newIndex = sectionSlides.findIndex(s => s.id === over.id);

        const reorderedSection = arrayMove(sectionSlides, oldIndex, newIndex);

        // Rebuild the full slides array maintaining section order
        const result: SlideItem[] = [];
        launchSections.forEach(section => {
          if (section.id === sectionId) {
            result.push(...reorderedSection);
          } else {
            result.push(...prev.filter(s => s.section === section.id));
          }
        });

        return result;
      });
    }
  };

  // Get slides by section
  const getSlidesBySection = (sectionId: string) => {
    return slides.filter(s => s.section === sectionId);
  };

  // Calculate included slides count
  const includedSlidesCount = slides.filter(s => s.included).length;

  // Preview slides (only included)
  const previewSlides = useMemo(() => slides.filter(s => s.included), [slides]);

  // Add decision point
  const addDecisionPoint = () => {
    setDecisionPoints(prev => [
      ...prev,
      {
        id: String(Date.now()),
        subject: '',
        amount: '',
        urgency: 'medium',
        deadline: '',
        recommendation: '',
        axe: 'general',
      },
    ]);
  };

  // Remove decision point
  const removeDecisionPoint = (id: string) => {
    setDecisionPoints(prev => prev.filter(p => p.id !== id));
  };

  // Update decision point
  const updateDecisionPoint = (id: string, field: keyof DGDecisionPoint, value: string) => {
    setDecisionPoints(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Save design settings
  const saveDesignSettings = () => {
    localStorage.setItem('deepdive_launch_design_settings', JSON.stringify(designSettings));
    setDesignSaved(true);
  };

  // Navigate preview
  const navigatePreview = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && previewSlideIndex > 0) {
      setPreviewSlideIndex(previewSlideIndex - 1);
    } else if (direction === 'next' && previewSlideIndex < previewSlides.length - 1) {
      setPreviewSlideIndex(previewSlideIndex + 1);
    }
  };

  // Render slide footer
  const renderSlideFooter = (slideNumber: number, totalSlides: number) => {
    const { showSlideNumbers, showDate, primaryColor } = designSettings;
    if (!showSlideNumbers && !showDate) return null;

    return (
      <div className="px-6 py-2 border-t flex items-center justify-between text-xs text-gray-400">
        {showDate ? (
          <span>Deep Dive #1 Cosmos Angré - {new Date(presentationDate).toLocaleDateString('fr-FR')}</span>
        ) : <span />}
        {showSlideNumbers && (
          <span style={{ color: primaryColor }}>{slideNumber} / {totalSlides}</span>
        )}
      </div>
    );
  };

  // Render slide preview content
  const renderSlidePreview = (slideItem: SlideItem) => {
    const { primaryColor, accentColor, fontFamily, headerStyle } = designSettings;
    const currentIndex = previewSlides.findIndex((s) => s.id === slideItem.id);
    const slideNumber = currentIndex + 1;
    const totalSlides = previewSlides.length;

    const baseStyles = {
      fontFamily,
      backgroundColor: '#ffffff',
      overflow: 'hidden' as const,
    };

    const headerBg = headerStyle === 'full' ? primaryColor : headerStyle === 'minimal' ? `${primaryColor}15` : 'transparent';
    const headerTextColor = headerStyle === 'full' ? '#ffffff' : primaryColor;

    // === PAGE DE GARDE ===
    if (slideItem.id === 'launch_1') {
      return (
        <div style={{ ...baseStyles, backgroundColor: primaryColor }} className="h-full flex flex-col items-center justify-center text-white p-8">
          <h1 className="text-4xl font-bold mb-2">{PROJET_CONFIG.nom}</h1>
          <div className="w-24 h-1 mb-6" style={{ backgroundColor: accentColor }} />
          <h2 className="text-2xl mb-2" style={{ color: accentColor }}>Deep Dive #1</h2>
          <p className="text-lg opacity-80">Lancement & Cadrage</p>
          <p className="text-sm opacity-60 mt-4">
            {new Date(presentationDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="mt-8 text-xs opacity-50">Présentation Direction Générale</div>
        </div>
      );
    }

    // === AGENDA ===
    if (slideItem.id === 'launch_2') {
      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: primaryColor }}>
              <h2 className="text-lg font-bold text-white">Agenda de la Session (~2h30)</h2>
            </div>
          )}
          <div className="flex-1 px-6 py-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-3">
              {launchSections.map((section, idx) => (
                <div key={section.id} className={`p-3 rounded-lg border ${section.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold bg-white/50">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold">{section.title.replace(`Partie ${idx + 1}: `, '')}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>{section.slides} slides</span>
                    <span>{section.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === MÉTHODOLOGIE DEEP DIVE ===
    if (slideItem.id === 'launch_4') {
      const structure = [
        { phase: 'Synthèse', duration: '10 min', icon: BarChart2, color: '#3B82F6', desc: 'Météo & KPIs' },
        { phase: 'Revue Axes', duration: '60 min', icon: RefreshCw, color: '#8B5CF6', desc: '5 axes stratégiques' },
        { phase: 'Décisions', duration: '20 min', icon: CheckCircle, color: '#10B981', desc: 'Arbitrages DG' },
        { phase: 'Actions', duration: '15 min', icon: Target, color: '#F59E0B', desc: 'Plan 30 jours' },
      ];

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Méthodologie Deep Dive</h2>
            </div>
          )}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Frequency badge */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="px-4 py-2 rounded-full text-white text-sm font-bold flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                <Calendar className="h-4 w-4" /> 1er lundi du mois
              </div>
              <div className="px-4 py-2 rounded-full text-white text-sm font-bold flex items-center gap-2" style={{ backgroundColor: accentColor }}>
                <Clock className="h-4 w-4" /> 2h à 2h30
              </div>
            </div>

            {/* Structure visuelle */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-xs font-semibold text-gray-500 mb-3">DÉROULÉ TYPE</div>
              <div className="flex items-stretch gap-2">
                {structure.map((item, idx) => (
                  <div key={item.phase} className="flex-1 relative">
                    <div
                      className="rounded-lg p-3 text-white text-center h-full flex flex-col justify-center"
                      style={{ backgroundColor: item.color }}
                    >
                      <div className="flex justify-center mb-1">{React.createElement(item.icon, { className: 'h-6 w-6' })}</div>
                      <div className="text-xs font-bold">{item.phase}</div>
                      <div className="text-[10px] opacity-80">{item.duration}</div>
                      <div className="text-[9px] mt-1 opacity-70">{item.desc}</div>
                    </div>
                    {idx < structure.length - 1 && (
                      <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 z-10 text-gray-400">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rôles */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { role: 'Direction Générale', resp: 'Arbitrage & Décisions', color: primaryColor, icon: Briefcase },
                { role: 'Pilotes d\'Axe', resp: 'Reporting & Alertes', color: '#8B5CF6', icon: ClipboardList },
                { role: 'PMO', resp: 'Animation & Suivi', color: '#10B981', icon: Target },
              ].map((item) => (
                <div key={item.role} className="rounded-lg border-2 p-2 text-center" style={{ borderColor: item.color }}>
                  <div className="flex justify-center mb-1">{React.createElement(item.icon, { className: 'h-5 w-5', style: { color: item.color } })}</div>
                  <div className="text-xs font-bold" style={{ color: item.color }}>{item.role}</div>
                  <div className="text-[10px] text-gray-500">{item.resp}</div>
                </div>
              ))}
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === STRATÉGIE DE RECRUTEMENT ===
    if (slideItem.id === 'launch_16b') {
      const orgChart = [
        { level: 0, title: 'Directeur Centre', count: 1, color: primaryColor },
        { level: 1, roles: [
          { title: 'Resp. Technique', count: 1, team: 7, color: '#8B5CF6' },
          { title: 'Resp. Exploitation', count: 1, team: 18, color: '#10B981' },
          { title: 'Resp. Commercial', count: 1, team: 3, color: '#3B82F6' },
        ]},
      ];

      const timeline = [
        { phase: 'Direction', period: 'J-120', positions: 3, status: 'active' },
        { phase: 'Technique', period: 'J-90', positions: 8, status: 'pending' },
        { phase: 'Opérations', period: 'J-60', positions: 18, status: 'pending' },
        { phase: 'Formation', period: 'J-30', positions: '—', status: 'pending' },
      ];

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Stratégie de Recrutement</h2>
            </div>
          )}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Org Chart */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-xs font-semibold text-gray-500 mb-2">ORGANISATION CIBLE</div>
              <div className="flex flex-col items-center">
                <div className="px-4 py-2 rounded-lg text-white text-sm font-bold mb-3 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
                  <Briefcase className="h-4 w-4" /> Directeur Centre
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="grid grid-cols-3 gap-4 w-full">
                  {orgChart[1].roles.map((role) => (
                    <div key={role.title} className="text-center">
                      <div className="w-full h-1 mb-2" style={{ backgroundColor: role.color }} />
                      <div className="text-xs font-semibold" style={{ color: role.color }}>{role.title}</div>
                      <div className="text-[10px] text-gray-500">+ {role.team} personnes</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Planning Recrutement */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-xs font-semibold text-gray-500 mb-2">PLANNING RECRUTEMENT</div>
              <div className="flex gap-2">
                {timeline.map((item, _idx) => (
                  <div key={item.phase} className="flex-1">
                    <div className={`p-2 rounded-lg text-center ${item.status === 'active' ? 'bg-blue-100 border-2 border-blue-400' : 'bg-white border border-gray-200'}`}>
                      <div className="text-xs font-bold text-gray-700">{item.period}</div>
                      <div className="text-[10px] font-semibold" style={{ color: item.status === 'active' ? '#3B82F6' : '#6B7280' }}>{item.phase}</div>
                      <div className="text-lg font-bold" style={{ color: primaryColor }}>{item.positions}</div>
                      <div className="text-[9px] text-gray-400">{typeof item.positions === 'number' ? 'postes' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
              <span className="text-sm font-semibold" style={{ color: primaryColor }}>EFFECTIF TOTAL CIBLE</span>
              <span className="text-2xl font-bold" style={{ color: primaryColor }}>33 postes</span>
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === BUDGET MOBILISATION ===
    if (slideItem.id === 'launch_16c') {
      const budgetItems = [
        { label: 'Recrutement', amount: 150, percent: 25, color: '#3B82F6' },
        { label: 'Formation', amount: 90, percent: 15, color: '#8B5CF6' },
        { label: 'Équipements', amount: 180, percent: 30, color: '#10B981' },
        { label: 'IT & Systèmes', amount: 120, percent: 20, color: '#F59E0B' },
        { label: 'Imprévus', amount: 60, percent: 10, color: '#6B7280' },
      ];
      const total = budgetItems.reduce((sum, item) => sum + item.amount, 0);

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Budget Mobilisation</h2>
            </div>
          )}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Stacked bar chart */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-xs font-semibold text-gray-500 mb-2">RÉPARTITION BUDGET</div>
              <div className="h-8 rounded-lg overflow-hidden flex mb-2">
                {budgetItems.map((item) => (
                  <div
                    key={item.label}
                    className="h-full flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: item.color, width: `${item.percent}%` }}
                  >
                    {item.percent}%
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {budgetItems.map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                    <div className="text-[9px] font-medium text-gray-600">{item.label}</div>
                    <div className="text-[10px] font-bold" style={{ color: item.color }}>{item.amount}M</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-xs font-semibold text-gray-500 mb-2">DÉCAISSEMENTS PRÉVISIONNELS</div>
              <div className="flex gap-2">
                {[
                  { period: 'T1 2026', percent: 20, label: 'Recrutements' },
                  { period: 'T2 2026', percent: 40, label: 'Équipements' },
                  { period: 'T3 2026', percent: 30, label: 'Formation' },
                  { period: 'T4 2026', percent: 10, label: 'Ajustements' },
                ].map((item) => (
                  <div key={item.period} className="flex-1 text-center">
                    <div className="text-[10px] text-gray-500 mb-1">{item.period}</div>
                    <div className="h-16 bg-gray-200 rounded relative">
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded"
                        style={{ height: `${item.percent * 2}%`, backgroundColor: primaryColor }}
                      />
                    </div>
                    <div className="text-xs font-bold mt-1" style={{ color: primaryColor }}>{item.percent}%</div>
                    <div className="text-[9px] text-gray-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total & Decision */}
            <div className="flex items-center justify-between p-3 rounded-lg border-2" style={{ borderColor: '#F59E0B', backgroundColor: '#FEF3C7' }}>
              <div>
                <div className="text-xs text-amber-700">[DECISION DG REQUISE]</div>
                <div className="text-sm font-semibold text-amber-900">Validation enveloppe mobilisation</div>
              </div>
              <div className="text-2xl font-bold" style={{ color: primaryColor }}>{total}M FCFA</div>
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === BUDGET EXPLOITATION ===
    if (slideItem.id === 'launch_16d') {
      const chargesItems = [
        { label: 'Masse salariale', percent: 35, color: '#3B82F6' },
        { label: 'Énergie', percent: 20, color: '#F59E0B' },
        { label: 'Maintenance', percent: 15, color: '#8B5CF6' },
        { label: 'Sécurité', percent: 12, color: '#EF4444' },
        { label: 'Nettoyage', percent: 8, color: '#10B981' },
        { label: 'Marketing', percent: 5, color: '#EC4899' },
        { label: 'Divers', percent: 5, color: '#6B7280' },
      ];

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Budget Exploitation Année 1</h2>
            </div>
          )}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Donut-like visualization */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-xs font-semibold text-gray-500 mb-2">CHARGES D'EXPLOITATION</div>
              <div className="flex items-center gap-4">
                {/* Horizontal stacked bar */}
                <div className="flex-1">
                  <div className="h-6 rounded-lg overflow-hidden flex mb-2">
                    {chargesItems.map((item) => (
                      <div
                        key={item.label}
                        className="h-full"
                        style={{ backgroundColor: item.color, width: `${item.percent}%` }}
                        title={`${item.label}: ${item.percent}%`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {chargesItems.slice(0, 4).map((item) => (
                      <div key={item.label} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[9px] text-gray-600 truncate">{item.label}</span>
                        <span className="text-[9px] font-bold" style={{ color: item.color }}>{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {chargesItems.slice(4).map((item) => (
                      <div key={item.label} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[9px] text-gray-600 truncate">{item.label}</span>
                        <span className="text-[9px] font-bold" style={{ color: item.color }}>{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                <div className="text-[10px] text-blue-600 mb-1">Ratio Charges / CA</div>
                <div className="text-2xl font-bold text-blue-700">&lt; 25%</div>
                <div className="text-[9px] text-blue-500">Objectif cible</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                <div className="text-[10px] text-green-600 mb-1">Point Mort</div>
                <div className="text-2xl font-bold text-green-700">M+18</div>
                <div className="text-[9px] text-green-500">Prévisionnel</div>
              </div>
            </div>

            {/* Decision */}
            <div className="flex items-center justify-between p-3 rounded-lg border-2" style={{ borderColor: '#F59E0B', backgroundColor: '#FEF3C7' }}>
              <div>
                <div className="text-xs text-amber-700">[DECISION DG REQUISE]</div>
                <div className="text-sm font-semibold text-amber-900">Validation budget exploitation Y1</div>
              </div>
              <div className="text-xl font-bold" style={{ color: primaryColor }}>À valider</div>
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === INTERCALAIRE AXES (Axe Commercialisation, etc.) ===
    if (slideItem.id.includes('_intro') && slideItem.title.startsWith('Axe ')) {
      const axeName = slideItem.title.replace('Axe ', '');
      const axeColors: Record<string, string> = {
        'Commercialisation': '#1C3163',
        'RH & Organisation': '#D4AF37',
        'Technique & Handover': '#10B981',
        'Budget & Pilotage': '#F59E0B',
        'Marketing & Communication': '#EF4444',
        'Exploitation & Système': '#8B5CF6',
      };
      const axeColor = axeColors[axeName] || primaryColor;

      return (
        <div style={{ ...baseStyles, backgroundColor: primaryColor }} className="h-full flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: axeColor, transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: axeColor, transform: 'translate(-30%, 30%)' }} />

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto" style={{ backgroundColor: axeColor }}>
              {React.createElement(slideItem.icon, { className: 'h-10 w-10 text-white' })}
            </div>
            <div className="text-sm uppercase tracking-widest opacity-60 mb-2">Axe Stratégique</div>
            <h2 className="text-3xl font-bold mb-4">{axeName}</h2>
            <div className="w-24 h-1 mx-auto rounded" style={{ backgroundColor: accentColor }} />
            <div className="mt-6 grid grid-cols-4 gap-4 text-center">
              {[
                { label: 'Situation', icon: BarChart2 },
                { label: 'Objectifs', icon: Target },
                { label: 'Risques', icon: AlertTriangle },
                { label: 'Décisions', icon: CheckCircle },
              ].map((item) => (
                <div key={item.label} className="opacity-70">
                  <div className="flex justify-center mb-1">{React.createElement(item.icon, { className: 'h-5 w-5' })}</div>
                  <div className="text-[10px]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // === INTERCALAIRE SLIDES (sections) ===
    if (slideItem.title.includes('Intercalaire')) {
      const sectionInfo = launchSections.find(s => slideItem.section === s.id);
      const sectionNumber = launchSections.findIndex(s => slideItem.section === s.id) + 1;

      // Get section-specific content
      const sectionContents: Record<string, { subtitle: string; items: string[] }> = {
        'intro': {
          subtitle: 'Cadrage & Gouvernance',
          items: ['Méthodologie', 'Organisation', 'Outils']
        },
        'vision': {
          subtitle: 'Ambition & Stratégie',
          items: ['Vision', 'Objectifs', 'Axes']
        },
        'etat': {
          subtitle: 'Synthèse Globale',
          items: ['Météo', 'Jalons', 'Budget', 'Recrutement']
        },
        'axes': {
          subtitle: '6 Axes Stratégiques',
          items: ['Commercialisation', 'RH', 'Technique', 'Budget', 'Marketing', 'Exploitation']
        },
        'consolidation': {
          subtitle: 'Arbitrages & Actions',
          items: ['Risques', 'Décisions', 'Plan d\'actions']
        },
        'cloture': {
          subtitle: 'Prochaines Étapes',
          items: ['Calendrier', 'Engagements']
        },
      };

      const content = sectionContents[slideItem.section] || { subtitle: '', items: [] };

      return (
        <div style={{ ...baseStyles, backgroundColor: primaryColor }} className="h-full flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full" />
            <div className="absolute bottom-10 right-10 w-24 h-24 border-4 border-white rounded-full" />
            <div className="absolute top-1/2 right-20 w-16 h-16 border-4 border-white rounded-full" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 mb-6">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: accentColor, color: primaryColor }}>
                {sectionNumber}
              </span>
              <span className="text-sm uppercase tracking-wider opacity-80">Partie {sectionNumber}</span>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-6 mx-auto">
              {React.createElement(slideItem.icon, { className: 'h-10 w-10', style: { color: accentColor } })}
            </div>

            <h2 className="text-3xl font-bold mb-2">
              {sectionInfo?.title.replace(`Partie ${sectionNumber}: `, '') || slideItem.title.replace('Intercalaire - ', '')}
            </h2>
            <p className="text-lg opacity-70 mb-6">{content.subtitle}</p>

            <div className="w-24 h-1 mx-auto rounded mb-6" style={{ backgroundColor: accentColor }} />

            {/* Section items */}
            <div className="flex flex-wrap justify-center gap-2">
              {content.items.map((item) => (
                <span key={item} className="px-3 py-1 rounded-full bg-white/10 text-sm">
                  {item}
                </span>
              ))}
            </div>

            {sectionInfo && (
              <p className="text-xs opacity-50 mt-6">{sectionInfo.duration} • {sectionInfo.slides} slides</p>
            )}
          </div>
        </div>
      );
    }

    // === LES 5 AXES STRATÉGIQUES ===
    if (slideItem.id === 'launch_9') {
      // Calculate project timeline
      const startDate = new Date(projectStartDate);
      const endDate = new Date(projectEndDate);
      const softDate = new Date(softOpeningDate);
      const _totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Axes timeline configuration (percentage of project duration) - 6 axes
      const axesTimeline = [
        { key: 'commercialisation', label: 'COMMERCIALISATION', color: '#3B82F6', start: 0, end: 95, milestone: '70%' },
        { key: 'rh', label: 'RH & ORGA', color: '#EF4444', start: 30, end: 100, milestone: 'Équipe' },
        { key: 'technique', label: 'TECHNIQUE', color: '#8B5CF6', start: 0, end: 100, milestone: 'Livr.' },
        { key: 'budget', label: 'BUDGET', color: '#F97316', start: 0, end: 100, milestone: 'Suivi' },
        { key: 'marketing', label: 'MARKETING', color: '#EC4899', start: 40, end: 100, milestone: 'Lncmt' },
        { key: 'exploitation', label: 'EXPLOIT.', color: '#10B981', start: 50, end: 100, milestone: 'J-Day' },
      ];

      const softOpeningPercent = Math.round(((softDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100);

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Les 6 Axes Stratégiques</h2>
            </div>
          )}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Axes list with descriptions */}
            <div className="grid grid-cols-6 gap-1 mb-4">
              {axesTimeline.map((axe) => (
                <div key={axe.key} className="text-center p-2 rounded-lg" style={{ backgroundColor: `${axe.color}15` }}>
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: axe.color }} />
                  <div className="text-[10px] font-bold" style={{ color: axe.color }}>{axe.label}</div>
                </div>
              ))}
            </div>

            {/* Gantt Chart */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-2">PLANNING PAR AXE</div>

              {/* Timeline header */}
              <div className="flex items-center mb-1 text-[9px] text-gray-500">
                <div className="w-24 flex-shrink-0" />
                <div className="flex-1 flex justify-between px-1">
                  <span>Q1'25</span>
                  <span>Q2'25</span>
                  <span>Q3'25</span>
                  <span>Q4'25</span>
                  <span>Q1'26</span>
                  <span>Q2'26</span>
                  <span>Q3'26</span>
                  <span>Q4'26</span>
                </div>
              </div>

              {/* Axes bars */}
              <div className="space-y-1.5">
                {axesTimeline.map((axe) => (
                  <div key={axe.key} className="flex items-center">
                    <div className="w-24 flex-shrink-0 text-[9px] font-medium truncate pr-2" style={{ color: axe.color }}>
                      {axe.label}
                    </div>
                    <div className="flex-1 h-4 bg-gray-200 rounded relative">
                      {/* Soft opening marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-10"
                        style={{ left: `${softOpeningPercent}%` }}
                        title="Soft Opening"
                      />
                      {/* Bar */}
                      <div
                        className="absolute top-0.5 bottom-0.5 rounded"
                        style={{
                          left: `${axe.start}%`,
                          width: `${axe.end - axe.start}%`,
                          backgroundColor: axe.color,
                        }}
                      />
                      {/* Milestone */}
                      <div
                        className="absolute top-0 text-[7px] text-white font-medium px-1 truncate"
                        style={{ left: `${axe.start + 2}%`, lineHeight: '16px' }}
                      >
                        {axe.milestone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-2 text-[8px] text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  <span>Soft Opening ({new Date(softOpeningDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                  <span>Ouverture ({new Date(projectEndDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })})</span>
                </div>
              </div>
            </div>

            {/* Interdependencies */}
            <div className="text-[10px] text-gray-600">
              <div className="font-semibold mb-1">Interdépendances clés:</div>
              <div className="grid grid-cols-2 gap-1">
                <span>• Commercialisation ↔ Technique : Plans locataires</span>
                <span>• Technique ↔ Exploitation : Handover</span>
                <span>• Juridique ↔ Commercialisation : Baux</span>
                <span>• Communication ↔ Tous : Coordination</span>
              </div>
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === MÉTÉO PROJET ===
    if (slideItem.id === 'launch_12') {
      const daysToOpening = Math.ceil((new Date(projectEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const _daysToSoftOpening = Math.ceil((new Date(softOpeningDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      // Calcul des vraies données
      const budgetData = budget;
      const tauxConsommation = budgetData?.prevu > 0
        ? Math.round((budgetData.realise / budgetData.prevu) * 100)
        : 0;
      const budgetStatus = tauxConsommation > 100 ? 'Dépassement' : tauxConsommation > 80 ? 'Attention' : 'Sur budget';
      const budgetColor = tauxConsommation > 100 ? '#EF4444' : tauxConsommation > 80 ? '#F59E0B' : '#10B981';

      const totalRisques = (risques || []).length;
      const risquesCritiques = (risques || []).filter(r => (r.score || 0) >= 12).length;
      const risquesStatus = risquesCritiques > 0 ? `${risquesCritiques} critique${risquesCritiques > 1 ? 's' : ''}` : `${totalRisques} identifié${totalRisques > 1 ? 's' : ''}`;
      const risquesColor = risquesCritiques > 0 ? '#EF4444' : totalRisques > 5 ? '#F59E0B' : '#10B981';

      const totalActions = (actions || []).length;
      const actionsTerminees = (actions || []).filter(a => a.statut === 'termine').length;
      const qualiteStatus = totalActions > 0 ? `${Math.round((actionsTerminees / totalActions) * 100)}% complété` : 'En démarrage';

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Météo Projet - État Initial</h2>
            </div>
          )}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border-2 text-center" style={{ borderColor: weatherConfig[projectWeather].color, backgroundColor: `${weatherConfig[projectWeather].color}10` }}>
                <div className="flex justify-center mb-2">
                  {React.createElement(weatherConfig[projectWeather].icon, {
                    className: 'h-12 w-12',
                    style: { color: weatherConfig[projectWeather].color }
                  })}
                </div>
                <div className="text-sm font-semibold" style={{ color: weatherConfig[projectWeather].color }}>
                  {weatherConfig[projectWeather].label.split(' ')[0]}
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                {[
                  { label: 'Coût', value: budgetStatus, color: budgetColor, icon: Zap },
                  { label: 'Délai', value: `J-${daysToOpening} ouverture`, color: '#3B82F6', icon: Clock },
                  { label: 'Qualité', value: qualiteStatus, color: primaryColor, icon: CheckCircle },
                  { label: 'Risques', value: risquesStatus, color: risquesColor, icon: AlertTriangle },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-gray-50 border">
                    <div className="text-sm font-bold flex items-center gap-1" style={{ color: item.color }}>
                      {React.createElement(item.icon, { className: 'h-3 w-3' })} {item.value}
                    </div>
                    <div className="text-xs text-gray-500">{item.label}</div>
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
    }

    // === JALONS MAJEURS ===
    if (slideItem.id === 'launch_13') {
      const upcomingJalons = (jalons || []).slice(0, 6);
      const daysToOpening = Math.ceil((new Date(projectEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const openingDate = new Date(projectEndDate);
      const quarter = Math.ceil((openingDate.getMonth() + 1) / 3);
      const quarterLabel = `Q${quarter} ${openingDate.getFullYear()}`;

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Jalons Majeurs & Countdown</h2>
            </div>
          )}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                <div className="text-3xl font-bold" style={{ color: primaryColor }}>J-{daysToOpening}</div>
                <div className="text-xs text-gray-600">Ouverture prévue</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-2xl font-bold text-gray-700">{quarterLabel}</div>
                <div className="text-xs text-gray-600">Date cible</div>
              </div>
            </div>
            <div className="space-y-2">
              {upcomingJalons.map((jalon, idx) => (
                <div key={jalon.id || idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: primaryColor }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{jalon.titre || 'Jalon'}</div>
                    {jalon.responsable && (
                      <div className="text-[10px] text-gray-500 truncate">{jalon.responsable}</div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </div>
              ))}
              {upcomingJalons.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-4">Jalons à définir</div>
              )}
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === LES 8 STRUCTURES DU PROJET ===
    if (slideItem.id === 'launch_12b') {
      const buildings = [
        {
          nom: 'Centre Commercial',
          code: 'CC',
          type: 'R+4',
          surface: '25 000 m²',
          status: 'en_cours',
          statusLabel: 'En cours',
          statusColor: '#F59E0B',
          avancement: 45,
          description: 'Supermarché livré, galeries en cours',
          icon: Building2,
        },
        {
          nom: 'Big Box 1',
          code: 'BB1',
          type: 'R+1',
          surface: '6 000 m²',
          status: 'non_demarre',
          statusLabel: 'Non démarré',
          statusColor: '#6B7280',
          avancement: 0,
          description: 'Grandes enseignes',
          icon: Layers,
        },
        {
          nom: 'Big Box 2',
          code: 'BB2',
          type: 'R+1',
          surface: '6 000 m²',
          status: 'non_demarre',
          statusLabel: 'Non démarré',
          statusColor: '#6B7280',
          avancement: 0,
          description: 'Grandes enseignes',
          icon: Layers,
        },
        {
          nom: 'Big Box 3',
          code: 'BB3',
          type: 'R+1',
          surface: '6 000 m²',
          status: 'non_demarre',
          statusLabel: 'Non démarré',
          statusColor: '#6B7280',
          avancement: 0,
          description: 'Grandes enseignes',
          icon: Layers,
        },
        {
          nom: 'Big Box 4',
          code: 'BB4',
          type: 'R+1',
          surface: '6 000 m²',
          status: 'non_demarre',
          statusLabel: 'Non démarré',
          statusColor: '#6B7280',
          avancement: 0,
          description: 'Grandes enseignes',
          icon: Layers,
        },
        {
          nom: "Zone d'Exposition",
          code: 'ZE',
          type: 'RDC',
          surface: '4 000 m²',
          status: 'non_demarre',
          statusLabel: 'Non démarré',
          statusColor: '#6B7280',
          avancement: 0,
          description: 'Événements & Salons',
          icon: Presentation,
        },
        {
          nom: 'Marché Artisanal',
          code: 'MA',
          type: 'RDC',
          surface: '2 500 m²',
          status: 'non_demarre',
          statusLabel: 'Non démarré',
          statusColor: '#6B7280',
          avancement: 0,
          description: 'Artisans locaux',
          icon: Store,
        },
        {
          nom: 'Parking',
          code: 'PK',
          type: 'S+RDC',
          surface: '15 000 m²',
          status: 'en_cours',
          statusLabel: 'En cours',
          statusColor: '#10B981',
          avancement: 35,
          description: 'Souterrain + Surface (~500 places)',
          icon: Car,
        },
      ];

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-2" style={{ backgroundColor: headerBg }}>
              <h2 className="text-lg font-bold" style={{ color: headerTextColor }}>Les 8 Structures du Projet</h2>
            </div>
          )}
          <div className="flex-1 p-3 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 h-full">
              {buildings.map((building) => (
                <div
                  key={building.code}
                  className="rounded-lg border flex flex-col overflow-hidden"
                  style={{ borderColor: building.statusColor, borderWidth: building.avancement > 0 ? 2 : 1 }}
                >
                  {/* Header compact */}
                  <div className="px-2 py-1.5 text-white" style={{ backgroundColor: building.statusColor }}>
                    <div className="flex items-center gap-1.5">
                      {React.createElement(building.icon, { className: 'h-3.5 w-3.5' })}
                      <span className="font-bold text-xs truncate">{building.nom}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-2 bg-white">
                    <div className="text-[10px] text-gray-500 mb-1">{building.type} • {building.surface}</div>
                    <div className="text-[10px] text-gray-600 line-clamp-2">{building.description}</div>

                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span style={{ color: building.statusColor }}>{building.statusLabel}</span>
                        <span className="font-bold">{building.avancement}%</span>
                      </div>
                      <div className="mt-0.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${building.avancement}%`, backgroundColor: building.statusColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total footer */}
            <div className="mt-2 p-1.5 rounded-lg text-center" style={{ backgroundColor: `${primaryColor}10` }}>
              <span className="text-xs font-semibold" style={{ color: primaryColor }}>
                Surface GLA Totale: {PROJET_CONFIG.surfaceGLA.toLocaleString()} m²
              </span>
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === BUDGET GLOBAL ===
    if (slideItem.id === 'launch_16') {
      const budgetData = budget;
      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Budget Global - Cadrage</h2>
            </div>
          )}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>Enveloppe Globale</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Budget Total', value: budgetData ? `${budgetData.prevu.toLocaleString('fr-FR')} FCFA` : '15 Mds FCFA' },
                    { label: 'Engagé', value: budgetData ? `${budgetData.engage.toLocaleString('fr-FR')} FCFA` : '0 FCFA' },
                    { label: 'Réalisé', value: budgetData ? `${budgetData.realise.toLocaleString('fr-FR')} FCFA` : '0 FCFA' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-xs">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium" style={{ color: primaryColor }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>Répartition par Axe</h3>
                <div className="space-y-2">
                  {axeDetailData.map((axeData) => {
                    const axeConfig = axesConfig[axeData.axe];
                    const budgetAxe = axeData.budgetPrevu;
                    return (
                      <div key={axeData.axe} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: axeConfig.color }} />
                        <span className="flex-1 text-xs">{axeConfig.label.split(' ')[0]}</span>
                        <span className="text-xs font-medium" style={{ color: axeConfig.color }}>
                          {budgetAxe > 0 ? `${(budgetAxe / 1000000).toFixed(0)} M` : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === MATRICE RISQUES ===
    if (slideItem.id === 'launch_44') {
      const topRisques = (risques || []).slice(0, 5);
      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Matrice des Risques Globale</h2>
            </div>
          )}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-red-50 rounded-lg p-2 border border-red-200 text-center">
                <div className="text-xl font-bold text-red-600">{topRisques.filter(r => (r.score || 0) >= 12).length}</div>
                <div className="text-[10px] text-red-700">Critiques (≥12)</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-2 border border-orange-200 text-center">
                <div className="text-xl font-bold text-orange-600">{topRisques.filter(r => (r.score || 0) >= 8 && (r.score || 0) < 12).length}</div>
                <div className="text-[10px] text-orange-700">Élevés (8-11)</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200 text-center">
                <div className="text-xl font-bold text-yellow-600">{topRisques.filter(r => (r.score || 0) >= 4 && (r.score || 0) < 8).length}</div>
                <div className="text-[10px] text-yellow-700">Modérés (4-7)</div>
              </div>
            </div>
            <div className="space-y-1">
              {topRisques.map((risque, idx) => (
                <div key={risque.id || idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  <span className={`w-2 h-2 rounded-full ${(risque.score || 0) >= 12 ? 'bg-red-500' : (risque.score || 0) >= 8 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                  <span className="flex-1 truncate">{risque.titre || 'Risque'}</span>
                  <span className="font-medium">{risque.score || 0}</span>
                </div>
              ))}
              {topRisques.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-4">Risques à identifier</div>
              )}
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === POINTS DG CONSOLIDÉS ===
    if (slideItem.id === 'launch_46') {
      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Points DG Consolidés</h2>
            </div>
          )}
          <div className="flex-1 p-4">
            <div className="space-y-2">
              {decisionPoints.map((decision) => (
                <div key={decision.id} className="p-3 rounded-lg border" style={{ borderLeftWidth: 4, borderLeftColor: urgencyConfig[decision.urgency].color }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {React.createElement(urgencyConfig[decision.urgency].icon, { className: 'h-4 w-4', style: { color: urgencyConfig[decision.urgency].color } })}
                        <span className="font-medium text-sm">{decision.subject || 'Point de décision'}</span>
                      </div>
                      <p className="text-xs text-gray-600">{decision.recommendation}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {decision.deadline ? new Date(decision.deadline).toLocaleDateString('fr-FR') : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === CALENDRIER DEEP DIVES ===
    if (slideItem.id === 'launch_49') {
      const deepDiveDates = [
        { month: 'Février', date: '9 fév', type: 'Lancement', highlight: true },
        { month: 'Mars', date: '9 mars', type: 'Mensuel', highlight: false },
        { month: 'Avril', date: '6 avril', type: 'Mensuel', highlight: false },
        { month: 'Mai', date: '4 mai', type: 'Mensuel', highlight: false },
        { month: 'Juin', date: '1 juin', type: 'Mensuel', highlight: false },
        { month: 'Juillet', date: '6 juil', type: 'Mensuel', highlight: false },
        { month: 'Août', date: '3 août', type: 'Mensuel', highlight: false },
        { month: 'Septembre', date: '7 sept', type: 'Mensuel', highlight: false },
        { month: 'Octobre', date: '5 oct', type: 'Pre-ouverture', highlight: true },
        { month: 'Novembre', date: '2 nov', type: 'Ouverture', highlight: true },
      ];

      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>Calendrier Deep Dives 2026</h2>
            </div>
          )}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-5 gap-2">
              {deepDiveDates.map((dd, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg text-center ${dd.highlight ? 'border-2' : 'border'}`}
                  style={{ borderColor: dd.highlight ? accentColor : '#e5e7eb', backgroundColor: dd.highlight ? `${accentColor}10` : 'white' }}
                >
                  <div className="text-[10px] text-gray-500">{dd.month}</div>
                  <div className="text-sm font-bold" style={{ color: dd.highlight ? primaryColor : '#374151' }}>{dd.date}</div>
                  <div className="text-[9px]" style={{ color: dd.highlight ? accentColor : '#6b7280' }}>{dd.type}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-xs text-blue-800">Premier lundi de chaque mois - Préparation J-5 par chaque pilote d'axe</p>
            </div>
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // === PAGE DE FIN ===
    if (slideItem.id === 'launch_51') {
      return (
        <div style={{ ...baseStyles, backgroundColor: primaryColor }} className="h-full flex flex-col items-center justify-center text-white p-8">
          <h1 className="text-3xl font-bold mb-4">Merci</h1>
          <div className="w-24 h-1 mb-6" style={{ backgroundColor: accentColor }} />
          <p className="text-lg opacity-80 mb-8">Questions & Discussion</p>
          <div className="text-sm opacity-60 space-y-1 text-center">
            <p>Prochaine session: 9 mars 2026</p>
            <p>Contact: projet@cosmos-angre.ci</p>
          </div>
        </div>
      );
    }

    // === AXE SLIDES ===
    if (slideItem.id.startsWith('launch_axe_')) {
      const axeMatch = slideItem.id.match(/launch_axe_(\w+)_(\w+)/);
      if (axeMatch) {
        const axeKey = axeMatch[1] as AxeType;
        const slideType = axeMatch[2];
        const axeInfo = axesConfig[axeKey];

        // Intro slide for axe
        if (slideType === 'intro') {
          return (
            <div style={{ ...baseStyles, backgroundColor: axeInfo.color }} className="h-full flex flex-col items-center justify-center text-white p-8">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-6">
                {React.createElement(axeInfo.icon, { className: 'h-8 w-8 text-white' })}
              </div>
              <h2 className="text-2xl font-bold mb-2">{axeInfo.label}</h2>
              <p className="text-sm opacity-70">Durée: ~12 min</p>
            </div>
          );
        }

        // Situation slide
        if (slideType === 'situation') {
          const axeActions = getActionsForAxe(axeKey);
          const axeBudget = getBudgetForAxe(axeKey);
          const actionsEnCours = axeActions.filter(a => a.statut === 'en_cours').length;
          const actionsTerminees = axeActions.filter(a => a.statut === 'termine').length;
          const avancement = axeActions.length > 0
            ? Math.round(axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / axeActions.length)
            : 0;

          return (
            <div style={baseStyles} className="h-full flex flex-col">
              <div className="px-6 py-3" style={{ backgroundColor: axeInfo.color }}>
                <h2 className="text-lg font-bold text-white">{axeInfo.label} - Situation Actuelle</h2>
              </div>
              <div className="flex-1 p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2" style={{ color: axeInfo.color }}>Actions</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total</span>
                        <span className="font-medium">{axeActions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">En cours</span>
                        <span className="font-medium text-blue-600">{actionsEnCours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Terminées</span>
                        <span className="font-medium text-green-600">{actionsTerminees}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avancement</span>
                          <span className="font-bold" style={{ color: axeInfo.color }}>{avancement}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="h-1.5 rounded-full" style={{ width: `${avancement}%`, backgroundColor: axeInfo.color }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2" style={{ color: axeInfo.color }}>Budget</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prévu</span>
                        <span className="font-medium">{axeBudget.prevu > 0 ? `${(axeBudget.prevu / 1000000).toFixed(1)} M` : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Engagé</span>
                        <span className="font-medium text-blue-600">{axeBudget.engage > 0 ? `${(axeBudget.engage / 1000000).toFixed(1)} M` : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Réalisé</span>
                        <span className="font-medium text-green-600">{axeBudget.realise > 0 ? `${(axeBudget.realise / 1000000).toFixed(1)} M` : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Actions récentes */}
                {axeActions.slice(0, 3).length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-xs mb-2" style={{ color: axeInfo.color }}>Actions en cours</h4>
                    <div className="space-y-1">
                      {axeActions.filter(a => a.statut === 'en_cours').slice(0, 3).map((action, idx) => (
                        <div key={action.id || idx} className="flex items-center gap-2 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: axeInfo.color }} />
                          <span className="flex-1 truncate">{action.titre}</span>
                          <span className="text-gray-500">{action.avancement}%</span>
                        </div>
                      ))}
                    </div>
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

        // Objectifs slide
        if (slideType === 'objectifs') {
          const axeJalons = getJalonsForAxe(axeKey);
          const axeActions = getActionsForAxe(axeKey);
          const jalonsAtteints = axeJalons.filter(j => j.statut === 'atteint').length;
          const prochainJalon = axeJalons
            .filter(j => j.statut !== 'atteint')
            .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())[0];

          return (
            <div style={baseStyles} className="h-full flex flex-col">
              <div className="px-6 py-3" style={{ backgroundColor: axeInfo.color }}>
                <h2 className="text-lg font-bold text-white">{axeInfo.label} - Objectifs & Jalons</h2>
              </div>
              <div className="flex-1 p-4">
                {/* KPIs de l'axe */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-bold" style={{ color: axeInfo.color }}>{axeActions.length}</div>
                    <div className="text-[10px] text-gray-600">Actions</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-bold" style={{ color: axeInfo.color }}>{axeJalons.length}</div>
                    <div className="text-[10px] text-gray-600">Jalons</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">{jalonsAtteints}</div>
                    <div className="text-[10px] text-gray-600">Atteints</div>
                  </div>
                </div>

                {/* Prochain jalon */}
                {prochainJalon && (
                  <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: `${axeInfo.color}10`, borderLeft: `4px solid ${axeInfo.color}` }}>
                    <div className="text-xs font-medium text-gray-500 mb-1">Prochain jalon</div>
                    <div className="text-sm font-medium" style={{ color: axeInfo.color }}>{prochainJalon.titre}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-600">
                        {prochainJalon.date_prevue ? new Date(prochainJalon.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                      {prochainJalon.responsable && (
                        <span className="text-[10px] text-gray-500">{prochainJalon.responsable}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Liste des jalons */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-xs mb-2" style={{ color: axeInfo.color }}>Jalons clés</h4>
                  <div className="space-y-1.5">
                    {axeJalons.slice(0, 5).map((jalon, idx) => (
                      <div key={jalon.id || idx} className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${jalon.statut === 'atteint' ? 'bg-green-500' : ''}`} style={{ backgroundColor: jalon.statut !== 'atteint' ? axeInfo.color : undefined }} />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{jalon.titre}</div>
                          {jalon.responsable && (
                            <div className="text-[9px] text-gray-400 truncate">{jalon.responsable}</div>
                          )}
                        </div>
                        <span className="text-gray-500 whitespace-nowrap">
                          {jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : '-'}
                        </span>
                      </div>
                    ))}
                    {axeJalons.length === 0 && (
                      <div className="text-xs text-gray-400 text-center py-2">Aucun jalon défini</div>
                    )}
                  </div>
                </div>
              </div>
              {renderSlideFooter(slideNumber, totalSlides)}
            </div>
          );
        }

        // Risques slide
        if (slideType === 'risques') {
          const axeRisques = getRisquesForAxe(axeKey);
          const risquesCritiques = axeRisques.filter(r => (r.score || 0) >= 12);
          const risquesEleves = axeRisques.filter(r => (r.score || 0) >= 8 && (r.score || 0) < 12);
          const risquesModeres = axeRisques.filter(r => (r.score || 0) >= 4 && (r.score || 0) < 8);

          const getRisqueStyle = (score: number) => {
            if (score >= 12) return { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-800', desc: 'text-red-700' };
            if (score >= 8) return { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800', desc: 'text-orange-700' };
            return { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-800', desc: 'text-yellow-700' };
          };

          return (
            <div style={baseStyles} className="h-full flex flex-col">
              <div className="px-6 py-3" style={{ backgroundColor: axeInfo.color }}>
                <h2 className="text-lg font-bold text-white">{axeInfo.label} - Risques Identifiés</h2>
              </div>
              <div className="flex-1 p-4">
                {/* Résumé des risques */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 bg-red-50 rounded-lg text-center border border-red-200">
                    <div className="text-lg font-bold text-red-600">{risquesCritiques.length}</div>
                    <div className="text-[10px] text-red-700">Critiques</div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg text-center border border-orange-200">
                    <div className="text-lg font-bold text-orange-600">{risquesEleves.length}</div>
                    <div className="text-[10px] text-orange-700">Élevés</div>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg text-center border border-yellow-200">
                    <div className="text-lg font-bold text-yellow-600">{risquesModeres.length}</div>
                    <div className="text-[10px] text-yellow-700">Modérés</div>
                  </div>
                </div>

                {/* Liste des risques */}
                <div className="space-y-2">
                  {axeRisques.slice(0, 4).map((risque, idx) => {
                    const style = getRisqueStyle(risque.score || 0);
                    return (
                      <div key={risque.id || idx} className={`p-2 ${style.bg} rounded-lg border-l-4 ${style.border}`}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-3 w-3 ${style.text}`} />
                          <span className={`text-xs font-medium ${style.text} flex-1 truncate`}>{risque.titre}</span>
                          <span className={`text-xs font-bold ${style.text}`}>Score: {risque.score || 0}</span>
                        </div>
                        {risque.description && (
                          <p className={`text-[10px] ${style.desc} mt-1 line-clamp-1`}>{risque.description}</p>
                        )}
                      </div>
                    );
                  })}
                  {axeRisques.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-4 bg-gray-50 rounded-lg">
                      Aucun risque identifié pour cet axe
                    </div>
                  )}
                </div>
              </div>
              {renderSlideFooter(slideNumber, totalSlides)}
            </div>
          );
        }

        // Decisions slide
        if (slideType === 'decisions') {
          const axeDecisions = decisionPoints.filter(d => d.axe === axeKey);
          return (
            <div style={baseStyles} className="h-full flex flex-col">
              <div className="px-6 py-3" style={{ backgroundColor: axeInfo.color }}>
                <h2 className="text-lg font-bold text-white">{axeInfo.label} - Décisions DG</h2>
              </div>
              <div className="flex-1 p-6">
                {axeDecisions.length > 0 ? (
                  <div className="space-y-2">
                    {axeDecisions.map(decision => (
                      <div key={decision.id} className="p-3 rounded-lg border" style={{ borderLeftWidth: 4, borderLeftColor: urgencyConfig[decision.urgency].color }}>
                        <div className="flex items-center gap-2 mb-1">
                          {React.createElement(urgencyConfig[decision.urgency].icon, { className: 'h-4 w-4', style: { color: urgencyConfig[decision.urgency].color } })}
                          <span className="font-medium text-sm">{decision.subject}</span>
                        </div>
                        <p className="text-xs text-gray-600">{decision.recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-400 py-8">
                    Aucune décision spécifique pour cet axe
                  </div>
                )}
              </div>
              {renderSlideFooter(slideNumber, totalSlides)}
            </div>
          );
        }
      }
    }

    // === DEFAULT SLIDE ===
    // If slide has custom content, show it
    if (slideItem.content) {
      return (
        <div style={baseStyles} className="h-full flex flex-col">
          {headerStyle !== 'none' && (
            <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
              <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>{slideItem.title}</h2>
            </div>
          )}
          <div className="flex-1 p-6 overflow-hidden">
            <p className="text-sm text-gray-500 mb-4">{slideItem.description}</p>
            <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed line-clamp-[12]">
              {slideItem.content}
            </div>
            {slideItem.comment && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-xs text-blue-600 font-medium mb-1">Notes:</p>
                <p className="text-sm text-blue-800">{slideItem.comment}</p>
              </div>
            )}
          </div>
          {renderSlideFooter(slideNumber, totalSlides)}
        </div>
      );
    }

    // Default placeholder slide
    return (
      <div style={baseStyles} className="h-full flex flex-col">
        {headerStyle !== 'none' && (
          <div className="px-6 py-3" style={{ backgroundColor: headerBg }}>
            <h2 className="text-xl font-bold" style={{ color: headerTextColor }}>{slideItem.title}</h2>
          </div>
        )}
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            {React.createElement(slideItem.icon, { className: 'h-8 w-8', style: { color: accentColor } })}
          </div>
          <p className="text-sm text-gray-600 text-center max-w-md">{slideItem.description}</p>
          {slideItem.duration && (
            <span className="mt-4 text-xs text-gray-400">Durée estimée: {slideItem.duration}</span>
          )}
          {slideItem.comment && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400 w-full max-w-md">
              <p className="text-sm text-blue-800">{slideItem.comment}</p>
            </div>
          )}
        </div>
        {renderSlideFooter(slideNumber, totalSlides)}
      </div>
    );
  };

  // Generate PPTX
  const generatePPTX = async () => {
    setGenerating(true);

    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();

      pptx.author = 'Cockpit Cosmos Angré';
      pptx.title = 'Deep Dive #1 : Lancement & Cadrage - 9 février 2026';
      pptx.subject = 'Présentation Direction Générale - Lancement';
      pptx.company = 'Cosmos Angré';

      const { primaryColor, accentColor, fontFamily, showSlideNumbers, showDate, headerStyle } = designSettings;
      const primaryHex = primaryColor.replace('#', '');
      const accentHex = accentColor.replace('#', '');

      // Helper: Add slide header
      const addSlideHeader = (slide: typeof pptx.slides[0], title: string, axeColor?: string) => {
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
        slide.addText(PROJET_CONFIG.nom, {
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

      // Helper: Add slide footer
      const addSlideFooter = (slide: typeof pptx.slides[0], pageNum: number, total: number) => {
        if (showDate) {
          slide.addText('Deep Dive #1 - Lancement & Cadrage - 9 février 2026', {
            x: 0.5,
            y: 5.2,
            w: 4,
            h: 0.3,
            fontSize: 8,
            fontFace: fontFamily,
            color: '666666',
          });
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

      // Helper: Add comment box
      const addComment = (slide: typeof pptx.slides[0], comment: string, y: number) => {
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

      // Generate slides for included slides
      const includedSlides = slides.filter(s => s.included);
      const totalSlides = includedSlides.length;

      includedSlides.forEach((slideItem, index) => {
        const slide = pptx.addSlide();
        const pageNum = index + 1;

        // Check if this is an axe-related slide
        const axeMatch = slideItem.id.match(/launch_axe_(\w+)_/);
        const axeKey = axeMatch ? axeMatch[1] as AxeType : null;
        const axeColor = axeKey && axesConfig[axeKey] ? axesConfig[axeKey].color : undefined;

        // Add header
        addSlideHeader(slide, slideItem.title, axeColor);

        // Add main content
        if (slideItem.content) {
          slide.addText(slideItem.content, {
            x: 0.5,
            y: 1.0,
            w: 9,
            h: 3.8,
            fontSize: 11,
            fontFace: fontFamily,
            color: '333333',
            valign: 'top',
          });
        } else {
          // Default content
          slide.addText(slideItem.description, {
            x: 0.5,
            y: 1.0,
            w: 9,
            h: 0.5,
            fontSize: 14,
            fontFace: fontFamily,
            color: '666666',
            italic: true,
          });
        }

        // Add comment if present
        if (slideItem.comment) {
          addComment(slide, slideItem.comment, 4.6);
        }

        // Add footer
        addSlideFooter(slide, pageNum, totalSlides);
      });

      // Generate and download
      const fileName = `DeepDive_Lancement_${new Date().toISOString().split('T')[0]}.pptx`;
      await pptx.writeFile({ fileName });

    } catch (error) {
      console.error('Erreur génération PPTX:', error);
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
            <h2 className="text-xl font-bold text-primary-900">Deep Dive #1 : Lancement & Cadrage</h2>
            <p className="text-sm text-primary-500">Projet Cosmos Angré - 9 février 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="info" className="text-sm">
            ~2h30 | {includedSlidesCount} slides
          </Badge>
          <Button onClick={generatePPTX} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Générer PPTX
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'config', label: 'Configuration', icon: Settings },
          { id: 'preview', label: 'Aperçu', icon: Eye },
          { id: 'design', label: 'Design', icon: Palette },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ViewTab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-primary-500 hover:text-primary-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Slides by section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Summary card */}
            <Card padding="md" className="bg-gradient-to-r from-primary-50 to-primary-100">
              <div className="grid grid-cols-6 gap-2 text-center">
                {launchSections.map(section => {
                  const sectionSlides = getSlidesBySection(section.id);
                  const includedCount = sectionSlides.filter(s => s.included).length;
                  return (
                    <div key={section.id} className={`p-2 rounded-lg border ${section.color}`}>
                      <p className="text-[10px] font-medium truncate">{section.title.split(':')[0]}</p>
                      <p className="text-lg font-bold">{includedCount}/{sectionSlides.length}</p>
                      <p className="text-[10px]">{section.duration}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Sections */}
            {launchSections.map(section => (
              <Card key={section.id} padding="none" className="overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id as keyof typeof expandedSections)}
                  className={`w-full flex items-center justify-between p-4 ${section.color} border-b`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{section.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {section.duration} | {getSlidesBySection(section.id).filter(s => s.included).length}/{section.slides} slides
                    </Badge>
                  </div>
                  {expandedSections[section.id as keyof typeof expandedSections] ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {expandedSections[section.id as keyof typeof expandedSections] && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, section.id)}
                  >
                    <SortableContext
                      items={getSlidesBySection(section.id).map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="divide-y">
                        {getSlidesBySection(section.id).map((slide, idx) => (
                          <SortableSlideItem
                            key={slide.id}
                            slide={slide}
                            index={idx}
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
                )}
              </Card>
            ))}
          </div>

          {/* Right: Settings & Decision Points */}
          <div className="space-y-4">
            {/* Date & Weather */}
            <Card padding="md">
              <h3 className="font-semibold text-primary-900 mb-4">Paramètres</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-primary-600 mb-1 block">Date de présentation</label>
                  <Input
                    type="date"
                    value={presentationDate}
                    onChange={e => setPresentationDate(e.target.value)}
                  />
                </div>

                {/* Project Timeline Dates */}
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-primary-800 mb-3">Dates Projet (COCKPIT)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-primary-600 mb-1 block">Début du projet</label>
                      <Input
                        type="date"
                        value={projectStartDate}
                        onChange={e => setProjectStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-primary-600 mb-1 block">Soft Opening</label>
                      <Input
                        type="date"
                        value={softOpeningDate}
                        onChange={e => setSoftOpeningDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-primary-600 mb-1 block">Fin du projet (Ouverture)</label>
                      <Input
                        type="date"
                        value={projectEndDate}
                        onChange={e => setProjectEndDate(e.target.value)}
                      />
                    </div>
                    <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                      <div className="font-medium mb-1">Délais calculés automatiquement:</div>
                      <div>• Soft Opening: J-{Math.ceil((new Date(softOpeningDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}</div>
                      <div>• Ouverture: J-{Math.ceil((new Date(projectEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-primary-600 mb-1 block">Météo projet</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(weatherConfig) as ProjectWeather[]).map(weather => (
                      <button
                        key={weather}
                        onClick={() => setProjectWeather(weather)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          projectWeather === weather
                            ? `border-current ${weatherConfig[weather].bgColor} ${weatherConfig[weather].textColor}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {React.createElement(weatherConfig[weather].icon, { className: 'h-4 w-4' })}
                          <span className="text-xs font-medium">{weatherConfig[weather].label.split(' ')[0]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Decision Points */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary-900">Points DG Initiaux</h3>
                <Button variant="ghost" size="sm" onClick={addDecisionPoint}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-3">
                {decisionPoints.map(point => (
                  <div key={point.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Input
                        placeholder="Sujet de la décision"
                        value={point.subject}
                        onChange={e => updateDecisionPoint(point.id, 'subject', e.target.value)}
                        className="text-sm"
                      />
                      <button
                        onClick={() => removeDecisionPoint(point.id)}
                        className="p-1 text-error-500 hover:bg-error-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Montant"
                        value={point.amount}
                        onChange={e => updateDecisionPoint(point.id, 'amount', e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        type="date"
                        value={point.deadline}
                        onChange={e => updateDecisionPoint(point.id, 'deadline', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={point.urgency}
                        onChange={e => updateDecisionPoint(point.id, 'urgency', e.target.value)}
                        className="flex-1 text-xs p-2 rounded border border-gray-200"
                      >
                        {(Object.keys(urgencyConfig) as UrgencyLevel[]).map(level => (
                          <option key={level} value={level}>
                            {urgencyConfig[level].label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={point.axe}
                        onChange={e => updateDecisionPoint(point.id, 'axe', e.target.value)}
                        className="flex-1 text-xs p-2 rounded border border-gray-200"
                      >
                        {(Object.keys(axesConfig) as AxeType[]).map(axe => (
                          <option key={axe} value={axe}>
                            {axesConfig[axe].shortLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Textarea
                      placeholder="Recommandation"
                      value={point.recommendation}
                      onChange={e => updateDecisionPoint(point.id, 'recommendation', e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Modes Panel - 3 modes utilisables simultanément */}
            <Card padding="md" className="bg-gradient-to-br from-gray-900 to-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-primary-400" />
                <h3 className="font-semibold text-white">Modes IA</h3>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                  Multi-Mode
                </Badge>
              </div>

              {/* 3 AI Modes - Toggles */}
              <div className="space-y-2 mb-4">
                {/* Local Mode */}
                <button
                  onClick={() => setAiModes(prev => ({ ...prev, local: { ...prev.local, enabled: !prev.local.enabled } }))}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    aiModes.local.enabled
                      ? 'bg-gray-700 border-2 border-gray-500'
                      : 'bg-gray-800/50 border-2 border-transparent hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${aiModes.local.enabled ? 'bg-gray-500' : 'bg-gray-700'}`}>
                      <Cpu className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Local</div>
                      <div className="text-xs text-gray-400">Algorithme hors-ligne</div>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${aiModes.local.enabled ? 'bg-gray-500' : 'bg-gray-700'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${aiModes.local.enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                  </div>
                </button>

                {/* OpenRouter Mode */}
                <button
                  onClick={() => setAiModes(prev => ({ ...prev, openrouter: { ...prev.openrouter, enabled: !prev.openrouter.enabled } }))}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    aiModes.openrouter.enabled
                      ? 'bg-purple-900/50 border-2 border-purple-500'
                      : 'bg-gray-800/50 border-2 border-transparent hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${aiModes.openrouter.enabled ? 'bg-purple-500' : 'bg-gray-700'}`}>
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">OpenRouter</div>
                      <div className="text-xs text-gray-400">Claude, GPT-4, Gemini...</div>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${aiModes.openrouter.enabled ? 'bg-purple-500' : 'bg-gray-700'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${aiModes.openrouter.enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                  </div>
                </button>

                {/* Anthropic Mode */}
                <button
                  onClick={() => setAiModes(prev => ({ ...prev, anthropic: { ...prev.anthropic, enabled: !prev.anthropic.enabled } }))}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    aiModes.anthropic.enabled
                      ? 'bg-orange-900/50 border-2 border-orange-500'
                      : 'bg-gray-800/50 border-2 border-transparent hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${aiModes.anthropic.enabled ? 'bg-orange-500' : 'bg-gray-700'}`}>
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Anthropic</div>
                      <div className="text-xs text-gray-400">Claude API Direct</div>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${aiModes.anthropic.enabled ? 'bg-orange-500' : 'bg-gray-700'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${aiModes.anthropic.enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              </div>

              {/* Active modes indicator */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400">Actifs:</span>
                {aiModes.local.enabled && <span className="px-2 py-0.5 bg-gray-600 text-white text-xs rounded">Local</span>}
                {aiModes.openrouter.enabled && <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded">OpenRouter</span>}
                {aiModes.anthropic.enabled && <span className="px-2 py-0.5 bg-orange-600 text-white text-xs rounded">Anthropic</span>}
                {!aiModes.local.enabled && !aiModes.openrouter.enabled && !aiModes.anthropic.enabled && (
                  <span className="text-xs text-gray-500 italic">Aucun</span>
                )}
              </div>

              {/* AI Prompt Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Demander à l'IA..."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!aiModes.local.enabled && !aiModes.openrouter.enabled && !aiModes.anthropic.enabled}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors flex items-center gap-1">
                  <FileEdit className="h-3 w-3" /> Générer contenu
                </button>
                <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors flex items-center gap-1">
                  <Target className="h-3 w-3" /> Analyser risques
                </button>
                <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Suggestions
                </button>
              </div>
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
                  Slide {previewSlideIndex + 1} / {previewSlides.length}
                </h4>
                <span className="text-sm text-primary-500">
                  {previewSlides[previewSlideIndex]?.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigatePreview('prev')} disabled={previewSlideIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigatePreview('next')} disabled={previewSlideIndex === previewSlides.length - 1}>
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
                {previewSlides[previewSlideIndex] && renderSlidePreview(previewSlides[previewSlideIndex])}
              </div>
            </div>

            {!isFullscreen && (
              <div className="mt-4 flex gap-2 overflow-x-auto py-2">
                {previewSlides.map((slide, index) => (
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

            {previewSlides[previewSlideIndex] && !isFullscreen && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  Commentaire pour cette slide
                </label>
                <Textarea
                  value={previewSlides[previewSlideIndex].comment}
                  onChange={(e) => updateSlideComment(previewSlides[previewSlideIndex].id, e.target.value)}
                  placeholder="Ajoutez un commentaire..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Color presets */}
          <Card padding="md">
            <h3 className="font-semibold text-primary-900 mb-4">Palette de couleurs</h3>
            <div className="grid grid-cols-2 gap-3">
              {colorPresets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setDesignSettings(prev => ({
                      ...prev,
                      primaryColor: preset.primary,
                      accentColor: preset.accent,
                    }));
                    setDesignSaved(false);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    designSettings.primaryColor === preset.primary
                      ? 'border-primary-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.primary }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <p className="text-xs font-medium text-primary-900">{preset.name}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs text-primary-600 mb-1 block">Couleur principale</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designSettings.primaryColor}
                    onChange={e => {
                      setDesignSettings(prev => ({ ...prev, primaryColor: e.target.value }));
                      setDesignSaved(false);
                    }}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={designSettings.primaryColor}
                    onChange={e => {
                      setDesignSettings(prev => ({ ...prev, primaryColor: e.target.value }));
                      setDesignSaved(false);
                    }}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-primary-600 mb-1 block">Couleur d'accent</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designSettings.accentColor}
                    onChange={e => {
                      setDesignSettings(prev => ({ ...prev, accentColor: e.target.value }));
                      setDesignSaved(false);
                    }}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={designSettings.accentColor}
                    onChange={e => {
                      setDesignSettings(prev => ({ ...prev, accentColor: e.target.value }));
                      setDesignSaved(false);
                    }}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Typography & Layout */}
          <Card padding="md">
            <h3 className="font-semibold text-primary-900 mb-4">Typographie & Mise en page</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-primary-600 mb-1 block">Police</label>
                <select
                  value={designSettings.fontFamily}
                  onChange={e => {
                    setDesignSettings(prev => ({ ...prev, fontFamily: e.target.value }));
                    setDesignSaved(false);
                  }}
                  className="w-full p-2 rounded border border-gray-200"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-primary-600 mb-1 block">Style d'en-tête</label>
                  <select
                    value={designSettings.headerStyle}
                    onChange={e => {
                      setDesignSettings(prev => ({
                        ...prev,
                        headerStyle: e.target.value as DesignSettings['headerStyle'],
                      }));
                      setDesignSaved(false);
                    }}
                    className="w-full p-2 rounded border border-gray-200 text-sm"
                  >
                    <option value="full">Complet</option>
                    <option value="minimal">Minimal</option>
                    <option value="none">Aucun</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-primary-600 mb-1 block">Style de fond</label>
                  <select
                    value={designSettings.backgroundStyle}
                    onChange={e => {
                      setDesignSettings(prev => ({
                        ...prev,
                        backgroundStyle: e.target.value as DesignSettings['backgroundStyle'],
                      }));
                      setDesignSaved(false);
                    }}
                    className="w-full p-2 rounded border border-gray-200 text-sm"
                  >
                    <option value="solid">Uni</option>
                    <option value="gradient">Dégradé</option>
                    <option value="pattern">Motif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={designSettings.showSlideNumbers}
                    onChange={e => {
                      setDesignSettings(prev => ({ ...prev, showSlideNumbers: e.target.checked }));
                      setDesignSaved(false);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-primary-700">Numéros de slides</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={designSettings.showDate}
                    onChange={e => {
                      setDesignSettings(prev => ({ ...prev, showDate: e.target.checked }));
                      setDesignSaved(false);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-primary-700">Afficher la date</span>
                </label>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button onClick={saveDesignSettings} disabled={designSaved}>
                <Save className="h-4 w-4 mr-2" />
                {designSaved ? 'Enregistré' : 'Enregistrer'}
              </Button>
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
                  placeholder="Ajoutez du contenu personnalisé pour cette slide (points clés, notes, données...)&#10;&#10;• Point 1&#10;• Point 2&#10;• Point 3"
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ce contenu sera affiché dans la slide lors de la prévisualisation et dans le PowerPoint généré.
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

              {/* Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Durée estimée
                  </label>
                  <Input
                    value={editingSlide.duration || ''}
                    onChange={(e) => updateSlide(editingSlide.id, { duration: e.target.value })}
                    placeholder="ex: 5 min"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Section
                  </label>
                  <select
                    value={editingSlide.section || ''}
                    onChange={(e) => updateSlide(editingSlide.id, { section: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {launchSections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Include toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="slide-included"
                  checked={editingSlide.included}
                  onChange={(e) => updateSlide(editingSlide.id, { included: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="slide-included" className="flex-1">
                  <span className="font-medium text-primary-900">Inclure cette slide</span>
                  <p className="text-xs text-gray-500">Décochez pour exclure cette slide de la présentation</p>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => deleteSlide(editingSlide.id)}
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
