// ============================================================================
// FORMULAIRE RISQUE v2.0 - Simplifié selon spécifications
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield,
  Target,
  Calendar,
  User,
  AlertTriangle,
  Check,
  X,
  Plus,
  Trash2,
  Link2,
  FileText,
  Clock,
  Save,
  Eye,
  Edit3,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Input,
  Textarea,
  Select,
  SelectOption,
  Label,
  Badge,
  useToast,
} from '@/components/ui';
import { useUsers, useJalons, useActions, createRisque, updateRisque } from '@/hooks';
import { type Risque } from '@/types';

// ============================================================================
// TYPES v2.0
// ============================================================================

// Probabilité simplifiée
const PROBABILITES = ['FAIBLE', 'MOYENNE', 'ELEVEE'] as const;
type Probabilite = typeof PROBABILITES[number];

const PROBABILITE_LABELS: Record<Probabilite, string> = {
  FAIBLE: 'Faible',
  MOYENNE: 'Moyenne',
  ELEVEE: 'Élevée',
};

const PROBABILITE_COLORS: Record<Probabilite, string> = {
  FAIBLE: 'bg-green-100 text-green-700 border-green-300',
  MOYENNE: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  ELEVEE: 'bg-red-100 text-red-700 border-red-300',
};

// Impact simplifié
const IMPACTS = ['FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE'] as const;
type Impact = typeof IMPACTS[number];

const IMPACT_LABELS: Record<Impact, string> = {
  FAIBLE: 'Faible',
  MOYEN: 'Moyen',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique',
};

const IMPACT_COLORS: Record<Impact, string> = {
  FAIBLE: 'bg-green-100 text-green-700 border-green-300',
  MOYEN: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  ELEVE: 'bg-orange-100 text-orange-700 border-orange-300',
  CRITIQUE: 'bg-red-100 text-red-700 border-red-300',
};

// Criticité (auto-calculée)
const CRITICITES = ['VERT', 'JAUNE', 'ORANGE', 'ROUGE'] as const;
type Criticite = typeof CRITICITES[number];

const CRITICITE_CONFIG: Record<Criticite, { label: string; color: string; emoji: string }> = {
  VERT: { label: 'Faible', color: 'bg-green-500', emoji: '🟢' },
  JAUNE: { label: 'Modéré', color: 'bg-yellow-400', emoji: '🟡' },
  ORANGE: { label: 'Élevé', color: 'bg-orange-500', emoji: '🟠' },
  ROUGE: { label: 'Critique', color: 'bg-red-500', emoji: '🔴' },
};

// Catégories simplifiées
const CATEGORIES = ['CONSTRUCTION', 'COMMERCIAL', 'RH', 'BUDGET', 'TECHNIQUE', 'EXTERNE'] as const;
type Categorie = typeof CATEGORIES[number];

const CATEGORIE_LABELS: Record<Categorie, string> = {
  CONSTRUCTION: 'Construction',
  COMMERCIAL: 'Commercial',
  RH: 'RH',
  BUDGET: 'Budget',
  TECHNIQUE: 'Technique',
  EXTERNE: 'Externe',
};

// Statuts simplifiés
const STATUTS = ['OUVERT', 'EN_TRAITEMENT', 'FERME', 'ACCEPTE'] as const;
type Statut = typeof STATUTS[number];

const STATUT_CONFIG: Record<Statut, { label: string; color: string }> = {
  OUVERT: { label: 'Ouvert', color: 'bg-red-100 text-red-700 border-red-300' },
  EN_TRAITEMENT: { label: 'En cours', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  FERME: { label: 'Fermé', color: 'bg-green-100 text-green-700 border-green-300' },
  ACCEPTE: { label: 'Accepté', color: 'bg-gray-100 text-gray-700 border-gray-300' },
};

// ============================================================================
// CALCUL CRITICITÉ (Matrice)
// ============================================================================

function calculerCriticite(probabilite: Probabilite, impact: Impact): Criticite {
  const matrice: Record<string, Criticite> = {
    'FAIBLE_FAIBLE': 'VERT',
    'FAIBLE_MOYEN': 'VERT',
    'FAIBLE_ELEVE': 'JAUNE',
    'FAIBLE_CRITIQUE': 'ORANGE',
    'MOYENNE_FAIBLE': 'VERT',
    'MOYENNE_MOYEN': 'JAUNE',
    'MOYENNE_ELEVE': 'ORANGE',
    'MOYENNE_CRITIQUE': 'ROUGE',
    'ELEVEE_FAIBLE': 'JAUNE',
    'ELEVEE_MOYEN': 'ORANGE',
    'ELEVEE_ELEVE': 'ROUGE',
    'ELEVEE_CRITIQUE': 'ROUGE',
  };
  return matrice[`${probabilite}_${impact}`] || 'JAUNE';
}

// ============================================================================
// SCHEMA v2.0
// ============================================================================

const risqueSchema = z.object({
  code: z.string().min(1, 'Le code est requis'),
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(150),
  description: z.string().max(500).optional(),

  // Évaluation
  probabilite: z.enum(PROBABILITES),
  impact: z.enum(IMPACTS),

  // Classification
  categorie: z.enum(CATEGORIES),
  responsableId: z.number({ required_error: 'Le responsable est obligatoire' }),

  // Suivi
  statut: z.enum(STATUTS),
  dateIdentification: z.string().min(1, 'La date est requise'),
  dateRevue: z.string().optional(),

  // Plan de mitigation
  actionsMitigation: z.string().max(1000).optional(),
});

type RisqueFormData = z.infer<typeof risqueSchema>;

// ============================================================================
// TABS
// ============================================================================

const FORM_TABS = [
  { id: 'general', label: 'Général', icon: Target },
  { id: 'evaluation', label: 'Évaluation', icon: Activity },
  { id: 'mitigation', label: 'Mitigation', icon: Shield },
  { id: 'liens', label: 'Liens', icon: Link2 },
];

// ============================================================================
// PROPS
// ============================================================================

interface RisqueFormProps {
  risque?: Risque;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RisqueForm({ risque, open, onClose, onSuccess }: RisqueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!risque);
  const [activeTab, setActiveTab] = useState('general');

  // Liens
  const [jalonIds, setJalonIds] = useState<number[]>([]);
  const [actionIds, setActionIds] = useState<number[]>([]);

  const users = useUsers();
  const jalons = useJalons();
  const actions = useActions();
  const toast = useToast();

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RisqueFormData>({
    resolver: zodResolver(risqueSchema),
    defaultValues: {
      code: '',
      titre: '',
      description: '',
      probabilite: 'MOYENNE',
      impact: 'MOYEN',
      categorie: 'TECHNIQUE',
      responsableId: undefined,
      statut: 'OUVERT',
      dateIdentification: today,
      dateRevue: '',
      actionsMitigation: '',
    },
  });

  const watchProbabilite = watch('probabilite');
  const watchImpact = watch('impact');
  const watchStatut = watch('statut');

  // Criticité auto-calculée
  const criticite = useMemo(() => {
    return calculerCriticite(watchProbabilite, watchImpact);
  }, [watchProbabilite, watchImpact]);

  // Charger les données du risque existant
  useEffect(() => {
    if (open && risque) {
      // Convertir les anciens champs vers le nouveau format
      const probabiliteMap: Record<number, Probabilite> = { 1: 'FAIBLE', 2: 'MOYENNE', 3: 'ELEVEE', 4: 'ELEVEE' };
      const impactMap: Record<number, Impact> = { 1: 'FAIBLE', 2: 'MOYEN', 3: 'ELEVE', 4: 'CRITIQUE' };
      const statutMap: Record<string, Statut> = {
        'ouvert': 'OUVERT',
        'en_cours': 'EN_TRAITEMENT',
        'en_traitement': 'EN_TRAITEMENT',
        'ferme': 'FERME',
        'clos': 'FERME',
        'accepte': 'ACCEPTE',
        'materialise': 'FERME',
      };

      reset({
        code: risque.id_risque || risque.code || `R-${String((risque as any).id || 1).padStart(3, '0')}`,
        titre: risque.titre,
        description: risque.description || '',
        probabilite: typeof risque.probabilite === 'number'
          ? probabiliteMap[risque.probabilite] || 'MOYENNE'
          : (risque.probabilite as Probabilite) || 'MOYENNE',
        impact: typeof risque.impact === 'number'
          ? impactMap[risque.impact] || 'MOYEN'
          : (risque.impact as Impact) || 'MOYEN',
        categorie: (risque.categorie?.toUpperCase() as Categorie) || 'TECHNIQUE',
        responsableId: risque.responsableId ?? undefined,
        statut: statutMap[risque.statut] || 'OUVERT',
        dateIdentification: risque.date_identification || today,
        dateRevue: risque.prochaine_revue || '',
        actionsMitigation: risque.plan_mitigation || '',
      });

      setJalonIds(risque.jalons_impactes?.map(j => parseInt(j)) || []);
      setActionIds(risque.actions_liees?.map(a => parseInt(a)) || []);
      setIsEditing(false);
      setActiveTab('general');
    } else if (open && !risque) {
      // Générer nouveau code
      const newCode = `R-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      reset({
        code: newCode,
        titre: '',
        description: '',
        probabilite: 'MOYENNE',
        impact: 'MOYEN',
        categorie: 'TECHNIQUE',
        responsableId: undefined,
        statut: 'OUVERT',
        dateIdentification: today,
        dateRevue: '',
        actionsMitigation: '',
      });
      setJalonIds([]);
      setActionIds([]);
      setIsEditing(true);
      setActiveTab('general');
    }
  }, [open, risque, reset, today]);

  // Changer le statut rapidement
  const handleStatutChange = (newStatut: Statut) => {
    setValue('statut', newStatut);
  };

  // Toggle jalon lié
  const toggleJalon = (jalonId: number) => {
    if (jalonIds.includes(jalonId)) {
      setJalonIds(jalonIds.filter(j => j !== jalonId));
    } else {
      setJalonIds([...jalonIds, jalonId]);
    }
  };

  // Toggle action liée
  const toggleAction = (actionId: number) => {
    if (actionIds.includes(actionId)) {
      setActionIds(actionIds.filter(a => a !== actionId));
    } else {
      setActionIds([...actionIds, actionId]);
    }
  };

  // Soumission
  const onSubmit = async (data: RisqueFormData) => {
    setIsSubmitting(true);
    try {
      const responsable = users.find(u => u.id === data.responsableId);
      const responsableName = responsable ? `${responsable.prenom} ${responsable.nom}` : '';

      // Convertir vers l'ancien format pour compatibilité
      const probabiliteToNum: Record<Probabilite, number> = { FAIBLE: 1, MOYENNE: 2, ELEVEE: 3 };
      const impactToNum: Record<Impact, number> = { FAIBLE: 1, MOYEN: 2, ELEVE: 3, CRITIQUE: 4 };
      const statutToOld: Record<Statut, string> = {
        OUVERT: 'ouvert',
        EN_TRAITEMENT: 'en_cours',
        FERME: 'ferme',
        ACCEPTE: 'accepte',
      };

      const submitData = {
        id_risque: data.code,
        code: data.code,
        titre: data.titre,
        description: data.description || '',

        // Évaluation (format numérique pour compatibilité)
        probabilite: probabiliteToNum[data.probabilite],
        probabilite_initiale: probabiliteToNum[data.probabilite],
        probabilite_actuelle: probabiliteToNum[data.probabilite],
        impact: impactToNum[data.impact],
        impact_initial: impactToNum[data.impact],
        impact_actuel: impactToNum[data.impact],
        score: probabiliteToNum[data.probabilite] * impactToNum[data.impact],
        score_initial: probabiliteToNum[data.probabilite] * impactToNum[data.impact],
        score_actuel: probabiliteToNum[data.probabilite] * impactToNum[data.impact],
        criticite,

        // Classification
        categorie: data.categorie.toLowerCase(),
        axe_impacte: 'axe3_technique',
        responsableId: data.responsableId,
        proprietaire: responsableName,

        // Suivi
        statut: statutToOld[data.statut],
        date_identification: data.dateIdentification,
        prochaine_revue: data.dateRevue || null,

        // Mitigation
        plan_mitigation: data.actionsMitigation || '',
        strategie_reponse: 'attenuer',

        // Liens
        jalons_impactes: jalonIds.map(j => String(j)),
        actions_liees: actionIds.map(a => String(a)),

        // Metadata
        derniere_modification: new Date().toISOString(),
        type_risque: 'menace',
        source_risque: 'interne',
        tendance_risque: 'stable',
        detectabilite: 2,
        velocite: 'moyenne',
        proximite: 'moyen_terme',
        impact_qualite: 'modere',
        impact_reputation: 'faible',
        impact_securite: 'aucun',
        phase_traitement: 'identification',
        validateur: responsableName,
      };

      if (risque?.id) {
        await updateRisque(risque.id, submitData);
        toast.success('Risque mis a jour', `"${data.titre}" a ete enregistre`);
      } else {
        await createRisque(submitData as any);
        toast.success('Risque cree', `"${data.titre}" a ete enregistre`);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur', 'Impossible de sauvegarder le risque');
    } finally {
      setIsSubmitting(false);
    }
  };

  const criticiteConfig = CRITICITE_CONFIG[criticite];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl !p-0">
        {/* Header fixe */}
        <div className="p-4 border-b bg-white rounded-t-xl">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${criticiteConfig.color}`}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span>{risque ? (isEditing ? 'Modifier le risque' : 'Détails du risque') : 'Nouveau Risque'}</span>
                {risque && (
                  <span className="ml-2 text-sm font-mono text-neutral-500">{risque.id_risque || risque.code}</span>
                )}
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Criticité badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${criticiteConfig.color} text-white`}>
                <span>{criticiteConfig.emoji}</span>
                <span>{criticiteConfig.label}</span>
              </div>
              {risque && !isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
              )}
            </div>
          </div>

          {/* Statut rapide */}
          <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg mt-3">
            <span className="text-sm font-medium text-neutral-600">Statut:</span>
            <div className="flex gap-1 flex-1 flex-wrap">
              {STATUTS.map((statut) => {
                const config = STATUT_CONFIG[statut];
                const isActive = watchStatut === statut;
                return (
                  <button
                    key={statut}
                    type="button"
                    onClick={() => handleStatutChange(statut)}
                    disabled={!isEditing && !risque}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      isActive ? `${config.color} ring-2 ring-offset-1` : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Onglets */}
          <div className="px-4 pt-2 bg-neutral-50">
            <div className="flex gap-1 bg-white p-1 rounded-lg border">
              {FORM_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="max-h-[60vh] overflow-y-auto p-4 bg-neutral-50">

            {/* ============================================= */}
            {/* ONGLET GÉNÉRAL */}
            {/* ============================================= */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                {/* Identification */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Identification
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Code *</Label>
                      {isEditing ? (
                        <Input {...register('code')} placeholder="R-001" className={`font-mono ${errors.code ? 'border-red-500' : ''}`} />
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm font-mono">{risque?.id_risque || risque?.code}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Catégorie *</Label>
                      {isEditing ? (
                        <Select {...register('categorie')}>
                          {CATEGORIES.map((cat) => (
                            <SelectOption key={cat} value={cat}>{CATEGORIE_LABELS[cat]}</SelectOption>
                          ))}
                        </Select>
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm">{CATEGORIE_LABELS[watchStatut as unknown as Categorie] || '-'}</div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-medium mb-1.5 block">Titre * <span className="text-neutral-400 font-normal">(max 150 car.)</span></Label>
                      {isEditing ? (
                        <Input {...register('titre')} placeholder="Description courte du risque" maxLength={150} className={errors.titre ? 'border-red-500' : ''} />
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm font-medium">{risque?.titre}</div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-medium mb-1.5 block">Description</Label>
                      {isEditing ? (
                        <Textarea {...register('description')} placeholder="Description détaillée du risque..." rows={3} maxLength={500} />
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm min-h-[60px]">{risque?.description || '-'}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Responsabilité */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Responsabilité
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Responsable *</Label>
                      {isEditing ? (
                        <Select {...register('responsableId', { valueAsNumber: true })} className={errors.responsableId ? 'border-red-500' : ''}>
                          <SelectOption value="">Sélectionner...</SelectOption>
                          {users.map((user) => (
                            <SelectOption key={user.id} value={user.id!}>{user.prenom} {user.nom}</SelectOption>
                          ))}
                        </Select>
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm">{risque?.proprietaire || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Date d'identification *</Label>
                      {isEditing ? (
                        <Input type="date" {...register('dateIdentification')} className={errors.dateIdentification ? 'border-red-500' : ''} />
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm">
                          {risque?.date_identification ? new Date(risque.date_identification).toLocaleDateString('fr-FR') : '-'}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Prochaine revue</Label>
                      {isEditing ? (
                        <Input type="date" {...register('dateRevue')} />
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm">
                          {risque?.prochaine_revue ? new Date(risque.prochaine_revue).toLocaleDateString('fr-FR') : '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================= */}
            {/* ONGLET ÉVALUATION */}
            {/* ============================================= */}
            {activeTab === 'evaluation' && (
              <div className="space-y-4">
                {/* Évaluation */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Évaluation du risque
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Probabilité */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Probabilité *</Label>
                      <div className="flex gap-2">
                        {PROBABILITES.map((prob) => {
                          const isActive = watchProbabilite === prob;
                          return (
                            <button
                              key={prob}
                              type="button"
                              onClick={() => isEditing && setValue('probabilite', prob)}
                              disabled={!isEditing}
                              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                                isActive ? `${PROBABILITE_COLORS[prob]} ring-2 ring-offset-1` : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                            >
                              {PROBABILITE_LABELS[prob]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Impact */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Impact *</Label>
                      <div className="flex gap-2">
                        {IMPACTS.map((imp) => {
                          const isActive = watchImpact === imp;
                          return (
                            <button
                              key={imp}
                              type="button"
                              onClick={() => isEditing && setValue('impact', imp)}
                              disabled={!isEditing}
                              className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                                isActive ? `${IMPACT_COLORS[imp]} ring-2 ring-offset-1` : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                            >
                              {IMPACT_LABELS[imp]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Criticité calculée */}
                  <div className="mt-4 p-4 bg-white rounded-lg border-2 border-dashed flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-xs text-neutral-500 mb-1">Criticité calculée</div>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold ${criticiteConfig.color}`}>
                        <span className="text-xl">{criticiteConfig.emoji}</span>
                        <span>{criticiteConfig.label}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matrice visuelle */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3">Matrice de criticité</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center">
                      <thead>
                        <tr>
                          <th className="p-2"></th>
                          <th className="p-2 font-medium" colSpan={4}>IMPACT</th>
                        </tr>
                        <tr>
                          <th className="p-2"></th>
                          {IMPACTS.map(imp => (
                            <th key={imp} className="p-2 font-medium bg-neutral-100 rounded">{IMPACT_LABELS[imp]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...PROBABILITES].reverse().map(prob => (
                          <tr key={prob}>
                            <th className="p-2 font-medium bg-neutral-100 rounded text-left">
                              {prob === PROBABILITES[2] && <span className="block text-[10px] text-neutral-400 mb-1">PROB.</span>}
                              {PROBABILITE_LABELS[prob]}
                            </th>
                            {IMPACTS.map(imp => {
                              const cellCriticite = calculerCriticite(prob, imp);
                              const cellConfig = CRITICITE_CONFIG[cellCriticite];
                              const isSelected = watchProbabilite === prob && watchImpact === imp;
                              return (
                                <td
                                  key={`${prob}-${imp}`}
                                  onClick={() => {
                                    if (isEditing) {
                                      setValue('probabilite', prob);
                                      setValue('impact', imp);
                                    }
                                  }}
                                  className={`p-2 cursor-pointer transition-all ${
                                    isSelected ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110 z-10' : ''
                                  }`}
                                >
                                  <div className={`w-8 h-8 mx-auto rounded-full ${cellConfig.color} flex items-center justify-center text-white font-bold`}>
                                    {cellConfig.emoji}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2 text-center">Cliquez sur une cellule pour sélectionner la combinaison P×I</p>
                </div>
              </div>
            )}

            {/* ============================================= */}
            {/* ONGLET MITIGATION */}
            {/* ============================================= */}
            {activeTab === 'mitigation' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Plan de mitigation
                  </h3>
                  <p className="text-xs text-purple-600 mb-3">Décrivez les actions préventives pour réduire la probabilité ou l'impact du risque.</p>

                  {isEditing ? (
                    <Textarea
                      {...register('actionsMitigation')}
                      placeholder="Ex:
- Identifier un fournisseur alternatif
- Négocier des pénalités de retard dans le contrat
- Mettre en place un suivi hebdomadaire avec le fournisseur..."
                      rows={8}
                      maxLength={1000}
                    />
                  ) : (
                    <div className="p-3 bg-white rounded border text-sm whitespace-pre-wrap min-h-[150px]">
                      {risque?.plan_mitigation || 'Aucun plan de mitigation défini.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================= */}
            {/* ONGLET LIENS */}
            {/* ============================================= */}
            {activeTab === 'liens' && (
              <div className="space-y-4">
                {/* Jalons impactés */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Jalons impactés
                    {jalonIds.length > 0 && <Badge variant="info" className="ml-2">{jalonIds.length}</Badge>}
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {jalons.slice(0, 20).map((jalon) => (
                      <label key={jalon.id} className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={jalonIds.includes(jalon.id!)}
                          onChange={() => isEditing && toggleJalon(jalon.id!)}
                          disabled={!isEditing}
                          className="rounded border-neutral-300"
                        />
                        <span className="text-xs font-mono text-neutral-500">{jalon.id_jalon}</span>
                        <span className="flex-1 text-sm truncate">{jalon.titre}</span>
                      </label>
                    ))}
                    {jalons.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucun jalon disponible</p>
                    )}
                  </div>
                </div>

                {/* Actions liées */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Actions liées
                    {actionIds.length > 0 && <Badge variant="info" className="ml-2">{actionIds.length}</Badge>}
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {actions.slice(0, 20).map((action) => (
                      <label key={action.id} className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionIds.includes(action.id!)}
                          onChange={() => isEditing && toggleAction(action.id!)}
                          disabled={!isEditing}
                          className="rounded border-neutral-300"
                        />
                        <span className="text-xs font-mono text-neutral-500">{action.id_action}</span>
                        <span className="flex-1 text-sm truncate">{action.titre}</span>
                      </label>
                    ))}
                    {actions.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center py-4">Aucune action disponible</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer fixe */}
          <div className="p-4 border-t bg-white rounded-b-xl flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-1" />
              {isEditing ? 'Annuler' : 'Fermer'}
            </Button>
            {isEditing && (
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                {isSubmitting ? (
                  <><Clock className="w-4 h-4 mr-1 animate-spin" />Enregistrement...</>
                ) : (
                  <><Save className="w-4 h-4 mr-1" />Enregistrer</>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RisqueForm;
