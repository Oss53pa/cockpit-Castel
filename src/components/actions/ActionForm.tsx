import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  Target,
  Calendar,
  Users,
  GitBranch,
  DollarSign,
  FileCheck,
  FileText,
  Activity,
  X,
  Plus,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Info,
  Trash2,
  Mail,
  Link2,
  ArrowLeftRight,
  Lock,
  Unlock,
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
  Checkbox,
  Badge,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SendReminderModal } from '@/components/shared';
import { useUsers, useJalons } from '@/hooks';
import { createAction, updateAction } from '@/hooks/useActions';
import {
  computeDateFromPhase,
  computeEcheance,
  formatDelaiComplet,
} from '@/lib/dateCalculations';
import { getProjectConfig, type ProjectConfig } from '@/components/settings/ProjectSettings';
import {
  PHASE_REFERENCE_LABELS,
  type PhaseReference,
} from '@/types';
import { detectPhaseForAction, calculateDureeEstimee } from '@/lib/phaseAutoDetect';
import { useLiveQuery } from 'dexie-react-hooks';
import { Flag } from 'lucide-react';
import { db } from '@/db';
import {
  AXES,
  AXE_LABELS,
  PHASES,
  PHASE_LABELS,
  ACTION_CATEGORIES,
  ACTION_CATEGORY_LABELS,
  ACTION_TYPES,
  ACTION_TYPE_LABELS,
  ACTION_STATUSES,
  ACTION_STATUS_LABELS,
  ACTION_SANTE,
  ACTION_SANTE_LABELS,
  PRIORITES,
  PRIORITE_LABELS,
  TENDANCES,
  TENDANCE_LABELS,
  FLEXIBILITES,
  FLEXIBILITE_LABELS,
  METHODES_AVANCEMENT,
  METHODE_AVANCEMENT_LABELS,
  VISIBILITES_REPORTING,
  VISIBILITE_REPORTING_LABELS,
  TYPES_LIEN,
  NIVEAUX_IMPACT,
  NIVEAU_IMPACT_LABELS,
  TYPES_DOCUMENT,
  TYPE_DOCUMENT_LABELS,
  STATUTS_LIVRABLE,
  STATUT_LIVRABLE_LABELS,
  type Action,
  type Livrable,
  type CritereAcceptation,
  type Document as DocType,
  type Dependance,
  type TypeLien,
  type StatutLivrable,
  type TypeDocument,
  type VisibiliteReporting,
} from '@/types';

// ============================================================================
// SCHEMA DE VALIDATION ZOD
// ============================================================================

const actionSchema = z.object({
  // Identification
  id_action: z.string().min(1, "L'ID est requis"),
  code_wbs: z.string().min(1, 'Le code WBS est requis'),
  titre: z.string().min(1, 'Le titre est requis').max(100),
  description: z.string().min(1, 'La description est requise').max(500),

  // Classification
  axe: z.enum(AXES),
  phase: z.enum(PHASES),
  categorie: z.enum(ACTION_CATEGORIES),
  sous_categorie: z.string().nullable(),
  type_action: z.enum(ACTION_TYPES),

  // Planification
  date_debut_prevue: z.string().min(1, 'La date de début est requise'),
  date_fin_prevue: z.string().min(1, 'La date de fin est requise'),
  date_debut_reelle: z.string().nullable(),
  date_fin_reelle: z.string().nullable(),
  duree_prevue_jours: z.number().min(0),
  duree_reelle_jours: z.number().nullable(),
  date_butoir: z.string().nullable(),
  flexibilite: z.enum(FLEXIBILITES),

  // RACI
  responsable: z.string().min(1, 'Le responsable est requis'),
  approbateur: z.string().min(1, "L'approbateur est requis"),
  delegue: z.string().nullable(),
  escalade_niveau1: z.string(),
  escalade_niveau2: z.string(),
  escalade_niveau3: z.string(),

  // Dépendances
  contraintes_externes: z.string().nullable(),
  chemin_critique: z.boolean(),

  // Ressources & Budget
  charge_homme_jour: z.number().nullable(),
  budget_prevu: z.number().nullable(),
  budget_engage: z.number().nullable(),
  budget_realise: z.number().nullable(),
  ligne_budgetaire: z.string().nullable(),

  // Livrables
  validateur_qualite: z.string().nullable(),

  // Documents
  lien_sharepoint: z.string().nullable(),
  modele_document: z.string().nullable(),

  // Suivi
  statut: z.enum(ACTION_STATUSES),
  avancement: z.number().min(0).max(100),
  methode_avancement: z.enum(METHODES_AVANCEMENT),
  tendance: z.enum(TENDANCES),
  sante: z.enum(ACTION_SANTE),
  notes_internes: z.string().nullable(),
  commentaire_reporting: z.string().max(200).nullable(),
  points_blocage: z.string().nullable(),
  escalade_requise: z.boolean(),
  niveau_escalade: z.string().nullable(),
  priorite: z.enum(PRIORITES),
  score_priorite: z.number().nullable(),
  impact_si_retard: z.enum(NIVEAUX_IMPACT),
  motif_modification: z.string().nullable(),
});

type ActionFormData = z.infer<typeof actionSchema>;

// ============================================================================
// TABS CONFIGURATION
// ============================================================================

const TABS = [
  { id: 'general', label: 'Général', icon: Target },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'responsabilites', label: 'RACI', icon: Users },
  { id: 'dependances', label: 'Dépendances', icon: GitBranch },
  { id: 'ressources', label: 'Ressources', icon: DollarSign },
  { id: 'livrables', label: 'Livrables', icon: FileCheck },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'suivi', label: 'Suivi', icon: Activity },
  { id: 'sync', label: 'Sync', icon: ArrowLeftRight },
];

// ============================================================================
// SECTION COLLAPSIBLE COMPONENT
// ============================================================================

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function Section({ title, icon, badge, defaultExpanded = true, children }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-between text-left transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {icon}
          <span className="font-medium text-neutral-900">{title}</span>
        </div>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
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
  span?: 1 | 2;
  children: React.ReactNode;
}

function Field({ label, required = false, hint, span = 1, children }: FieldProps) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <Label className="text-sm font-medium text-neutral-700 mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
    </div>
  );
}

// ============================================================================
// PROPS
// ============================================================================

interface ActionFormProps {
  action?: Action;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActionForm({ action, open, onClose, onSuccess }: ActionFormProps) {
  const users = useUsers();
  const jalons = useJalons();
  const isEditing = !!action;
  const [activeTab, setActiveTab] = useState('general');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedJalonId, setSelectedJalonId] = useState<number | null>(action?.jalonId ?? null);

  const today = new Date().toISOString().split('T')[0];

  // State for dynamic lists
  const [consultes, setConsultes] = useState<string[]>(action?.consultes || []);
  const [informes, setInformes] = useState<string[]>(action?.informes || []);
  const [ressourcesHumaines, setRessourcesHumaines] = useState<string[]>(action?.ressources_humaines || []);
  const [predecesseurs, setPredecesseurs] = useState<Dependance[]>(action?.predecesseurs || []);
  const [successeurs, setSuccesseurs] = useState<Dependance[]>(action?.successeurs || []);
  const [livrables, setLivrables] = useState<Livrable[]>(action?.livrables || []);
  const [criteres, setCriteres] = useState<CritereAcceptation[]>(action?.criteres_acceptation || []);
  const [documents, setDocuments] = useState<DocType[]>(action?.documents || []);
  const [risquesAssocies, setRisquesAssocies] = useState<string[]>(action?.risques_associes || []);
  const [visibiliteReporting, setVisibiliteReporting] = useState<string[]>(
    action?.visibilite_reporting || ['interne_equipe']
  );

  // Phase reference & verrouillage state
  const [actionPhaseRef, setActionPhaseRef] = useState<PhaseReference | ''>(
    (action as Action & { jalon_reference?: PhaseReference } | undefined)?.jalon_reference || ''
  );
  const [actionDelai, setActionDelai] = useState<number | null>(
    (action as Action & { delai_declenchement?: number } | undefined)?.delai_declenchement ?? -30
  );
  const [dateVerrouillageAction, setDateVerrouillageAction] = useState(
    !!(action as Action & { date_verrouillage_manuel?: boolean } | undefined)?.date_verrouillage_manuel
  );
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);

  // Load project config on mount
  useEffect(() => {
    getProjectConfig().then(setProjectConfig);
  }, []);

  // State for sync links
  const [actionsLiees, setActionsLiees] = useState<string[]>([]);
  const [propagationRetard, setPropagationRetard] = useState(true);

  // Get available actions for linking
  const allActions = useLiveQuery(async () => {
    return db.actions.toArray();
  }) ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: action
      ? {
          id_action: action.id_action,
          code_wbs: action.code_wbs,
          titre: action.titre,
          description: action.description,
          axe: action.axe,
          phase: action.phase,
          categorie: action.categorie,
          sous_categorie: action.sous_categorie,
          type_action: action.type_action,
          date_debut_prevue: action.date_debut_prevue,
          date_fin_prevue: action.date_fin_prevue,
          date_debut_reelle: action.date_debut_reelle,
          date_fin_reelle: action.date_fin_reelle,
          duree_prevue_jours: action.duree_prevue_jours,
          duree_reelle_jours: action.duree_reelle_jours,
          date_butoir: action.date_butoir,
          flexibilite: action.flexibilite,
          responsable: action.responsable,
          approbateur: action.approbateur,
          delegue: action.delegue,
          escalade_niveau1: action.escalade_niveau1,
          escalade_niveau2: action.escalade_niveau2,
          escalade_niveau3: action.escalade_niveau3,
          contraintes_externes: action.contraintes_externes,
          chemin_critique: action.chemin_critique,
          charge_homme_jour: action.charge_homme_jour,
          budget_prevu: action.budget_prevu,
          budget_engage: action.budget_engage,
          budget_realise: action.budget_realise,
          ligne_budgetaire: action.ligne_budgetaire,
          validateur_qualite: action.validateur_qualite,
          lien_sharepoint: action.lien_sharepoint,
          modele_document: action.modele_document,
          statut: action.statut,
          avancement: action.avancement,
          methode_avancement: action.methode_avancement,
          tendance: action.tendance,
          sante: action.sante,
          notes_internes: action.notes_internes,
          commentaire_reporting: action.commentaire_reporting,
          points_blocage: action.points_blocage,
          escalade_requise: action.escalade_requise,
          niveau_escalade: action.niveau_escalade,
          priorite: action.priorite,
          score_priorite: action.score_priorite,
          impact_si_retard: action.impact_si_retard,
          motif_modification: null,
        }
      : {
          id_action: '',
          code_wbs: '',
          titre: '',
          description: '',
          axe: 'axe2_commercial',
          phase: 'execution',
          categorie: 'negociation',
          sous_categorie: null,
          type_action: 'tache',
          date_debut_prevue: today,
          date_fin_prevue: today,
          date_debut_reelle: null,
          date_fin_reelle: null,
          duree_prevue_jours: 1,
          duree_reelle_jours: null,
          date_butoir: null,
          flexibilite: 'moyenne',
          responsable: '',
          approbateur: '',
          delegue: null,
          escalade_niveau1: '',
          escalade_niveau2: '',
          escalade_niveau3: '',
          contraintes_externes: null,
          chemin_critique: false,
          charge_homme_jour: null,
          budget_prevu: null,
          budget_engage: null,
          budget_realise: null,
          ligne_budgetaire: null,
          validateur_qualite: null,
          lien_sharepoint: null,
          modele_document: null,
          statut: 'a_planifier',
          avancement: 0,
          methode_avancement: 'manuel',
          tendance: 'stable',
          sante: 'gris',
          notes_internes: null,
          commentaire_reporting: null,
          points_blocage: null,
          escalade_requise: false,
          niveau_escalade: null,
          priorite: 'moyenne',
          score_priorite: null,
          impact_si_retard: 'modere',
          motif_modification: null,
        },
  });

  const watchStatut = watch('statut');
  const watchAvancement = watch('avancement');
  const watchEscaladeRequise = watch('escalade_requise');
  const watchTitre = watch('titre');
  const watchAxe = watch('axe');

  // Auto-detect phase from titre + axe
  useEffect(() => {
    if (!dateVerrouillageAction && watchTitre) {
      const detected = detectPhaseForAction({ titre: watchTitre, axe: watchAxe });
      if (detected) {
        setActionPhaseRef(detected);
      }
    }
  }, [watchTitre, watchAxe, dateVerrouillageAction]);

  // Auto-calculate duration from titre keywords
  const [autoCalcDuree, setAutoCalcDuree] = useState<number>(
    action?.duree_prevue_jours || calculateDureeEstimee({ titre: action?.titre })
  );
  useEffect(() => {
    if (!dateVerrouillageAction && watchTitre) {
      const duree = calculateDureeEstimee({ titre: watchTitre });
      setAutoCalcDuree(duree);
    }
  }, [watchTitre, dateVerrouillageAction]);

  // Auto-calculate dates from phase + délai + config + duration
  useEffect(() => {
    if (projectConfig && actionPhaseRef && actionDelai != null && !dateVerrouillageAction) {
      const dateDebut = computeDateFromPhase(projectConfig, actionPhaseRef as PhaseReference, actionDelai);
      setValue('date_debut_prevue', dateDebut);
      setValue('duree_prevue_jours', autoCalcDuree);
      const dateFin = computeEcheance(dateDebut, autoCalcDuree);
      setValue('date_fin_prevue', dateFin);
    }
  }, [projectConfig, actionPhaseRef, actionDelai, autoCalcDuree, dateVerrouillageAction, setValue]);

  // Calculate alerts based on date_fin_prevue
  const calculateAlerts = (dateFin: string) => {
    if (!dateFin) return { j30: null, j15: null, j7: null, j3: null };
    const date = new Date(dateFin);
    return {
      j30: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      j15: new Date(date.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      j7: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      j3: new Date(date.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  };

  const onSubmit = async (data: ActionFormData) => {
    try {
      const alerts = calculateAlerts(data.date_fin_prevue);
      const actionData: Partial<Action> & Record<string, unknown> = {
        ...data,
        consultes,
        informes,
        ressources_humaines: ressourcesHumaines,
        predecesseurs,
        successeurs,
        livrables,
        criteres_acceptation: criteres,
        documents,
        risques_associes: risquesAssocies,
        problemes_ouverts: [],
        visibilite_reporting: visibiliteReporting as VisibiliteReporting[],
        historique_commentaires: action?.historique_commentaires || [],
        alerte_j30: alerts.j30,
        alerte_j15: alerts.j15,
        alerte_j7: alerts.j7,
        alerte_j3: alerts.j3,
        date_creation: action?.date_creation || today,
        date_modification: today,
        modifie_par: data.responsable,
        version: (action?.version || 0) + 1,
        jalonId: selectedJalonId,
        // Calcul automatique des echeances
        jalon_reference: actionPhaseRef || undefined,
        delai_declenchement: actionDelai ?? undefined,
        date_verrouillage_manuel: dateVerrouillageAction,
      };

      if (isEditing && action?.id) {
        await updateAction(action.id, actionData);
      } else {
        await createAction(actionData as Omit<Action, 'id' | 'createdAt' | 'updatedAt'>);
      }
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving action:', error);
    }
  };

  // Helper to add/remove from arrays
  const addToList = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => [...prev, value]);
  };

  const removeFromList = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  // Add livrable
  const addLivrable = () => {
    const newLivrable: Livrable = {
      id: uuidv4(),
      nom: '',
      description: null,
      statut: 'en_attente',
      obligatoire: true,
      date_prevue: null,
      date_livraison: null,
      validateur: null,
    };
    setLivrables([...livrables, newLivrable]);
  };

  // Add critere
  const addCritere = () => {
    const newCritere: CritereAcceptation = {
      id: uuidv4(),
      critere: '',
      valide: false,
      date_validation: null,
      validateur: null,
    };
    setCriteres([...criteres, newCritere]);
  };

  // Add document
  const addDocument = () => {
    const newDoc: DocType = {
      id: uuidv4(),
      nom: '',
      type: 'autre',
      url: '',
      date_ajout: today,
      ajoute_par: '',
    };
    setDocuments([...documents, newDoc]);
  };

  // ============================================================================
  // TAB: GÉNÉRAL
  // ============================================================================

  const renderGeneral = () => (
    <div className="space-y-4">
      <Section title="Identification" icon={<Target className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ID Action" required hint="Format: X.Y.Z (ex: 2.3.1)">
            <Input
              {...register('id_action')}
              placeholder="2.3.1"
              disabled={isEditing}
              className={isEditing ? 'bg-neutral-100' : ''}
            />
          </Field>
          <Field label="Code WBS" required hint="Format: WBS-XXX-YYY">
            <Input {...register('code_wbs')} placeholder="WBS-COM-003" />
          </Field>
          <Field label="Titre" required span={2}>
            <Input
              {...register('titre')}
              placeholder="Finaliser négociation bail Carrefour"
              maxLength={100}
            />
          </Field>
          <Field label="Description" required span={2}>
            <Textarea
              {...register('description')}
              placeholder="Négocier et finaliser le contrat de bail avec Carrefour pour l'espace locomotive..."
              rows={3}
              maxLength={500}
            />
          </Field>
          <Field label="Axe stratégique" required>
            <Select {...register('axe')}>
              {AXES.map((axe) => (
                <SelectOption key={axe} value={axe}>
                  {AXE_LABELS[axe]}
                </SelectOption>
              ))}
            </Select>
          </Field>
          <Field label="Phase" required>
            <Select {...register('phase')}>
              {PHASES.map((phase) => (
                <SelectOption key={phase} value={phase}>
                  {PHASE_LABELS[phase]}
                </SelectOption>
              ))}
            </Select>
          </Field>
          <Field label="Catégorie" required>
            <Select {...register('categorie')}>
              {ACTION_CATEGORIES.map((cat) => (
                <SelectOption key={cat} value={cat}>
                  {ACTION_CATEGORY_LABELS[cat]}
                </SelectOption>
              ))}
            </Select>
          </Field>
          <Field label="Sous-catégorie">
            <Input {...register('sous_categorie')} placeholder="Bail commercial" />
          </Field>
        </div>
        <div className="mt-4">
          <Label className="text-sm font-medium text-neutral-700 mb-2 block">Type d'action *</Label>
          <div className="flex flex-wrap gap-2">
            {ACTION_TYPES.map((type) => (
              <Controller
                key={type}
                name="type_action"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(type)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      field.value === type
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    {ACTION_TYPE_LABELS[type]}
                  </button>
                )}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Statut & Avancement">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-2 block">Statut actuel *</Label>
            <div className="flex flex-wrap gap-2">
              {ACTION_STATUSES.map((status) => (
                <Controller
                  key={status}
                  name="statut"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(status)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                        field.value === status
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      {ACTION_STATUS_LABELS[status]}
                    </button>
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Avancement" required>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  {...register('avancement', { valueAsNumber: true })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{watchAvancement}%</span>
              </div>
            </Field>
            <Field label="Santé">
              <Select {...register('sante')}>
                {ACTION_SANTE.map((sante) => (
                  <SelectOption key={sante} value={sante}>
                    {ACTION_SANTE_LABELS[sante]}
                  </SelectOption>
                ))}
              </Select>
            </Field>
            <Field label="Tendance">
              <Select {...register('tendance')}>
                {TENDANCES.map((t) => (
                  <SelectOption key={t} value={t}>
                    {TENDANCE_LABELS[t]}
                  </SelectOption>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-2 block">Priorité *</Label>
            <div className="flex gap-2">
              {PRIORITES.map((p) => {
                const colors: Record<string, string> = {
                  critique: 'bg-red-500 text-white border-red-500',
                  haute: 'bg-orange-500 text-white border-orange-500',
                  moyenne: 'bg-blue-500 text-white border-blue-500',
                  basse: 'bg-neutral-400 text-white border-neutral-400',
                };
                return (
                  <Controller
                    key={p}
                    name="priorite"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(p)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          field.value === p
                            ? colors[p]
                            : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400'
                        }`}
                      >
                        {PRIORITE_LABELS[p]}
                      </button>
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );

  // ============================================================================
  // TAB: PLANNING
  // ============================================================================

  const renderPlanning = () => (
    <div className="space-y-4">
      <Section title="Dates & Échéances" icon={<Calendar className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Date début prévue${!dateVerrouillageAction ? ' (auto)' : ''}`} required>
            <Input
              type="date"
              {...register('date_debut_prevue')}
              disabled={!dateVerrouillageAction && !!projectConfig && !!actionPhaseRef}
              className={!dateVerrouillageAction && projectConfig && actionPhaseRef ? 'bg-neutral-100' : ''}
            />
          </Field>
          <Field label={`Date fin prévue${!dateVerrouillageAction ? ' (auto)' : ''}`} required>
            <Input
              type="date"
              {...register('date_fin_prevue')}
              disabled={!dateVerrouillageAction && !!projectConfig && !!actionPhaseRef}
              className={!dateVerrouillageAction && projectConfig && actionPhaseRef ? 'bg-neutral-100' : ''}
            />
          </Field>
          <Field label="Date début réelle">
            <Input type="date" {...register('date_debut_reelle')} />
          </Field>
          <Field label="Date fin réelle">
            <Input type="date" {...register('date_fin_reelle')} />
          </Field>
          <Field label={`Durée prévue (jours)${!dateVerrouillageAction ? ' (auto)' : ''}`} hint="Auto-calculé depuis le titre">
            <Input
              type="number"
              min="0"
              {...register('duree_prevue_jours', { valueAsNumber: true })}
              disabled={!dateVerrouillageAction}
              className={!dateVerrouillageAction ? 'bg-neutral-100' : ''}
            />
          </Field>
          <Field label="Durée réelle (jours)" hint="Auto-calculé">
            <Input type="number" min="0" {...register('duree_reelle_jours', { valueAsNumber: true })} />
          </Field>
          <Field label="Date butoir" hint="Deadline impérative">
            <Input type="date" {...register('date_butoir')} />
          </Field>
          <Field label="Flexibilité délai" hint="Marge de manoeuvre">
            <Select {...register('flexibilite')}>
              {FLEXIBILITES.map((f) => (
                <SelectOption key={f} value={f}>
                  {FLEXIBILITE_LABELS[f]}
                </SelectOption>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Alertes de rappel" icon={<Info className="w-4 h-4" />}>
        <div className="grid grid-cols-4 gap-4">
          <Field label="J-30">
            <Input type="date" disabled value={calculateAlerts(watch('date_fin_prevue')).j30 || ''} className="bg-neutral-100" />
          </Field>
          <Field label="J-15">
            <Input type="date" disabled value={calculateAlerts(watch('date_fin_prevue')).j15 || ''} className="bg-neutral-100" />
          </Field>
          <Field label="J-7">
            <Input type="date" disabled value={calculateAlerts(watch('date_fin_prevue')).j7 || ''} className="bg-neutral-100" />
          </Field>
          <Field label="J-3">
            <Input type="date" disabled value={calculateAlerts(watch('date_fin_prevue')).j3 || ''} className="bg-neutral-100" />
          </Field>
        </div>
        <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-primary-600 mt-0.5" />
          <p className="text-sm text-blue-800">
            Les alertes seront envoyées automatiquement aux personnes désignées dans l'onglet "RACI"
          </p>
        </div>
      </Section>
    </div>
  );

  // ============================================================================
  // TAB: RACI
  // ============================================================================

  const renderRACI = () => (
    <div className="space-y-4">
      <Section title="Matrice RACI" icon={<Users className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Responsable (R)" required hint="Qui exécute">
            <Select {...register('responsable')}>
              <SelectOption value="">Sélectionner...</SelectOption>
              {users.map((user) => (
                <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                  {user.prenom} {user.nom}
                </SelectOption>
              ))}
            </Select>
          </Field>
          <Field label="Approbateur (A)" required hint="Qui valide">
            <Select {...register('approbateur')}>
              <SelectOption value="">Sélectionner...</SelectOption>
              {users.map((user) => (
                <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                  {user.prenom} {user.nom}
                </SelectOption>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <Label className="text-sm font-medium text-neutral-700 mb-2 block">Consultés (C)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {consultes.map((c, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-neutral-100 rounded text-sm flex items-center gap-1"
              >
                {c}
                <button type="button" onClick={() => removeFromList(setConsultes, idx)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Select
              value=""
              onChange={(e) => {
                if (e.target.value && !consultes.includes(e.target.value)) {
                  addToList(setConsultes, e.target.value);
                }
              }}
            >
              <SelectOption value="">+ Ajouter</SelectOption>
              {users
                .filter((u) => !consultes.includes(`${u.prenom} ${u.nom}`))
                .map((user) => (
                  <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                    {user.prenom} {user.nom}
                  </SelectOption>
                ))}
            </Select>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Qui est consulté</p>
        </div>

        <div className="mt-4">
          <Label className="text-sm font-medium text-neutral-700 mb-2 block">Informés (I)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {informes.map((i, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-neutral-100 rounded text-sm flex items-center gap-1"
              >
                {i}
                <button type="button" onClick={() => removeFromList(setInformes, idx)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Select
              value=""
              onChange={(e) => {
                if (e.target.value && !informes.includes(e.target.value)) {
                  addToList(setInformes, e.target.value);
                }
              }}
            >
              <SelectOption value="">+ Ajouter</SelectOption>
              {users
                .filter((u) => !informes.includes(`${u.prenom} ${u.nom}`))
                .map((user) => (
                  <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                    {user.prenom} {user.nom}
                  </SelectOption>
                ))}
            </Select>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Qui est notifié</p>
        </div>

        <div className="mt-4">
          <Field label="Délégué" hint="Backup si responsable absent">
            <Select {...register('delegue')}>
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

      <Section title="Chaîne d'escalade">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Niveau 1" hint="Retard < 5j">
            <Select {...register('escalade_niveau1')}>
              <SelectOption value="">Sélectionner...</SelectOption>
              {users.map((user) => (
                <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                  {user.prenom} {user.nom}
                </SelectOption>
              ))}
            </Select>
          </Field>
          <Field label="Niveau 2" hint="Retard 5-10j">
            <Select {...register('escalade_niveau2')}>
              <SelectOption value="">Sélectionner...</SelectOption>
              {users.map((user) => (
                <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                  {user.prenom} {user.nom}
                </SelectOption>
              ))}
            </Select>
          </Field>
          <Field label="Niveau 3" hint="Retard > 10j">
            <Select {...register('escalade_niveau3')}>
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
    </div>
  );

  // ============================================================================
  // TAB: DÉPENDANCES
  // ============================================================================

  const renderDependances = () => (
    <div className="space-y-4">
      <Section title="Prédécesseurs (Actions préalables)" icon={<GitBranch className="w-4 h-4" />}>
        <div className="space-y-2">
          {predecesseurs.map((pred, idx) => (
            <div key={pred.id} className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg">
              <Input
                value={pred.id}
                onChange={(e) => {
                  const updated = [...predecesseurs];
                  updated[idx].id = e.target.value;
                  setPredecesseurs(updated);
                }}
                placeholder="ID (ex: 2.1.1)"
                className="w-24"
              />
              <Input
                value={pred.titre}
                onChange={(e) => {
                  const updated = [...predecesseurs];
                  updated[idx].titre = e.target.value;
                  setPredecesseurs(updated);
                }}
                placeholder="Titre"
                className="flex-1"
              />
              <Select
                value={pred.type_lien}
                onChange={(e) => {
                  const updated = [...predecesseurs];
                  updated[idx].type_lien = e.target.value as TypeLien;
                  setPredecesseurs(updated);
                }}
                className="w-24"
              >
                {TYPES_LIEN.map((t) => (
                  <SelectOption key={t} value={t}>
                    {t}
                  </SelectOption>
                ))}
              </Select>
              <Badge variant={pred.statut === 'termine' ? 'success' : 'secondary'}>
                {ACTION_STATUS_LABELS[pred.statut] || pred.statut}
              </Badge>
              <button
                type="button"
                onClick={() => setPredecesseurs(predecesseurs.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setPredecesseurs([
                ...predecesseurs,
                { id: '', titre: '', type_lien: 'FS', decalage_jours: 0, statut: 'a_planifier' },
              ])
            }
            className="w-full p-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un prédécesseur
          </button>
        </div>
      </Section>

      <Section title="Successeurs (Actions dépendantes)">
        <div className="space-y-2">
          {successeurs.map((succ, idx) => (
            <div key={succ.id} className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg">
              <Input
                value={succ.id}
                onChange={(e) => {
                  const updated = [...successeurs];
                  updated[idx].id = e.target.value;
                  setSuccesseurs(updated);
                }}
                placeholder="ID"
                className="w-24"
              />
              <Input
                value={succ.titre}
                onChange={(e) => {
                  const updated = [...successeurs];
                  updated[idx].titre = e.target.value;
                  setSuccesseurs(updated);
                }}
                placeholder="Titre"
                className="flex-1"
              />
              <Badge variant="secondary">{ACTION_STATUS_LABELS[succ.statut] || 'À venir'}</Badge>
              <button
                type="button"
                onClick={() => setSuccesseurs(successeurs.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {successeurs.length > 0 && (
            <div className="p-3 bg-orange-50 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-primary-600 mt-0.5" />
              <p className="text-sm text-orange-800">
                Impact: Un retard sur cette action impactera directement {successeurs.length} action(s)
                successeur(s).
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              setSuccesseurs([
                ...successeurs,
                { id: '', titre: '', type_lien: 'FS', decalage_jours: 0, statut: 'a_planifier' },
              ])
            }
            className="w-full p-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un successeur
          </button>
        </div>
      </Section>

      <Section title="Jalon associé" icon={<Flag className="w-4 h-4" />}>
        <div className="space-y-4">
          <Field label="Jalon cible" hint="Le jalon que cette action contribue à atteindre">
            <Select
              value={selectedJalonId?.toString() ?? ''}
              onChange={(e) => {
                const newId = e.target.value ? Number(e.target.value) : null;
                setSelectedJalonId(newId);
                if (!newId) setDateVerrouillageAction(false);
              }}
            >
              <SelectOption value="">Aucun jalon</SelectOption>
              {jalons.map((jalon) => (
                <SelectOption key={jalon.id} value={jalon.id?.toString() ?? ''}>
                  {jalon.titre} ({jalon.date_prevue})
                </SelectOption>
              ))}
            </Select>
          </Field>
          {selectedJalonId && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                Cette action sera affichée dans le suivi du jalon sélectionné.
              </p>
            </div>
          )}
        </div>
      </Section>

      <Section title="Calcul automatique des échéances" icon={<Calendar className="w-4 h-4" />}>
        <div className="space-y-4">
          {projectConfig ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Phase (auto-détectée)">
                  <div className="px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm text-neutral-700 flex items-center gap-2">
                    <Lock className="h-3 w-3 text-neutral-400" />
                    {actionPhaseRef
                      ? PHASE_REFERENCE_LABELS[actionPhaseRef as PhaseReference]
                      : 'Non détectée'}
                  </div>
                </Field>
                <Field label="Délai de déclenchement" hint="Seul champ éditable. Défaut : -30">
                  <Input
                    type="number"
                    value={actionDelai ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                      setActionDelai(val);
                    }}
                    placeholder="ex: -30"
                  />
                </Field>
                <Field label="Durée estimée (auto)">
                  <div className="px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm text-neutral-700 flex items-center gap-2">
                    <Lock className="h-3 w-3 text-neutral-400" />
                    {autoCalcDuree} jours
                  </div>
                </Field>
              </div>

              {actionPhaseRef && actionDelai != null && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-mono bg-white">
                      {formatDelaiComplet(actionDelai, PHASE_REFERENCE_LABELS[actionPhaseRef])}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-blue-600">
                    <span>Date début: {computeDateFromPhase(projectConfig, actionPhaseRef, actionDelai)}</span>
                    <span>Date fin: {computeEcheance(computeDateFromPhase(projectConfig, actionPhaseRef, actionDelai), autoCalcDuree)}</span>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={dateVerrouillageAction}
                  onChange={(e) => setDateVerrouillageAction(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                {dateVerrouillageAction ? (
                  <Lock className="h-4 w-4 text-orange-600" />
                ) : (
                  <Unlock className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-neutral-700">
                  {dateVerrouillageAction ? 'Dates verrouillées (ignorées au recalcul)' : 'Recalcul automatique actif'}
                </span>
              </label>
            </>
          ) : (
            <p className="text-sm text-neutral-500">
              Chargement de la configuration du projet...
            </p>
          )}
        </div>
      </Section>

      <Section title="Chemin critique">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Controller
              name="chemin_critique"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="chemin_critique"
                />
              )}
            />
            <Label htmlFor="chemin_critique" className="cursor-pointer">
              Sur le chemin critique
            </Label>
          </div>
          <p className="text-xs text-neutral-500">
            Tout retard impacte directement la date d'ouverture du centre
          </p>
          <Field label="Contraintes externes" span={2}>
            <Textarea
              {...register('contraintes_externes')}
              placeholder="Validation du promoteur requise avant signature"
              rows={2}
            />
          </Field>
        </div>
      </Section>
    </div>
  );

  // ============================================================================
  // TAB: RESSOURCES
  // ============================================================================

  const renderRessources = () => {
    const budgetPrevu = watch('budget_prevu') || 0;
    const budgetRealise = watch('budget_realise') || 0;
    const consommation = budgetPrevu > 0 ? Math.round((budgetRealise / budgetPrevu) * 100) : 0;

    return (
      <div className="space-y-4">
        <Section title="Ressources Humaines" icon={<Users className="w-4 h-4" />}>
          <div className="mb-4">
            <Label className="text-sm font-medium text-neutral-700 mb-2 block">Personnes affectées</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ressourcesHumaines.map((r, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-neutral-100 rounded text-sm flex items-center gap-1"
                >
                  {r}
                  <button type="button" onClick={() => removeFromList(setRessourcesHumaines, idx)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <Select
              value=""
              onChange={(e) => {
                if (e.target.value && !ressourcesHumaines.includes(e.target.value)) {
                  addToList(setRessourcesHumaines, e.target.value);
                }
              }}
            >
              <SelectOption value="">+ Ajouter</SelectOption>
              {users
                .filter((u) => !ressourcesHumaines.includes(`${u.prenom} ${u.nom}`))
                .map((user) => (
                  <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                    {user.prenom} {user.nom}
                  </SelectOption>
                ))}
            </Select>
          </div>
          <Field label="Charge de travail (homme-jours)">
            <Input
              type="number"
              step="0.5"
              min="0"
              {...register('charge_homme_jour', { valueAsNumber: true })}
            />
          </Field>
        </Section>

        <Section title="Budget" icon={<DollarSign className="w-4 h-4" />}>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Budget prévu (FCFA)">
              <Input type="number" min="0" {...register('budget_prevu', { valueAsNumber: true })} />
            </Field>
            <Field label="Budget engagé (FCFA)">
              <Input type="number" min="0" {...register('budget_engage', { valueAsNumber: true })} />
            </Field>
            <Field label="Budget réalisé (FCFA)">
              <Input type="number" min="0" {...register('budget_realise', { valueAsNumber: true })} />
            </Field>
          </div>
          {budgetPrevu > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Consommation</span>
                <span>{consommation}%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    consommation > 100 ? 'bg-red-500' : consommation > 80 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(consommation, 100)}%` }}
                />
              </div>
            </div>
          )}
          <div className="mt-4">
            <Field label="Ligne budgétaire">
              <Input {...register('ligne_budgetaire')} placeholder="COMM-2026-003" />
            </Field>
          </div>
        </Section>
      </div>
    );
  };

  // ============================================================================
  // TAB: LIVRABLES
  // ============================================================================

  const renderLivrables = () => {
    const criteresValides = criteres.filter((c) => c.valide).length;

    return (
      <div className="space-y-4">
        <Section title="Livrables attendus" icon={<FileCheck className="w-4 h-4" />}>
          <div className="space-y-2">
            {livrables.map((liv, idx) => (
              <div key={liv.id} className="p-3 border border-neutral-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={liv.statut === 'valide'}
                    onCheckedChange={(checked) => {
                      const updated = [...livrables];
                      updated[idx].statut = checked ? 'valide' : 'en_attente';
                      setLivrables(updated);
                    }}
                  />
                  <Input
                    value={liv.nom}
                    onChange={(e) => {
                      const updated = [...livrables];
                      updated[idx].nom = e.target.value;
                      setLivrables(updated);
                    }}
                    placeholder="Nom du livrable"
                    className="flex-1"
                  />
                  {liv.obligatoire && (
                    <Badge variant="secondary" className="text-xs">
                      Obligatoire
                    </Badge>
                  )}
                  <Select
                    value={liv.statut}
                    onChange={(e) => {
                      const updated = [...livrables];
                      updated[idx].statut = e.target.value as StatutLivrable;
                      setLivrables(updated);
                    }}
                    className="w-32"
                  >
                    {STATUTS_LIVRABLE.map((s) => (
                      <SelectOption key={s} value={s}>
                        {STATUT_LIVRABLE_LABELS[s]}
                      </SelectOption>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={() => setLivrables(livrables.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addLivrable}
              className="w-full p-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un livrable
            </button>
          </div>
        </Section>

        <Section title="Critères d'acceptation">
          <div className="space-y-2">
            {criteres.map((crit, idx) => (
              <div key={crit.id} className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg">
                <Checkbox
                  checked={crit.valide}
                  onCheckedChange={(checked) => {
                    const updated = [...criteres];
                    updated[idx].valide = !!checked;
                    updated[idx].date_validation = checked ? today : null;
                    setCriteres(updated);
                  }}
                />
                <Input
                  value={crit.critere}
                  onChange={(e) => {
                    const updated = [...criteres];
                    updated[idx].critere = e.target.value;
                    setCriteres(updated);
                  }}
                  placeholder="Critère d'acceptation"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setCriteres(criteres.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {criteres.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progression</span>
                  <span>
                    {criteresValides}/{criteres.length} ({Math.round((criteresValides / criteres.length) * 100)}
                    %)
                  </span>
                </div>
                <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(criteresValides / criteres.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={addCritere}
              className="w-full p-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un critère
            </button>
          </div>
        </Section>
      </div>
    );
  };

  // ============================================================================
  // TAB: DOCUMENTS
  // ============================================================================

  const renderDocuments = () => (
    <div className="space-y-4">
      <Section title="Documents associés" icon={<FileText className="w-4 h-4" />}>
        <div className="space-y-2">
          {documents.map((doc, idx) => (
            <div key={doc.id} className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg">
              <Input
                value={doc.nom}
                onChange={(e) => {
                  const updated = [...documents];
                  updated[idx].nom = e.target.value;
                  setDocuments(updated);
                }}
                placeholder="Nom du document"
                className="flex-1"
              />
              <Select
                value={doc.type}
                onChange={(e) => {
                  const updated = [...documents];
                  updated[idx].type = e.target.value as TypeDocument;
                  setDocuments(updated);
                }}
                className="w-32"
              >
                {TYPES_DOCUMENT.map((t) => (
                  <SelectOption key={t} value={t}>
                    {TYPE_DOCUMENT_LABELS[t]}
                  </SelectOption>
                ))}
              </Select>
              <Input
                value={doc.url}
                onChange={(e) => {
                  const updated = [...documents];
                  updated[idx].url = e.target.value;
                  setDocuments(updated);
                }}
                placeholder="URL"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addDocument}
            className="w-full p-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un document
          </button>
        </div>
      </Section>

      <Section title="Références">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Lien SharePoint">
            <Input {...register('lien_sharepoint')} placeholder="/Projet/Commercial/Baux" />
          </Field>
          <Field label="Modèle/Template à utiliser">
            <Input {...register('modele_document')} placeholder="URL du template" />
          </Field>
        </div>
      </Section>
    </div>
  );

  // ============================================================================
  // TAB: SUIVI
  // ============================================================================

  const renderSuivi = () => (
    <div className="space-y-4">
      <Section title="Communication" icon={<Activity className="w-4 h-4" />}>
        <div className="space-y-4">
          <Field label="Notes internes" span={2}>
            <Textarea {...register('notes_internes')} placeholder="Notes de travail..." rows={3} />
          </Field>
          <Field label="Commentaire reporting" hint="Max 200 caractères" span={2}>
            <Textarea
              {...register('commentaire_reporting')}
              placeholder="Message pour le reporting..."
              rows={2}
              maxLength={200}
            />
          </Field>
          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-2 block">Visibilité reporting</Label>
            <div className="flex flex-wrap gap-2">
              {VISIBILITES_REPORTING.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    if (visibiliteReporting.includes(v)) {
                      setVisibiliteReporting(visibiliteReporting.filter((x) => x !== v));
                    } else {
                      setVisibiliteReporting([...visibiliteReporting, v]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    visibiliteReporting.includes(v)
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  {VISIBILITE_REPORTING_LABELS[v]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Risques & Problèmes">
        <div className="space-y-4">
          <Field label="Points de blocage" span={2}>
            <Textarea {...register('points_blocage')} placeholder="Éléments bloquants..." rows={2} />
          </Field>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Controller
                name="escalade_requise"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="escalade_requise" />
                )}
              />
              <Label htmlFor="escalade_requise" className="cursor-pointer">
                Escalade requise
              </Label>
            </div>
            {watchEscaladeRequise && (
              <Field label="Niveau d'escalade">
                <Input {...register('niveau_escalade')} placeholder="Manager / Direction / DG" />
              </Field>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-2 block">Risques associés</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {risquesAssocies.map((r, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm flex items-center gap-1"
                >
                  {r}
                  <button type="button" onClick={() => removeFromList(setRisquesAssocies, idx)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              placeholder="Ajouter un ID risque (ex: R-2026-012)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && !risquesAssocies.includes(value)) {
                    addToList(setRisquesAssocies, value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>
        </div>
      </Section>

      <Section title="Méthode d'avancement">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Méthode de calcul">
            <Select {...register('methode_avancement')}>
              {METHODES_AVANCEMENT.map((m) => (
                <SelectOption key={m} value={m}>
                  {METHODE_AVANCEMENT_LABELS[m]}
                </SelectOption>
              ))}
            </Select>
          </Field>
          <Field label="Impact si retard">
            <Select {...register('impact_si_retard')}>
              {NIVEAUX_IMPACT.map((n) => (
                <SelectOption key={n} value={n}>
                  {NIVEAU_IMPACT_LABELS[n]}
                </SelectOption>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      {isEditing && (
        <Section title="Audit & Traçabilité" defaultExpanded={false}>
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-lg grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-500">Version:</span>{' '}
                <span className="font-medium">{action?.version || 1}</span>
              </div>
              <div>
                <span className="text-neutral-500">Créé le:</span>{' '}
                <span className="font-medium">{action?.date_creation}</span>
              </div>
              <div>
                <span className="text-neutral-500">Modifié le:</span>{' '}
                <span className="font-medium">{action?.date_modification}</span>
              </div>
              <div>
                <span className="text-neutral-500">Par:</span>{' '}
                <span className="font-medium">{action?.modifie_par}</span>
              </div>
            </div>
            <Field label="Motif de modification">
              <Textarea {...register('motif_modification')} placeholder="Raison du changement..." rows={2} />
            </Field>
          </div>
        </Section>
      )}
    </div>
  );

  // ============================================================================
  // TAB: SYNC (Synchronisation Chantier/Mobilisation)
  // ============================================================================

  const renderSync = () => {
    const isTechnique = watchAxe === 'axe3_technique';
    const isCommercial = watchAxe === 'axe2_commercial';

    // Filter available actions based on current action's axe
    const availableActions = allActions.filter((a) => {
      if (isTechnique) {
        // For technical actions, show commercial actions to link
        return a.axe === 'axe2_commercial' && a.id_action !== watch('id_action');
      } else if (isCommercial) {
        // For commercial actions, show technical actions to link
        return a.axe === 'axe3_technique' && a.id_action !== watch('id_action');
      }
      return false;
    });

    if (!isTechnique && !isCommercial) {
      return (
        <div className="space-y-4">
          <div className="p-6 bg-neutral-50 rounded-xl text-center">
            <ArrowLeftRight className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">
              Synchronisation non applicable
            </h3>
            <p className="text-sm text-neutral-500">
              La synchronisation Chantier/Mobilisation est uniquement disponible pour les actions
              des axes <strong>AXE 2 - Commercial</strong> et <strong>AXE 3 - Technique</strong>.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Section
          title={isTechnique ? "Lier à des actions de mobilisation" : "Lier à des actions techniques"}
          icon={<Link2 className="w-4 h-4" />}
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-primary-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                {isTechnique ? (
                  <p>
                    Liez cette action technique à des actions de mobilisation commerciale.
                    En cas de retard sur cette action, les dates des actions liées peuvent être
                    automatiquement ajustées.
                  </p>
                ) : (
                  <p>
                    Liez cette action de mobilisation à des actions techniques.
                    Si l'action technique liée prend du retard, cette action pourra être
                    automatiquement reportée.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700 mb-2 block">
                Actions liées ({actionsLiees.length})
              </Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {actionsLiees.map((actionId, idx) => {
                  const linkedAction = allActions.find((a) => a.id_action === actionId);
                  return (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm flex items-center gap-2"
                    >
                      <Link2 className="w-3 h-3" />
                      {linkedAction?.titre || actionId}
                      <button
                        type="button"
                        onClick={() => setActionsLiees(actionsLiees.filter((_, i) => i !== idx))}
                        className="hover:text-purple-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {actionsLiees.length === 0 && (
                  <span className="text-sm text-neutral-500 italic">
                    Aucune action liée
                  </span>
                )}
              </div>

              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value && !actionsLiees.includes(e.target.value)) {
                    setActionsLiees([...actionsLiees, e.target.value]);
                  }
                }}
              >
                <SelectOption value="">+ Ajouter une action</SelectOption>
                {availableActions
                  .filter((a) => !actionsLiees.includes(a.id_action))
                  .map((a) => (
                    <SelectOption key={a.id_action} value={a.id_action}>
                      {a.id_action} - {a.titre}
                    </SelectOption>
                  ))}
              </Select>
            </div>
          </div>
        </Section>

        {isTechnique && actionsLiees.length > 0 && (
          <Section title="Propagation automatique des retards">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={propagationRetard}
                  onCheckedChange={(checked) => setPropagationRetard(!!checked)}
                  id="propagation_retard"
                />
                <Label htmlFor="propagation_retard" className="cursor-pointer">
                  Propager automatiquement les retards aux actions de mobilisation
                </Label>
              </div>
              <p className="text-xs text-neutral-500">
                Si cette option est activée, un retard sur cette action technique déclenchera
                automatiquement une proposition de décalage des dates pour les {actionsLiees.length} action(s)
                de mobilisation liée(s).
              </p>
            </div>
          </Section>
        )}

        {actionsLiees.length > 0 && (
          <Section title="Aperçu des actions liées" defaultExpanded={true}>
            <div className="space-y-2">
              {actionsLiees.map((actionId) => {
                const linkedAction = allActions.find((a) => a.id_action === actionId);
                if (!linkedAction) return null;

                return (
                  <div
                    key={actionId}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">
                          {linkedAction.titre}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {linkedAction.id_action} | {AXE_LABELS[linkedAction.axe]}
                        </p>
                      </div>
                      <Badge
                        variant={
                          linkedAction.statut === 'termine'
                            ? 'success'
                            : linkedAction.statut === 'bloque'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {ACTION_STATUS_LABELS[linkedAction.statut]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                      <span>Début: {linkedAction.date_debut_prevue}</span>
                      <span>Fin: {linkedAction.date_fin_prevue}</span>
                      <span>Avancement: {linkedAction.avancement}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-900 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {isEditing ? "Modifier l'action" : 'Nouvelle action'}
                </DialogTitle>
                {isEditing && action && (
                  <p className="text-sm text-neutral-500">{action.titre}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {action?.id_action && (
                <Badge variant="secondary" className="text-xs">
                  {action.id_action}
                </Badge>
              )}
              {watchStatut && (
                <Badge
                  variant={watchStatut === 'termine' ? 'success' : watchStatut === 'bloque' ? 'destructive' : 'secondary'}
                >
                  {ACTION_STATUS_LABELS[watchStatut]}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="flex-shrink-0 px-5 py-2 border-b border-neutral-200 flex gap-1 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="flex-1 overflow-y-auto p-5">
              <TabsContent value="general">{renderGeneral()}</TabsContent>
              <TabsContent value="planning">{renderPlanning()}</TabsContent>
              <TabsContent value="responsabilites">{renderRACI()}</TabsContent>
              <TabsContent value="dependances">{renderDependances()}</TabsContent>
              <TabsContent value="ressources">{renderRessources()}</TabsContent>
              <TabsContent value="livrables">{renderLivrables()}</TabsContent>
              <TabsContent value="documents">{renderDocuments()}</TabsContent>
              <TabsContent value="suivi">{renderSuivi()}</TabsContent>
              <TabsContent value="sync">{renderSync()}</TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <DialogFooter className="flex-shrink-0 px-5 py-4 border-t border-neutral-200 flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              {isEditing && action && (
                <>
                  Créé le {action.date_creation} | MAJ {action.date_modification} | v{action.version}
                </>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing && action && (
                <Button type="button" variant="outline" onClick={() => setReminderModalOpen(true)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Relancer
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-neutral-900 hover:bg-neutral-800">
                {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {/* Send Reminder Modal */}
        {isEditing && action && (
          <SendReminderModal
            isOpen={reminderModalOpen}
            onClose={() => setReminderModalOpen(false)}
            entityType="action"
            entityId={action.id!}
            entity={action}
            defaultRecipientId={users.find(u => `${u.prenom} ${u.nom}` === action.responsable)?.id}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
