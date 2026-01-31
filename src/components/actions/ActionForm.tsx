// ============================================================================
// FORMULAIRE ACTION v2.0 - Vue et Modification avec ONGLETS
// Selon spécifications: 4 champs obligatoires, 6 auto-calculés, 4 complémentaires
// + Sections Sous-tâches et Preuves
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Target,
  Calendar,
  User,
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
  FileIcon,
  Sparkles,
  Save,
  Eye,
  Edit3,
  CheckCircle,
  XCircle,
  ListChecks,
  Paperclip,
  MessageSquare,
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
  Badge,
  useToast,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUsers, useJalons } from '@/hooks';
import { updateAction } from '@/hooks/useActions';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import {
  AXE_LABELS,
  type Action,
  type Axe,
} from '@/types';
import { calculerPourcentageAction } from '@/lib/calculations';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

const actionFormSchema = z.object({
  jalonId: z.number({ required_error: 'Le jalon est obligatoire' }),
  titre: z.string().min(3, 'Le libellé doit contenir au moins 3 caractères').max(150, 'Maximum 150 caractères'),
  date_fin_prevue: z.string().min(1, 'L\'échéance est obligatoire'),
  responsableId: z.number({ required_error: 'Le responsable est obligatoire' }),
  dependances: z.array(z.number()).default([]),
  livrable: z.string().max(200).optional(),
  format: z.string().optional(),
  statut: z.enum(['a_faire', 'en_cours', 'fait', 'bloque']).default('a_faire'),
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

// Statuts avec icônes
const STATUT_CONFIG = {
  a_faire: { label: 'À faire', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Edit3 },
  fait: { label: 'Fait', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  bloque: { label: 'Bloqué', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
};

// ============================================================================
// INTERFACES
// ============================================================================

interface SousTache {
  id: string;
  libelle: string;
  responsableId: number | null;
  echeance: string | null;
  fait: boolean;
}

interface Preuve {
  id: string;
  type: 'fichier' | 'lien';
  nom: string;
  url?: string;
  format?: string;
  taille?: number;
  dateAjout: string;
}

interface Note {
  id: string;
  texte: string;
  auteur: string;
  date: string;
}

interface ActionFormProps {
  action?: Action;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================================
// TABS CONFIGURATION
// ============================================================================

const FORM_TABS = [
  { id: 'general', label: 'Général', icon: Target },
  { id: 'sousTaches', label: 'Sous-tâches', icon: ListChecks },
  { id: 'complements', label: 'Compléments', icon: ListTodo },
  { id: 'preuves', label: 'Preuves', icon: Paperclip },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ActionForm({ action, open, onClose, onSuccess }: ActionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!action);
  const [activeTab, setActiveTab] = useState('general');
  const [newNote, setNewNote] = useState('');

  // Données locales
  const [sousTaches, setSousTaches] = useState<SousTache[]>([]);
  const [preuves, setPreuves] = useState<Preuve[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

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
    formState: { errors },
  } = useForm<ActionFormData>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      jalonId: action?.jalonId ?? undefined,
      titre: action?.titre ?? '',
      date_fin_prevue: action?.date_fin_prevue ?? '',
      responsableId: action?.responsableId ?? undefined,
      dependances: [],
      livrable: action?.livrables?.[0]?.nom ?? '',
      format: action?.livrables?.[0]?.format ?? '',
      statut: (action?.statut as 'a_faire' | 'en_cours' | 'fait' | 'bloque') ?? 'a_faire',
    },
  });

  const watchJalonId = watch('jalonId');
  const watchEcheance = watch('date_fin_prevue');
  const watchStatut = watch('statut');

  const selectedJalon = watchJalonId ? jalons.find(j => j.id === watchJalonId) : null;
  const axeHerite = selectedJalon?.axe || action?.axe || null;

  // Calculs auto
  const calculerPriorite = useCallback((echeance: string): 'haute' | 'moyenne' | 'basse' => {
    if (!echeance) return 'moyenne';
    const joursRestants = Math.ceil((new Date(echeance).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (joursRestants <= 7) return 'haute';
    if (joursRestants <= 30) return 'moyenne';
    return 'basse';
  }, []);

  const prioriteCalculee = calculerPriorite(watchEcheance);
  const joursRestants = watchEcheance
    ? Math.ceil((new Date(watchEcheance).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Calcul de l'avancement selon les spécifications v2.0
  // - A_FAIRE → 0%, FAIT → 100%, BLOQUE → garde la valeur
  // - EN_COURS avec sous-tâches → basé sur les sous-tâches faites
  // - EN_COURS sans sous-tâches → valeur manuelle ou 50% par défaut
  const avancementCalcule = calculerPourcentageAction(
    watchStatut,
    sousTaches,
    action?.avancement ?? 50
  );

  // Charger les données
  useEffect(() => {
    if (open && action) {
      reset({
        jalonId: action.jalonId ?? undefined,
        titre: action.titre,
        date_fin_prevue: action.date_fin_prevue,
        responsableId: action.responsableId ?? undefined,
        dependances: action.predecesseurs?.map(p => typeof p === 'string' ? parseInt(p) : p.actionId).filter(Boolean) || [],
        livrable: action.livrables?.[0]?.nom ?? '',
        format: action.livrables?.[0]?.format ?? '',
        statut: (action.statut as 'a_faire' | 'en_cours' | 'fait' | 'bloque') ?? 'a_faire',
      });
      setSousTaches((action as any).sous_taches || []);
      setPreuves(action.documents?.map(d => ({
        id: d.id || crypto.randomUUID(),
        type: d.type?.includes('lien') ? 'lien' : 'fichier',
        nom: d.nom,
        url: d.url,
        dateAjout: d.dateAjout || new Date().toISOString(),
      })) || []);
      setNotes(action.commentaires?.map(c => ({
        id: c.id || crypto.randomUUID(),
        texte: c.texte,
        auteur: c.auteur,
        date: c.date,
      })) || []);
      setIsEditing(false);
      setActiveTab('general');
    } else if (open && !action) {
      reset({
        jalonId: undefined,
        titre: '',
        date_fin_prevue: '',
        responsableId: undefined,
        dependances: [],
        livrable: '',
        format: '',
        statut: 'a_faire',
      });
      setSousTaches([]);
      setPreuves([]);
      setNotes([]);
      setIsEditing(true);
      setActiveTab('general');
    }
  }, [open, action, reset]);

  // Pré-remplissage jalon
  useEffect(() => {
    if (isEditing && watchJalonId && selectedJalon) {
      if (selectedJalon.responsableId && !watch('responsableId')) {
        setValue('responsableId', selectedJalon.responsableId);
      }
      if (selectedJalon.date_prevue && !watch('date_fin_prevue')) {
        const jalonDate = new Date(selectedJalon.date_prevue);
        const echeanceSuggeree = new Date(jalonDate.getTime() - 5 * 24 * 60 * 60 * 1000);
        setValue('date_fin_prevue', echeanceSuggeree.toISOString().split('T')[0]);
      }
    }
  }, [watchJalonId, selectedJalon, setValue, watch, isEditing]);

  // Handlers sous-tâches
  const handleAddSousTache = () => {
    setSousTaches([...sousTaches, { id: crypto.randomUUID(), libelle: '', responsableId: null, echeance: null, fait: false }]);
  };
  const handleUpdateSousTache = (index: number, field: keyof SousTache, value: any) => {
    const updated = [...sousTaches];
    updated[index] = { ...updated[index], [field]: value };
    setSousTaches(updated);
  };
  const handleRemoveSousTache = (index: number) => {
    setSousTaches(sousTaches.filter((_, i) => i !== index));
  };
  const handleToggleSousTache = async (index: number) => {
    const updated = [...sousTaches];
    updated[index] = { ...updated[index], fait: !updated[index].fait };
    setSousTaches(updated);
    if (!isEditing && action?.id) {
      // Utiliser la fonction centralisée pour calculer l'avancement
      const newAvancement = calculerPourcentageAction(watchStatut, updated, action.avancement ?? 50);
      await updateAction(action.id, { sous_taches: updated, avancement: newAvancement, derniere_mise_a_jour: new Date().toISOString().split('T')[0] });
    }
  };

  // Handlers preuves
  const handleAddLien = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      const nom = prompt('Libellé du lien (optionnel):', url) || url;
      setPreuves([...preuves, { id: crypto.randomUUID(), type: 'lien', nom, url, dateAjout: new Date().toISOString() }]);
    }
  };
  const handleRemovePreuve = (index: number) => {
    setPreuves(preuves.filter((_, i) => i !== index));
  };

  // Handlers notes
  const handleAddNote = () => {
    if (newNote.trim()) {
      const currentUser = users[0];
      setNotes([...notes, { id: crypto.randomUUID(), texte: newNote.trim(), auteur: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Utilisateur', date: new Date().toISOString() }]);
      setNewNote('');
    }
  };
  const handleRemoveNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  // Statut rapide - Met aussi à jour l'avancement automatiquement
  const handleStatutChange = async (newStatut: 'a_faire' | 'en_cours' | 'fait' | 'bloque') => {
    setValue('statut', newStatut);
    if (!isEditing && action?.id) {
      // Calculer le nouvel avancement selon le statut (spec v2.0)
      const newAvancement = calculerPourcentageAction(newStatut, sousTaches, action.avancement ?? 50);
      await updateAction(action.id, {
        statut: newStatut,
        avancement: newAvancement,
        derniere_mise_a_jour: new Date().toISOString().split('T')[0]
      });
    }
  };

  const actionsDisponibles = allActions.filter(a => a.id !== action?.id);

  // Soumission
  const onSubmit = async (data: ActionFormData) => {
    if (!action?.id) return;
    setIsSubmitting(true);
    try {
      const responsable = users.find(u => u.id === data.responsableId);
      const responsableName = responsable ? `${responsable.prenom} ${responsable.nom}` : action.responsable;
      const today = new Date().toISOString().split('T')[0];

      await updateAction(action.id, {
        titre: data.titre,
        date_fin_prevue: data.date_fin_prevue,
        responsable: responsableName,
        responsableId: data.responsableId,
        jalonId: data.jalonId,
        axe: axeHerite || action.axe,
        predecesseurs: data.dependances.map(id => String(id)),
        livrables: data.livrable ? [{ id: action.livrables?.[0]?.id || crypto.randomUUID(), nom: data.livrable, format: data.format || 'autre', statut: 'attendu' }] : [],
        documents: preuves.map(p => ({ id: p.id, nom: p.nom, type: p.type, url: p.url || '', dateAjout: p.dateAjout })),
        statut: data.statut,
        avancement: avancementCalcule,
        priorite: prioriteCalculee,
        sante: joursRestants && joursRestants < 0 ? 'rouge' : joursRestants && joursRestants < 7 ? 'orange' : 'vert',
        derniere_mise_a_jour: today,
        sous_taches: sousTaches,
        commentaires: notes.map(n => ({ id: n.id, auteur: n.auteur, date: n.date, texte: n.texte })),
      });
      toast.success('Action mise a jour', `L'action "${data.titre}" a ete enregistree`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur', 'Impossible de sauvegarder l\'action');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                {isEditing ? <Edit3 className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
              </div>
              <div>
                <span>{action ? (isEditing ? 'Modifier l\'action' : 'Détails de l\'action') : 'Nouvelle Action'}</span>
                {action?.id_action && (
                  <span className="ml-2 text-sm font-mono text-neutral-500">{action.id_action}</span>
                )}
              </div>
            </DialogTitle>
            {action && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-1" />
                Modifier
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Statut rapide - Toujours visible */}
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg flex-shrink-0 mx-1">
          <span className="text-sm font-medium text-neutral-600">Statut:</span>
          <div className="flex gap-1 flex-1 flex-wrap">
            {(Object.entries(STATUT_CONFIG) as [keyof typeof STATUT_CONFIG, typeof STATUT_CONFIG[keyof typeof STATUT_CONFIG]][]).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = watchStatut === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleStatutChange(key)}
                  disabled={!isEditing && !action}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    isActive ? `${config.color} ring-2 ring-offset-1` : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            {/* Onglets */}
            <TabsList className="flex-shrink-0 grid grid-cols-4 mx-1 mt-2">
              {FORM_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.id === 'sousTaches' && sousTaches.length > 0 && (
                      <Badge variant="info" className="ml-1 text-xs">{sousTaches.filter(st => st.fait).length}/{sousTaches.length}</Badge>
                    )}
                    {tab.id === 'preuves' && preuves.length > 0 && (
                      <Badge variant="info" className="ml-1 text-xs">{preuves.length}</Badge>
                    )}
                    {tab.id === 'complements' && notes.length > 0 && (
                      <Badge variant="info" className="ml-1 text-xs">{notes.length}</Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Contenu des onglets */}
            <div className="flex-1 overflow-y-auto p-1 mt-2">

              {/* ============================================= */}
              {/* ONGLET GÉNÉRAL */}
              {/* ============================================= */}
              <TabsContent value="general" className="space-y-4 m-0">
                {/* Champs obligatoires */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Champs obligatoires
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Jalon */}
                    <div>
                      <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                        <Link2 className="w-4 h-4 text-purple-600" />
                        Jalon *
                      </Label>
                      {isEditing ? (
                        <Select {...register('jalonId', { valueAsNumber: true })} className={errors.jalonId ? 'border-red-500' : ''}>
                          <SelectOption value="">Sélectionner un jalon...</SelectOption>
                          {jalons.map((jalon) => (
                            <SelectOption key={jalon.id} value={jalon.id!}>{jalon.id_jalon} - {jalon.titre}</SelectOption>
                          ))}
                        </Select>
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm">{selectedJalon ? `${selectedJalon.id_jalon} - ${selectedJalon.titre}` : '-'}</div>
                      )}
                    </div>

                    {/* Responsable */}
                    <div>
                      <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                        <User className="w-4 h-4 text-green-600" />
                        Responsable *
                      </Label>
                      {isEditing ? (
                        <Select {...register('responsableId', { valueAsNumber: true })} className={errors.responsableId ? 'border-red-500' : ''}>
                          <SelectOption value="">Sélectionner...</SelectOption>
                          {users.map((user) => (
                            <SelectOption key={user.id} value={user.id!}>{user.prenom} {user.nom}</SelectOption>
                          ))}
                        </Select>
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm">{action?.responsable || '-'}</div>
                      )}
                    </div>

                    {/* Libellé */}
                    <div className="md:col-span-2">
                      <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Libellé * <span className="text-neutral-400 font-normal">(max 150 car.)</span>
                      </Label>
                      {isEditing ? (
                        <Input {...register('titre')} placeholder="Ex: Finaliser le contrat fournisseur" maxLength={150} className={errors.titre ? 'border-red-500' : ''} />
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm font-medium">{action?.titre || '-'}</div>
                      )}
                    </div>

                    {/* Échéance */}
                    <div>
                      <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        Échéance *
                      </Label>
                      {isEditing ? (
                        <Input type="date" {...register('date_fin_prevue')} className={errors.date_fin_prevue ? 'border-red-500' : ''} />
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm">{action?.date_fin_prevue ? new Date(action.date_fin_prevue).toLocaleDateString('fr-FR') : '-'}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Champs auto-calculés */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Champs auto-calculés
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                    <div className="p-2 bg-white rounded border">
                      <div className="text-xs text-neutral-500">ID</div>
                      <div className="font-mono font-medium text-blue-700 truncate">{action?.id_action || 'Auto'}</div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="text-xs text-neutral-500">Axe</div>
                      <div className="font-medium truncate">{axeHerite ? AXE_LABELS[axeHerite] : '-'}</div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="text-xs text-neutral-500">Statut</div>
                      <Badge className={`${STATUT_CONFIG[watchStatut]?.color} text-xs`}>{STATUT_CONFIG[watchStatut]?.label}</Badge>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="text-xs text-neutral-500">Avancement</div>
                      <div className="font-medium">{avancementCalcule}%</div>
                      <div className="w-full bg-neutral-200 rounded-full h-1 mt-1">
                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${avancementCalcule}%` }} />
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="text-xs text-neutral-500">Jours restants</div>
                      <div className={`font-medium ${joursRestants && joursRestants < 0 ? 'text-red-600' : joursRestants && joursRestants < 7 ? 'text-orange-600' : 'text-green-600'}`}>
                        {joursRestants !== null ? (joursRestants < 0 ? `${Math.abs(joursRestants)}j retard` : `${joursRestants}j`) : '-'}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <div className="text-xs text-neutral-500">Priorité</div>
                      <Badge variant={prioriteCalculee === 'haute' ? 'danger' : prioriteCalculee === 'moyenne' ? 'warning' : 'success'} className="text-xs">
                        {prioriteCalculee === 'haute' ? 'Haute' : prioriteCalculee === 'moyenne' ? 'Moyenne' : 'Basse'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ============================================= */}
              {/* ONGLET SOUS-TÂCHES */}
              {/* ============================================= */}
              <TabsContent value="sousTaches" className="space-y-3 m-0">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Sous-tâches
                  </h3>
                  <p className="text-xs text-green-600">Le % d'avancement est calculé automatiquement selon les sous-tâches cochées</p>
                </div>

                {sousTaches.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 border-2 border-dashed rounded-lg">
                    <ListChecks className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Aucune sous-tâche</p>
                    {isEditing && <p className="text-sm mt-1">Cliquez sur le bouton ci-dessous pour en ajouter</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sousTaches.map((st, index) => (
                      <div key={st.id} className={`p-3 rounded-lg border ${st.fait ? 'bg-green-50 border-green-200' : 'bg-white border-neutral-200'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={st.fait}
                            onChange={() => handleToggleSousTache(index)}
                            className="w-5 h-5 rounded border-neutral-300 text-green-600 focus:ring-green-500"
                          />
                          {isEditing ? (
                            <Input
                              value={st.libelle}
                              onChange={(e) => handleUpdateSousTache(index, 'libelle', e.target.value)}
                              placeholder="Libellé de la sous-tâche"
                              className={`flex-1 ${st.fait ? 'line-through text-neutral-400' : ''}`}
                            />
                          ) : (
                            <span className={`flex-1 ${st.fait ? 'line-through text-neutral-400' : ''}`}>{st.libelle}</span>
                          )}
                          {isEditing && (
                            <button type="button" onClick={() => handleRemoveSousTache(index)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {isEditing && (
                          <div className="grid grid-cols-2 gap-2 mt-2 pl-8">
                            <Select value={st.responsableId?.toString() || ''} onChange={(e) => handleUpdateSousTache(index, 'responsableId', e.target.value ? parseInt(e.target.value) : null)}>
                              <SelectOption value="">Responsable (opt.)</SelectOption>
                              {users.map((user) => (
                                <SelectOption key={user.id} value={user.id!.toString()}>{user.prenom} {user.nom}</SelectOption>
                              ))}
                            </Select>
                            <Input type="date" value={st.echeance || ''} onChange={(e) => handleUpdateSousTache(index, 'echeance', e.target.value || null)} placeholder="Échéance" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isEditing && (
                  <Button type="button" variant="outline" onClick={handleAddSousTache} className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une sous-tâche
                  </Button>
                )}
              </TabsContent>

              {/* ============================================= */}
              {/* ONGLET COMPLÉMENTS */}
              {/* ============================================= */}
              <TabsContent value="complements" className="space-y-4 m-0">
                {/* Dépendances */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Dépendances (actions prérequises)
                  </h3>
                  {isEditing ? (
                    <Select multiple {...register('dependances')} className="min-h-[100px]">
                      {actionsDisponibles.map((a) => (
                        <SelectOption key={a.id} value={a.id!}>{a.id_action} - {a.titre}</SelectOption>
                      ))}
                    </Select>
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm">
                      {action?.predecesseurs?.length ? action.predecesseurs.join(', ') : 'Aucune dépendance'}
                    </div>
                  )}
                </div>

                {/* Livrable */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Livrable attendu
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Description du livrable</Label>
                      {isEditing ? (
                        <Input {...register('livrable')} placeholder="Ex: Rapport d'analyse, Contrat signé..." />
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm">{action?.livrables?.[0]?.nom || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Format</Label>
                      {isEditing ? (
                        <Select {...register('format')}>
                          {FORMATS_LIVRABLE.map((f) => (
                            <SelectOption key={f.value} value={f.value}>{f.label}</SelectOption>
                          ))}
                        </Select>
                      ) : (
                        <div className="p-2 bg-white rounded border text-sm">
                          {FORMATS_LIVRABLE.find(f => f.value === action?.livrables?.[0]?.format)?.label || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Notes horodatées
                    {notes.length > 0 && <Badge variant="info" className="ml-2">{notes.length}</Badge>}
                  </h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {notes.length === 0 ? (
                      <p className="text-sm text-blue-600 italic">Aucune note</p>
                    ) : (
                      notes.map((note, index) => (
                        <div key={note.id} className="p-2 bg-white rounded border text-sm flex justify-between items-start">
                          <div>
                            <p className="text-neutral-700">{note.texte}</p>
                            <p className="text-xs text-neutral-500 mt-1">{note.auteur} - {new Date(note.date).toLocaleString('fr-FR')}</p>
                          </div>
                          {isEditing && (
                            <button type="button" onClick={() => handleRemoveNote(index)} className="text-red-500 hover:text-red-700 p-1">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2 mt-3">
                      <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ajouter une note..." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())} />
                      <Button type="button" variant="outline" size="sm" onClick={handleAddNote}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ============================================= */}
              {/* ONGLET PREUVES */}
              {/* ============================================= */}
              <TabsContent value="preuves" className="space-y-4 m-0">
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-cyan-800 mb-1 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Preuves et pièces jointes
                  </h3>
                  <p className="text-xs text-cyan-600">Ajoutez des fichiers (PDF, DOC, XLS, IMG - max 10MB) ou des liens</p>
                </div>

                {/* Liste des preuves */}
                {preuves.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 border-2 border-dashed rounded-lg">
                    <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Aucune preuve attachée</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {preuves.map((preuve, index) => (
                      <div key={preuve.id} className="p-3 bg-white rounded-lg border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {preuve.type === 'fichier' ? (
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileIcon className="w-5 h-5 text-blue-600" />
                            </div>
                          ) : (
                            <div className="p-2 bg-green-100 rounded-lg">
                              <LinkIcon className="w-5 h-5 text-green-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{preuve.nom}</p>
                            <p className="text-xs text-neutral-500">
                              {preuve.type === 'fichier' ? 'Fichier' : 'Lien'} - {new Date(preuve.dateAjout).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {preuve.url && (
                            <a href={preuve.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                              Ouvrir
                            </a>
                          )}
                          {isEditing && (
                            <button type="button" onClick={() => handleRemovePreuve(index)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isEditing && (
                  <>
                    {/* Zone de drop fichiers */}
                    <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center bg-white hover:bg-neutral-50 transition-colors">
                      <Upload className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
                      <p className="text-neutral-600 font-medium">Glissez-déposez vos fichiers ici</p>
                      <p className="text-xs text-neutral-500 mt-1">PDF, DOC, XLS, IMG - Max 10MB</p>
                      <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) { alert('Le fichier ne doit pas dépasser 10MB'); return; }
                            setPreuves([...preuves, { id: crypto.randomUUID(), type: 'fichier', nom: file.name, format: file.type, taille: file.size, dateAjout: new Date().toISOString() }]);
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="mt-4" onClick={() => document.getElementById('file-upload')?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Parcourir les fichiers
                      </Button>
                    </div>

                    {/* Bouton ajouter lien */}
                    <Button type="button" variant="outline" onClick={handleAddLien} className="w-full">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Ajouter un lien
                    </Button>
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <DialogFooter className="gap-2 pt-4 border-t flex-shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-1" />
              {isEditing ? 'Annuler' : 'Fermer'}
            </Button>
            {isEditing && (
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                {isSubmitting ? (
                  <><Clock className="w-4 h-4 mr-1 animate-spin" />Enregistrement...</>
                ) : (
                  <><Save className="w-4 h-4 mr-1" />Enregistrer</>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ActionForm;
