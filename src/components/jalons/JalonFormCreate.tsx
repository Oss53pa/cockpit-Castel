// ============================================================================
// FORMULAIRE CRÉATION JALON - Champs éditables pour nouveau jalon
// ============================================================================

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Target,
  Calendar,
  User,
  X,
  Link2,
  MessageSquare,
  Save,
  Sparkles,
  ChevronDown,
  ChevronUp,
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
  Badge,
  useToast,
} from '@/components/ui';
import { useUsers, useJalons, createJalon } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  AXES,
  AXE_LABELS,
  type Jalon,
  type Axe,
} from '@/types';

// Schema simplifié
const jalonSchema = z.object({
  axe: z.enum(['axe1_rh', 'axe2_commercial', 'axe3_technique', 'axe4_budget', 'axe5_marketing', 'axe6_exploitation', 'axe7_construction'] as const, {
    required_error: 'L\'axe est obligatoire',
  }),
  titre: z.string().min(3, 'Minimum 3 caractères').max(100, 'Maximum 100 caractères'),
  cible: z.string().min(1, 'La cible est obligatoire').max(50, 'Maximum 50 caractères'),
  date_prevue: z.string().min(1, 'L\'échéance est obligatoire'),
  responsableId: z.number({ required_error: 'Sélectionnez un responsable' }),
  preuve_url: z.string().max(500).optional(),
  commentaire: z.string().max(500).optional(),
});

type JalonFormData = z.infer<typeof jalonSchema>;

// Préfixes ID
const AXE_PREFIXES: Record<string, string> = {
  'axe1_rh': 'RH',
  'axe2_commercial': 'COM',
  'axe3_technique': 'TECH',
  'axe4_budget': 'BUD',
  'axe5_marketing': 'MKT',
  'axe6_exploitation': 'EXP',
  'axe7_construction': 'CON',
};

interface JalonFormCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JalonFormCreate({ open, onClose, onSuccess }: JalonFormCreateProps) {
  const users = useUsers();
  const jalons = useJalons();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<JalonFormData>({
    resolver: zodResolver(jalonSchema),
    defaultValues: {
      axe: 'axe3_technique',
      titre: '',
      cible: '',
      date_prevue: '',
      responsableId: undefined,
      preuve_url: '',
      commentaire: '',
    },
  });

  const watchAxe = watch('axe');
  const watchDate = watch('date_prevue');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        axe: 'axe3_technique',
        titre: '',
        cible: '',
        date_prevue: '',
        responsableId: undefined,
        preuve_url: '',
        commentaire: '',
      });
      setShowOptional(false);
    }
  }, [open, reset]);

  // Générer l'ID
  const generateJalonId = (axe: Axe): string => {
    const prefix = AXE_PREFIXES[axe] || 'GEN';
    const axeJalons = jalons.filter(j => j.axe === axe);
    return `J-${prefix}-${axeJalons.length + 1}`;
  };

  const displayId = generateJalonId(watchAxe);

  // Calculs
  const joursRestants = watchDate ? Math.ceil((new Date(watchDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const onSubmit = async (data: JalonFormData) => {
    setIsSubmitting(true);
    try {
      const responsable = users.find(u => u.id === data.responsableId);
      const responsableName = responsable ? `${responsable.prenom} ${responsable.nom}` : '';
      const today = new Date().toISOString().split('T')[0];

      const jalonIdGenerated = generateJalonId(data.axe);
      await createJalon({
        id_jalon: jalonIdGenerated,
        code_wbs: jalonIdGenerated,
        titre: data.titre,
        description: data.cible,
        axe: data.axe,
        date_prevue: data.date_prevue,
        responsable: responsableName,
        responsableId: data.responsableId,
        preuve_url: data.preuve_url || null,
        categorie: 'validation',
        type_jalon: 'managerial',
        niveau_importance: 'standard',
        date_reelle: null,
        heure_cible: null,
        fuseau_horaire: 'Africa/Abidjan',
        date_butoir_absolue: null,
        flexibilite: 'standard',
        alerte_j30: '',
        alerte_j15: '',
        alerte_j7: '',
        statut: 'a_venir',
        avancement_prealables: 0,
        confiance_atteinte: 50,
        tendance: 'stable',
        date_derniere_maj: today,
        maj_par: responsableName,
        validateur: responsableName,
        validateurId: data.responsableId,
        contributeurs: [],
        parties_prenantes: [],
        escalade_niveau1: responsableName,
        escalade_niveau2: '',
        escalade_niveau3: '',
        livrables: [],
        risques: [],
        documents: [],
        prerequis_jalons: [],
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
          description: 'Création du jalon',
        }],
        tags: [],
        visibilite_reporting: 'tous_niveaux',
        source: 'form',
      } as Omit<Jalon, 'id'>);

      toast.success('Jalon créé', `"${data.titre}" a été enregistré`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur', 'Impossible de créer le jalon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <span>Nouveau jalon</span>
              {displayId && (
                <Badge variant="outline" className="ml-2 font-mono text-xs">
                  {displayId}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Axe + Échéance sur la même ligne */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Axe *</Label>
              <Select {...register('axe')} className={errors.axe ? 'border-red-500' : ''}>
                {AXES.map((axe) => (
                  <SelectOption key={axe} value={axe}>{AXE_LABELS[axe]}</SelectOption>
                ))}
              </Select>
              {errors.axe && <p className="text-red-500 text-xs mt-1">{errors.axe.message}</p>}
            </div>

            <div>
              <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Échéance *
              </Label>
              <Input
                type="date"
                {...register('date_prevue')}
                className={errors.date_prevue ? 'border-red-500' : ''}
              />
              {errors.date_prevue && <p className="text-red-500 text-xs mt-1">{errors.date_prevue.message}</p>}
            </div>
          </div>

          {/* Libellé */}
          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <Target className="w-4 h-4 text-purple-600" />
              Libellé *
            </Label>
            <Input
              {...register('titre')}
              placeholder="Ex: Signature contrat exploitant principal"
              className={errors.titre ? 'border-red-500' : ''}
              maxLength={100}
            />
            {errors.titre && <p className="text-red-500 text-xs mt-1">{errors.titre.message}</p>}
          </div>

          {/* Cible */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Cible * <span className="text-neutral-400 font-normal text-xs">(objectif mesurable)</span>
            </Label>
            <Input
              {...register('cible')}
              placeholder="Ex: 80% BEFA signés, 100% recrutement terminé"
              className={errors.cible ? 'border-red-500' : ''}
              maxLength={50}
            />
            {errors.cible && <p className="text-red-500 text-xs mt-1">{errors.cible.message}</p>}
          </div>

          {/* Responsable */}
          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <User className="w-4 h-4 text-green-600" />
              Responsable *
            </Label>
            <Select
              {...register('responsableId', { valueAsNumber: true })}
              className={errors.responsableId ? 'border-red-500' : ''}
            >
              <SelectOption value="">Sélectionner un responsable...</SelectOption>
              {users.map((user) => (
                <SelectOption key={user.id} value={user.id!}>
                  {user.prenom} {user.nom}
                </SelectOption>
              ))}
            </Select>
            {errors.responsableId && <p className="text-red-500 text-xs mt-1">{errors.responsableId.message}</p>}
          </div>

          {/* Indicateurs auto-calculés - compact */}
          {watchDate && (
            <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg text-sm">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="flex items-center gap-1">
                <span className="text-neutral-500">Jours restants:</span>
                <span className={cn('font-semibold', joursRestants && joursRestants < 0 ? 'text-red-600' : joursRestants && joursRestants <= 7 ? 'text-orange-600' : 'text-green-600')}>
                  {joursRestants ?? '-'}
                </span>
              </div>
            </div>
          )}

          {/* Bouton pour afficher/masquer les champs optionnels */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showOptional ? 'Masquer les options' : 'Preuve & commentaire (optionnel)'}
          </button>

          {/* Champs optionnels */}
          {showOptional && (
            <div className="space-y-4 pt-2 border-t border-dashed">
              <div>
                <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Link2 className="w-4 h-4 text-cyan-600" />
                  Preuve
                </Label>
                <Input
                  {...register('preuve_url')}
                  placeholder="Lien vers le document justificatif..."
                />
              </div>

              <div>
                <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Commentaire
                </Label>
                <Textarea
                  {...register('commentaire')}
                  placeholder="Notes ou informations complémentaires..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {isSubmitting ? (
                <><span className="animate-spin mr-2">&#8987;</span>Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4 mr-1" />Créer</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default JalonFormCreate;
