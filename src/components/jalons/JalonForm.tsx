import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  Users,
  GitBranch,
  Package,
  Bell,
  Calendar,
  Target,
  ChevronDown,
  ChevronRight,
  Upload,
  Activity,
  Info,
  CheckCircle2,
  Clock,
  Mail,
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
} from '@/components/ui';
import { useUsers, useJalons, useRisques, useActions, createJalon, updateJalon, updateJalonWithPropagation } from '@/hooks';
import { SendReminderModal } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  computeDateFromPhase,
  formatDelaiComplet,
} from '@/lib/dateCalculations';
import { getProjectConfig, type ProjectConfig } from '@/components/settings/ProjectSettings';
import { db } from '@/db';
import {
  PHASE_REFERENCE_LABELS,
  type PhaseReference,
} from '@/types';
import { detectPhaseForJalon } from '@/lib/phaseAutoDetect';
import {
  AXES,
  AXE_LABELS,
  JALON_STATUSES,
  JALON_STATUS_LABELS,
  JALON_STATUS_STYLES,
  JALON_CATEGORIES,
  JALON_CATEGORY_LABELS,
  JALON_TYPES,
  JALON_TYPE_LABELS,
  NIVEAUX_IMPORTANCE,
  NIVEAU_IMPORTANCE_LABELS,
  NIVEAU_IMPORTANCE_STYLES,
  FLEXIBILITES,
  FLEXIBILITE_LABELS,
  NIVEAUX_IMPACT,
  NIVEAU_IMPACT_LABELS,
  FREQUENCES_RAPPEL,
  FREQUENCE_RAPPEL_LABELS,
  CANAUX_ALERTE,
  CANAL_ALERTE_LABELS,
  TENDANCES,
  TENDANCE_LABELS,
  VISIBILITES_REPORTING,
  VISIBILITE_REPORTING_LABELS,
  STATUTS_LIVRABLE,
  STATUT_LIVRABLE_LABELS,
  TYPES_DOCUMENT,
  TYPE_DOCUMENT_LABELS,
  type Action,
  type Jalon,
  type JalonStatus,
  type Livrable,
  type CritereAcceptation,
  type Document,
  type JalonDependance,
  type CanalAlerte,
  type VisibiliteReporting,
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

const jalonSchema = z.object({
  // Identification
  id_jalon: z.string().optional(),
  code_wbs: z.string().optional(),
  titre: z.string().min(1, 'Le titre est requis').max(100, 'Maximum 100 caractères'),
  description: z.string().min(1, 'La description est requise').max(500, 'Maximum 500 caractères'),
  axe: z.enum(AXES),
  categorie: z.enum(JALON_CATEGORIES).optional(),
  type_jalon: z.enum(JALON_TYPES).optional(),
  niveau_importance: z.enum(NIVEAUX_IMPORTANCE),

  // Planning
  date_prevue: z.string().min(1, 'La date prévue est requise'),
  date_reelle: z.string().optional(),
  date_butoir_absolue: z.string().optional(),
  flexibilite: z.enum(FLEXIBILITES),

  // Statut
  statut: z.enum(JALON_STATUSES),
  avancement_prealables: z.number().min(0).max(100),
  confiance_atteinte: z.number().min(0).max(100),
  tendance: z.enum(TENDANCES),

  // RACI
  responsable: z.string().optional(),
  validateur: z.string().optional(),
  escalade_niveau1: z.string().optional(),

  // Dépendances
  chemin_critique: z.boolean(),

  // Risques
  impact_retard: z.enum(NIVEAUX_IMPACT),
  cout_retard_jour: z.number().optional(),
  probabilite_atteinte: z.number().min(0).max(100),
  plan_contingence: z.string().optional(),

  // Budget
  budget_associe: z.number().optional(),
  budget_consomme: z.number().optional(),

  // Documents
  lien_sharepoint: z.string().optional(),

  // Alertes
  alertes_actives: z.boolean(),
  frequence_rappel: z.enum(FREQUENCES_RAPPEL),

  // Communication
  notes: z.string().optional(),
  commentaire_reporting: z.string().optional(),
});

type JalonFormData = z.infer<typeof jalonSchema>;

// ============================================================================
// TABS CONFIGURATION
// ============================================================================

const TABS = [
  { id: 'essentiel', label: 'Essentiel', icon: Target },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'liens', label: 'Liens', icon: GitBranch },
  { id: 'avance', label: 'Avancé', icon: FileText },
];

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface JalonFormProps {
  jalon?: Jalon;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JalonForm({ jalon, open, onClose, onSuccess }: JalonFormProps) {
  const users = useUsers();
  const jalons = useJalons();
  const risques = useRisques();
  const actions = useActions();
  const isEditing = !!jalon;
  const [activeTab, setActiveTab] = useState('general');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Dynamic lists (not in react-hook-form)
  const [contributeurs, setContributeurs] = useState<string[]>([]);
  const [partiesPrenantes, setPartiesPrenantes] = useState<string[]>([]);
  const [predecesseurs, setPredecesseurs] = useState<JalonDependance[]>([]);
  const [successeurs, setSuccesseurs] = useState<JalonDependance[]>([]);
  const [actionsPrerequisesIds, setActionsPrerequisesIds] = useState<string[]>([]);
  const [livrables, setLivrables] = useState<Livrable[]>([]);
  const [criteres, setCriteres] = useState<CritereAcceptation[]>([]);
  const [risquesAssocies, setRisquesAssocies] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [canauxAlerte, setCanauxAlerte] = useState<CanalAlerte[]>(['email']);
  const [notifier, setNotifier] = useState<string[]>([]);
  const [visibilite, setVisibilite] = useState<VisibiliteReporting[]>([]);

  // Phase reference & verrouillage state
  const [jalonReference, setJalonReference] = useState<PhaseReference | ''>('');
  const [delaiDeclenchement, setDelaiDeclenchement] = useState<number | null>(null);
  const [dateVerrouillage, setDateVerrouillage] = useState(false);
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);
  const [showPropagationDialog, setShowPropagationDialog] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<Partial<Jalon> | null>(null);

  // Load project config on mount
  useEffect(() => {
    getProjectConfig().then(setProjectConfig);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<JalonFormData>({
    resolver: zodResolver(jalonSchema),
    defaultValues: {
      titre: '',
      description: '',
      axe: 'axe2_commercial',
      statut: 'a_venir',
      niveau_importance: 'standard',
      date_prevue: new Date().toISOString().split('T')[0],
      flexibilite: 'moyenne',
      tendance: 'stable',
      impact_retard: 'modere',
      avancement_prealables: 0,
      confiance_atteinte: 80,
      probabilite_atteinte: 80,
      alertes_actives: true,
      frequence_rappel: 'hebdomadaire',
      chemin_critique: false,
    },
  });

  // Calculate alert dates
  const datePrevue = watch('date_prevue');
  const alerteDates = datePrevue ? {
    j30: new Date(new Date(datePrevue).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    j15: new Date(new Date(datePrevue).getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    j7: new Date(new Date(datePrevue).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  } : { j30: '', j15: '', j7: '' };

  // Auto-detect phase from titre + axe
  const watchedTitre = watch('titre');
  const watchedAxe = watch('axe');
  useEffect(() => {
    if (!dateVerrouillage && watchedTitre) {
      const detected = detectPhaseForJalon({ titre: watchedTitre, axe: watchedAxe });
      if (detected) {
        setJalonReference(detected);
      }
    }
  }, [watchedTitre, watchedAxe, dateVerrouillage]);

  // Auto-generate ID and WBS code based on axe
  const AXE_PREFIXES: Record<string, string> = {
    'axe1_rh': 'RH',
    'axe2_commercial': 'COM',
    'axe3_technique': 'TECH',
    'axe4_budget': 'BUD',
    'axe5_marketing': 'MKT',
    'axe6_exploitation': 'EXP',
  };

  useEffect(() => {
    if (!isEditing && watchedAxe) {
      const prefix = AXE_PREFIXES[watchedAxe] || 'GEN';
      const year = new Date().getFullYear();
      const num = String(jalons.length + 1).padStart(3, '0');
      const newId = `JAL-${prefix}-${year}-${num}`;
      const newWbs = `WBS-${prefix}-M${num}`;
      setValue('id_jalon', newId);
      setValue('code_wbs', newWbs);
    }
  }, [watchedAxe, isEditing, jalons.length, setValue]);

  // Auto-calculate avancement_prealables from linked actions
  const linkedActions = isEditing && jalon?.id
    ? actions.filter(a => a.jalonId === jalon.id)
    : [];

  const calculatedAvancement = linkedActions.length > 0
    ? Math.round(linkedActions.filter(a => a.statut === 'termine').length / linkedActions.length * 100)
    : 0;

  useEffect(() => {
    if (isEditing && linkedActions.length > 0) {
      setValue('avancement_prealables', calculatedAvancement);
    }
  }, [isEditing, linkedActions.length, calculatedAvancement, setValue]);

  // Auto-calculate date_prevue from phase + délai + config
  useEffect(() => {
    if (projectConfig && jalonReference && delaiDeclenchement != null && !dateVerrouillage) {
      const newDate = computeDateFromPhase(projectConfig, jalonReference as PhaseReference, delaiDeclenchement);
      setValue('date_prevue', newDate);
    }
  }, [projectConfig, jalonReference, delaiDeclenchement, dateVerrouillage, setValue]);

  // Handler for delai input changes
  const handleDelaiChange = (newDelai: number) => {
    setDelaiDeclenchement(newDelai);
  };

  useEffect(() => {
    if (open) {
      setActiveTab('general');
      if (jalon) {
        reset({
          id_jalon: jalon.id_jalon || '',
          code_wbs: jalon.code_wbs || '',
          titre: jalon.titre,
          description: jalon.description,
          axe: jalon.axe,
          categorie: jalon.categorie,
          type_jalon: jalon.type_jalon,
          niveau_importance: jalon.niveau_importance || 'standard',
          date_prevue: jalon.date_prevue,
          date_reelle: jalon.date_reelle || '',
          date_butoir_absolue: jalon.date_butoir_absolue || '',
          flexibilite: jalon.flexibilite || 'moyenne',
          statut: jalon.statut,
          avancement_prealables: jalon.avancement_prealables || 0,
          confiance_atteinte: jalon.confiance_atteinte || 80,
          tendance: jalon.tendance || 'stable',
          responsable: jalon.responsable || '',
          validateur: jalon.validateur || '',
          escalade_niveau1: jalon.escalade_niveau1 || '',
          chemin_critique: jalon.chemin_critique || false,
          impact_retard: jalon.impact_retard || 'modere',
          cout_retard_jour: jalon.cout_retard_jour || undefined,
          probabilite_atteinte: jalon.probabilite_atteinte || 80,
          plan_contingence: jalon.plan_contingence || '',
          budget_associe: jalon.budget_associe || undefined,
          budget_consomme: jalon.budget_consomme || undefined,
          lien_sharepoint: jalon.lien_sharepoint || '',
          alertes_actives: jalon.alertes_actives ?? true,
          frequence_rappel: jalon.frequence_rappel || 'hebdomadaire',
          notes: jalon.notes || '',
          commentaire_reporting: jalon.commentaire_reporting || '',
        });
        setContributeurs(jalon.contributeurs || []);
        setPartiesPrenantes(jalon.parties_prenantes || []);
        setPredecesseurs(jalon.predecesseurs || []);
        setSuccesseurs(jalon.successeurs || []);
        setActionsPrerequisesIds(jalon.actions_prerequises || []);
        setLivrables(jalon.livrables || []);
        setCriteres(jalon.criteres_acceptation || []);
        setRisquesAssocies(jalon.risques_associes || []);
        setDocuments(jalon.documents || []);
        setCanauxAlerte(jalon.canal_alerte || ['email']);
        setNotifier(jalon.notifier || []);
        setVisibilite(jalon.visibilite || []);
        setJalonReference((jalon as Jalon & { jalon_reference?: PhaseReference }).jalon_reference || '');
        setDelaiDeclenchement((jalon as Jalon & { delai_declenchement?: number }).delai_declenchement ?? -30);
        setDateVerrouillage(!!(jalon as Jalon & { date_verrouillage_manuel?: boolean }).date_verrouillage_manuel);
      } else {
        const newCode = `JAL-${new Date().getFullYear()}-${String(jalons.length + 1).padStart(3, '0')}`;
        reset({
          id_jalon: newCode,
          code_wbs: '',
          titre: '',
          description: '',
          axe: 'axe2_commercial',
          statut: 'a_venir',
          niveau_importance: 'standard',
          date_prevue: new Date().toISOString().split('T')[0],
          flexibilite: 'moyenne',
          tendance: 'stable',
          impact_retard: 'modere',
          avancement_prealables: 0,
          confiance_atteinte: 80,
          probabilite_atteinte: 80,
          alertes_actives: true,
          frequence_rappel: 'hebdomadaire',
          chemin_critique: false,
        });
        setContributeurs([]);
        setPartiesPrenantes([]);
        setPredecesseurs([]);
        setSuccesseurs([]);
        setActionsPrerequisesIds([]);
        setLivrables([]);
        setCriteres([]);
        setRisquesAssocies([]);
        setDocuments([]);
        setCanauxAlerte(['email']);
        setNotifier([]);
        setVisibilite([]);
        setJalonReference('');
        setDelaiDeclenchement(-30);
        setDateVerrouillage(false);
      }
    }
  }, [jalon, open, reset, jalons.length]);

  const currentStatus = watch('statut');
  const niveauImportance = watch('niveau_importance');

  const criteresValides = criteres.filter(c => c.valide).length;
  const livrablesValides = livrables.filter(l => l.statut === 'valide').length;

  const buildSubmitData = (data: JalonFormData): Partial<Jalon> => {
    const submitData: Partial<Jalon> & Record<string, unknown> = {
      ...data,
      contributeurs,
      parties_prenantes: partiesPrenantes,
      predecesseurs,
      successeurs,
      actions_prerequises: actionsPrerequisesIds,
      livrables,
      criteres_acceptation: criteres,
      risques_associes: risquesAssocies,
      documents,
      canal_alerte: canauxAlerte,
      notifier,
      visibilite,
      alerte_j30: alerteDates.j30,
      alerte_j15: alerteDates.j15,
      alerte_j7: alerteDates.j7,
      date_derniere_maj: new Date().toISOString(),
      maj_par: 'Utilisateur',
      version: (jalon?.version || 0) + 1,
      derniere_modification: new Date().toISOString(),
      modifie_par: 'Utilisateur',
      // Calcul automatique des echeances
      jalon_reference: jalonReference || undefined,
      delai_declenchement: delaiDeclenchement ?? undefined,
      date_verrouillage_manuel: dateVerrouillage,
    };

    if (!isEditing) {
      (submitData as Jalon).date_creation = new Date().toISOString();
      (submitData as Jalon).cree_par = 'Utilisateur';
    }

    return submitData as Partial<Jalon>;
  };

  const doSave = async (submitData: Partial<Jalon>, propagate: boolean) => {
    try {
      if (isEditing && jalon?.id) {
        if (propagate) {
          await updateJalonWithPropagation(jalon.id, submitData, { propagateToActions: true });
        } else {
          await updateJalon(jalon.id, submitData);
        }
      } else {
        await createJalon(submitData as Omit<Jalon, 'id'>);
      }
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving jalon:', error);
    }
  };

  const onSubmit = async (data: JalonFormData) => {
    const submitData = buildSubmitData(data);

    // Check if date changed and there are linked actions
    if (isEditing && jalon?.id && submitData.date_prevue !== jalon.date_prevue) {
      const linkedActions = await db.actions.where('jalonId').equals(jalon.id).toArray();
      const actionsWithOffsets = linkedActions.filter(
        (a) => (a as Action & { delai_declenchement?: number }).delai_declenchement != null
      );
      if (actionsWithOffsets.length > 0) {
        setPendingSubmitData(submitData);
        setShowPropagationDialog(true);
        return;
      }
    }

    await doSave(submitData, false);
  };

  const handlePropagationConfirm = async (propagate: boolean) => {
    setShowPropagationDialog(false);
    if (pendingSubmitData) {
      await doSave(pendingSubmitData, propagate);
      setPendingSubmitData(null);
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const addLivrable = () => {
    setLivrables([
      ...livrables,
      {
        id: uuidv4(),
        nom: '',
        description: null,
        statut: 'en_attente',
        obligatoire: true,
        date_prevue: null,
        date_livraison: null,
        validateur: null,
      },
    ]);
  };

  const updateLivrable = (index: number, field: keyof Livrable, value: Livrable[keyof Livrable]) => {
    const updated = [...livrables];
    (updated[index] as Record<keyof Livrable, Livrable[keyof Livrable]>)[field] = value;
    setLivrables(updated);
  };

  const removeLivrable = (index: number) => {
    setLivrables(livrables.filter((_, i) => i !== index));
  };

  const addCritere = () => {
    setCriteres([
      ...criteres,
      {
        id: uuidv4(),
        critere: '',
        valide: false,
        date_validation: null,
        validateur: null,
      },
    ]);
  };

  const updateCritere = (index: number, field: keyof CritereAcceptation, value: CritereAcceptation[keyof CritereAcceptation]) => {
    const updated = [...criteres];
    (updated[index] as Record<keyof CritereAcceptation, CritereAcceptation[keyof CritereAcceptation]>)[field] = value;
    setCriteres(updated);
  };

  const removeCritere = (index: number) => {
    setCriteres(criteres.filter((_, i) => i !== index));
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

  const toggleContributeur = (userName: string) => {
    if (contributeurs.includes(userName)) {
      setContributeurs(contributeurs.filter(c => c !== userName));
    } else {
      setContributeurs([...contributeurs, userName]);
    }
  };

  const togglePartiesPrenantes = (userName: string) => {
    if (partiesPrenantes.includes(userName)) {
      setPartiesPrenantes(partiesPrenantes.filter(p => p !== userName));
    } else {
      setPartiesPrenantes([...partiesPrenantes, userName]);
    }
  };

  const toggleRisqueAssocie = (risqueId: string) => {
    if (risquesAssocies.includes(risqueId)) {
      setRisquesAssocies(risquesAssocies.filter(r => r !== risqueId));
    } else {
      setRisquesAssocies([...risquesAssocies, risqueId]);
    }
  };

  const toggleActionPrealable = (actionId: string) => {
    if (actionsPrerequisesIds.includes(actionId)) {
      setActionsPrerequisesIds(actionsPrerequisesIds.filter(a => a !== actionId));
    } else {
      setActionsPrerequisesIds([...actionsPrerequisesIds, actionId]);
    }
  };

  const toggleJalonPredecesseur = (j: Jalon) => {
    const exists = predecesseurs.find(p => p.id === String(j.id));
    if (exists) {
      setPredecesseurs(predecesseurs.filter(p => p.id !== String(j.id)));
    } else {
      setPredecesseurs([
        ...predecesseurs,
        {
          id: String(j.id),
          titre: j.titre,
          statut: j.statut,
          date_prevue: j.date_prevue,
        },
      ]);
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

  const statusStyle = currentStatus ? JALON_STATUS_STYLES[currentStatus] : null;
  const importanceStyle = niveauImportance ? NIVEAU_IMPORTANCE_STYLES[niveauImportance] : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-neutral-900">
                {isEditing ? 'Modifier le Jalon' : 'Nouveau Jalon'}
              </DialogTitle>
              {isEditing && jalon && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {jalon.id_jalon}
                  </Badge>
                  <span className="text-sm text-neutral-600 truncate max-w-[300px]">{jalon.titre}</span>
                  <Badge className={cn(statusStyle?.bg, statusStyle?.text)}>
                    {JALON_STATUS_LABELS[currentStatus]}
                  </Badge>
                  {importanceStyle && (
                    <Badge className={cn(importanceStyle.bg, importanceStyle.text)}>
                      {NIVEAU_IMPORTANCE_LABELS[niveauImportance]}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-4 mb-2">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                  <tab.icon className="h-3 w-3 mr-1" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2 pb-4">
              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 1: ESSENTIEL (Identification + RACI)
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="essentiel" className="space-y-4 mt-0">
                <Section title="Identification" icon={Target}>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="ID Jalon" hint="Généré automatiquement">
                      <Input
                        {...register('id_jalon')}
                        placeholder="JAL-2026-001"
                        className="font-mono bg-neutral-100"
                        disabled
                      />
                    </Field>
                    <Field label="Code WBS" hint="Généré automatiquement">
                      <Input
                        {...register('code_wbs')}
                        placeholder="WBS-COM-M01"
                        className="font-mono bg-neutral-100"
                        disabled
                      />
                    </Field>
                    <Field label="Axe stratégique" required error={errors.axe?.message}>
                      <Select {...register('axe')}>
                        {AXES.map((axe) => (
                          <SelectOption key={axe} value={axe}>
                            {AXE_LABELS[axe]}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="Titre" required error={errors.titre?.message}>
                      <Input
                        {...register('titre')}
                        placeholder="Titre du jalon"
                        maxLength={100}
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="Description détaillée" required error={errors.description?.message}>
                      <Textarea
                        {...register('description')}
                        placeholder="Description complète du jalon et de ses conditions d'atteinte..."
                        rows={3}
                        maxLength={500}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <Field label="Catégorie">
                      <Select {...register('categorie')}>
                        <SelectOption value="">Sélectionner...</SelectOption>
                        {JALON_CATEGORIES.map((cat) => (
                          <SelectOption key={cat} value={cat}>
                            {JALON_CATEGORY_LABELS[cat]}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Type de jalon">
                      <Select {...register('type_jalon')}>
                        <SelectOption value="">Sélectionner...</SelectOption>
                        {JALON_TYPES.map((type) => (
                          <SelectOption key={type} value={type}>
                            {JALON_TYPE_LABELS[type]}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Niveau d'importance" required>
                      <Select {...register('niveau_importance')}>
                        {NIVEAUX_IMPORTANCE.map((imp) => (
                          <SelectOption key={imp} value={imp}>
                            {NIVEAU_IMPORTANCE_LABELS[imp]}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </Section>

                <Section title="Statut & Avancement" icon={Activity}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Statut actuel" required>
                      <Select {...register('statut')}>
                        {JALON_STATUSES.map((status) => (
                          <SelectOption key={status} value={status}>
                            {JALON_STATUS_LABELS[status]}
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

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Field label="Avancement prérequis" hint={isEditing && linkedActions.length > 0 ? `${linkedActions.filter(a => a.statut === 'termine').length}/${linkedActions.length} actions terminées` : 'Calculé automatiquement depuis les actions'}>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${calculatedAvancement >= 80 ? 'bg-green-500' : calculatedAvancement >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${calculatedAvancement}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{calculatedAvancement}%</span>
                      </div>
                    </Field>
                    <Field label="Confiance d'atteinte (%)" hint="Probabilité d'atteindre le jalon à temps">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...register('confiance_atteinte', { valueAsNumber: true })}
                      />
                    </Field>
                  </div>

                  {isEditing && jalon && (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-sm">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-neutral-500">Dernière MAJ:</span>
                          <span className="ml-2 font-medium">
                            {jalon.date_derniere_maj ? new Date(jalon.date_derniere_maj).toLocaleDateString('fr-FR') : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Par:</span>
                          <span className="ml-2 font-medium">{jalon.maj_par || '-'}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Version:</span>
                          <span className="ml-2 font-medium">{jalon.version || 1}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Section>

                <Section title="Communication" icon={Info} defaultExpanded={false}>
                  <div className="space-y-4">
                    <Field label="Notes internes">
                      <Textarea
                        {...register('notes')}
                        placeholder="Notes pour l'équipe..."
                        rows={2}
                      />
                    </Field>
                    <Field label="Commentaire reporting" hint="Max 200 caractères, visible dans les rapports">
                      <Textarea
                        {...register('commentaire_reporting')}
                        placeholder="Point de situation pour le reporting..."
                        rows={2}
                        maxLength={200}
                      />
                    </Field>
                    <Field label="Visibilité reporting">
                      <div className="flex flex-wrap gap-2 mt-2">
                        {VISIBILITES_REPORTING.map((vis) => (
                          <label key={vis} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-neutral-50">
                            <input
                              type="checkbox"
                              checked={visibilite.includes(vis)}
                              onChange={() => {
                                if (visibilite.includes(vis)) {
                                  setVisibilite(visibilite.filter(v => v !== vis));
                                } else {
                                  setVisibilite([...visibilite, vis]);
                                }
                              }}
                              className="rounded border-neutral-300"
                            />
                            <span className="text-sm">{VISIBILITE_REPORTING_LABELS[vis]}</span>
                          </label>
                        ))}
                      </div>
                    </Field>
                  </div>
                </Section>

                <Section title="Responsabilités" icon={Users}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Responsable (R)" required hint="Qui pilote l'atteinte du jalon">
                      <Select {...register('responsable')}>
                        <SelectOption value="">Sélectionner...</SelectOption>
                        {users.map((user) => (
                          <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                            {user.prenom} {user.nom}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Validateur (A)" required hint="Qui approuve l'atteinte">
                      <Select {...register('validateur')}>
                        <SelectOption value="">Sélectionner...</SelectOption>
                        {users.map((user) => (
                          <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                            {user.prenom} {user.nom}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Section title="Plus d'options" defaultExpanded={false}>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Contributeurs (C)" hint="Qui est consulté">
                        <div className="border rounded-lg p-2 max-h-24 overflow-y-auto space-y-1">
                          {users.map((user) => {
                            const userName = `${user.prenom} ${user.nom}`;
                            return (
                              <label key={user.id} className="flex items-center gap-2 p-1 rounded hover:bg-neutral-50 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={contributeurs.includes(userName)}
                                  onChange={() => toggleContributeur(userName)}
                                  className="rounded border-neutral-300"
                                />
                                {userName}
                              </label>
                            );
                          })}
                        </div>
                      </Field>
                      <Field label="Parties prenantes (I)" hint="Qui est informé">
                        <div className="border rounded-lg p-2 max-h-24 overflow-y-auto space-y-1">
                          {users.map((user) => {
                            const userName = `${user.prenom} ${user.nom}`;
                            return (
                              <label key={user.id} className="flex items-center gap-2 p-1 rounded hover:bg-neutral-50 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={partiesPrenantes.includes(userName)}
                                  onChange={() => togglePartiesPrenantes(userName)}
                                  className="rounded border-neutral-300"
                                />
                                {userName}
                              </label>
                            );
                          })}
                        </div>
                      </Field>
                    </div>
                    <div className="mt-4">
                      <Field label="Contact d'escalade" hint="En cas de blocage">
                        <Select {...register('escalade_niveau1')}>
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
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 2: PLANNING
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="planning" className="space-y-4 mt-0">
                <Section title="Dates & Échéances" icon={Calendar}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={`Date prévue${!dateVerrouillage ? ' (auto)' : ''}`} required error={errors.date_prevue?.message}>
                      <Input
                        type="date"
                        {...register('date_prevue')}
                        disabled={!dateVerrouillage}
                        className={!dateVerrouillage ? 'bg-neutral-100' : ''}
                      />
                      {jalonReference && delaiDeclenchement != null && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {formatDelaiComplet(delaiDeclenchement, PHASE_REFERENCE_LABELS[jalonReference as PhaseReference])}
                          </Badge>
                        </div>
                      )}
                    </Field>
                    <Field label="Date réelle" hint="À renseigner une fois le jalon atteint">
                      <Input type="date" {...register('date_reelle')} />
                    </Field>
                  </div>

                  {/* Calcul automatique des echeances */}
                  {projectConfig && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          Calcul automatique
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dateVerrouillage}
                            onChange={(e) => setDateVerrouillage(e.target.checked)}
                            className="rounded border-blue-300"
                          />
                          {dateVerrouillage ? (
                            <Lock className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Unlock className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="text-xs text-blue-800">
                            {dateVerrouillage ? 'Date verrouillée (ignorée au recalcul)' : 'Recalcul automatique actif'}
                          </span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Phase (auto-détectée)</label>
                          <div className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-neutral-700 flex items-center gap-2">
                            <Lock className="h-3 w-3 text-neutral-400" />
                            {jalonReference
                              ? PHASE_REFERENCE_LABELS[jalonReference as PhaseReference]
                              : 'Non détectée'}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-blue-700 block mb-1">Délai de déclenchement (jours)</label>
                          <Input
                            type="number"
                            value={delaiDeclenchement ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              if (val != null && !isNaN(val)) {
                                handleDelaiChange(val);
                              } else {
                                setDelaiDeclenchement(null);
                              }
                            }}
                            className="bg-white"
                            placeholder="ex: -90"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-blue-600">
                        Négatif = avant la phase (J-90), positif = après (J+15). Défaut : -30
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Field label="Date butoir absolue" hint="Deadline impérative non négociable">
                      <Input type="date" {...register('date_butoir_absolue')} />
                    </Field>
                    <Field label="Flexibilité du délai">
                      <Select {...register('flexibilite')}>
                        {FLEXIBILITES.map((flex) => (
                          <SelectOption key={flex} value={flex}>
                            {FLEXIBILITE_LABELS[flex]}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </Section>

                <Section title="Alertes automatiques" icon={Bell} defaultExpanded={false}>
                  <p className="text-sm text-neutral-500 mb-3">
                    Dates calculées automatiquement à partir de la date prévue
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-xs text-yellow-700 mb-1">J-30</div>
                      <div className="font-medium">{alerteDates.j30 || '-'}</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-xs text-orange-700 mb-1">J-15</div>
                      <div className="font-medium">{alerteDates.j15 || '-'}</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-xs text-red-700 mb-1">J-7</div>
                      <div className="font-medium">{alerteDates.j7 || '-'}</div>
                    </div>
                  </div>
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 3: LIENS (Dépendances + Actions)
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="liens" className="space-y-4 mt-0">
                <Section title="Prérequis (Jalons précédents)" icon={GitBranch} badge={predecesseurs.length}>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {jalons.filter(j => j.id !== jalon?.id).map((j) => {
                      const isSelected = predecesseurs.some(p => p.id === String(j.id));
                      const jalonStatus = (j.statut || 'a_venir') as JalonStatus;
                      const style = JALON_STATUS_STYLES[jalonStatus] || JALON_STATUS_STYLES['a_venir'];
                      return (
                        <label key={j.id} className="flex items-center gap-3 p-2 rounded hover:bg-neutral-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleJalonPredecesseur(j)}
                            className="rounded border-neutral-300"
                          />
                          <div className="flex-1">
                            <span className="text-xs text-neutral-500 font-mono">{j.id_jalon}</span>
                            <span className="ml-2">{j.titre}</span>
                          </div>
                          <Badge className={cn(style?.bg, style?.text)}>
                            {JALON_STATUS_LABELS[jalonStatus] || 'À venir'}
                          </Badge>
                        </label>
                      );
                    })}
                    {jalons.length <= 1 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucun autre jalon disponible</p>
                    )}
                  </div>
                </Section>

                <Section title="Actions préalables requises" icon={CheckCircle2} badge={actionsPrerequisesIds.length}>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {actions.slice(0, 30).map((action) => (
                      <label key={action.id} className="flex items-center gap-3 p-2 rounded hover:bg-neutral-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionsPrerequisesIds.includes(String(action.id))}
                          onChange={() => toggleActionPrealable(String(action.id))}
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

                <Section title="Chemin critique" icon={Clock}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('chemin_critique')}
                      className="rounded border-neutral-300"
                    />
                    <div>
                      <div className="font-medium">Sur le chemin critique</div>
                      <p className="text-xs text-neutral-500">
                        Tout retard sur ce jalon impacte directement la date d'ouverture du centre
                      </p>
                    </div>
                  </label>
                </Section>
              </TabsContent>

              {/* ════════════════════════════════════════════════════════════════════════════
                  TAB 4: AVANCÉ (Livrables + Risques + Documents)
                  ════════════════════════════════════════════════════════════════════════════ */}
              <TabsContent value="avance" className="space-y-4 mt-0">
                <Section title="Livrables attendus" icon={Package} badge={livrables.length}>
                  <div className="flex justify-end mb-3">
                    <Button type="button" size="sm" variant="outline" onClick={addLivrable}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un livrable
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {livrables.map((livrable, index) => (
                      <div key={livrable.id} className="p-3 border rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Input
                              value={livrable.nom}
                              onChange={(e) => updateLivrable(index, 'nom', e.target.value)}
                              placeholder="Nom du livrable"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={livrable.obligatoire}
                              onChange={(e) => updateLivrable(index, 'obligatoire', e.target.checked)}
                              className="rounded border-neutral-300"
                            />
                            Obligatoire
                          </label>
                          <Select
                            value={livrable.statut}
                            onChange={(e) => updateLivrable(index, 'statut', e.target.value)}
                            className="w-32"
                          >
                            {STATUTS_LIVRABLE.map((s) => (
                              <SelectOption key={s} value={s}>
                                {STATUT_LIVRABLE_LABELS[s]}
                              </SelectOption>
                            ))}
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeLivrable(index)}
                          >
                            <Trash2 className="h-4 w-4 text-primary-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="date"
                            value={livrable.date_prevue || ''}
                            onChange={(e) => updateLivrable(index, 'date_prevue', e.target.value)}
                            placeholder="Date prévue"
                          />
                          <Select
                            value={livrable.validateur || ''}
                            onChange={(e) => updateLivrable(index, 'validateur', e.target.value)}
                          >
                            <SelectOption value="">Validateur...</SelectOption>
                            {users.map((user) => (
                              <SelectOption key={user.id} value={`${user.prenom} ${user.nom}`}>
                                {user.prenom} {user.nom}
                              </SelectOption>
                            ))}
                          </Select>
                        </div>
                      </div>
                    ))}
                    {livrables.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucun livrable défini</p>
                    )}
                  </div>
                  {livrables.length > 0 && (
                    <div className="mt-3 text-sm text-neutral-600">
                      Progression: {livrablesValides} / {livrables.length} livrables validés
                    </div>
                  )}
                </Section>

                <Section title="Critères d'acceptation" icon={CheckCircle2} badge={`${criteresValides}/${criteres.length}`}>
                  <div className="flex justify-end mb-3">
                    <Button type="button" size="sm" variant="outline" onClick={addCritere}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un critère
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {criteres.map((critere, index) => (
                      <div key={critere.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={critere.valide}
                          onChange={(e) => updateCritere(index, 'valide', e.target.checked)}
                          className="rounded border-neutral-300"
                        />
                        <Input
                          value={critere.critere}
                          onChange={(e) => updateCritere(index, 'critere', e.target.value)}
                          placeholder="Description du critère d'acceptation"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCritere(index)}
                        >
                          <Trash2 className="h-4 w-4 text-primary-500" />
                        </Button>
                      </div>
                    ))}
                    {criteres.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucun critère défini</p>
                    )}
                  </div>
                  {criteres.length > 0 && (
                    <div className="mt-3">
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${(criteresValides / criteres.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Section>

                <Section title="Risques & Impact" icon={AlertTriangle} defaultExpanded={false}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Niveau d'impact en cas de retard">
                      <Select {...register('impact_retard')}>
                        {NIVEAUX_IMPACT.map((impact) => (
                          <SelectOption key={impact} value={impact}>
                            {NIVEAU_IMPACT_LABELS[impact]}
                          </SelectOption>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Probabilité d'atteinte (%)">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...register('probabilite_atteinte', { valueAsNumber: true })}
                      />
                    </Field>
                  </div>
                  {risques.length > 0 && (
                    <div className="mt-4">
                      <Field label="Risques associés" hint={`${risquesAssocies.length} sélectionné(s)`}>
                        <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
                          {risques.slice(0, 10).map((risque) => (
                            <label key={risque.id} className="flex items-center gap-2 p-1 rounded hover:bg-neutral-50 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={risquesAssocies.includes(String(risque.id))}
                                onChange={() => toggleRisqueAssocie(String(risque.id))}
                                className="rounded border-neutral-300"
                              />
                              <span className="truncate">{risque.titre}</span>
                            </label>
                          ))}
                        </div>
                      </Field>
                    </div>
                  )}
                  <div className="mt-4">
                    <Field label="Plan de contingence" hint="Actions alternatives si retard">
                      <Textarea
                        {...register('plan_contingence')}
                        placeholder="Plan B..."
                        rows={2}
                      />
                    </Field>
                  </div>
                </Section>

                <Section title="Documents" icon={FileText} badge={documents.length} defaultExpanded={false}>
                  <div className="flex justify-between items-center mb-3">
                    <Field label="Lien SharePoint">
                      <Input
                        {...register('lien_sharepoint')}
                        placeholder="/Sites/CosmosAngre/..."
                        className="w-64"
                      />
                    </Field>
                    <Button type="button" size="sm" variant="outline" onClick={addDocument}>
                      <Plus className="h-4 w-4 mr-1" />
                      Document
                    </Button>
                  </div>
                  {documents.length > 0 && (
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div key={doc.id} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Input
                            value={doc.nom}
                            onChange={(e) => updateDocument(index, 'nom', e.target.value)}
                            placeholder="Nom"
                            className="flex-1"
                          />
                          <Input
                            value={doc.url}
                            onChange={(e) => updateDocument(index, 'url', e.target.value)}
                            placeholder="URL"
                            className="flex-1"
                          />
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeDocument(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="Budget" icon={Activity} defaultExpanded={false}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Budget associé (FCFA)">
                      <Input type="number" {...register('budget_associe', { valueAsNumber: true })} placeholder="0" />
                    </Field>
                    <Field label="Budget consommé (FCFA)">
                      <Input type="number" {...register('budget_consomme', { valueAsNumber: true })} placeholder="0" />
                    </Field>
                  </div>
                </Section>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-2 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs text-neutral-400">
                {isEditing && jalon && (
                  <>Dernière MAJ: {jalon.derniere_modification ? new Date(jalon.derniere_modification).toLocaleDateString('fr-FR') : '-'}</>
                )}
              </div>
              {Object.keys(errors).length > 0 && (
                <div className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {Object.keys(errors).length} erreur(s) de validation
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing && jalon && (
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
        {isEditing && jalon && (
          <SendReminderModal
            isOpen={reminderModalOpen}
            onClose={() => setReminderModalOpen(false)}
            entityType="jalon"
            entityId={jalon.id!}
            entity={jalon}
            defaultRecipientId={users.find(u => `${u.prenom} ${u.nom}` === jalon.responsable)?.id}
          />
        )}

        {/* Propagation Dialog */}
        {showPropagationDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Propager aux actions liées ?
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                La date de ce jalon a changé. Des actions sont liées à ce jalon avec des offsets configurés.
                Voulez-vous recalculer automatiquement leurs dates ?
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handlePropagationConfirm(false)}
                >
                  Non, garder les dates actuelles
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePropagationConfirm(true)}
                >
                  Oui, propager
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
