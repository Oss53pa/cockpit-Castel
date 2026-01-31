import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Zap,
  Calendar,
  User,
  Target,
  Plus,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Select,
  SelectOption,
  Label,
  useToast,
} from '@/components/ui';
import { useUsers, useJalons } from '@/hooks';
import { createAction } from '@/hooks/useActions';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import {
  AXES,
  AXE_LABELS,
  type Axe,
} from '@/types';

// Schema minimal pour création rapide
const quickAddSchema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(100),
  responsableId: z.number({ required_error: 'Veuillez sélectionner un responsable' }),
  date_fin_prevue: z.string().min(1, 'La date d\'échéance est obligatoire'),
  jalonId: z.number().nullable(),
  axe: z.enum(['axe1_rh', 'axe2_commercial', 'axe3_technique', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation', 'axe7_construction'] as const).nullable(),
});

type QuickAddFormData = z.infer<typeof quickAddSchema>;

interface QuickAddActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (actionId: number) => void;
  defaultJalonId?: number;
  defaultAxe?: Axe;
}

const AXE_PREFIXES: Record<string, string> = {
  'axe1_rh': 'RH',
  'axe2_commercial': 'COM',
  'axe3_technique': 'TECH',
  'axe4_budget': 'BUD',
  'axe5_marketing': 'MKT',
  'axe6_exploitation': 'EXP',
  'axe7_construction': 'CON',
};

export function QuickAddAction({
  isOpen,
  onClose,
  onSuccess,
  defaultJalonId,
  defaultAxe,
}: QuickAddActionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const toast = useToast();

  const users = useUsers();
  const jalons = useJalons();
  const allActions = useLiveQuery(() => db.actions.toArray()) ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuickAddFormData>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      titre: '',
      responsableId: undefined,
      date_fin_prevue: '',
      jalonId: defaultJalonId ?? null,
      axe: defaultAxe ?? null,
    },
  });

  const watchJalonId = watch('jalonId');
  const watchAxe = watch('axe');

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

        // Suggest date = J-30 before jalon
        if (linkedJalon.date_prevue && !watch('date_fin_prevue')) {
          const jalonDate = new Date(linkedJalon.date_prevue);
          const actionEndDate = new Date(jalonDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          setValue('date_fin_prevue', actionEndDate.toISOString().split('T')[0]);
        }
      }
    }
  }, [watchJalonId, jalons, setValue, watch]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        titre: '',
        responsableId: undefined,
        date_fin_prevue: '',
        jalonId: defaultJalonId ?? null,
        axe: defaultAxe ?? null,
      });
      setShowAdvanced(false);
    }
  }, [isOpen, defaultJalonId, defaultAxe, reset]);

  const generateActionId = (axe: Axe | null, jalonId: number | null): string => {
    const prefix = axe ? AXE_PREFIXES[axe] || 'GEN' : 'GEN';

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

  const onSubmit = async (data: QuickAddFormData) => {
    setIsSubmitting(true);

    try {
      const selectedUser = users.find(u => u.id === data.responsableId);
      const responsableName = selectedUser
        ? `${selectedUser.prenom} ${selectedUser.nom}`
        : '';

      const effectiveAxe = data.axe || 'axe3_technique';
      const today = new Date().toISOString().split('T')[0];

      // Calculate start date (7 days before end date by default)
      const endDate = new Date(data.date_fin_prevue);
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const actionId = await createAction({
        // Identification
        id_action: generateActionId(effectiveAxe, data.jalonId),
        code_wbs: `WBS-${AXE_PREFIXES[effectiveAxe] || 'GEN'}-A${String(allActions.length + 1).padStart(3, '0')}`,
        titre: data.titre,
        description: data.titre, // Use title as description for quick add

        // Classification
        axe: effectiveAxe,
        phase: 'execution',
        categorie: 'operationnel',
        sous_categorie: null,
        type_action: 'tache',

        // Planning
        date_creation: today,
        date_debut_prevue: startDate.toISOString().split('T')[0],
        date_fin_prevue: data.date_fin_prevue,
        date_debut_reelle: null,
        date_fin_reelle: null,
        duree_prevue_jours: 7,
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
        priorite: 'moyenne',
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
          description: 'Création rapide de l\'action',
        }],

        // Metadata
        tags: [],
        source: 'quick_add',
      });

      toast.success('Action creee', `"${data.titre}" a ete ajoutee`);
      onSuccess?.(actionId);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création rapide:', error);
      toast.error('Erreur', 'Impossible de creer l\'action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedJalon = watchJalonId ? jalons.find(j => j.id === watchJalonId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span>Création rapide</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Titre - Champ principal */}
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

          {/* Responsable */}
          <div>
            <Label htmlFor="responsableId" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <User className="w-4 h-4 text-green-600" />
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
                  {user.prenom} {user.nom}
                </SelectOption>
              ))}
            </Select>
            {errors.responsableId && (
              <p className="text-red-500 text-xs mt-1">{errors.responsableId.message}</p>
            )}
          </div>

          {/* Échéance */}
          <div>
            <Label htmlFor="date_fin_prevue" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <Calendar className="w-4 h-4 text-purple-600" />
              Échéance *
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

          {/* Options avancées (collapsible) */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-3 py-2 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-between text-sm text-neutral-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Options (optionnel)
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="p-3 space-y-3 border-t border-neutral-200">
                {/* Jalon lié */}
                <div>
                  <Label htmlFor="jalonId" className="text-sm font-medium mb-1.5 block">
                    Jalon lié
                  </Label>
                  <Select
                    id="jalonId"
                    {...register('jalonId', { valueAsNumber: true })}
                  >
                    <SelectOption value="">Aucun jalon</SelectOption>
                    {jalons.map((jalon) => (
                      <SelectOption key={jalon.id} value={jalon.id!}>
                        {jalon.titre}
                      </SelectOption>
                    ))}
                  </Select>
                </div>

                {/* Axe */}
                <div>
                  <Label htmlFor="axe" className="text-sm font-medium mb-1.5 block">
                    Axe
                  </Label>
                  <Select
                    id="axe"
                    {...register('axe')}
                    disabled={!!watchJalonId}
                  >
                    <SelectOption value="">Auto (Technique)</SelectOption>
                    {AXES.map((axe) => (
                      <SelectOption key={axe} value={axe}>
                        {AXE_LABELS[axe]}
                      </SelectOption>
                    ))}
                  </Select>
                  {watchJalonId && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Axe hérité du jalon lié
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info box si jalon sélectionné */}
          {selectedJalon && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                Pré-remplissage intelligent
              </div>
              <p className="text-xs text-blue-700">
                L'action sera liée au jalon "{selectedJalon.titre}" et configurée automatiquement
                (axe: {AXE_LABELS[selectedJalon.axe]}, échéance J-30).
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-1" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Création...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default QuickAddAction;
