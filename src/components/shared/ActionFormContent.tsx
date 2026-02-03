// ============================================================================
// CONTENU FORMULAIRE ACTION - Composant réutilisable (interne + externe)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Calendar,
  User,
  Plus,
  Trash2,
  Link2,
  FileText,
  Upload,
  LinkIcon,
  Clock,
  Save,
  Eye,
  Edit3,
  CheckCircle,
  XCircle,
  ListChecks,
  Paperclip,
  MessageSquare,
  FileIcon,
  Sparkles,
  X,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  SelectOption,
  Label,
  Badge,
  PercentInput,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AXE_LABELS, PROJECT_PHASES, PROJECT_PHASE_LABELS, type Action, type Axe, type ProjectPhase } from '@/types';
import { calculerPourcentageAction } from '@/lib/calculations';

// ============================================================================
// TYPES
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

interface PointAttention {
  id: string;
  sujet: string;
  responsableId: number | null;
  responsableNom?: string;
  dateCreation: string;
  transmis?: boolean;
  dateTransmission?: string;
}

interface DecisionAttendue {
  id: string;
  sujet: string;
  dateCreation: string;
  transmis?: boolean;
  dateTransmission?: string;
}

interface UserOption {
  id: number;
  nom: string;
  prenom: string;
}

interface JalonOption {
  id: number;
  id_jalon: string;
  titre: string;
  axe?: Axe;
  responsableId?: number;
  date_prevue?: string;
}

// Statuts avec icônes
const STATUT_CONFIG = {
  a_faire: { label: 'À faire', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Edit3 },
  fait: { label: 'Fait', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  bloque: { label: 'Bloqué', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
};

type StatutAction = keyof typeof STATUT_CONFIG;

// Tabs
const FORM_TABS = [
  { id: 'general', label: 'Général', icon: Target },
  { id: 'sousTaches', label: 'Sous-tâches', icon: ListChecks },
  { id: 'pointsAttention', label: "Points d'Attention", icon: AlertTriangle },
  { id: 'decisionsAttendues', label: 'Décisions attendues', icon: HelpCircle },
  { id: 'complements', label: 'Compléments', icon: MessageSquare },
  { id: 'preuves', label: 'Preuves', icon: Paperclip },
];

// ============================================================================
// PROPS
// ============================================================================

export interface ActionFormContentProps {
  // Données de l'action
  action: Partial<Action> & { titre: string };

  // Options pour les selects (vide en mode externe si pas dispo)
  users?: UserOption[];
  jalons?: JalonOption[];
  actionsDisponibles?: Action[];

  // Mode
  isEditing?: boolean;
  isExternal?: boolean;

  // Callbacks
  onStatutChange?: (statut: StatutAction) => void;
  onAvancementChange?: (avancement: number) => void;
  onSave?: (data: ActionFormSaveData) => void;
  onCancel?: () => void;

  // État
  isSaving?: boolean;
}

export interface ActionFormSaveData {
  // Champs principaux (modifiables en interne)
  titre?: string;
  jalonId?: number | null;
  responsableId?: number | null;
  date_fin_prevue?: string;
  projectPhase?: ProjectPhase;
  // Statut et avancement
  statut: StatutAction;
  avancement: number;
  notes_mise_a_jour?: string;
  liens_documents?: string;
  commentaires_externes?: string;
  sousTaches?: SousTache[];
  preuves?: Preuve[];
  pointsAttention?: PointAttention[];
  decisionsAttendues?: DecisionAttendue[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActionFormContent({
  action,
  users = [],
  jalons = [],
  actionsDisponibles = [],
  isEditing = true,
  isExternal = false,
  onStatutChange,
  onAvancementChange,
  onSave,
  onCancel,
  isSaving = false,
}: ActionFormContentProps) {
  const [activeTab, setActiveTab] = useState('general');

  // État des champs principaux (éditables en interne)
  const [titre, setTitre] = useState(action.titre || '');
  const [jalonId, setJalonId] = useState<number | null>(action.jalonId ?? null);
  const [responsableId, setResponsableId] = useState<number | null>(action.responsableId ?? null);
  const [echeance, setEcheance] = useState(action.date_fin_prevue || '');
  const [projectPhase, setProjectPhase] = useState<ProjectPhase | undefined>(action.projectPhase);

  // État du formulaire
  const [avancement, setAvancement] = useState(action.avancement ?? 0);
  const [isBloque, setIsBloque] = useState((action.statut as StatutAction) === 'bloque');
  const [sousTaches, setSousTaches] = useState<SousTache[]>((action as any).sous_taches || []);
  const [preuves, setPreuves] = useState<Preuve[]>(action.documents?.map(d => ({
    id: d.id || crypto.randomUUID(),
    type: d.type?.includes('lien') ? 'lien' as const : 'fichier' as const,
    nom: d.nom,
    url: d.url,
    dateAjout: d.dateAjout || new Date().toISOString(),
  })) || []);
  const [notes, setNotes] = useState<Note[]>(() => {
    // Priorité: commentaires_externes (sync Firebase) > commentaires existants
    const externesStr = (action as any).commentaires_externes;
    if (externesStr) {
      try {
        const parsed = JSON.parse(externesStr);
        return parsed.map((c: any) => ({
          id: c.id || crypto.randomUUID(),
          texte: c.texte,
          auteur: c.auteur,
          date: c.date,
        }));
      } catch (e) {
        console.warn('Erreur parsing commentaires_externes:', e);
      }
    }
    return action.commentaires?.map(c => ({
      id: c.id || crypto.randomUUID(),
      texte: c.texte,
      auteur: c.auteur,
      date: c.date,
    })) || [];
  });
  const [newNote, setNewNote] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [pointsAttention, setPointsAttention] = useState<PointAttention[]>(
    (action as any).points_attention || []
  );
  const [decisionsAttendues, setDecisionsAttendues] = useState<DecisionAttendue[]>(
    (action as any).decisions_attendues || []
  );
  const [notesMiseAJour, setNotesMiseAJour] = useState((action as any).notes_mise_a_jour || '');

  // Calcul automatique du statut basé sur l'avancement
  const statut: StatutAction = isBloque
    ? 'bloque'
    : avancement === 0
      ? 'a_faire'
      : avancement === 100
        ? 'fait'
        : 'en_cours';

  // Calculs
  const selectedJalon = jalonId ? jalons.find(j => j.id === jalonId) : null;
  const axeHerite = selectedJalon?.axe || action.axe || null;

  const calculerPriorite = useCallback((echeance: string): 'haute' | 'moyenne' | 'basse' => {
    if (!echeance) return 'moyenne';
    const joursRestants = Math.ceil((new Date(echeance).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (joursRestants <= 7) return 'haute';
    if (joursRestants <= 30) return 'moyenne';
    return 'basse';
  }, []);

  const prioriteCalculee = calculerPriorite(action.date_fin_prevue || '');
  const joursRestants = action.date_fin_prevue
    ? Math.ceil((new Date(action.date_fin_prevue).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Calcul avancement auto selon sous-tâches (uniquement si pas bloqué)
  useEffect(() => {
    if (sousTaches.length > 0 && !isBloque) {
      const faites = sousTaches.filter(st => st.fait).length;
      const newAvancement = Math.round((faites / sousTaches.length) * 100);
      if (newAvancement !== avancement) {
        setAvancement(newAvancement);
        onAvancementChange?.(newAvancement);
      }
    }
  }, [sousTaches, isBloque]);

  // Notifier les changements de statut
  useEffect(() => {
    if (onStatutChange) {
      onStatutChange(statut);
    }
  }, [statut, onStatutChange]);

  // Handler avancement manuel
  const handleAvancementChange = (newAvancement: number) => {
    if (isBloque) return; // Pas de changement si bloqué
    setAvancement(Math.max(0, Math.min(100, newAvancement)));
    onAvancementChange?.(newAvancement);
  };

  // Handler bloqué
  const handleBloqueToggle = () => {
    setIsBloque(!isBloque);
  };

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

  const handleToggleSousTache = (index: number) => {
    const updated = [...sousTaches];
    updated[index] = { ...updated[index], fait: !updated[index].fait };
    setSousTaches(updated);
  };

  // Handlers preuves
  const handleAddLien = () => {
    if (!newLinkUrl.trim()) return;
    setPreuves([...preuves, {
      id: crypto.randomUUID(),
      type: 'lien',
      nom: newLinkLabel.trim() || newLinkUrl.trim(),
      url: newLinkUrl.trim(),
      dateAjout: new Date().toISOString()
    }]);
    setNewLinkUrl('');
    setNewLinkLabel('');
    setShowLinkForm(false);
  };

  const handleAddFichier = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Convertir le fichier en base64 pour le stockage
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPreuves([...preuves, {
          id: crypto.randomUUID(),
          type: 'fichier',
          nom: file.name,
          url: base64, // Stocke le fichier en base64
          dateAjout: new Date().toISOString()
        }]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input pour permettre de re-sélectionner le même fichier
    event.target.value = '';
  };

  const handleRemovePreuve = (index: number) => {
    setPreuves(preuves.filter((_, i) => i !== index));
  };

  // Handlers notes
  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, {
        id: crypto.randomUUID(),
        texte: newNote.trim(),
        auteur: isExternal ? (action.responsable || 'Externe') : 'Utilisateur',
        date: new Date().toISOString()
      }]);
      setNewNote('');
    }
  };

  const handleRemoveNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  // Handlers points d'attention
  const handleAddPointAttention = () => {
    setPointsAttention([...pointsAttention, {
      id: crypto.randomUUID(),
      sujet: '',
      responsableId: null,
      responsableNom: '',
      dateCreation: new Date().toISOString(),
    }]);
  };

  const handleUpdatePointAttention = (index: number, field: keyof PointAttention, value: any) => {
    const updated = [...pointsAttention];
    updated[index] = { ...updated[index], [field]: value };
    // Si on change le responsableId, mettre à jour le nom aussi
    if (field === 'responsableId' && value) {
      const user = users.find(u => u.id === value);
      if (user) {
        updated[index].responsableNom = `${user.prenom} ${user.nom}`;
      }
    }
    setPointsAttention(updated);
  };

  const handleRemovePointAttention = (index: number) => {
    setPointsAttention(pointsAttention.filter((_, i) => i !== index));
  };

  // Handlers décisions attendues
  const handleAddDecisionAttendue = () => {
    setDecisionsAttendues([...decisionsAttendues, {
      id: crypto.randomUUID(),
      sujet: '',
      dateCreation: new Date().toISOString(),
    }]);
  };

  const handleUpdateDecisionAttendue = (index: number, field: keyof DecisionAttendue, value: any) => {
    const updated = [...decisionsAttendues];
    updated[index] = { ...updated[index], [field]: value };
    setDecisionsAttendues(updated);
  };

  const handleRemoveDecisionAttendue = (index: number) => {
    setDecisionsAttendues(decisionsAttendues.filter((_, i) => i !== index));
  };

  // Sauvegarde
  const handleSave = () => {
    onSave?.({
      // Champs principaux (si modifiés en interne)
      titre: titre !== action.titre ? titre : undefined,
      jalonId: jalonId !== action.jalonId ? jalonId : undefined,
      responsableId: responsableId !== action.responsableId ? responsableId : undefined,
      date_fin_prevue: echeance !== action.date_fin_prevue ? echeance : undefined,
      projectPhase: projectPhase !== action.projectPhase ? projectPhase : undefined,
      // Statut et avancement
      statut,
      avancement,
      notes_mise_a_jour: notesMiseAJour,
      liens_documents: JSON.stringify(preuves),
      commentaires_externes: JSON.stringify(notes),
      sousTaches,
      preuves,
      pointsAttention,
      decisionsAttendues,
    });
  };

  const StatutIcon = STATUT_CONFIG[statut].icon;

  return (
    <div className="flex flex-col h-full">
      {/* Avancement & Statut - Toujours visible */}
      <div className="p-4 bg-neutral-50 rounded-lg flex-shrink-0 mb-4 space-y-3">
        {/* Statut auto-calculé (lecture seule) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-600">Statut:</span>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${STATUT_CONFIG[statut].color}`}>
              <StatutIcon className="w-4 h-4" />
              {STATUT_CONFIG[statut].label}
            </div>
            <span className="text-xs text-neutral-400 italic">(auto-calculé)</span>
          </div>
          {/* Toggle Bloqué */}
          {isEditing && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBloque}
                onChange={handleBloqueToggle}
                className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span className={`text-sm font-medium ${isBloque ? 'text-red-600' : 'text-neutral-500'}`}>
                <XCircle className="w-4 h-4 inline mr-1" />
                Bloqué
              </span>
            </label>
          )}
        </div>

        {/* Avancement modifiable */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-600">Avancement:</span>
            <span className={`text-lg font-bold ${avancement === 100 ? 'text-green-600' : avancement === 0 ? 'text-neutral-400' : 'text-blue-600'}`}>
              {avancement}%
            </span>
          </div>
          {isEditing && !isBloque && sousTaches.length === 0 ? (
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={avancement}
                onChange={(e) => handleAvancementChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <PercentInput
                value={avancement}
                onChange={handleAvancementChange}
                className="w-20 text-center text-sm"
              />
            </div>
          ) : (
            <div className="w-full bg-neutral-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${isBloque ? 'bg-red-500' : avancement === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${avancement}%` }}
              />
            </div>
          )}
          {sousTaches.length > 0 && !isBloque && (
            <p className="text-xs text-neutral-500 italic">
              Avancement calculé automatiquement selon les sous-tâches ({sousTaches.filter(st => st.fait).length}/{sousTaches.length} terminées)
            </p>
          )}
          {isBloque && (
            <p className="text-xs text-red-500 italic">
              Action bloquée - l'avancement est gelé
            </p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Onglets - 6 tabs en ligne */}
        <TabsList className="flex-shrink-0 flex gap-0.5">
          {FORM_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
                {tab.id === 'sousTaches' && sousTaches.length > 0 && (
                  <Badge variant="info" className="ml-1 text-xs">{sousTaches.filter(st => st.fait).length}/{sousTaches.length}</Badge>
                )}
                {tab.id === 'preuves' && preuves.length > 0 && (
                  <Badge variant="info" className="ml-1 text-xs">{preuves.length}</Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenu des onglets */}
        <div className="flex-1 overflow-y-auto p-1 mt-4">
          {/* ONGLET GÉNÉRAL */}
          <TabsContent value="general" className="space-y-4 m-0">
            {/* Champs obligatoires - Éditables en interne, lecture seule en externe */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Champs obligatoires
                {isExternal && <span className="text-xs font-normal text-blue-600 ml-2">(lecture seule)</span>}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Jalon */}
                <div>
                  <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <Link2 className="w-4 h-4 text-purple-600" />
                    Jalon
                  </Label>
                  {isEditing && !isExternal ? (
                    <Select
                      value={jalonId?.toString() || ''}
                      onChange={(e) => setJalonId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <SelectOption value="">Sélectionner un jalon...</SelectOption>
                      {jalons.map(j => (
                        <SelectOption key={j.id} value={j.id.toString()}>
                          {j.id_jalon} - {j.titre}
                        </SelectOption>
                      ))}
                    </Select>
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm">
                      {selectedJalon ? `${selectedJalon.id_jalon} - ${selectedJalon.titre}` : action.jalonId || '-'}
                    </div>
                  )}
                </div>

                {/* Responsable */}
                <div>
                  <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <User className="w-4 h-4 text-green-600" />
                    Responsable
                  </Label>
                  {isEditing && !isExternal ? (
                    <Select
                      value={responsableId?.toString() || ''}
                      onChange={(e) => setResponsableId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <SelectOption value="">Sélectionner un responsable...</SelectOption>
                      {users.map(u => (
                        <SelectOption key={u.id} value={u.id.toString()}>
                          {u.prenom} {u.nom}
                        </SelectOption>
                      ))}
                    </Select>
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm">{action.responsable || '-'}</div>
                  )}
                </div>

                {/* Libellé */}
                <div className="md:col-span-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Libellé
                  </Label>
                  {isEditing && !isExternal ? (
                    <Input
                      value={titre}
                      onChange={(e) => setTitre(e.target.value)}
                      placeholder="Titre de l'action"
                    />
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm font-medium">{action.titre || '-'}</div>
                  )}
                </div>

                {/* Échéance */}
                <div>
                  <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    Échéance
                  </Label>
                  {isEditing && !isExternal ? (
                    <Input
                      type="date"
                      value={echeance}
                      onChange={(e) => setEcheance(e.target.value)}
                    />
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm">
                      {action.date_fin_prevue ? new Date(action.date_fin_prevue).toLocaleDateString('fr-FR') : '-'}
                    </div>
                  )}
                </div>

                {/* Phase projet */}
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    Phase projet
                  </Label>
                  {isEditing && !isExternal ? (
                    <Select
                      value={projectPhase || ''}
                      onChange={(e) => setProjectPhase(e.target.value as ProjectPhase || undefined)}
                    >
                      <SelectOption value="">Non définie</SelectOption>
                      {PROJECT_PHASES.map((phase) => (
                        <SelectOption key={phase} value={phase}>{PROJECT_PHASE_LABELS[phase]}</SelectOption>
                      ))}
                    </Select>
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm">
                      {projectPhase ? PROJECT_PHASE_LABELS[projectPhase] : '-'}
                    </div>
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
                  <div className="font-mono font-medium text-blue-700 truncate">{action.id_action || '-'}</div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-xs text-neutral-500">Axe</div>
                  <div className="font-medium truncate">{axeHerite ? AXE_LABELS[axeHerite] : '-'}</div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-xs text-neutral-500">Statut</div>
                  <Badge className={`${STATUT_CONFIG[statut]?.color} text-xs`}>{STATUT_CONFIG[statut]?.label}</Badge>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-xs text-neutral-500">Avancement</div>
                  <div className="font-medium">{avancement}%</div>
                  <div className="w-full bg-neutral-200 rounded-full h-1 mt-1">
                    <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${avancement}%` }} />
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

            {/* Notes de mise à jour */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes de mise à jour
              </h3>
              <textarea
                value={notesMiseAJour}
                onChange={(e) => setNotesMiseAJour(e.target.value)}
                placeholder="Ajoutez vos notes, observations ou informations supplémentaires..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={!isEditing}
              />
            </div>
          </TabsContent>

          {/* ONGLET SOUS-TÂCHES */}
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
                        disabled={!isEditing}
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

          {/* ONGLET POINTS D'ATTENTION */}
          <TabsContent value="pointsAttention" className="space-y-3 m-0">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Points d'Attention
                {pointsAttention.length > 0 && (
                  <Badge variant="warning" className="ml-2">{pointsAttention.length}</Badge>
                )}
              </h3>
              <p className="text-xs text-amber-600 mb-3">
                Ces points seront consolidés dans le rapport DeepDive sous l'axe de cette action.
              </p>
            </div>

            {pointsAttention.length > 0 && (
              <div className="space-y-2">
                {pointsAttention.map((pa, index) => (
                  <div
                    key={pa.id}
                    className={`p-3 border rounded-lg ${pa.transmis ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}
                  >
                    <div className="space-y-3">
                      {/* Checkbox Transmis */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pa.transmis || false}
                            onChange={(e) => {
                              handleUpdatePointAttention(index, 'transmis', e.target.checked);
                              if (e.target.checked) {
                                handleUpdatePointAttention(index, 'dateTransmission', new Date().toISOString());
                              }
                            }}
                            disabled={!isEditing}
                            className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                          />
                          <span className={`text-sm font-medium ${pa.transmis ? 'text-green-700' : 'text-amber-700'}`}>
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Transmis
                          </span>
                        </label>
                        {pa.transmis && pa.dateTransmission && (
                          <span className="text-xs text-green-600">
                            le {new Date(pa.dateTransmission).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>

                      {/* Sujet */}
                      <div>
                        <Label className={`text-xs mb-1 ${pa.transmis ? 'text-green-700' : 'text-amber-700'}`}>Sujet</Label>
                        {isEditing ? (
                          <Input
                            value={pa.sujet}
                            onChange={(e) => handleUpdatePointAttention(index, 'sujet', e.target.value)}
                            placeholder="Décrivez le point d'attention..."
                            className={pa.transmis ? 'border-green-300 focus:border-green-500' : 'border-amber-300 focus:border-amber-500'}
                          />
                        ) : (
                          <p className={`text-sm ${pa.transmis ? 'line-through text-green-600' : ''}`}>{pa.sujet || 'Non renseigné'}</p>
                        )}
                      </div>

                      {/* Responsable */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Label className={`text-xs mb-1 ${pa.transmis ? 'text-green-700' : 'text-amber-700'}`}>Responsable</Label>
                          {isEditing ? (
                            <Select
                              value={pa.responsableId?.toString() || ''}
                              onChange={(e) => handleUpdatePointAttention(index, 'responsableId', e.target.value ? parseInt(e.target.value) : null)}
                            >
                              <SelectOption value="">Sélectionner...</SelectOption>
                              {users.map(user => (
                                <SelectOption key={user.id} value={user.id.toString()}>
                                  {user.prenom} {user.nom}
                                </SelectOption>
                              ))}
                            </Select>
                          ) : (
                            <p className="text-sm flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {pa.responsableNom || 'Non assigné'}
                            </p>
                          )}
                        </div>

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemovePointAttention(index)}
                            className="text-red-500 hover:text-red-700 p-1 mt-5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pointsAttention.length === 0 && (
              <div className="text-center py-8 text-amber-600">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun point d'attention</p>
              </div>
            )}

            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddPointAttention}
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un point d'attention
              </Button>
            )}
          </TabsContent>

          {/* ONGLET DÉCISIONS ATTENDUES */}
          <TabsContent value="decisionsAttendues" className="space-y-3 m-0">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Décisions attendues
                {decisionsAttendues.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-purple-200 text-purple-800">{decisionsAttendues.length}</Badge>
                )}
              </h3>
              <p className="text-xs text-purple-600 mb-3">
                Ces décisions seront consolidées dans le rapport DeepDive sous l'axe de cette action.
              </p>
            </div>

            {decisionsAttendues.length > 0 && (
              <div className="space-y-2">
                {decisionsAttendues.map((da, index) => (
                  <div
                    key={da.id}
                    className={`p-3 border rounded-lg ${da.transmis ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'}`}
                  >
                    <div className="space-y-3">
                      {/* Checkbox Transmis */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={da.transmis || false}
                            onChange={(e) => {
                              handleUpdateDecisionAttendue(index, 'transmis', e.target.checked);
                              if (e.target.checked) {
                                handleUpdateDecisionAttendue(index, 'dateTransmission', new Date().toISOString());
                              }
                            }}
                            disabled={!isEditing}
                            className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                          />
                          <span className={`text-sm font-medium ${da.transmis ? 'text-green-700' : 'text-purple-700'}`}>
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Transmis
                          </span>
                        </label>
                        {da.transmis && da.dateTransmission && (
                          <span className="text-xs text-green-600">
                            le {new Date(da.dateTransmission).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>

                      {/* Sujet */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Label className={`text-xs mb-1 ${da.transmis ? 'text-green-700' : 'text-purple-700'}`}>Sujet</Label>
                          {isEditing ? (
                            <Input
                              value={da.sujet}
                              onChange={(e) => handleUpdateDecisionAttendue(index, 'sujet', e.target.value)}
                              placeholder="Décrivez la décision attendue..."
                              className={da.transmis ? 'border-green-300 focus:border-green-500' : 'border-purple-300 focus:border-purple-500'}
                            />
                          ) : (
                            <p className={`text-sm ${da.transmis ? 'line-through text-green-600' : ''}`}>{da.sujet || 'Non renseigné'}</p>
                          )}
                        </div>

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDecisionAttendue(index)}
                            className="text-red-500 hover:text-red-700 p-1 mt-5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {decisionsAttendues.length === 0 && (
              <div className="text-center py-8 text-purple-600">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune décision attendue</p>
              </div>
            )}

            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddDecisionAttendue}
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter une décision attendue
              </Button>
            )}
          </TabsContent>

          {/* ONGLET COMPLÉMENTS / NOTES */}
          <TabsContent value="complements" className="space-y-4 m-0">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Commentaires
                {notes.length > 0 && <Badge variant="info" className="ml-2">{notes.length}</Badge>}
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-sm text-blue-600 italic">Aucun commentaire</p>
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
                  <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddNote}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ONGLET PREUVES */}
          <TabsContent value="preuves" className="space-y-4 m-0">
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
              <h3 className="text-sm font-semibold text-cyan-800 mb-1 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Documents et liens
              </h3>
              <p className="text-xs text-cyan-600">Ajoutez des liens vers des documents</p>
            </div>

            {preuves.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 border-2 border-dashed rounded-lg">
                <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Aucun document ou lien</p>
              </div>
            ) : (
              <div className="space-y-2">
                {preuves.map((preuve, index) => (
                  <div key={preuve.id} className="p-3 bg-white rounded-lg border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${preuve.type === 'fichier' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        {preuve.type === 'fichier' ? (
                          <FileIcon className="w-5 h-5 text-blue-600" />
                        ) : (
                          <LinkIcon className="w-5 h-5 text-green-600" />
                        )}
                      </div>
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
              <div className="space-y-3">
                {!showLinkForm ? (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowLinkForm(true)} className="flex-1">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Ajouter un lien
                    </Button>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleAddFichier}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      />
                      <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors border border-primary-300 bg-transparent hover:bg-primary-100 active:bg-primary-200 h-10 px-4 w-full">
                        <FileIcon className="w-4 h-4" />
                        Joindre un fichier
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
                    <Input
                      placeholder="URL du lien (ex: https://...)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Libellé (optionnel)"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddLien}
                        disabled={!newLinkUrl.trim()}
                        className="flex-1"
                      >
                        Ajouter
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowLinkForm(false);
                          setNewLinkUrl('');
                          setNewLinkLabel('');
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer avec boutons */}
      {isEditing && onSave && (
        <div className="flex gap-2 pt-4 border-t mt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="flex-1">
              <X className="w-4 h-4 mr-1" />
              Annuler
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
          >
            {isSaving ? (
              <><Clock className="w-4 h-4 mr-1 animate-spin" />Enregistrement...</>
            ) : (
              <><Save className="w-4 h-4 mr-1" />Enregistrer</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ActionFormContent;
