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
  Link2,
  FileText,
  MessageSquare,
  GitBranch,
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
  useToast,
} from '@/components/ui';
import { useUsers, useJalons } from '@/hooks';
import { createJalon } from '@/hooks/useJalons';
import {
  AXES,
  AXE_LABELS,
  type Axe,
} from '@/types';

// ============================================================================
// SPÉCIFICATIONS v2.0 - Formulaire Jalon
// ============================================================================
// Champs Obligatoires (5) : Axe, Libellé, Cible, Échéance, Responsable
// Champs Auto-calculés (5) : ID, Statut, % Avancement, Jours restants, Météo
// Champs Optionnels (3) : Prérequis, Preuve, Commentaire
// ============================================================================

// Schema pour les champs obligatoires
const step1Schema = z.object({
  axe: z.enum(['axe1_rh', 'axe2_commercial', 'axe3_technique', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation', 'axe7_construction', 'axe8_divers'] as const, {
    required_error: 'L\'axe est obligatoire',
  }),
  titre: z.string().min(3, 'Le libellé doit contenir au moins 3 caractères').max(100, 'Le libellé ne peut pas dépasser 100 caractères'),
  cible: z.string().min(1, 'La cible est obligatoire').max(50, 'La cible ne peut pas dépasser 50 caractères'),
  date_prevue: z.string().min(1, 'L\'échéance est obligatoire'),
  responsableId: z.number({ required_error: 'Veuillez sélectionner un responsable' }),
});

// Schema pour les champs optionnels
const step2Schema = z.object({
  prerequis: z.array(z.string()).optional(),
  preuve: z.string().max(500).optional(),
  commentaire: z.string().max(500).optional(),
});

// Schema complet
const wizardSchema = step1Schema.merge(step2Schema);
type WizardFormData = z.infer<typeof wizardSchema>;

interface JalonWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (jalonId: number) => void;
  defaultAxe?: Axe;
}

const STEPS = [
  { id: 1, label: 'Obligatoires', icon: Target, description: 'Axe, Libellé, Cible, Échéance, Responsable' },
  { id: 2, label: 'Optionnels', icon: FileText, description: 'Prérequis, Preuve, Commentaire' },
];

// Préfixes pour générer l'ID au format J-{AXE}-{N°}
const AXE_PREFIXES: Record<string, string> = {
  'axe1_rh': 'RH',
  'axe2_commercial': 'COM',
  'axe3_technique': 'TECH',
  'axe4_budget': 'BUD',
  'axe5_marketing': 'MKT',
  'axe6_exploitation': 'EXP',
  'axe7_construction': 'CON',
  'axe8_divers': 'DIV',
};

export function JalonWizard({
  isOpen,
  onClose,
  onSuccess,
  defaultAxe,
}: JalonWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPrerequis, setSelectedPrerequis] = useState<string[]>([]);

  const users = useUsers();
  const jalons = useJalons();
  const toast = useToast();

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
      axe: defaultAxe || 'axe3_technique',
      titre: '',
      cible: '',
      date_prevue: '',
      responsableId: undefined,
      prerequis: [],
      preuve: '',
      commentaire: '',
    },
  });

  const watchAxe = watch('axe');
  const watchTitre = watch('titre');
  const watchCible = watch('cible');
  const watchDate = watch('date_prevue');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        axe: defaultAxe || 'axe3_technique',
        titre: '',
        cible: '',
        date_prevue: '',
        responsableId: undefined,
        prerequis: [],
        preuve: '',
        commentaire: '',
      });
      setSelectedPrerequis([]);
      setCurrentStep(1);
    }
  }, [isOpen, defaultAxe, reset]);

  // Générer l'ID au format J-{AXE}-{N°}
  const generateJalonId = (axe: Axe): string => {
    const prefix = AXE_PREFIXES[axe] || 'GEN';
    const axeJalons = jalons.filter(j => j.axe === axe);
    const num = axeJalons.length + 1;
    return `J-${prefix}-${num}`;
  };

  // ID prévisualisé
  const previewId = generateJalonId(watchAxe);

  // Calculer les jours restants
  const calculateJoursRestants = (datePrevue: string): number | null => {
    if (!datePrevue) return null;
    const today = new Date();
    const target = new Date(datePrevue);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const joursRestants = calculateJoursRestants(watchDate);

  const validateCurrentStep = async () => {
    if (currentStep === 1) {
      return await trigger(['axe', 'titre', 'cible', 'date_prevue', 'responsableId']);
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePrerequis = (jalonId: string) => {
    setSelectedPrerequis((prev) => {
      const newSelection = prev.includes(jalonId)
        ? prev.filter((id) => id !== jalonId)
        : [...prev, jalonId];
      setValue('prerequis', newSelection);
      return newSelection;
    });
  };

  const onSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true);

    try {
      const responsable = users.find(u => u.id === data.responsableId);
      const responsableName = responsable ? `${responsable.prenom} ${responsable.nom}` : '';

      const today = new Date().toISOString().split('T')[0];
      const jalonIdGenerated = generateJalonId(data.axe);

      const jalonId = await createJalon({
        // ID auto-calculé au format J-{AXE}-{N°}
        id_jalon: jalonIdGenerated,
        code_wbs: jalonIdGenerated,

        // Champs obligatoires
        titre: data.titre,
        description: data.cible, // La cible sert de description principale
        axe: data.axe,
        date_prevue: data.date_prevue,
        responsable: responsableName,
        responsableId: data.responsableId,

        // Champs optionnels
        prerequis_jalons: selectedPrerequis,
        preuve_url: data.preuve || null,

        // Champs avec valeurs par défaut
        categorie: 'validation',
        type_jalon: 'managerial',
        niveau_importance: 'standard',
        projectPhase: undefined,

        date_reelle: null,
        heure_cible: null,
        fuseau_horaire: 'Africa/Abidjan',
        date_butoir_absolue: null,
        flexibilite: 'standard',

        // Alerts
        alerte_j30: '',
        alerte_j15: '',
        alerte_j7: '',

        // Statut auto-calculé (initialisé à "a_venir")
        statut: 'a_venir',
        avancement_prealables: 0,
        confiance_atteinte: 50,
        tendance: 'stable',
        date_derniere_maj: today,
        maj_par: responsableName,

        // Validateur = responsable par défaut
        validateur: responsableName,
        validateurId: data.responsableId,
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
        commentaires: data.commentaire ? [{
          id: crypto.randomUUID(),
          date: today,
          auteur: responsableName,
          texte: data.commentaire,
        }] : [],
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

      toast.success('Jalon cree', `"${data.titre}" a ete ajoute`);
      onSuccess?.(jalonId);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur', 'Impossible de creer le jalon');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrer les jalons disponibles pour les prérequis (exclure le même axe en option)
  const jalonsDisponibles = jalons.filter(j => j.statut !== 'atteint');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span>Nouveau Jalon</span>
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
          {/* Step 1: Champs Obligatoires */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-purple-800 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Champs obligatoires (5)
                </div>
                <p className="text-xs text-purple-700 mt-1">
                  Axe, Libellé, Cible, Échéance, Responsable
                </p>
              </div>

              {/* ID Auto-calculé (lecture seule) */}
              <div className="p-3 bg-neutral-100 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">ID (auto-calculé)</span>
                  <span className="font-mono font-bold text-purple-700">{previewId}</span>
                </div>
              </div>

              {/* Axe */}
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
                {errors.axe && (
                  <p className="text-red-500 text-xs mt-1">{errors.axe.message}</p>
                )}
              </div>

              {/* Libellé */}
              <div>
                <Label htmlFor="titre" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Target className="w-4 h-4 text-purple-600" />
                  Libellé * <span className="text-xs text-neutral-400">(max 100 car.)</span>
                </Label>
                <Input
                  id="titre"
                  {...register('titre')}
                  placeholder="Ex: Signature contrat exploitant principal"
                  className={errors.titre ? 'border-red-500' : ''}
                  maxLength={100}
                  autoFocus
                />
                {errors.titre && (
                  <p className="text-red-500 text-xs mt-1">{errors.titre.message}</p>
                )}
              </div>

              {/* Cible */}
              <div>
                <Label htmlFor="cible" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Target className="w-4 h-4 text-green-600" />
                  Cible * <span className="text-xs text-neutral-400">(max 50 car.)</span>
                </Label>
                <Input
                  id="cible"
                  {...register('cible')}
                  placeholder="Ex: 80% BEFA signés"
                  className={errors.cible ? 'border-red-500' : ''}
                  maxLength={50}
                />
                {errors.cible && (
                  <p className="text-red-500 text-xs mt-1">{errors.cible.message}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  Objectif mesurable à atteindre (ex: "100% recrutement", "3 contrats signés")
                </p>
              </div>

              {/* Échéance */}
              <div>
                <Label htmlFor="date_prevue" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Échéance *
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
                {joursRestants !== null && (
                  <p className={`text-xs mt-1 ${joursRestants < 0 ? 'text-red-600' : joursRestants <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                    {joursRestants < 0
                      ? `⚠️ Dépassé de ${Math.abs(joursRestants)} jour(s)`
                      : joursRestants === 0
                      ? "📅 Aujourd'hui"
                      : `📅 Dans ${joursRestants} jour(s)`}
                  </p>
                )}
              </div>

              {/* Responsable */}
              <div>
                <Label htmlFor="responsableId" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Responsable *
                </Label>
                <Select
                  id="responsableId"
                  {...register('responsableId', { valueAsNumber: true })}
                  className={errors.responsableId ? 'border-red-500' : ''}
                >
                  <SelectOption value="">Sélectionner un responsable...</SelectOption>
                  {users.map((user) => (
                    <SelectOption key={user.id} value={user.id!}>
                      {user.prenom} {user.nom} {user.fonction ? `- ${user.fonction}` : ''}
                    </SelectOption>
                  ))}
                </Select>
                {errors.responsableId && (
                  <p className="text-red-500 text-xs mt-1">{errors.responsableId.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Champs Optionnels */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                  <FileText className="w-4 h-4" />
                  Champs optionnels (3)
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Prérequis, Preuve, Commentaire
                </p>
              </div>

              {/* Prérequis (Multi-select jalons) */}
              <div>
                <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <GitBranch className="w-4 h-4 text-orange-600" />
                  Prérequis (jalons)
                </Label>
                <p className="text-xs text-neutral-500 mb-2">
                  Sélectionnez les jalons qui doivent être atteints avant celui-ci
                </p>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {jalonsDisponibles.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-2">
                      Aucun jalon disponible
                    </p>
                  ) : (
                    jalonsDisponibles.map((jalon) => (
                      <label
                        key={jalon.id_jalon}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-neutral-50 ${
                          selectedPrerequis.includes(jalon.id_jalon) ? 'bg-orange-50 border border-orange-200' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPrerequis.includes(jalon.id_jalon)}
                          onChange={() => togglePrerequis(jalon.id_jalon)}
                          className="rounded text-orange-600"
                        />
                        <span className="font-mono text-xs text-neutral-500">{jalon.id_jalon}</span>
                        <span className="text-sm truncate">{jalon.titre}</span>
                      </label>
                    ))
                  )}
                </div>
                {selectedPrerequis.length > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {selectedPrerequis.length} prérequis sélectionné(s)
                  </p>
                )}
              </div>

              {/* Preuve (Fichier/Lien) */}
              <div>
                <Label htmlFor="preuve" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Link2 className="w-4 h-4 text-green-600" />
                  Preuve (lien ou référence)
                </Label>
                <Input
                  id="preuve"
                  {...register('preuve')}
                  placeholder="Ex: https://drive.google.com/... ou Réf. Document #123"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Lien vers le document justificatif ou référence du fichier
                </p>
              </div>

              {/* Commentaire */}
              <div>
                <Label htmlFor="commentaire" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Commentaire
                </Label>
                <Textarea
                  id="commentaire"
                  {...register('commentaire')}
                  placeholder="Informations complémentaires..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Récapitulatif */}
              <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="text-sm font-medium text-neutral-700 mb-3">Récapitulatif</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-neutral-500">ID:</div>
                  <div className="font-mono font-bold text-purple-700">{previewId}</div>

                  <div className="text-neutral-500">Axe:</div>
                  <div className="font-medium">{AXE_LABELS[watchAxe]}</div>

                  <div className="text-neutral-500">Libellé:</div>
                  <div className="font-medium truncate">{watchTitre || '-'}</div>

                  <div className="text-neutral-500">Cible:</div>
                  <div className="font-medium truncate">{watchCible || '-'}</div>

                  <div className="text-neutral-500">Échéance:</div>
                  <div className="font-medium">
                    {watchDate
                      ? new Date(watchDate).toLocaleDateString('fr-FR')
                      : '-'}
                  </div>

                  <div className="text-neutral-500">Jours restants:</div>
                  <div className={`font-medium ${joursRestants !== null && joursRestants < 0 ? 'text-red-600' : ''}`}>
                    {joursRestants !== null ? `${joursRestants} jour(s)` : '-'}
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

            {currentStep < 2 ? (
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
