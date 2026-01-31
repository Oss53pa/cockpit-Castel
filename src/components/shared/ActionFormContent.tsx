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
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  SelectOption,
  Label,
  Badge,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AXE_LABELS, type Action, type Axe } from '@/types';
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
  statut: StatutAction;
  avancement: number;
  notes_mise_a_jour?: string;
  liens_documents?: string;
  commentaires_externes?: string;
  sousTaches?: SousTache[];
  preuves?: Preuve[];
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

  // État du formulaire
  const [statut, setStatut] = useState<StatutAction>((action.statut as StatutAction) || 'a_faire');
  const [avancement, setAvancement] = useState(action.avancement ?? 0);
  const [sousTaches, setSousTaches] = useState<SousTache[]>((action as any).sous_taches || []);
  const [preuves, setPreuves] = useState<Preuve[]>(action.documents?.map(d => ({
    id: d.id || crypto.randomUUID(),
    type: d.type?.includes('lien') ? 'lien' as const : 'fichier' as const,
    nom: d.nom,
    url: d.url,
    dateAjout: d.dateAjout || new Date().toISOString(),
  })) || []);
  const [notes, setNotes] = useState<Note[]>(action.commentaires?.map(c => ({
    id: c.id || crypto.randomUUID(),
    texte: c.texte,
    auteur: c.auteur,
    date: c.date,
  })) || []);
  const [newNote, setNewNote] = useState('');
  const [notesMiseAJour, setNotesMiseAJour] = useState((action as any).notes_mise_a_jour || '');

  // Calculs
  const selectedJalon = action.jalonId ? jalons.find(j => j.id === action.jalonId) : null;
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

  // Calcul avancement auto selon sous-tâches
  useEffect(() => {
    if (sousTaches.length > 0 && statut === 'en_cours') {
      const newAvancement = calculerPourcentageAction(statut, sousTaches, avancement);
      if (newAvancement !== avancement) {
        setAvancement(newAvancement);
        onAvancementChange?.(newAvancement);
      }
    }
  }, [sousTaches, statut]);

  // Handlers statut
  const handleStatutChange = (newStatut: StatutAction) => {
    setStatut(newStatut);
    const newAvancement = calculerPourcentageAction(newStatut, sousTaches, avancement);
    setAvancement(newAvancement);
    onStatutChange?.(newStatut);
    onAvancementChange?.(newAvancement);
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

  // Sauvegarde
  const handleSave = () => {
    onSave?.({
      statut,
      avancement,
      notes_mise_a_jour: notesMiseAJour,
      liens_documents: JSON.stringify(preuves),
      commentaires_externes: JSON.stringify(notes),
      sousTaches,
      preuves,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Statut rapide - Toujours visible */}
      <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg flex-shrink-0 mb-4">
        <span className="text-sm font-medium text-neutral-600">Statut:</span>
        <div className="flex gap-1 flex-1 flex-wrap">
          {(Object.entries(STATUT_CONFIG) as [StatutAction, typeof STATUT_CONFIG[StatutAction]][]).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = statut === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => isEditing && handleStatutChange(key)}
                disabled={!isEditing}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  isActive ? `${config.color} ring-2 ring-offset-1` : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Onglets */}
        <TabsList className="flex-shrink-0 grid grid-cols-4">
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
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenu des onglets */}
        <div className="flex-1 overflow-y-auto p-1 mt-4">
          {/* ONGLET GÉNÉRAL */}
          <TabsContent value="general" className="space-y-4 m-0">
            {/* Champs obligatoires - Lecture seule en externe */}
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
                    Jalon
                  </Label>
                  <div className="p-2 bg-white rounded border text-sm">
                    {selectedJalon ? `${selectedJalon.id_jalon} - ${selectedJalon.titre}` : action.jalonId || '-'}
                  </div>
                </div>

                {/* Responsable */}
                <div>
                  <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <User className="w-4 h-4 text-green-600" />
                    Responsable
                  </Label>
                  <div className="p-2 bg-white rounded border text-sm">{action.responsable || '-'}</div>
                </div>

                {/* Libellé */}
                <div className="md:col-span-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Libellé
                  </Label>
                  <div className="p-2 bg-white rounded border text-sm font-medium">{action.titre || '-'}</div>
                </div>

                {/* Échéance */}
                <div>
                  <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    Échéance
                  </Label>
                  <div className="p-2 bg-white rounded border text-sm">
                    {action.date_fin_prevue ? new Date(action.date_fin_prevue).toLocaleDateString('fr-FR') : '-'}
                  </div>
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

            {/* Notes de mise à jour (externe) */}
            {isExternal && (
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
            )}
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
                      {isEditing && !isExternal ? (
                        <Input
                          value={st.libelle}
                          onChange={(e) => handleUpdateSousTache(index, 'libelle', e.target.value)}
                          placeholder="Libellé de la sous-tâche"
                          className={`flex-1 ${st.fait ? 'line-through text-neutral-400' : ''}`}
                        />
                      ) : (
                        <span className={`flex-1 ${st.fait ? 'line-through text-neutral-400' : ''}`}>{st.libelle}</span>
                      )}
                      {isEditing && !isExternal && (
                        <button type="button" onClick={() => handleRemoveSousTache(index)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isEditing && !isExternal && (
              <Button type="button" variant="outline" onClick={handleAddSousTache} className="w-full">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter une sous-tâche
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
              <Button type="button" variant="outline" onClick={handleAddLien} className="w-full">
                <LinkIcon className="w-4 h-4 mr-2" />
                Ajouter un lien
              </Button>
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
