import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Wand2,
  Target,
  Calendar,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Sparkles,
  Flag,
  Link2,
  Clock,
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
} from '@/components/ui';
import { useUsers, useJalons } from '@/hooks';
import { createAction } from '@/hooks/useActions';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import {
  AXES,
  AXE_LABELS,
  ACTION_CATEGORIES,
  ACTION_CATEGORY_LABELS,
  ACTION_TYPES,
  ACTION_TYPE_LABELS,
  PRIORITES,
  PRIORITE_LABELS,
  type Axe,
} from '@/types';

// Schemas par étape
const step1Schema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(100),
  description: z.string().max(500).optional(),
  jalonId: z.number().nullable(),
  axe: z.enum(['axe1_rh', 'axe2_commercial', 'axe3_technique', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation']),
});

const step2Schema = z.object({
  date_debut_prevue: z.string().min(1, 'La date de début est obligatoire'),
  date_fin_prevue: z.string().min(1, 'La date de fin est obligatoire'),
  duree_prevue_jours: z.number().min(1),
});

const step3Schema = z.object({
  responsableId: z.number({ required_error: 'Veuillez sélectionner un responsable' }),
  priorite: z.enum(['critique', 'haute', 'moyenne', 'basse']),
  categorie: z.enum(['administratif', 'technique', 'commercial', 'financier', 'juridique', 'rh', 'communication', 'operationnel', 'autre']),
});

// Schema complet
const wizardSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type WizardFormData = z.infer<typeof wizardSchema>;

interface ActionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (actionId: number) => void;
  defaultJalonId?: number;
  defaultAxe?: Axe;
}

const STEPS = [
  { id: 1, label: 'Identification', icon: Target, description: 'Titre et jalon lié' },
  { id: 2, label: 'Planning', icon: Calendar, description: 'Dates et durée' },
  { id: 3, label: 'Attribution', icon: Users, description: 'Responsable et priorité' },
];

const AXE_PREFIXES: Record<string, string> = {
  'axe1_rh': 'RH',
  'axe2_commercial': 'COM',
  'axe3_technique': 'TECH',
  'axe4_budget': 'BUD',
  'axe5_marketing': 'MKT',
  'axe6_exploitation': 'EXP',
};

const PRIORITE_COLORS: Record<string, string> = {
  critique: 'bg-red-100 border-red-300 text-red-800',
  haute: 'bg-orange-100 border-orange-300 text-orange-800',
  moyenne: 'bg-blue-100 border-blue-300 text-blue-800',
  basse: 'bg-gray-100 border-gray-300 text-gray-600',
};

export function ActionWizard({
  isOpen,
  onClose,
  onSuccess,
  defaultJalonId,
  defaultAxe,
}: ActionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const users = useUsers();
  const jalons = useJalons();
  const allActions = useLiveQuery(() => db.actions.toArray()) ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      titre: '',
      description: '',
      jalonId: defaultJalonId ?? null,
      axe: defaultAxe || 'axe3_technique',
      date_debut_prevue: '',
      date_fin_prevue: '',
      duree_prevue_jours: 7,
      responsableId: undefined,
      priorite: 'moyenne',
      categorie: 'operationnel',
    },
  });

  const watchAxe = watch('axe');
  const watchJalonId = watch('jalonId');
  const watchPriorite = watch('priorite');
  const watchDateDebut = watch('date_debut_prevue');
  const watchDateFin = watch('date_fin_prevue');

  // Pre-fill from selected jalon
  useEffect(() => {
    if (watchJalonId) {
      const linkedJalon = jalons.find(j => j.id === watchJalonId);
      if (linkedJalon) {
        // Auto-fill axe from jalon
        setValue('axe', linkedJalon.axe);

        // Auto-fill responsable if available
        if (linkedJalon.responsableId && !watch('responsableId')) {
          setValue('responsableId', linkedJalon.responsableId);
        }

        // Map jalon importance to action priority
        const prioriteMap: Record<string, 'critique' | 'haute' | 'moyenne' | 'basse'> = {
          'critique': 'critique',
          'majeur': 'haute',
          'standard': 'moyenne',
          'mineur': 'basse',
        };
        if (linkedJalon.niveau_importance) {
          setValue('priorite', prioriteMap[linkedJalon.niveau_importance] || 'moyenne');
        }

        // Suggest date = J-30 before jalon
        if (linkedJalon.date_prevue) {
          const jalonDate = new Date(linkedJalon.date_prevue);
          const actionEndDate = new Date(jalonDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          const duree = watch('duree_prevue_jours') || 7;
          const actionStartDate = new Date(actionEndDate.getTime() - duree * 24 * 60 * 60 * 1000);
          setValue('date_fin_prevue', actionEndDate.toISOString().split('T')[0]);
          setValue('date_debut_prevue', actionStartDate.toISOString().split('T')[0]);
        }
      }
    }
  }, [watchJalonId, jalons, setValue, watch]);

  // Auto-calculate duration when dates change
  useEffect(() => {
    if (watchDateDebut && watchDateFin) {
      const start = new Date(watchDateDebut);
      const end = new Date(watchDateFin);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setValue('duree_prevue_jours', diffDays);
      }
    }
  }, [watchDateDebut, watchDateFin, setValue]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        titre: '',
        description: '',
        jalonId: defaultJalonId ?? null,
        axe: defaultAxe || 'axe3_technique',
        date_debut_prevue: '',
        date_fin_prevue: '',
        duree_prevue_jours: 7,
        responsableId: undefined,
        priorite: 'moyenne',
        categorie: 'operationnel',
      });
      setCurrentStep(1);
    }
  }, [isOpen, defaultJalonId, defaultAxe, reset]);

  const generateActionId = (axe: Axe, jalonId: number | null): string => {
    const prefix = AXE_PREFIXES[axe] || 'GEN';

    if (jalonId) {
      const linkedJalon = jalons.find(j => j.id === jalonId);
      const jalonActions = allActions.filter(a => a.jalonId === jalonId);
      const num = jalonActions.length + 1;
      const jalonNum = linkedJalon?.id_jalon?.split('-').pop() || '001';
      return `${prefix}.${jalonNum}.${num}`;
    } else {
      const axeActions = allActions.filter(a => a.axe === axe);
      const num = String(axeActions.length + 1).padStart(3, '0');
      return `ACT-${prefix}-${num}`;
    }
  };

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof WizardFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['titre', 'axe'];
        break;
      case 2:
        fieldsToValidate = ['date_debut_prevue', 'date_fin_prevue'];
        break;
      case 3:
        fieldsToValidate = ['responsableId', 'priorite', 'categorie'];
        break;
    }

    return await trigger(fieldsToValidate);
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true);

    try {
      const responsable = users.find(u => u.id === data.responsableId);
      const responsableName = responsable ? `${responsable.prenom} ${responsable.nom}` : '';

      const today = new Date().toISOString().split('T')[0];
      const prefix = AXE_PREFIXES[data.axe] || 'GEN';

      const actionId = await createAction({
        // Identification
        id_action: generateActionId(data.axe, data.jalonId),
        code_wbs: `WBS-${prefix}-A${String(allActions.length + 1).padStart(3, '0')}`,
        titre: data.titre,
        description: data.description || data.titre,

        // Classification
        axe: data.axe,
        phase: 'execution',
        categorie: data.categorie,
        sous_categorie: null,
        type_action: 'tache',

        // Planning
        date_creation: today,
        date_debut_prevue: data.date_debut_prevue,
        date_fin_prevue: data.date_fin_prevue,
        date_debut_reelle: null,
        date_fin_reelle: null,
        duree_prevue_jours: data.duree_prevue_jours,
        duree_reelle_jours: null,
        date_butoir: null,
        flexibilite: 'standard',

        // Alerts
        alerte_j30: null,
        alerte_j15: null,
        alerte_j7: null,
        alerte_j3: null,

        // RACI
        responsable: responsableName,
        responsableId: data.responsableId,
        approbateur: responsableName,
        consultes: [],
        informes: [],
        delegue: null,

        // Escalade
        escalade_niveau1: responsableName,
        escalade_niveau2: '',
        escalade_niveau3: '',

        // Dependencies
        predecesseurs: [],
        successeurs: [],
        contraintes_externes: null,
        chemin_critique: false,
        jalonId: data.jalonId,

        // Resources
        ressources_humaines: [responsableName],
        charge_homme_jour: null,
        budget_prevu: null,
        budget_engage: null,
        budget_realise: null,
        ligne_budgetaire: null,

        // Livrables
        livrables: [],
        criteres_acceptation: [],
        documents: [],

        // Suivi
        statut: 'a_faire',
        avancement: 0,
        methode_avancement: 'manuel',
        priorite: data.priorite,
        sante: 'vert',
        tendance: 'stable',
        derniere_mise_a_jour: today,

        // Alertes & reporting
        alertes: [],
        visibilite_reporting: 'flash_hebdo',

        // Commentaires & historique
        commentaires: [],
        historique: [{
          id: crypto.randomUUID(),
          date: today,
          auteur: responsableName,
          type: 'creation',
          description: 'Création via assistant guidé',
        }],

        // Metadata
        tags: [],
        source: 'wizard',
      });

      onSuccess?.(actionId);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedJalon = watchJalonId ? jalons.find(j => j.id === watchJalonId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span>Assistant création d'action</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="relative mb-6">
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {index > 0 && (
                      <div
                        className={`flex-1 h-1 transition-colors ${
                          isCompleted || isActive ? 'bg-blue-500' : 'bg-neutral-200'
                        }`}
                      />
                    )}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 transition-colors ${
                          isCompleted ? 'bg-blue-500' : 'bg-neutral-200'
                        }`}
                      />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-sm font-medium ${
                        isActive ? 'text-blue-700' : 'text-neutral-600'
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-xs text-neutral-500">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Identification */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Étape 1 : Identifiez votre action
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Décrivez l'action et associez-la optionnellement à un jalon.
                </p>
              </div>

              <div>
                <Label htmlFor="titre" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Target className="w-4 h-4 text-blue-600" />
                  Titre de l'action *
                </Label>
                <Input
                  id="titre"
                  {...register('titre')}
                  placeholder="Ex: Finaliser le contrat fournisseur"
                  className={errors.titre ? 'border-red-500' : ''}
                  autoFocus
                />
                {errors.titre && (
                  <p className="text-red-500 text-xs mt-1">{errors.titre.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium mb-1.5 block">
                  Description (optionnel)
                </Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Détails supplémentaires..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="jalonId" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Link2 className="w-4 h-4 text-purple-600" />
                  Jalon lié (optionnel)
                </Label>
                <Select
                  id="jalonId"
                  {...register('jalonId', { valueAsNumber: true })}
                >
                  <SelectOption value="">Aucun jalon</SelectOption>
                  {jalons.map((jalon) => (
                    <SelectOption key={jalon.id} value={jalon.id!}>
                      {jalon.titre} ({new Date(jalon.date_prevue).toLocaleDateString('fr-FR')})
                    </SelectOption>
                  ))}
                </Select>
                {selectedJalon && (
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    L'axe, le responsable et les dates seront pré-remplis automatiquement.
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="axe" className="text-sm font-medium mb-1.5 block">
                  Axe *
                </Label>
                <Select
                  id="axe"
                  {...register('axe')}
                  className={errors.axe ? 'border-red-500' : ''}
                  disabled={!!watchJalonId}
                >
                  {AXES.map((axe) => (
                    <SelectOption key={axe} value={axe}>
                      {AXE_LABELS[axe]}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Planning */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  Étape 2 : Planifiez votre action
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Définissez les dates de début et de fin. La durée est calculée automatiquement.
                </p>
              </div>

              {selectedJalon && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-800 text-sm font-medium mb-1">
                    <Sparkles className="w-4 h-4" />
                    Dates suggérées (J-30 du jalon)
                  </div>
                  <p className="text-xs text-purple-700">
                    Jalon "{selectedJalon.titre}" prévu le {new Date(selectedJalon.date_prevue).toLocaleDateString('fr-FR')}.
                    L'action devrait se terminer 30 jours avant.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_debut_prevue" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Date de début *
                  </Label>
                  <Input
                    type="date"
                    id="date_debut_prevue"
                    {...register('date_debut_prevue')}
                    className={errors.date_debut_prevue ? 'border-red-500' : ''}
                  />
                  {errors.date_debut_prevue && (
                    <p className="text-red-500 text-xs mt-1">{errors.date_debut_prevue.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="date_fin_prevue" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <Calendar className="w-4 h-4 text-red-600" />
                    Date de fin *
                  </Label>
                  <Input
                    type="date"
                    id="date_fin_prevue"
                    {...register('date_fin_prevue')}
                    className={errors.date_fin_prevue ? 'border-red-500' : ''}
                  />
                  {errors.date_fin_prevue && (
                    <p className="text-red-500 text-xs mt-1">{errors.date_fin_prevue.message}</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-2 text-neutral-700 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Durée calculée:</span>
                  <span className="font-bold text-blue-700">
                    {watch('duree_prevue_jours')} jour{watch('duree_prevue_jours') > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Attribution */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-orange-800 text-sm font-medium">
                  <Users className="w-4 h-4" />
                  Étape 3 : Assignez l'action
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  Désignez un responsable et définissez la priorité.
                </p>
              </div>

              <div>
                <Label htmlFor="responsableId" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Users className="w-4 h-4 text-orange-600" />
                  Responsable *
                </Label>
                <Select
                  id="responsableId"
                  {...register('responsableId', { valueAsNumber: true })}
                  className={errors.responsableId ? 'border-red-500' : ''}
                >
                  <SelectOption value="">Sélectionner...</SelectOption>
                  {users.map((user) => (
                    <SelectOption key={user.id} value={user.id!}>
                      {user.prenom} {user.nom} - {user.fonction || user.role}
                    </SelectOption>
                  ))}
                </Select>
                {errors.responsableId && (
                  <p className="text-red-500 text-xs mt-1">{errors.responsableId.message}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Priorité *
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITES.map((priorite) => (
                    <button
                      key={priorite}
                      type="button"
                      onClick={() => setValue('priorite', priorite)}
                      className={`p-2 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                        watchPriorite === priorite
                          ? `${PRIORITE_COLORS[priorite]} ring-2 ring-offset-1`
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {priorite === 'critique' && <Flag className="w-4 h-4 mx-auto mb-1 text-red-600" />}
                      {priorite === 'haute' && <Flag className="w-4 h-4 mx-auto mb-1 text-orange-600" />}
                      {PRIORITE_LABELS[priorite]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="categorie" className="text-sm font-medium mb-1.5 block">
                  Catégorie
                </Label>
                <Select
                  id="categorie"
                  {...register('categorie')}
                >
                  {ACTION_CATEGORIES.map((cat) => (
                    <SelectOption key={cat} value={cat}>
                      {ACTION_CATEGORY_LABELS[cat]}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="text-sm font-medium text-neutral-700 mb-2">Récapitulatif</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-neutral-500">Titre:</div>
                  <div className="font-medium truncate">{watch('titre') || '-'}</div>
                  <div className="text-neutral-500">Axe:</div>
                  <div className="font-medium">{AXE_LABELS[watchAxe]}</div>
                  <div className="text-neutral-500">Durée:</div>
                  <div className="font-medium">{watch('duree_prevue_jours')} jours</div>
                  <div className="text-neutral-500">Priorité:</div>
                  <div className={`font-medium px-2 py-0.5 rounded text-xs inline-block ${PRIORITE_COLORS[watchPriorite]}`}>
                    {PRIORITE_LABELS[watchPriorite]}
                  </div>
                  {selectedJalon && (
                    <>
                      <div className="text-neutral-500">Jalon:</div>
                      <div className="font-medium truncate text-purple-700">{selectedJalon.titre}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-4 mt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onClose : handlePrev}
            >
              {currentStep === 1 ? (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Annuler
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </>
              )}
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Créer l'action
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ActionWizard;
