// ============================================================================
// FORMULAIRE ACTION v2.0 - Selon spécifications
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Wand2,
  Target,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Plus,
  Trash2,
  Link2,
  FileText,
  Upload,
  LinkIcon,
  ListTodo,
  Clock,
  AlertTriangle,
  FileIcon,
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
  Textarea,
  Select,
  SelectOption,
  Label,
  Badge,
  useToast,
} from '@/components/ui';
import { useUsers, useJalons } from '@/hooks';
import { createAction } from '@/hooks/useActions';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { AXE_LABELS, type Axe } from '@/types';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

// Schema pour les sous-tâches
const sousTacheSchema = z.object({
  id: z.string(),
  libelle: z.string().min(1, 'Le libellé est obligatoire'),
  responsableId: z.number().nullable().optional(),
  echeance: z.string().nullable().optional(),
  fait: z.boolean().default(false),
});

// Schema pour les preuves
const preuveSchema = z.object({
  id: z.string(),
  type: z.enum(['fichier', 'lien']),
  nom: z.string(),
  url: z.string().optional(),
  format: z.string().optional(),
  taille: z.number().optional(),
  dateAjout: z.string(),
});

// Schema pour les notes
const noteSchema = z.object({
  id: z.string(),
  texte: z.string(),
  auteur: z.string(),
  date: z.string(),
});

// Schema principal du formulaire v2.0
const actionFormSchema = z.object({
  // Champs obligatoires (4)
  jalonId: z.number({ required_error: 'Le jalon est obligatoire' }),
  libelle: z.string().min(3, 'Le libellé doit contenir au moins 3 caractères').max(150, 'Maximum 150 caractères'),
  echeance: z.string().min(1, 'L\'échéance est obligatoire'),
  responsableId: z.number({ required_error: 'Le responsable est obligatoire' }),

  // Champs complémentaires (4)
  dependances: z.array(z.number()).default([]),
  livrable: z.string().max(200).optional(),
  format: z.enum(['pdf', 'excel', 'word', 'powerpoint', 'image', 'autre', '']).default(''),

  // Sections
  sousTaches: z.array(sousTacheSchema).default([]),
  preuves: z.array(preuveSchema).default([]),
  notes: z.array(noteSchema).default([]),
});

type ActionFormData = z.infer<typeof actionFormSchema>;

// Formats de livrables
const FORMATS_LIVRABLE = [
  { value: '', label: 'Non spécifié' },
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'word', label: 'Word' },
  { value: 'powerpoint', label: 'PowerPoint' },
  { value: 'image', label: 'Image' },
  { value: 'autre', label: 'Autre' },
];

// Préfixes par axe
const AXE_PREFIXES: Record<string, string> = {
  'axe1_rh': 'RH',
  'axe2_commercial': 'COM',
  'axe3_technique': 'TECH',
  'axe4_budget': 'BUD',
  'axe5_marketing': 'MKT',
  'axe6_exploitation': 'EXP',
  'axe7_construction': 'CON',
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

interface ActionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (actionId: number) => void;
  defaultJalonId?: number;
  defaultAxe?: Axe;
}

export function ActionWizard({
  isOpen,
  onClose,
  onSuccess,
  defaultJalonId,
}: ActionWizardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSousTaches, setShowSousTaches] = useState(false);
  const [showPreuves, setShowPreuves] = useState(false);
  const [newNote, setNewNote] = useState('');

  const users = useUsers();
  const jalons = useJalons();
  const toast = useToast();
  const allActions = useLiveQuery(() => db.actions.toArray()) ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<ActionFormData>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      jalonId: defaultJalonId,
      libelle: '',
      echeance: '',
      responsableId: undefined,
      dependances: [],
      livrable: '',
      format: '',
      sousTaches: [],
      preuves: [],
      notes: [],
    },
  });

  const { fields: sousTachesFields, append: appendSousTache, remove: removeSousTache } = useFieldArray({
    control,
    name: 'sousTaches',
  });

  const { fields: preuvesFields, append: appendPreuve, remove: removePreuve } = useFieldArray({
    control,
    name: 'preuves',
  });

  const { fields: notesFields, append: appendNote, remove: removeNote } = useFieldArray({
    control,
    name: 'notes',
  });

  const watchJalonId = watch('jalonId');
  const watchEcheance = watch('echeance');
  const watchSousTaches = watch('sousTaches');

  // Jalon sélectionné
  const selectedJalon = watchJalonId ? jalons.find(j => j.id === watchJalonId) : null;

  // Axe hérité du jalon (auto-calculé)
  const axeHerite = selectedJalon?.axe || null;

  // Calcul auto de la priorité selon l'échéance
  const calculerPriorite = useCallback((echeance: string): 'haute' | 'moyenne' | 'basse' => {
    if (!echeance) return 'moyenne';
    const joursRestants = Math.ceil((new Date(echeance).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (joursRestants <= 7) return 'haute';
    if (joursRestants <= 30) return 'moyenne';
    return 'basse';
  }, []);

  const prioriteCalculee = calculerPriorite(watchEcheance);

  // Jours restants (auto-calculé)
  const joursRestants = watchEcheance
    ? Math.ceil((new Date(watchEcheance).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // % Avancement basé sur sous-tâches
  const avancementCalcule = watchSousTaches.length > 0
    ? Math.round((watchSousTaches.filter(st => st.fait).length / watchSousTaches.length) * 100)
    : 0;

  // Pré-remplissage quand le jalon change
  useEffect(() => {
    if (watchJalonId && selectedJalon) {
      // Auto-fill responsable from jalon if not set
      if (selectedJalon.responsableId && !watch('responsableId')) {
        setValue('responsableId', selectedJalon.responsableId);
      }

      // Suggérer échéance = jalon - 5 jours
      if (selectedJalon.date_prevue && !watch('echeance')) {
        const jalonDate = new Date(selectedJalon.date_prevue);
        const echeanceSuggeree = new Date(jalonDate.getTime() - 5 * 24 * 60 * 60 * 1000);
        setValue('echeance', echeanceSuggeree.toISOString().split('T')[0]);
      }
    }
  }, [watchJalonId, selectedJalon, setValue, watch]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        jalonId: defaultJalonId,
        libelle: '',
        echeance: '',
        responsableId: undefined,
        dependances: [],
        livrable: '',
        format: '',
        sousTaches: [],
        preuves: [],
        notes: [],
      });
      setShowAdvanced(false);
      setShowSousTaches(false);
      setShowPreuves(false);
      setNewNote('');
    }
  }, [isOpen, defaultJalonId, reset]);

  // Générer l'ID auto: A-{AXE}-{N°Jalon}.{N°Action}
  const generateActionId = (axe: Axe | null, jalonId: number): string => {
    const prefix = axe ? AXE_PREFIXES[axe] || 'GEN' : 'GEN';
    const linkedJalon = jalons.find(j => j.id === jalonId);
    const jalonActions = allActions.filter(a => a.jalonId === jalonId);
    const numAction = jalonActions.length + 1;

    // Extraire le numéro du jalon (ex: J-RH-1 -> 1)
    const jalonNum = linkedJalon?.id_jalon?.split('-').pop() || '1';

    return `A-${prefix}-${jalonNum}.${numAction}`;
  };

  // Ajouter une sous-tâche
  const handleAddSousTache = () => {
    appendSousTache({
      id: crypto.randomUUID(),
      libelle: '',
      responsableId: null,
      echeance: null,
      fait: false,
    });
  };

  // Ajouter un lien comme preuve
  const handleAddLien = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      const nom = prompt('Libellé du lien (optionnel):', url) || url;
      appendPreuve({
        id: crypto.randomUUID(),
        type: 'lien',
        nom,
        url,
        dateAjout: new Date().toISOString(),
      });
    }
  };

  // Ajouter une note
  const handleAddNote = () => {
    if (newNote.trim()) {
      const currentUser = users[0]; // À remplacer par l'utilisateur connecté
      appendNote({
        id: crypto.randomUUID(),
        texte: newNote.trim(),
        auteur: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Utilisateur',
        date: new Date().toISOString(),
      });
      setNewNote('');
    }
  };

  // Actions disponibles pour les dépendances (exclure les actions du même jalon pour éviter les cycles)
  const actionsDisponibles = allActions.filter(a => a.jalonId !== watchJalonId);

  // Soumission du formulaire
  const onSubmit = async (data: ActionFormData) => {
    if (!axeHerite) return;

    setIsSubmitting(true);

    try {
      const responsable = users.find(u => u.id === data.responsableId);
      const responsableName = responsable ? `${responsable.prenom} ${responsable.nom}` : '';
      const today = new Date().toISOString().split('T')[0];

      // Calculer la date de début (7 jours avant l'échéance par défaut)
      const echeanceDate = new Date(data.echeance);
      const dateDebut = new Date(echeanceDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const actionId = await createAction({
        // Identification (auto-calculé)
        id_action: generateActionId(axeHerite, data.jalonId),
        code_wbs: `WBS-${AXE_PREFIXES[axeHerite]}-A${String(allActions.length + 1).padStart(3, '0')}`,
        titre: data.libelle,
        description: data.livrable || data.libelle,

        // Classification (axe hérité du jalon)
        axe: axeHerite,
        phase: 'execution',
        categorie: 'operationnel',
        sous_categorie: null,
        type_action: 'tache',

        // Planning
        date_creation: today,
        date_debut_prevue: dateDebut.toISOString().split('T')[0],
        date_fin_prevue: data.echeance,
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
        predecesseurs: data.dependances.map(id => String(id)),
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
        livrables: data.livrable ? [{
          id: crypto.randomUUID(),
          nom: data.livrable,
          format: data.format || 'autre',
          statut: 'attendu',
        }] : [],
        criteres_acceptation: [],
        documents: data.preuves.map(p => ({
          id: p.id,
          nom: p.nom,
          type: p.type,
          url: p.url || '',
          dateAjout: p.dateAjout,
        })),

        // Suivi (auto-calculé)
        statut: 'a_faire',
        avancement: avancementCalcule,
        methode_avancement: data.sousTaches.length > 0 ? 'sous_taches' : 'manuel',
        priorite: prioriteCalculee,
        sante: joursRestants && joursRestants < 0 ? 'rouge' : joursRestants && joursRestants < 7 ? 'orange' : 'vert',
        tendance: 'stable',
        derniere_mise_a_jour: today,

        // Sous-tâches
        sous_taches: data.sousTaches.map(st => ({
          id: st.id,
          libelle: st.libelle,
          responsableId: st.responsableId || null,
          echeance: st.echeance || null,
          fait: st.fait,
        })),

        // Alertes & reporting
        alertes: [],
        visibilite_reporting: 'flash_hebdo',

        // Commentaires & historique
        commentaires: data.notes.map(n => ({
          id: n.id,
          auteur: n.auteur,
          date: n.date,
          texte: n.texte,
        })),
        historique: [{
          id: crypto.randomUUID(),
          date: today,
          auteur: responsableName,
          type: 'creation',
          description: 'Création de l\'action',
        }],

        // Metadata
        tags: [],
        source: 'formulaire_v2',
      });

      toast.success('Action creee', `"${data.titre}" a ete ajoutee`);
      onSuccess?.(actionId);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur', 'Impossible de creer l\'action');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span>Nouvelle Action</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ============================================= */}
          {/* CHAMPS OBLIGATOIRES (4) */}
          {/* ============================================= */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Champs obligatoires
            </h3>

            <div className="space-y-3">
              {/* Jalon (obligatoire) */}
              <div>
                <Label htmlFor="jalonId" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Link2 className="w-4 h-4 text-purple-600" />
                  Jalon *
                </Label>
                <Select
                  id="jalonId"
                  {...register('jalonId', { valueAsNumber: true })}
                  className={errors.jalonId ? 'border-red-500' : ''}
                >
                  <SelectOption value="">Sélectionner un jalon...</SelectOption>
                  {jalons.map((jalon) => (
                    <SelectOption key={jalon.id} value={jalon.id!}>
                      {jalon.id_jalon} - {jalon.titre}
                    </SelectOption>
                  ))}
                </Select>
                {errors.jalonId && (
                  <p className="text-red-500 text-xs mt-1">{errors.jalonId.message}</p>
                )}
              </div>

              {/* Libellé (max 150 car) */}
              <div>
                <Label htmlFor="libelle" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Libellé * <span className="text-neutral-400 font-normal">(max 150 car.)</span>
                </Label>
                <Input
                  id="libelle"
                  {...register('libelle')}
                  placeholder="Ex: Finaliser le contrat fournisseur"
                  maxLength={150}
                  className={errors.libelle ? 'border-red-500' : ''}
                  autoFocus
                />
                {errors.libelle && (
                  <p className="text-red-500 text-xs mt-1">{errors.libelle.message}</p>
                )}
              </div>

              {/* Échéance (suggérée = jalon - 5j) */}
              <div>
                <Label htmlFor="echeance" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  Échéance *
                  {selectedJalon && (
                    <span className="text-xs text-neutral-500 font-normal ml-1">
                      (suggérée: J-5 du jalon)
                    </span>
                  )}
                </Label>
                <Input
                  type="date"
                  id="echeance"
                  {...register('echeance')}
                  className={errors.echeance ? 'border-red-500' : ''}
                />
                {errors.echeance && (
                  <p className="text-red-500 text-xs mt-1">{errors.echeance.message}</p>
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
            </div>
          </div>

          {/* ============================================= */}
          {/* CHAMPS AUTO-CALCULÉS (6) */}
          {/* ============================================= */}
          {selectedJalon && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Champs auto-calculés
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {/* ID */}
                <div className="p-2 bg-white rounded border">
                  <div className="text-xs text-neutral-500">ID</div>
                  <div className="font-mono font-medium text-blue-700">
                    {generateActionId(axeHerite, watchJalonId)}
                  </div>
                </div>

                {/* Axe (hérité) */}
                <div className="p-2 bg-white rounded border">
                  <div className="text-xs text-neutral-500">Axe</div>
                  <div className="font-medium">
                    {axeHerite ? AXE_LABELS[axeHerite] : '-'}
                  </div>
                </div>

                {/* Statut */}
                <div className="p-2 bg-white rounded border">
                  <div className="text-xs text-neutral-500">Statut</div>
                  <Badge variant="default">À faire</Badge>
                </div>

                {/* % Avancement */}
                <div className="p-2 bg-white rounded border">
                  <div className="text-xs text-neutral-500">% Avancement</div>
                  <div className="font-medium">{avancementCalcule}%</div>
                </div>

                {/* Jours restants */}
                <div className="p-2 bg-white rounded border">
                  <div className="text-xs text-neutral-500">Jours restants</div>
                  <div className={`font-medium ${joursRestants && joursRestants < 0 ? 'text-red-600' : joursRestants && joursRestants < 7 ? 'text-orange-600' : 'text-green-600'}`}>
                    {joursRestants !== null ? (joursRestants < 0 ? `${Math.abs(joursRestants)}j en retard` : `${joursRestants}j`) : '-'}
                  </div>
                </div>

                {/* Priorité (auto) */}
                <div className="p-2 bg-white rounded border">
                  <div className="text-xs text-neutral-500">Priorité</div>
                  <Badge
                    variant={prioriteCalculee === 'haute' ? 'danger' : prioriteCalculee === 'moyenne' ? 'warning' : 'success'}
                  >
                    {prioriteCalculee === 'haute' ? 'Haute' : prioriteCalculee === 'moyenne' ? 'Moyenne' : 'Basse'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* ============================================= */}
          {/* CHAMPS COMPLÉMENTAIRES (4) - Collapsible */}
          {/* ============================================= */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-between text-sm font-medium text-neutral-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-purple-600" />
                Champs complémentaires
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 space-y-4 border-t border-neutral-200">
                {/* Dépendances (multi-select) */}
                <div>
                  <Label htmlFor="dependances" className="text-sm font-medium mb-1.5 block">
                    Dépendances (actions prérequises)
                  </Label>
                  <Select
                    id="dependances"
                    multiple
                    {...register('dependances')}
                    className="min-h-[80px]"
                  >
                    {actionsDisponibles.map((action) => (
                      <SelectOption key={action.id} value={action.id!}>
                        {action.id_action} - {action.titre}
                      </SelectOption>
                    ))}
                  </Select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Maintenez Ctrl/Cmd pour sélectionner plusieurs actions
                  </p>
                </div>

                {/* Livrable */}
                <div>
                  <Label htmlFor="livrable" className="text-sm font-medium mb-1.5 block">
                    Livrable (ce qui doit être produit)
                  </Label>
                  <Input
                    id="livrable"
                    {...register('livrable')}
                    placeholder="Ex: Rapport d'analyse, Contrat signé..."
                  />
                </div>

                {/* Format */}
                <div>
                  <Label htmlFor="format" className="text-sm font-medium mb-1.5 block">
                    Format du livrable
                  </Label>
                  <Select id="format" {...register('format')}>
                    {FORMATS_LIVRABLE.map((f) => (
                      <SelectOption key={f.value} value={f.value}>
                        {f.label}
                      </SelectOption>
                    ))}
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Notes</Label>
                  <div className="space-y-2">
                    {notesFields.map((note, index) => (
                      <div key={note.id} className="p-2 bg-neutral-50 rounded border text-sm flex justify-between items-start">
                        <div>
                          <p className="text-neutral-700">{note.texte}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {note.auteur} - {new Date(note.date).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNote(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Ajouter une note..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleAddNote}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================= */}
          {/* SECTION SOUS-TÂCHES - Collapsible */}
          {/* ============================================= */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSousTaches(!showSousTaches)}
              className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-between text-sm font-medium text-neutral-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Sous-tâches
                {sousTachesFields.length > 0 && (
                  <Badge variant="info" className="ml-2">{sousTachesFields.length}</Badge>
                )}
              </span>
              {showSousTaches ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSousTaches && (
              <div className="p-4 space-y-3 border-t border-neutral-200">
                {sousTachesFields.map((field, index) => (
                  <div key={field.id} className="p-3 bg-neutral-50 rounded-lg border space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register(`sousTaches.${index}.fait`)}
                        className="w-4 h-4 rounded border-neutral-300"
                      />
                      <Input
                        {...register(`sousTaches.${index}.libelle`)}
                        placeholder="Libellé de la sous-tâche"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeSousTache(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      <Select {...register(`sousTaches.${index}.responsableId`, { valueAsNumber: true })}>
                        <SelectOption value="">Responsable (opt.)</SelectOption>
                        {users.map((user) => (
                          <SelectOption key={user.id} value={user.id!}>
                            {user.prenom} {user.nom}
                          </SelectOption>
                        ))}
                      </Select>
                      <Input
                        type="date"
                        {...register(`sousTaches.${index}.echeance`)}
                        placeholder="Échéance (opt.)"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSousTache}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une sous-tâche
                </Button>
              </div>
            )}
          </div>

          {/* ============================================= */}
          {/* SECTION PREUVES - Collapsible */}
          {/* ============================================= */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPreuves(!showPreuves)}
              className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-between text-sm font-medium text-neutral-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Preuves
                {preuvesFields.length > 0 && (
                  <Badge variant="info" className="ml-2">{preuvesFields.length}</Badge>
                )}
              </span>
              {showPreuves ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showPreuves && (
              <div className="p-4 space-y-3 border-t border-neutral-200">
                {/* Liste des preuves */}
                {preuvesFields.map((field, index) => (
                  <div key={field.id} className="p-2 bg-neutral-50 rounded border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {field.type === 'fichier' ? (
                        <FileIcon className="w-4 h-4 text-blue-600" />
                      ) : (
                        <LinkIcon className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm">{field.nom}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePreuve(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Zone de drop pour fichiers */}
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center bg-white">
                  <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                  <p className="text-sm text-neutral-600">
                    Glissez-déposez vos fichiers ici
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    PDF, DOC, XLS, IMG - Max 10MB
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert('Le fichier ne doit pas dépasser 10MB');
                          return;
                        }
                        appendPreuve({
                          id: crypto.randomUUID(),
                          type: 'fichier',
                          nom: file.name,
                          format: file.type,
                          taille: file.size,
                          dateAjout: new Date().toISOString(),
                        });
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Parcourir
                  </Button>
                </div>

                {/* Ajouter un lien */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLien}
                  className="w-full"
                >
                  <LinkIcon className="w-4 h-4 mr-1" />
                  Ajouter un lien
                </Button>
              </div>
            )}
          </div>

          {/* ============================================= */}
          {/* FOOTER */}
          {/* ============================================= */}
          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-1" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !watchJalonId}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-1 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Créer l'action
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ActionWizard;
