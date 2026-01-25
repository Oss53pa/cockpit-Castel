import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  Users,
  Link2,
  History,
  Shield,
  Target,
  Activity,
  ChevronDown,
  ChevronRight,
  Upload,
  BarChart3,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectOption,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
} from '@/components/ui';
import { useUsers, useJalons, useActions, useRisques, createRisque, updateRisque } from '@/hooks';
import { SendReminderModal } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  AXES,
  AXE_LABELS,
  RISQUE_TYPES,
  RISQUE_SOURCES,
  RISQUE_SOURCE_LABELS,
  RISQUE_CATEGORIES,
  RISQUE_CATEGORY_LABELS,
  RISQUE_STATUSES,
  RISQUE_STATUS_LABELS,
  RISQUE_STATUS_STYLES,
  RISQUE_PHASES,
  RISQUE_PHASE_LABELS,
  RISQUE_STRATEGIES,
  RISQUE_STRATEGIE_LABELS,
  RISQUE_STRATEGIE_STYLES,
  RISQUE_TENDANCES,
  RISQUE_TENDANCE_LABELS,
  RISQUE_VELOCITES,
  RISQUE_VELOCITE_LABELS,
  RISQUE_PROXIMITES,
  RISQUE_PROXIMITE_LABELS,
  NIVEAUX_IMPACT,
  NIVEAU_IMPACT_LABELS,
  CANAUX_ALERTE,
  CANAL_ALERTE_LABELS,
  TYPES_DOCUMENT,
  TYPE_DOCUMENT_LABELS,
  getScoreStyle,
  calculateScore,
  type Risque,
  type ActionMitigation,
  type ActionContingence,
  type EvaluationHistorique,
  type Document,
  type CanalAlerte,
} from '@/types';

// ============================================================================
// SECTION COMPONENT
// ============================================================================

interface SectionProps {
  title: string;
  icon?: React.ElementType;
  badge?: string | number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, badge, defaultExpanded = true, children }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-neutral-600" />}
          <span className="font-medium text-neutral-900">{title}</span>
          {badge !== undefined && (
            <Badge variant="outline" className="ml-2">
              {badge}
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-neutral-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-neutral-400" />
        )}
      </button>
      {expanded && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

// ============================================================================
// FIELD COMPONENT
// ============================================================================

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500", error && 'text-red-500')}>
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ============================================================================
// SCHEMA
// ============================================================================

const risqueSchema = z.object({
  // Identification
  id_risque: z.string().optional(),
  code_wbs: z.string().optional(),
  titre: z.string().min(1, 'Le titre est requis').max(100, 'Maximum 100 caractères'),
  description: z.string().min(1, 'La description est requise').max(500, 'Maximum 500 caractères'),
  type_risque: z.enum(RISQUE_TYPES),
  source_risque: z.enum(RISQUE_SOURCES),
  categorie: z.enum(RISQUE_CATEGORIES),
  sous_categorie: z.string().optional(),
  axe_impacte: z.enum(AXES),
  date_identification: z.string().min(1, 'La date est requise'),
  identifie_par: z.string().min(1, 'Champ requis'),

  // Évaluation initiale
  probabilite_initiale: z.number().min(1).max(4),
  impact_initial: z.number().min(1).max(4),

  // Évaluation actuelle
  probabilite_actuelle: z.number().min(1).max(4),
  impact_actuel: z.number().min(1).max(4),
  tendance_risque: z.enum(RISQUE_TENDANCES),
  detectabilite: z.number().min(1).max(4),
  velocite: z.enum(RISQUE_VELOCITES),
  proximite: z.enum(RISQUE_PROXIMITES),

  // Statut
  statut: z.enum(RISQUE_STATUSES),
  phase_traitement: z.enum(RISQUE_PHASES),
  prochaine_revue: z.string().optional(),

  // Impact
  impact_cout: z.number().optional(),
  impact_delai_jours: z.number().optional(),
  impact_qualite: z.enum(NIVEAUX_IMPACT),
  impact_reputation: z.enum(NIVEAUX_IMPACT),
  impact_securite: z.enum(NIVEAUX_IMPACT),
  description_impact: z.string().optional(),

  // Responsabilités
  proprietaire: z.string().min(1, 'Champ requis'),
  gestionnaire: z.string().optional(),
  validateur: z.string().min(1, 'Champ requis'),
  escalade_niveau1: z.string().optional(),
  escalade_niveau2: z.string().optional(),
  escalade_niveau3: z.string().optional(),

  // Mitigation
  strategie_reponse: z.enum(RISQUE_STRATEGIES),
  plan_mitigation: z.string().optional(),
  cout_mitigation: z.number().optional(),
  efficacite_prevue: z.number().min(0).max(100).optional(),

  // Contingence
  plan_contingence: z.string().optional(),
  declencheur_contingence: z.string().optional(),
  cout_contingence: z.number().optional(),

  // Documentation
  lien_sharepoint: z.string().optional(),

  // Alertes
  alertes_actives: z.boolean(),
  seuil_alerte_score: z.number().min(1).max(16),
});

type RisqueFormData = z.infer<typeof risqueSchema>;

// ============================================================================
// TABS CONFIGURATION
// ============================================================================

const TABS = [
  { id: 'identification', label: 'Identification', icon: Target },
  { id: 'evaluation', label: 'Évaluation', icon: BarChart3 },
  { id: 'impact', label: 'Impact', icon: Zap },
  { id: 'mitigation', label: 'Mitigation', icon: Shield },
  { id: 'contingence', label: 'Contingence', icon: AlertTriangle },
  { id: 'liens', label: 'Liens', icon: Link2 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'historique', label: 'Historique', icon: History },
];

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface RisqueFormProps {
  risque?: Risque;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RisqueForm({ risque, open, onClose, onSuccess }: RisqueFormProps) {
  const users = useUsers();
  const jalons = useJalons();
  const actions = useActions();
  const risques = useRisques();
  const isEditing = !!risque;
  const [activeTab, setActiveTab] = useState('identification');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Dynamic lists
  const [equipeResponse, setEquipeResponse] = useState<string[]>([]);
  const [actionsMitigation, setActionsMitigation] = useState<ActionMitigation[]>([]);
  const [actionsContingence, setActionsContingence] = useState<ActionContingence[]>([]);
  const [jalonsImpactes, setJalonsImpactes] = useState<string[]>([]);
  const [actionsLiees, setActionsLiees] = useState<string[]>([]);
  const [risquesLies, setRisquesLies] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [canauxAlerte, setCanauxAlerte] = useState<CanalAlerte[]>(['email']);
  const [notifier, setNotifier] = useState<string[]>([]);
  const [historique, setHistorique] = useState<EvaluationHistorique[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RisqueFormData>({
    resolver: zodResolver(risqueSchema),
    defaultValues: {
      type_risque: 'menace',
      source_risque: 'externe',
      categorie: 'technique',
      axe_impacte: 'axe3_technique',
      date_identification: today,
      statut: 'ouvert',
      phase_traitement: 'identification',
      probabilite_initiale: 2,
      impact_initial: 2,
      probabilite_actuelle: 2,
      impact_actuel: 2,
      tendance_risque: 'stable',
      detectabilite: 2,
      velocite: 'moyenne',
      proximite: 'moyen_terme',
      impact_qualite: 'modere',
      impact_reputation: 'faible',
      impact_securite: 'aucun',
      strategie_reponse: 'attenuer',
      efficacite_prevue: 50,
      alertes_actives: true,
      seuil_alerte_score: 8,
    },
  });

  // Watch values for score calculation
  const probabiliteInitiale = watch('probabilite_initiale') || 2;
  const impactInitial = watch('impact_initial') || 2;
  const probabiliteActuelle = watch('probabilite_actuelle') || 2;
  const impactActuel = watch('impact_actuel') || 2;
  const currentStatus = watch('statut');
  const alertesActives = watch('alertes_actives');

  const scoreInitial = calculateScore(probabiliteInitiale, impactInitial);
  const scoreActuel = calculateScore(probabiliteActuelle, impactActuel);
  const scoreStyle = getScoreStyle(scoreActuel);
  const statusStyle = RISQUE_STATUS_STYLES[currentStatus];

  useEffect(() => {
    if (open) {
      setActiveTab('identification');
      if (risque) {
        reset({
          id_risque: risque.id_risque || '',
          code_wbs: risque.code_wbs || '',
          titre: risque.titre,
          description: risque.description,
          type_risque: risque.type_risque,
          source_risque: risque.source_risque,
          categorie: risque.categorie,
          sous_categorie: risque.sous_categorie || '',
          axe_impacte: risque.axe_impacte,
          date_identification: risque.date_identification,
          identifie_par: risque.identifie_par,
          probabilite_initiale: risque.probabilite_initiale,
          impact_initial: risque.impact_initial,
          probabilite_actuelle: risque.probabilite_actuelle,
          impact_actuel: risque.impact_actuel,
          tendance_risque: risque.tendance_risque,
          detectabilite: risque.detectabilite,
          velocite: risque.velocite,
          proximite: risque.proximite,
          statut: risque.statut,
          phase_traitement: risque.phase_traitement,
          prochaine_revue: risque.prochaine_revue || '',
          impact_cout: risque.impact_cout || undefined,
          impact_delai_jours: risque.impact_delai_jours || undefined,
          impact_qualite: risque.impact_qualite,
          impact_reputation: risque.impact_reputation,
          impact_securite: risque.impact_securite,
          description_impact: risque.description_impact || '',
          proprietaire: risque.proprietaire,
          gestionnaire: risque.gestionnaire || '',
          validateur: risque.validateur,
          escalade_niveau1: risque.escalade_niveau1 || '',
          escalade_niveau2: risque.escalade_niveau2 || '',
          escalade_niveau3: risque.escalade_niveau3 || '',
          strategie_reponse: risque.strategie_reponse,
          plan_mitigation: risque.plan_mitigation || '',
          cout_mitigation: risque.cout_mitigation || undefined,
          efficacite_prevue: risque.efficacite_prevue || 50,
          plan_contingence: risque.plan_contingence || '',
          declencheur_contingence: risque.declencheur_contingence || '',
          cout_contingence: risque.cout_contingence || undefined,
          lien_sharepoint: risque.lien_sharepoint || '',
          alertes_actives: risque.alertes_actives ?? true,
          seuil_alerte_score: risque.seuil_alerte_score || 8,
        });
        setEquipeResponse(risque.equipe_response || []);
        setActionsMitigation(risque.actions_mitigation || []);
        setActionsContingence(risque.actions_contingence || []);
        setJalonsImpactes(risque.jalons_impactes || []);
        setActionsLiees(risque.actions_liees || []);
        setRisquesLies(risque.risques_lies || []);
        setDocuments(risque.documents || []);
        setCanauxAlerte(risque.canal_alerte || ['email']);
        setNotifier(risque.notifier || []);
        setHistorique(risque.historique || []);
      } else {
        const newCode = `R-${new Date().getFullYear()}-${String(risques.length + 1).padStart(3, '0')}`;
        reset({
          id_risque: newCode,
          code_wbs: '',
          titre: '',
          description: '',
          type_risque: 'menace',
          source_risque: 'externe',
          categorie: 'technique',
          axe_impacte: 'axe3_technique',
          date_identification: today,
          identifie_par: users[0] ? `${users[0].prenom} ${users[0].nom}` : '',
          statut: 'ouvert',
          phase_traitement: 'identification',
          probabilite_initiale: 2,
          impact_initial: 2,
          probabilite_actuelle: 2,
          impact_actuel: 2,
          tendance_risque: 'stable',
          detectabilite: 2,
          velocite: 'moyenne',
          proximite: 'moyen_terme',
          impact_qualite: 'modere',
          impact_reputation: 'faible',
          impact_securite: 'aucun',
          proprietaire: users[0] ? `${users[0].prenom} ${users[0].nom}` : '',
          validateur: '',
          strategie_reponse: 'attenuer',
          efficacite_prevue: 50,
          alertes_actives: true,
          seuil_alerte_score: 8,
        });
        setEquipeResponse([]);
        setActionsMitigation([]);
        setActionsContingence([]);
        setJalonsImpactes([]);
        setActionsLiees([]);
        setRisquesLies([]);
        setDocuments([]);
        setCanauxAlerte(['email']);
        setNotifier([]);
        setHistorique([]);
      }
    }
  }, [risque, open, reset, users, risques.length, today]);

  const onSubmit = async (data: RisqueFormData) => {
    try {
      const submitData: Partial<Risque> = {
        ...data,
        score_initial: scoreInitial,
        score_actuel: scoreActuel,
        equipe_response: equipeResponse,
        actions_mitigation: actionsMitigation,
        actions_contingence: actionsContingence,
        jalons_impactes: jalonsImpactes,
        actions_liees: actionsLiees,
        risques_lies: risquesLies,
        opportunites_liees: [],
        documents,
        canal_alerte: canauxAlerte,
        notifier,
        historique,
        date_derniere_evaluation: new Date().toISOString(),
        version: (risque?.version || 0) + 1,
        derniere_modification: new Date().toISOString(),
        modifie_par: data.identifie_par,
      };

      if (!isEditing) {
        (submitData as Risque).date_creation = new Date().toISOString();
        (submitData as Risque).cree_par = data.identifie_par;
      }

      if (isEditing && risque?.id) {
        await updateRisque(risque.id, submitData);
      } else {
        await createRisque(submitData as Omit<Risque, 'id'>);
      }
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving risque:', error);
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const addActionMitigation = () => {
    setActionsMitigation([
      ...actionsMitigation,
      {
        id: uuidv4(),
        action: '',
        responsable: '',
        deadline: today,
        statut: 'planifie',
        efficacite: null,
      },
    ]);
  };

  const updateActionMitigation = (index: number, field: keyof ActionMitigation, value: ActionMitigation[keyof ActionMitigation]) => {
    const updated = [...actionsMitigation];
    (updated[index] as Record<keyof ActionMitigation, ActionMitigation[keyof ActionMitigation]>)[field] = value;
    setActionsMitigation(updated);
  };

  const removeActionMitigation = (index: number) => {
    setActionsMitigation(actionsMitigation.filter((_, i) => i !== index));
  };

  const addActionContingence = () => {
    setActionsContingence([
      ...actionsContingence,
      {
        id: uuidv4(),
        action: '',
        deadline: today,
      },
    ]);
  };

  const updateActionContingence = (index: number, field: keyof ActionContingence, value: ActionContingence[keyof ActionContingence]) => {
    const updated = [...actionsContingence];
    (updated[index] as Record<keyof ActionContingence, ActionContingence[keyof ActionContingence]>)[field] = value;
    setActionsContingence(updated);
  };

  const removeActionContingence = (index: number) => {
    setActionsContingence(actionsContingence.filter((_, i) => i !== index));
  };

  const addDocument = () => {
    setDocuments([
      ...documents,
      {
        id: uuidv4(),
        nom: '',
        type: 'autre',
        url: '',
        date_ajout: new Date().toISOString(),
        ajoute_par: 'Utilisateur',
      },
    ]);
  };

  const updateDocument = (index: number, field: keyof Document, value: Document[keyof Document]) => {
    const updated = [...documents];
    (updated[index] as Record<keyof Document, Document[keyof Document]>)[field] = value;
    setDocuments(updated);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const toggleEquipe = (userName: string) => {
    if (equipeResponse.includes(userName)) {
      setEquipeResponse(equipeResponse.filter(e => e !== userName));
    } else {
      setEquipeResponse([...equipeResponse, userName]);
    }
  };

  const toggleJalonImpacte = (jalonId: string) => {
    if (jalonsImpactes.includes(jalonId)) {
      setJalonsImpactes(jalonsImpactes.filter(j => j !== jalonId));
    } else {
      setJalonsImpactes([...jalonsImpactes, jalonId]);
    }
  };

  const toggleActionLiee = (actionId: string) => {
    if (actionsLiees.includes(actionId)) {
      setActionsLiees(actionsLiees.filter(a => a !== actionId));
    } else {
      setActionsLiees([...actionsLiees, actionId]);
    }
  };

  const toggleRisqueLie = (risqueId: string) => {
    if (risquesLies.includes(risqueId)) {
      setRisquesLies(risquesLies.filter(r => r !== risqueId));
    } else {
      setRisquesLies([...risquesLies, risqueId]);
    }
  };

  const toggleCanalAlerte = (canal: CanalAlerte) => {
    if (canauxAlerte.includes(canal)) {
      setCanauxAlerte(canauxAlerte.filter(c => c !== canal));
    } else {
      setCanauxAlerte([...canauxAlerte, canal]);
    }
  };

  const toggleNotifier = (userName: string) => {
    if (notifier.includes(userName)) {
      setNotifier(notifier.filter(n => n !== userName));
    } else {
      setNotifier([...notifier, userName]);
    }
  };

  // Probability/Impact selector component
  const ProbabilityImpactSelector = ({
    name,
    label
  }: {
    name: 'probabilite_initiale' | 'impact_initial' | 'probabilite_actuelle' | 'impact_actuel' | 'detectabilite';
    label: string;
  }) => (
    <Field label={label} required>
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4].map((n) => (
          <Controller
            key={n}
            name={name}
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                size="sm"
                variant={field.value === n ? 'default' : 'outline'}
                onClick={() => field.onChange(n)}
                className="flex-1"
              >
                {n}
              </Button>
            )}
          />
        ))}
      </div>
    </Field>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-neutral-900">
                {isEditing ? 'Modifier le Risque' : 'Nouveau Risque'}
              </DialogTitle>
              {isEditing && risque && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {risque.id_risque}
                  </Badge>
                  <span className="text-sm text-neutral-600 truncate max-w-[300px]">{risque.titre}</span>
                  <Badge className={cn(statusStyle?.bg, statusStyle?.text)}>
                    {RISQUE_STATUS_LABELS[currentStatus]}
                  </Badge>
                  <Badge className={cn(scoreStyle.bg, scoreStyle.text)}>
                    Score: {scoreActuel}
                  </Badge>
                </div>
              )}
            </div>
            {!isEditing && (
              <div className={cn('px-3 py-1 rounded-full text-sm font-medium', scoreStyle.bg, scoreStyle.text)}>
                Score: {scoreActuel} - {scoreStyle.label}
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-8 mb-2">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                  <tab.icon className="h-3 w-3 mr-1" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2 pb-4">
              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 1: IDENTIFICATION
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="identification" className="space-y-4 mt-0">
                <Section title="Identification" icon={Target}>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="ID Risque" hint="Format: R-YYYY-XXX">
                      <Input {...register('id_risque')} placeholder="R-2026-001" className="font-mono" />
                    </Field>
                    <Field label="Code WBS" hint="Format: WBS-RSK-XXX">
                      <Input {...register('code_wbs')} placeholder="WBS-RSK-001" className="font-mono" />
                    </Field>
                    <Field label="Type de risque" required>
                      <Controller
                        name="type_risque"
                        control={control}
                        render={({ field }) => (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={field.value === 'menace' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => field.onChange('menace')}
                              className="flex-1"
                            >
                              Menace
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'opportunite' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => field.onChange('opportunite')}
                              className="flex-1"
                            >
                              Opportunité
                            </Button>
                          </div>
                        )}
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="Titre" required error={errors.titre?.message}>
                      <Input {...register('titre')} placeholder="Titre du risque" maxLength={100} />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="Description détaillée" required error={errors.description?.message}>
                      <Textarea
                        {...register('description')}
                        placeholder="Description détaillée du risque, ses causes et ses effets potentiels..."
                        rows={3}
                        maxLength={500}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <Field label="Source" required>
                      <Select {...register('source_risque')}>
                        {RISQUE_SOURCES.map((s) => (
                          <SelectOption key={s} value={s}>{RISQUE_SOURCE_LABELS[s]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Catégorie" required>
                      <Select {...register('categorie')}>
                        {RISQUE_CATEGORIES.map((cat) => (
                          <SelectOption key={cat} value={cat}>{RISQUE_CATEGORY_LABELS[cat]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Sous-catégorie">
                      <Input {...register('sous_categorie')} placeholder="Précision..." />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <Field label="Axe impacté" required>
                      <Select {...register('axe_impacte')}>
                        {AXES.map((axe) => (
                          <SelectOption key={axe} value={axe}>{AXE_LABELS[axe]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Date d'identification" required>
                      <Input type="date" {...register('date_identification')} />
                    </Field>
                    <Field label="Identifié par" required error={errors.identifie_par?.message}>
                      <Select {...register('identifie_par')}>
                        <SelectOption value="">Sélectionner...</SelectOption>
                        {users.map((user) => (
                          <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                            {user.prenom} {user.nom}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </Section>

                <Section title="Responsabilités" icon={Users}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Propriétaire du risque" required hint="Responsable de la surveillance">
                      <Select {...register('proprietaire')}>
                        <SelectOption value="">Sélectionner...</SelectOption>
                        {users.map((user) => (
                          <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                            {user.prenom} {user.nom}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Gestionnaire" hint="Pilote les actions de mitigation">
                      <Select {...register('gestionnaire')}>
                        <SelectOption value="">Sélectionner...</SelectOption>
                        {users.map((user) => (
                          <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                            {user.prenom} {user.nom}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Field label="Validateur" required hint="Approuve le traitement">
                      <Select {...register('validateur')}>
                        <SelectOption value="">Sélectionner...</SelectOption>
                        {users.map((user) => (
                          <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                            {user.prenom} {user.nom}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Équipe de réponse">
                      <div className="border rounded-lg p-2 max-h-24 overflow-y-auto space-y-1">
                        {users.map((user) => {
                          const userName = `${user.prenom} ${user.nom}`;
                          return (
                            <label key={user.id} className="flex items-center gap-2 p-1 rounded hover:bg-neutral-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={equipeResponse.includes(userName)}
                                onChange={() => toggleEquipe(userName)}
                                className="rounded border-neutral-300"
                              />
                              <span className="text-sm">{userName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </Field>
                  </div>
                </Section>

                <Section title="Chaîne d'escalade" icon={AlertTriangle} defaultExpanded={false}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium">Niveau 1</div>
                      <div className="flex-1">
                        <Select {...register('escalade_niveau1')}>
                          <SelectOption value="">Sélectionner...</SelectOption>
                          {users.map((user) => (
                            <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                              {user.prenom} {user.nom}
                            </SelectOption>
                          ))}
                        </Select>
                      </div>
                      <div className="text-xs text-neutral-500 w-32">Score ≥ 8</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium">Niveau 2</div>
                      <div className="flex-1">
                        <Select {...register('escalade_niveau2')}>
                          <SelectOption value="">Sélectionner...</SelectOption>
                          {users.map((user) => (
                            <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                              {user.prenom} {user.nom}
                            </SelectOption>
                          ))}
                        </Select>
                      </div>
                      <div className="text-xs text-neutral-500 w-32">Score ≥ 12</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium">Niveau 3</div>
                      <div className="flex-1">
                        <Select {...register('escalade_niveau3')}>
                          <SelectOption value="">Sélectionner...</SelectOption>
                          {users.map((user) => (
                            <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                              {user.prenom} {user.nom}
                            </SelectOption>
                          ))}
                        </Select>
                      </div>
                      <div className="text-xs text-neutral-500 w-32">Score = 16 ou Matérialisé</div>
                    </div>
                  </div>
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 2: ÉVALUATION
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="evaluation" className="space-y-4 mt-0">
                <Section title="Statut du risque" icon={Activity}>
                  <div className="grid grid-cols-4 gap-4">
                    <Field label="Statut actuel" required>
                      <Select {...register('statut')}>
                        {RISQUE_STATUSES.map((s) => (
                          <SelectOption key={s} value={s}>{RISQUE_STATUS_LABELS[s]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Phase de traitement">
                      <Select {...register('phase_traitement')}>
                        {RISQUE_PHASES.map((p) => (
                          <SelectOption key={p} value={p}>{RISQUE_PHASE_LABELS[p]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Prochaine revue">
                      <Input type="date" {...register('prochaine_revue')} />
                    </Field>
                    <Field label="Tendance">
                      <Select {...register('tendance_risque')}>
                        {RISQUE_TENDANCES.map((t) => (
                          <SelectOption key={t} value={t}>{RISQUE_TENDANCE_LABELS[t]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </Section>

                <div className="grid grid-cols-2 gap-4">
                  <Section title="Évaluation initiale" icon={BarChart3}>
                    <div className="space-y-4">
                      <ProbabilityImpactSelector name="probabilite_initiale" label="Probabilité initiale (1-4)" />
                      <p className="text-xs text-neutral-500 -mt-2">1: Très faible → 4: Très forte</p>

                      <ProbabilityImpactSelector name="impact_initial" label="Impact initial (1-4)" />
                      <p className="text-xs text-neutral-500 -mt-2">1: Mineur → 4: Critique</p>

                      <div className={cn('p-3 rounded-lg text-center font-bold', getScoreStyle(scoreInitial).bg, getScoreStyle(scoreInitial).text)}>
                        Score initial: {probabiliteInitiale} × {impactInitial} = {scoreInitial}
                      </div>
                    </div>
                  </Section>

                  <Section title="Évaluation actuelle" icon={BarChart3}>
                    <div className="space-y-4">
                      <ProbabilityImpactSelector name="probabilite_actuelle" label="Probabilité actuelle (1-4)" />

                      <ProbabilityImpactSelector name="impact_actuel" label="Impact actuel (1-4)" />

                      <div className={cn('p-3 rounded-lg text-center font-bold', scoreStyle.bg, scoreStyle.text)}>
                        Score actuel: {probabiliteActuelle} × {impactActuel} = {scoreActuel}
                        <div className="text-sm font-normal mt-1">{scoreStyle.description}</div>
                      </div>
                    </div>
                  </Section>
                </div>

                <Section title="Matrice de criticité" icon={BarChart3}>
                  <div className="grid grid-cols-5 gap-1 text-xs text-center max-w-md mx-auto">
                    <div className="font-medium p-2">P \ I</div>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="font-medium p-2 bg-neutral-100 rounded">{i}</div>
                    ))}
                    {[4, 3, 2, 1].map(p => (
                      <React.Fragment key={`row-${p}`}>
                        <div className="font-medium p-2 bg-neutral-100 rounded">{p}</div>
                        {[1, 2, 3, 4].map(i => {
                          const s = p * i;
                          const style = getScoreStyle(s);
                          const isSelected = probabiliteActuelle === p && impactActuel === i;
                          return (
                            <div
                              key={`${p}-${i}`}
                              className={cn(
                                'p-2 rounded cursor-pointer transition-all',
                                style.bg, style.text,
                                isSelected && 'ring-2 ring-neutral-900 font-bold scale-110 z-10'
                              )}
                              onClick={() => {
                                setValue('probabilite_actuelle', p as 1 | 2 | 3 | 4);
                                setValue('impact_actuel', i as 1 | 2 | 3 | 4);
                              }}
                            >
                              {s}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2 text-center">Cliquez sur une cellule pour sélectionner P×I</p>
                </Section>

                <Section title="Indicateurs complémentaires" icon={Activity} defaultExpanded={false}>
                  <div className="grid grid-cols-3 gap-4">
                    <ProbabilityImpactSelector name="detectabilite" label="Détectabilité (1-4)" />
                    <Field label="Vélocité">
                      <Select {...register('velocite')}>
                        {RISQUE_VELOCITES.map((v) => (
                          <SelectOption key={v} value={v}>{RISQUE_VELOCITE_LABELS[v]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Proximité">
                      <Select {...register('proximite')}>
                        {RISQUE_PROXIMITES.map((p) => (
                          <SelectOption key={p} value={p}>{RISQUE_PROXIMITE_LABELS[p]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Détectabilité: 1 = Facile à détecter → 4 = Difficile à détecter
                  </p>
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 3: IMPACT
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="impact" className="space-y-4 mt-0">
                <Section title="Impact quantifié" icon={Zap}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Impact financier (FCFA)" hint="Coût estimé si le risque se matérialise">
                      <Input
                        type="number"
                        {...register('impact_cout', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Impact délai (jours)" hint="Retard potentiel sur le projet">
                      <Input
                        type="number"
                        {...register('impact_delai_jours', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </Field>
                  </div>
                </Section>

                <Section title="Impact qualitatif" icon={Activity}>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Impact qualité">
                      <Select {...register('impact_qualite')}>
                        {NIVEAUX_IMPACT.map((l) => (
                          <SelectOption key={l} value={l}>{NIVEAU_IMPACT_LABELS[l]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Impact réputation">
                      <Select {...register('impact_reputation')}>
                        {NIVEAUX_IMPACT.map((l) => (
                          <SelectOption key={l} value={l}>{NIVEAU_IMPACT_LABELS[l]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Impact sécurité">
                      <Select {...register('impact_securite')}>
                        {NIVEAUX_IMPACT.map((l) => (
                          <SelectOption key={l} value={l}>{NIVEAU_IMPACT_LABELS[l]}</SelectOption>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="Description détaillée de l'impact">
                      <Textarea
                        {...register('description_impact')}
                        placeholder="Décrivez en détail les conséquences si le risque se matérialise..."
                        rows={4}
                      />
                    </Field>
                  </div>
                </Section>

                <Section title="Résumé des impacts" icon={BarChart3} defaultExpanded={false}>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <p className="text-2xl font-bold text-neutral-800">
                        {new Intl.NumberFormat('fr-FR').format(watch('impact_cout') || 0)}
                      </p>
                      <p className="text-xs text-neutral-500">FCFA</p>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <p className="text-2xl font-bold text-neutral-800">{watch('impact_delai_jours') || 0}</p>
                      <p className="text-xs text-neutral-500">Jours de retard</p>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <p className="text-lg font-bold text-neutral-800">{NIVEAU_IMPACT_LABELS[watch('impact_qualite')]}</p>
                      <p className="text-xs text-neutral-500">Qualité</p>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <p className="text-lg font-bold text-neutral-800">{NIVEAU_IMPACT_LABELS[watch('impact_securite')]}</p>
                      <p className="text-xs text-neutral-500">Sécurité</p>
                    </div>
                  </div>
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 4: MITIGATION
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="mitigation" className="space-y-4 mt-0">
                <Section title="Stratégie de réponse" icon={Shield}>
                  <Field label="Stratégie choisie" required>
                    <div className="grid grid-cols-5 gap-2 mt-1">
                      {RISQUE_STRATEGIES.map((s) => {
                        const style = RISQUE_STRATEGIE_STYLES[s];
                        return (
                          <Controller
                            key={s}
                            name="strategie_reponse"
                            control={control}
                            render={({ field }) => (
                              <Button
                                type="button"
                                size="sm"
                                variant={field.value === s ? 'default' : 'outline'}
                                onClick={() => field.onChange(s)}
                                className={cn(
                                  'flex-col h-auto py-2',
                                  field.value === s && style.bg
                                )}
                              >
                                <span className="font-medium">{RISQUE_STRATEGIE_LABELS[s]}</span>
                              </Button>
                            )}
                          />
                        );
                      })}
                    </div>
                  </Field>

                  <div className="mt-4">
                    <Field label="Plan de mitigation">
                      <Textarea
                        {...register('plan_mitigation')}
                        placeholder="Décrivez les mesures préventives pour réduire la probabilité ou l'impact..."
                        rows={3}
                      />
                    </Field>
                  </div>
                </Section>

                <Section title="Actions de mitigation" icon={Shield} badge={actionsMitigation.length}>
                  <div className="flex justify-end mb-3">
                    <Button type="button" size="sm" variant="outline" onClick={addActionMitigation}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter une action
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {actionsMitigation.map((action, index) => (
                      <div key={action.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center gap-3">
                          <Input
                            value={action.action}
                            onChange={(e) => updateActionMitigation(index, 'action', e.target.value)}
                            placeholder="Description de l'action"
                            className="flex-1"
                          />
                          <Select
                            value={action.statut}
                            onChange={(e) => updateActionMitigation(index, 'statut', e.target.value)}
                            className="w-32"
                          >
                            <SelectOption value="planifie">Planifié</SelectOption>
                            <SelectOption value="en_cours">En cours</SelectOption>
                            <SelectOption value="termine">Terminé</SelectOption>
                            <SelectOption value="annule">Annulé</SelectOption>
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeActionMitigation(index)}
                          >
                            <Trash2 className="h-4 w-4 text-primary-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Select
                            value={action.responsable}
                            onChange={(e) => updateActionMitigation(index, 'responsable', e.target.value)}
                          >
                            <SelectOption value="">Responsable...</SelectOption>
                            {users.map((user) => (
                              <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                                {user.prenom} {user.nom}
                              </SelectOption>
                            ))}
                          </Select>
                          <Input
                            type="date"
                            value={action.deadline}
                            onChange={(e) => updateActionMitigation(index, 'deadline', e.target.value)}
                          />
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={action.efficacite || ''}
                            onChange={(e) => updateActionMitigation(index, 'efficacite', e.target.value ? Number(e.target.value) : null)}
                            placeholder="Efficacité %"
                          />
                        </div>
                      </div>
                    ))}
                    {actionsMitigation.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucune action de mitigation</p>
                    )}
                  </div>
                </Section>

                <Section title="Budget & Efficacité" icon={Activity} defaultExpanded={false}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Coût total de mitigation (FCFA)">
                      <Input
                        type="number"
                        {...register('cout_mitigation', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Efficacité prévue (%)">
                      <div className="space-y-2">
                        <Input
                          type="range"
                          min="0"
                          max="100"
                          {...register('efficacite_prevue', { valueAsNumber: true })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-neutral-500">
                          <span>0%</span>
                          <span className="font-medium text-neutral-800">{watch('efficacite_prevue') || 0}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </Field>
                  </div>
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 5: CONTINGENCE
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="contingence" className="space-y-4 mt-0">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Plan de contingence:</strong> Actions à mettre en œuvre si le risque se matérialise malgré les mesures de mitigation.
                  </p>
                </div>

                <Section title="Déclencheur" icon={Zap}>
                  <Field label="Condition de déclenchement" hint="Événement ou signal qui active le plan de contingence">
                    <Input
                      {...register('declencheur_contingence')}
                      placeholder="Ex: Si le fournisseur annonce un retard > 15 jours..."
                    />
                  </Field>
                </Section>

                <Section title="Plan de contingence" icon={AlertTriangle}>
                  <Field label="Description du plan B">
                    <Textarea
                      {...register('plan_contingence')}
                      placeholder="Décrivez les actions à entreprendre si le risque se matérialise..."
                      rows={4}
                    />
                  </Field>
                </Section>

                <Section title="Actions de contingence" icon={AlertTriangle} badge={actionsContingence.length}>
                  <div className="flex justify-end mb-3">
                    <Button type="button" size="sm" variant="outline" onClick={addActionContingence}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter une action
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {actionsContingence.map((action, index) => (
                      <div key={action.id} className="flex items-center gap-3 p-2 bg-neutral-50 rounded">
                        <span className="text-sm font-medium w-6">{index + 1}</span>
                        <Input
                          value={action.action}
                          onChange={(e) => updateActionContingence(index, 'action', e.target.value)}
                          placeholder="Description de l'action"
                          className="flex-1"
                        />
                        <Input
                          type="date"
                          value={action.deadline}
                          onChange={(e) => updateActionContingence(index, 'deadline', e.target.value)}
                          className="w-36"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeActionContingence(index)}
                        >
                          <Trash2 className="h-4 w-4 text-primary-500" />
                        </Button>
                      </div>
                    ))}
                    {actionsContingence.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucune action de contingence</p>
                    )}
                  </div>
                </Section>

                <Section title="Budget de contingence" icon={Activity} defaultExpanded={false}>
                  <Field label="Coût estimé du plan de contingence (FCFA)">
                    <Input
                      type="number"
                      {...register('cout_contingence', { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </Field>
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 6: LIENS
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="liens" className="space-y-4 mt-0">
                <Section title="Jalons impactés" icon={Link2} badge={jalonsImpactes.length}>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {jalons.map((jalon) => (
                      <label key={jalon.id} className="flex items-center gap-3 p-2 rounded hover:bg-neutral-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={jalonsImpactes.includes(String(jalon.id))}
                          onChange={() => toggleJalonImpacte(String(jalon.id))}
                          className="rounded border-neutral-300"
                        />
                        <span className="text-xs text-neutral-500 font-mono">{jalon.id_jalon}</span>
                        <span className="flex-1 truncate">{jalon.titre}</span>
                      </label>
                    ))}
                    {jalons.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucun jalon disponible</p>
                    )}
                  </div>
                </Section>

                <Section title="Actions liées" icon={Link2} badge={actionsLiees.length}>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {actions.slice(0, 30).map((action) => (
                      <label key={action.id} className="flex items-center gap-3 p-2 rounded hover:bg-neutral-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionsLiees.includes(String(action.id))}
                          onChange={() => toggleActionLiee(String(action.id))}
                          className="rounded border-neutral-300"
                        />
                        <span className="text-xs text-neutral-500 font-mono">{action.id_action}</span>
                        <span className="flex-1 truncate">{action.titre}</span>
                      </label>
                    ))}
                    {actions.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucune action disponible</p>
                    )}
                  </div>
                </Section>

                <Section title="Risques corrélés" icon={Link2} badge={risquesLies.length}>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {risques.filter(r => r.id !== risque?.id).map((r) => {
                      const score = r.score || calculateScore(r.probabilite, r.impact);
                      const style = getScoreStyle(score);
                      return (
                        <label key={r.id} className="flex items-center gap-3 p-2 rounded hover:bg-neutral-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={risquesLies.includes(String(r.id))}
                            onChange={() => toggleRisqueLie(String(r.id))}
                            className="rounded border-neutral-300"
                          />
                          <span className="text-xs text-neutral-500 font-mono">{r.id_risque}</span>
                          <span className="flex-1 truncate">{r.titre}</span>
                          <Badge className={cn(style.bg, style.text)}>{score}</Badge>
                        </label>
                      );
                    })}
                    {risques.length <= 1 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucun autre risque disponible</p>
                    )}
                  </div>
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 7: DOCUMENTS
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="documents" className="space-y-4 mt-0">
                <Section title="Documentation" icon={FileText} badge={documents.length}>
                  <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center mb-4">
                    <Upload className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">
                      Glissez des fichiers ici ou cliquez pour parcourir
                    </p>
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addDocument}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un document
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <div key={doc.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Input
                            value={doc.nom}
                            onChange={(e) => updateDocument(index, 'nom', e.target.value)}
                            placeholder="Nom du document"
                            className="flex-1"
                          />
                          <Select
                            value={doc.type}
                            onChange={(e) => updateDocument(index, 'type', e.target.value)}
                            className="w-32"
                          >
                            {TYPES_DOCUMENT.map((t) => (
                              <SelectOption key={t} value={t}>
                                {TYPE_DOCUMENT_LABELS[t]}
                              </SelectOption>
                            ))}
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDocument(index)}
                          >
                            <Trash2 className="h-4 w-4 text-primary-500" />
                          </Button>
                        </div>
                        <div className="mt-2">
                          <Input
                            value={doc.url}
                            onChange={(e) => updateDocument(index, 'url', e.target.value)}
                            placeholder="URL ou chemin du document"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Lien SharePoint" icon={FileText}>
                  <Field label="Dossier SharePoint" hint="Lien vers le dossier de documents du risque">
                    <Input
                      {...register('lien_sharepoint')}
                      placeholder="/Sites/CosmosAngre/Risques/..."
                    />
                  </Field>
                </Section>

                <Section title="Alertes" icon={AlertTriangle}>
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('alertes_actives')}
                      className="rounded border-neutral-300"
                    />
                    <div>
                      <div className="font-medium">Activer les alertes automatiques</div>
                      <p className="text-xs text-neutral-500">
                        Déclencher des alertes lorsque le score atteint un seuil
                      </p>
                    </div>
                  </label>

                  {alertesActives && (
                    <div className="space-y-4 pt-4 border-t">
                      <Field label="Seuil d'alerte (score)">
                        <Input
                          type="number"
                          min={1}
                          max={16}
                          {...register('seuil_alerte_score', { valueAsNumber: true })}
                        />
                      </Field>

                      <Field label="Canaux de notification">
                        <div className="flex gap-4 mt-2">
                          {CANAUX_ALERTE.map((canal) => (
                            <label key={canal} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={canauxAlerte.includes(canal)}
                                onChange={() => toggleCanalAlerte(canal)}
                                className="rounded border-neutral-300"
                              />
                              <span>{CANAL_ALERTE_LABELS[canal]}</span>
                            </label>
                          ))}
                        </div>
                      </Field>

                      <Field label="Personnes à notifier">
                        <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                          {users.map((user) => {
                            const userName = `${user.prenom} ${user.nom}`;
                            return (
                              <label key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-neutral-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifier.includes(userName)}
                                  onChange={() => toggleNotifier(userName)}
                                  className="rounded border-neutral-300"
                                />
                                <span>{userName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </Field>
                    </div>
                  )}
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 8: HISTORIQUE
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="historique" className="space-y-4 mt-0">
                <Section title="Historique des évaluations" icon={History} badge={historique.length}>
                  {historique.length > 0 ? (
                    <div className="space-y-3">
                      {historique.map((h, index) => {
                        const style = getScoreStyle(h.score);
                        return (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-neutral-500">
                                {new Date(h.date).toLocaleDateString('fr-FR')}
                              </span>
                              <Badge className={cn(style.bg, style.text)}>
                                P={h.probabilite} × I={h.impact} = {h.score}
                              </Badge>
                            </div>
                            <p className="text-sm">{h.commentaire}</p>
                            <p className="text-xs text-neutral-400 mt-1">Par: {h.auteur}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400 text-center py-8">Aucun historique d'évaluation</p>
                  )}
                </Section>

                <Section title="Évolution du score" icon={TrendingUp} defaultExpanded={false}>
                  <div className="p-4 bg-neutral-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-8">
                      <div>
                        <p className="text-sm text-neutral-500">Score initial</p>
                        <p className={cn('text-2xl font-bold', getScoreStyle(scoreInitial).text)}>{scoreInitial}</p>
                      </div>
                      <div className="text-neutral-400">
                        {scoreActuel < scoreInitial ? (
                          <TrendingDown className="h-8 w-8 text-primary-500" />
                        ) : scoreActuel > scoreInitial ? (
                          <TrendingUp className="h-8 w-8 text-primary-500" />
                        ) : (
                          <Minus className="h-8 w-8" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Score actuel</p>
                        <p className={cn('text-2xl font-bold', scoreStyle.text)}>{scoreActuel}</p>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 mt-4">
                      Variation: {scoreActuel - scoreInitial > 0 ? '+' : ''}{scoreActuel - scoreInitial} ({((scoreActuel - scoreInitial) / scoreInitial * 100).toFixed(0)}%)
                    </p>
                  </div>
                </Section>

                {isEditing && risque && (
                  <Section title="Informations d'audit" icon={History}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-500">Créé le:</span>
                        <span className="ml-2 font-medium">
                          {risque.date_creation ? new Date(risque.date_creation).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Créé par:</span>
                        <span className="ml-2 font-medium">{risque.cree_par || '-'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Modifié le:</span>
                        <span className="ml-2 font-medium">
                          {risque.derniere_modification ? new Date(risque.derniere_modification).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Modifié par:</span>
                        <span className="ml-2 font-medium">{risque.modifie_par || '-'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Version:</span>
                        <span className="ml-2 font-medium">{risque.version || 1}</span>
                      </div>
                    </div>
                  </Section>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-2 pt-3 border-t flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              {isEditing && risque && (
                <>Dernière MAJ: {risque.derniere_modification ? new Date(risque.derniere_modification).toLocaleDateString('fr-FR') : '-'}</>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing && risque && (
                <Button type="button" variant="outline" onClick={() => setReminderModalOpen(true)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Relancer
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button type="button" variant="outline">
                Prévisualiser
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Enregistrement...'
                  : isEditing
                  ? 'Mettre à jour'
                  : 'Créer'}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {/* Send Reminder Modal */}
        {isEditing && risque && (
          <SendReminderModal
            isOpen={reminderModalOpen}
            onClose={() => setReminderModalOpen(false)}
            entityType="risque"
            entityId={risque.id!}
            entity={risque}
            defaultRecipientId={users.find(u => `${u.prenom} ${u.nom}` === risque.proprietaire)?.id}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
