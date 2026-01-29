import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  AlertTriangle,
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
import { createJalon } from '@/hooks/useJalons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import {
  AXES,
  AXE_LABELS,
  JALON_CATEGORIES,
  JALON_CATEGORY_LABELS,
  JALON_TYPES,
  JALON_TYPE_LABELS,
  NIVEAUX_IMPORTANCE,
  NIVEAU_IMPORTANCE_LABELS,
  PROJECT_PHASES,
  PROJECT_PHASE_LABELS,
  FLEXIBILITES,
  FLEXIBILITE_LABELS,
  type Axe,
} from '@/types';

// Schemas par étape
const step1Schema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(100),
  description: z.string().max(500).optional(),
  axe: z.enum(['axe1_rh', 'axe2_commercial', 'axe3_technique', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation']),
  categorie: z.enum(['contrat', 'reception', 'validation', 'livraison', 'inauguration', 'recrutement', 'formation', 'audit', 'autre']),
  niveau_importance: z.enum(['critique', 'majeur', 'standard', 'mineur']),
});

const step2Schema = z.object({
  date_prevue: z.string().min(1, 'La date prévue est obligatoire'),
  projectPhase: z.enum(['phase1_preparation', 'phase2_mobilisation', 'phase3_lancement', 'phase4_stabilisation']).nullable(),
  flexibilite: z.enum(['fixe', 'flexible', 'standard', 'critique']),
});

const step3Schema = z.object({
  responsableId: z.number({ required_error: 'Veuillez sélectionner un responsable' }),
  validateurId: z.number({ required_error: 'Veuillez sélectionner un validateur' }),
});

// Schema complet
const wizardSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type WizardFormData = z.infer<typeof wizardSchema>;

interface JalonWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (jalonId: number) => void;
  defaultAxe?: Axe;
}

const STEPS = [
  { id: 1, label: 'Identification', icon: Target, description: 'Titre, axe et importance' },
  { id: 2, label: 'Planning', icon: Calendar, description: 'Date et phase projet' },
  { id: 3, label: 'Responsabilités', icon: Users, description: 'Responsable et validateur' },
];

const AXE_PREFIXES: Record<string, string> = {
  'axe1_rh': 'RH',
  'axe2_commercial': 'COM',
  'axe3_technique': 'TECH',
  'axe4_budget': 'BUD',
  'axe5_marketing': 'MKT',
  'axe6_exploitation': 'EXP',
};

const IMPORTANCE_COLORS: Record<string, string> = {
  critique: 'bg-red-100 border-red-300 text-red-800',
  majeur: 'bg-orange-100 border-orange-300 text-orange-800',
  standard: 'bg-blue-100 border-blue-300 text-blue-800',
  mineur: 'bg-gray-100 border-gray-300 text-gray-600',
};

export function JalonWizard({
  isOpen,
  onClose,
  onSuccess,
  defaultAxe,
}: JalonWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const users = useUsers();
  const jalons = useJalons();

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
      axe: defaultAxe || 'axe3_technique',
      categorie: 'validation',
      niveau_importance: 'standard',
      date_prevue: '',
      projectPhase: null,
      flexibilite: 'standard',
      responsableId: undefined,
      validateurId: undefined,
    },
  });

  const watchAxe = watch('axe');
  const watchImportance = watch('niveau_importance');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        titre: '',
        description: '',
        axe: defaultAxe || 'axe3_technique',
        categorie: 'validation',
        niveau_importance: 'standard',
        date_prevue: '',
        projectPhase: null,
        flexibilite: 'standard',
        responsableId: undefined,
        validateurId: undefined,
      });
      setCurrentStep(1);
    }
  }, [isOpen, defaultAxe, reset]);

  const generateJalonId = (axe: Axe): string => {
    const prefix = AXE_PREFIXES[axe] || 'GEN';
    const year = new Date().getFullYear();
    const axeJalons = jalons.filter(j => j.axe === axe);
    const num = String(axeJalons.length + 1).padStart(3, '0');
    return `JAL-${prefix}-${year}-${num}`;
  };

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof WizardFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['titre', 'axe', 'categorie', 'niveau_importance'];
        break;
      case 2:
        fieldsToValidate = ['date_prevue', 'flexibilite'];
        break;
      case 3:
        fieldsToValidate = ['responsableId', 'validateurId'];
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
      const validateur = users.find(u => u.id === data.validateurId);
      const responsableName = responsable ? `${responsable.prenom} ${responsable.nom}` : '';
      const validateurName = validateur ? `${validateur.prenom} ${validateur.nom}` : '';

      const today = new Date().toISOString().split('T')[0];
      const prefix = AXE_PREFIXES[data.axe] || 'GEN';

      const jalonId = await createJalon({
        // Identification
        id_jalon: generateJalonId(data.axe),
        code_wbs: `WBS-${prefix}-M${String(jalons.length + 1).padStart(3, '0')}`,
        titre: data.titre,
        description: data.description || data.titre,

        // Classification
        axe: data.axe,
        categorie: data.categorie,
        type_jalon: 'managerial',
        niveau_importance: data.niveau_importance,
        projectPhase: data.projectPhase || undefined,

        // Planning
        date_prevue: data.date_prevue,
        date_reelle: null,
        heure_cible: null,
        fuseau_horaire: 'Africa/Abidjan',
        date_butoir_absolue: null,
        flexibilite: data.flexibilite,

        // Alerts
        alerte_j30: '',
        alerte_j15: '',
        alerte_j7: '',

        // Status
        statut: 'a_venir',
        avancement_prealables: 0,
        confiance_atteinte: 50,
        tendance: 'stable',
        date_derniere_maj: today,
        maj_par: responsableName,

        // Responsabilités
        responsable: responsableName,
        responsableId: data.responsableId,
        validateur: validateurName,
        validateurId: data.validateurId,
        contributeurs: [],
        parties_prenantes: [],

        // Escalade
        escalade_niveau1: responsableName,
        escalade_niveau2: '',
        escalade_niveau3: '',

        // Livrables & risques
        livrables: [],
        risques: [],
        documents: [],

        // Commentaires
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
        visibilite_reporting: 'tous_niveaux',
        source: 'wizard',
      });

      onSuccess?.(jalonId);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span>Assistant création de jalon</span>
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
                          isCompleted || isActive ? 'bg-purple-500' : 'bg-neutral-200'
                        }`}
                      />
                    )}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-purple-500 text-white ring-4 ring-purple-100'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 transition-colors ${
                          isCompleted ? 'bg-purple-500' : 'bg-neutral-200'
                        }`}
                      />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-sm font-medium ${
                        isActive ? 'text-purple-700' : 'text-neutral-600'
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
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-purple-800 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Étape 1 : Identifiez votre jalon
                </div>
                <p className="text-xs text-purple-700 mt-1">
                  Donnez un titre clair et choisissez les caractéristiques principales.
                </p>
              </div>

              <div>
                <Label htmlFor="titre" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Target className="w-4 h-4 text-purple-600" />
                  Titre du jalon *
                </Label>
                <Input
                  id="titre"
                  {...register('titre')}
                  placeholder="Ex: Signature du contrat exploitant"
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
                  placeholder="Description détaillée..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="axe" className="text-sm font-medium mb-1.5 block">
                    Axe *
                  </Label>
                  <Select
                    id="axe"
                    {...register('axe')}
                    className={errors.axe ? 'border-red-500' : ''}
                  >
                    {AXES.map((axe) => (
                      <SelectOption key={axe} value={axe}>
                        {AXE_LABELS[axe]}
                      </SelectOption>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categorie" className="text-sm font-medium mb-1.5 block">
                    Catégorie *
                  </Label>
                  <Select
                    id="categorie"
                    {...register('categorie')}
                  >
                    {JALON_CATEGORIES.map((cat) => (
                      <SelectOption key={cat} value={cat}>
                        {JALON_CATEGORY_LABELS[cat]}
                      </SelectOption>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Niveau d'importance *
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {NIVEAUX_IMPORTANCE.map((niveau) => (
                    <button
                      key={niveau}
                      type="button"
                      onClick={() => setValue('niveau_importance', niveau)}
                      className={`p-2 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                        watchImportance === niveau
                          ? `${IMPORTANCE_COLORS[niveau]} ring-2 ring-offset-1`
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {niveau === 'critique' && <AlertTriangle className="w-4 h-4 mx-auto mb-1" />}
                      {niveau === 'majeur' && <Flag className="w-4 h-4 mx-auto mb-1" />}
                      {NIVEAU_IMPORTANCE_LABELS[niveau]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Planning */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  Étape 2 : Planifiez votre jalon
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Définissez la date prévue et la phase du projet.
                </p>
              </div>

              <div>
                <Label htmlFor="date_prevue" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Date prévue *
                </Label>
                <Input
                  type="date"
                  id="date_prevue"
                  {...register('date_prevue')}
                  className={errors.date_prevue ? 'border-red-500' : ''}
                />
                {errors.date_prevue && (
                  <p className="text-red-500 text-xs mt-1">{errors.date_prevue.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="projectPhase" className="text-sm font-medium mb-1.5 block">
                  Phase projet (optionnel)
                </Label>
                <Select
                  id="projectPhase"
                  {...register('projectPhase')}
                >
                  <SelectOption value="">Non définie</SelectOption>
                  {PROJECT_PHASES.map((phase) => (
                    <SelectOption key={phase} value={phase}>
                      {PROJECT_PHASE_LABELS[phase]}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="flexibilite" className="text-sm font-medium mb-1.5 block">
                  Flexibilité de la date
                </Label>
                <Select
                  id="flexibilite"
                  {...register('flexibilite')}
                >
                  {FLEXIBILITES.map((flex) => (
                    <SelectOption key={flex} value={flex}>
                      {FLEXIBILITE_LABELS[flex]}
                    </SelectOption>
                  ))}
                </Select>
                <p className="text-xs text-neutral-500 mt-1">
                  Indique si la date peut être ajustée ou non.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Responsabilités */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                  <Users className="w-4 h-4" />
                  Étape 3 : Assignez les responsables
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Désignez qui pilote et qui valide l'atteinte du jalon.
                </p>
              </div>

              <div>
                <Label htmlFor="responsableId" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Users className="w-4 h-4 text-green-600" />
                  Responsable (R) *
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
                <p className="text-xs text-neutral-500 mt-1">
                  La personne qui pilote et coordonne les actions menant au jalon.
                </p>
              </div>

              <div>
                <Label htmlFor="validateurId" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Check className="w-4 h-4 text-blue-600" />
                  Validateur (A) *
                </Label>
                <Select
                  id="validateurId"
                  {...register('validateurId', { valueAsNumber: true })}
                  className={errors.validateurId ? 'border-red-500' : ''}
                >
                  <SelectOption value="">Sélectionner...</SelectOption>
                  {users.map((user) => (
                    <SelectOption key={user.id} value={user.id!}>
                      {user.prenom} {user.nom} - {user.fonction || user.role}
                    </SelectOption>
                  ))}
                </Select>
                {errors.validateurId && (
                  <p className="text-red-500 text-xs mt-1">{errors.validateurId.message}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  La personne qui approuve officiellement que le jalon est atteint.
                </p>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="text-sm font-medium text-neutral-700 mb-2">Récapitulatif</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-neutral-500">Titre:</div>
                  <div className="font-medium">{watch('titre') || '-'}</div>
                  <div className="text-neutral-500">Axe:</div>
                  <div className="font-medium">{AXE_LABELS[watchAxe]}</div>
                  <div className="text-neutral-500">Date:</div>
                  <div className="font-medium">
                    {watch('date_prevue')
                      ? new Date(watch('date_prevue')).toLocaleDateString('fr-FR')
                      : '-'}
                  </div>
                  <div className="text-neutral-500">Importance:</div>
                  <div className={`font-medium px-2 py-0.5 rounded text-xs inline-block ${IMPORTANCE_COLORS[watchImportance]}`}>
                    {NIVEAU_IMPORTANCE_LABELS[watchImportance]}
                  </div>
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
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
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
                    Créer le jalon
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

export default JalonWizard;
