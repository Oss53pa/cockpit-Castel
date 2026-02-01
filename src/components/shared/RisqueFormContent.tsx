// ============================================================================
// CONTENU FORMULAIRE RISQUE - Composant réutilisable (interne + externe)
// ============================================================================

import { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Target,
  Calendar,
  User,
  Activity,
  Save,
  Clock,
  X,
  Plus,
  MessageSquare,
  CheckCircle,
  Ban,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Badge,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUsers } from '@/hooks';
import { type Risque } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

// Probabilité
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

// Impact
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

// Criticité
const CRITICITE_CONFIG = {
  VERT: { label: 'Faible', color: 'bg-green-500', emoji: '🟢' },
  JAUNE: { label: 'Modéré', color: 'bg-yellow-400', emoji: '🟡' },
  ORANGE: { label: 'Élevé', color: 'bg-orange-500', emoji: '🟠' },
  ROUGE: { label: 'Critique', color: 'bg-red-500', emoji: '🔴' },
};

type Criticite = keyof typeof CRITICITE_CONFIG;

// Statuts
const STATUT_CONFIG = {
  OUVERT: { label: 'Ouvert', color: 'bg-red-100 text-red-700 border-red-300' },
  EN_TRAITEMENT: { label: 'En cours', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  FERME: { label: 'Fermé', color: 'bg-green-100 text-green-700 border-green-300' },
  ACCEPTE: { label: 'Accepté', color: 'bg-gray-100 text-gray-700 border-gray-300' },
};

type Statut = keyof typeof STATUT_CONFIG;

// Catégories
const CATEGORIE_LABELS: Record<string, string> = {
  CONSTRUCTION: 'Construction',
  COMMERCIAL: 'Commercial',
  RH: 'RH',
  BUDGET: 'Budget',
  TECHNIQUE: 'Technique',
  EXTERNE: 'Externe',
};

interface Comment {
  id: string;
  texte: string;
  auteur: string;
  date: string;
}

// Calcul criticité
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

// Tabs
const FORM_TABS = [
  { id: 'general', label: 'Général', icon: Target },
  { id: 'evaluation', label: 'Évaluation', icon: Activity },
  { id: 'mitigation', label: 'Mitigation', icon: Shield },
];

// ============================================================================
// PROPS
// ============================================================================

export interface RisqueFormContentProps {
  risque: Partial<Risque> & { titre: string };
  isEditing?: boolean;
  isExternal?: boolean;
  onStatutChange?: (statut: Statut) => void;
  onSave?: (data: RisqueFormSaveData) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export interface RisqueFormSaveData {
  statut: string;
  probabilite: number;
  impact: number;
  score: number;
  // Champs éditables en interne uniquement
  titre?: string;
  description?: string;
  categorie?: string;
  proprietaire?: string;
  // Champs éditables en interne ET externe
  plan_mitigation?: string;
  notes_mise_a_jour?: string;
  commentaires_externes?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RisqueFormContent({
  risque,
  isEditing = true,
  isExternal = false,
  onStatutChange,
  onSave,
  onCancel,
  isSaving = false,
}: RisqueFormContentProps) {
  const [activeTab, setActiveTab] = useState('general');
  const users = useUsers();

  // Tous les champs sont éditables (sauf le code qui est auto-généré)
  const [titre, setTitre] = useState(risque.titre || '');
  const [description, setDescription] = useState(risque.description || '');
  const [categorie, setCategorie] = useState(risque.categorie || '');
  const [proprietaire, setProprietaire] = useState(risque.proprietaire || '');

  // Convertir les valeurs numériques en enums
  const getProbabiliteFromNum = (num?: number): Probabilite => {
    if (!num) return 'MOYENNE';
    if (num <= 1) return 'FAIBLE';
    if (num <= 2) return 'MOYENNE';
    return 'ELEVEE';
  };

  const getImpactFromNum = (num?: number): Impact => {
    if (!num) return 'MOYEN';
    if (num <= 1) return 'FAIBLE';
    if (num <= 2) return 'MOYEN';
    if (num <= 3) return 'ELEVE';
    return 'CRITIQUE';
  };

  const getStatutFromOld = (statut?: string): Statut => {
    const map: Record<string, Statut> = {
      'ouvert': 'OUVERT',
      'en_cours': 'EN_TRAITEMENT',
      'en_traitement': 'EN_TRAITEMENT',
      'ferme': 'FERME',
      'clos': 'FERME',
      'accepte': 'ACCEPTE',
    };
    return map[statut || ''] || 'OUVERT';
  };

  // État du formulaire
  const [isClosed, setIsClosed] = useState<'FERME' | 'ACCEPTE' | null>(
    risque.statut === 'ferme' || risque.statut === 'clos' ? 'FERME' :
    risque.statut === 'accepte' ? 'ACCEPTE' : null
  );
  const [probabilite, setProbabilite] = useState<Probabilite>(
    typeof risque.probabilite === 'number' ? getProbabiliteFromNum(risque.probabilite) : 'MOYENNE'
  );
  const [impact, setImpact] = useState<Impact>(
    typeof risque.impact === 'number' ? getImpactFromNum(risque.impact) : 'MOYEN'
  );
  const [planMitigation, setPlanMitigation] = useState(risque.plan_mitigation || '');
  const [notesMiseAJour, setNotesMiseAJour] = useState((risque as any).notes_mise_a_jour || '');
  const [comments, setComments] = useState<Comment[]>(() => {
    // Priorité: commentaires_externes (sync Firebase) > commentaires existants
    const externesStr = (risque as any).commentaires_externes;
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
        console.warn('Erreur parsing commentaires_externes risque:', e);
      }
    }
    return (risque as any).commentaires?.map((c: any) => ({
      id: c.id || crypto.randomUUID(),
      texte: c.texte,
      auteur: c.auteur,
      date: c.date,
    })) || [];
  });
  const [newComment, setNewComment] = useState('');

  // Calcul automatique du statut
  const statut: Statut = isClosed
    ? isClosed
    : planMitigation.trim().length > 0
      ? 'EN_TRAITEMENT'
      : 'OUVERT';

  // Criticité auto-calculée
  const criticite = useMemo(() => calculerCriticite(probabilite, impact), [probabilite, impact]);
  const criticiteConfig = CRITICITE_CONFIG[criticite];

  // Calcul score
  const probabiliteToNum: Record<Probabilite, number> = { FAIBLE: 1, MOYENNE: 2, ELEVEE: 3 };
  const impactToNum: Record<Impact, number> = { FAIBLE: 1, MOYEN: 2, ELEVE: 3, CRITIQUE: 4 };
  const score = probabiliteToNum[probabilite] * impactToNum[impact];

  // Notifier les changements de statut
  useEffect(() => {
    onStatutChange?.(statut);
  }, [statut]);

  // Handlers clôture
  const handleCloseRisk = (type: 'FERME' | 'ACCEPTE') => {
    if (isClosed === type) {
      setIsClosed(null); // Réouvrir
    } else {
      setIsClosed(type);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([...comments, {
        id: crypto.randomUUID(),
        texte: newComment.trim(),
        auteur: isExternal ? (risque.proprietaire || 'Externe') : 'Utilisateur',
        date: new Date().toISOString()
      }]);
      setNewComment('');
    }
  };

  const handleRemoveComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index));
  };

  // Sauvegarde
  const handleSave = () => {
    const statutToOld: Record<Statut, string> = {
      OUVERT: 'ouvert',
      EN_TRAITEMENT: 'en_cours',
      FERME: 'ferme',
      ACCEPTE: 'accepte',
    };

    onSave?.({
      statut: statutToOld[statut],
      probabilite: probabiliteToNum[probabilite],
      impact: impactToNum[impact],
      score,
      // Tous les champs sont éditables (sauf le code)
      titre,
      description,
      categorie,
      proprietaire,
      // Champs communs
      plan_mitigation: planMitigation,
      notes_mise_a_jour: notesMiseAJour,
      commentaires_externes: JSON.stringify(comments),
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header avec criticité */}
      <div className="flex items-center justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${criticiteConfig.color} text-white`}>
          <span>{criticiteConfig.emoji}</span>
          <span>Criticité: {criticiteConfig.label}</span>
        </div>
        <div className="text-sm text-neutral-500">
          Score: <span className="font-bold text-lg">{score}</span>
        </div>
      </div>

      {/* Statut auto-calculé + Actions de clôture */}
      <div className="p-4 bg-neutral-50 rounded-lg mb-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-600">Statut:</span>
            <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${STATUT_CONFIG[statut].color}`}>
              {STATUT_CONFIG[statut].label}
            </div>
            <span className="text-xs text-neutral-400 italic">(auto-calculé)</span>
          </div>

          {/* Boutons de clôture */}
          {isEditing && (
            <div className="flex gap-2">
              {isClosed ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsClosed(null)}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Réouvrir
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseRisk('FERME')}
                    className="border-green-300 text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Clôturer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseRisk('ACCEPTE')}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Accepter
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Explication du statut */}
        <p className="text-xs text-neutral-500">
          {statut === 'OUVERT' && 'Risque identifié, aucun plan de mitigation défini.'}
          {statut === 'EN_TRAITEMENT' && 'Un plan de mitigation est en cours.'}
          {statut === 'FERME' && 'Le risque a été traité et clôturé.'}
          {statut === 'ACCEPTE' && 'Le risque a été accepté (pas de mitigation prévue).'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Onglets */}
        <TabsList className="flex-shrink-0 grid grid-cols-3 mb-4">
          {FORM_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenu des onglets */}
        <div className="flex-1 overflow-y-auto">
          {/* ONGLET GÉNÉRAL */}
          <TabsContent value="general" className="space-y-4 m-0">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Identification du risque
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Code <span className="text-xs text-neutral-400">(auto-généré)</span></Label>
                  <div className="p-2 bg-white rounded border text-sm font-mono">{risque.id_risque || '-'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Catégorie</Label>
                  {isEditing ? (
                    <select
                      value={categorie}
                      onChange={(e) => setCategorie(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="technique">Technique</option>
                      <option value="commercial">Commercial</option>
                      <option value="rh">RH</option>
                      <option value="financier">Financier</option>
                      <option value="reglementaire">Réglementaire</option>
                      <option value="operationnel">Opérationnel</option>
                    </select>
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm">
                      {CATEGORIE_LABELS[categorie?.toUpperCase() || ''] || categorie || '-'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-1.5 block">Titre</Label>
                  {isEditing ? (
                    <Input
                      value={titre}
                      onChange={(e) => setTitre(e.target.value)}
                      placeholder="Titre du risque..."
                      className="bg-white"
                    />
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm font-medium">{titre || '-'}</div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-1.5 block">Description</Label>
                  {isEditing ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description du risque..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none bg-white"
                    />
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm min-h-[60px]">{description || '-'}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Responsabilité
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Responsable</Label>
                  {isEditing ? (
                    <select
                      value={proprietaire}
                      onChange={(e) => setProprietaire(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    >
                      <option value="">Sélectionner un responsable...</option>
                      {users.map((user) => (
                        <option key={user.id} value={`${user.prenom} ${user.nom}`}>
                          {user.prenom} {user.nom} {user.role ? `(${user.role})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 bg-white rounded border text-sm">{proprietaire || '-'}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Date d'identification</Label>
                  <div className="p-2 bg-white rounded border text-sm">
                    {risque.date_identification ? new Date(risque.date_identification).toLocaleDateString('fr-FR') : '-'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ONGLET ÉVALUATION */}
          <TabsContent value="evaluation" className="space-y-4 m-0">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Évaluation du risque
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Probabilité */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Probabilité</Label>
                  <div className="flex gap-2">
                    {PROBABILITES.map((prob) => {
                      const isActive = probabilite === prob;
                      return (
                        <button
                          key={prob}
                          type="button"
                          onClick={() => isEditing && setProbabilite(prob)}
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
                  <Label className="text-sm font-medium mb-2 block">Impact</Label>
                  <div className="flex gap-2">
                    {IMPACTS.map((imp) => {
                      const isActive = impact === imp;
                      return (
                        <button
                          key={imp}
                          type="button"
                          onClick={() => isEditing && setImpact(imp)}
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

              {/* Score */}
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-dashed flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-neutral-500 mb-1">Criticité calculée</div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold ${criticiteConfig.color}`}>
                    <span className="text-xl">{criticiteConfig.emoji}</span>
                    <span>{criticiteConfig.label}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-neutral-500 mb-1">Score</div>
                  <div className="text-3xl font-bold text-neutral-800">{score}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ONGLET MITIGATION */}
          <TabsContent value="mitigation" className="space-y-4 m-0">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Plan de mitigation
              </h3>
              {isEditing ? (
                <textarea
                  value={planMitigation}
                  onChange={(e) => setPlanMitigation(e.target.value)}
                  placeholder="Décrivez les actions préventives..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              ) : (
                <div className="p-3 bg-white rounded border text-sm whitespace-pre-wrap min-h-[150px]">
                  {planMitigation || 'Aucun plan de mitigation défini.'}
                </div>
              )}
            </div>

            {/* Notes de mise à jour */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes de mise à jour
              </h3>
              <textarea
                value={notesMiseAJour}
                onChange={(e) => setNotesMiseAJour(e.target.value)}
                placeholder="Ajoutez vos notes..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={!isEditing}
              />
            </div>

            {/* Commentaires */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Commentaires
                {comments.length > 0 && <Badge variant="info" className="ml-2">{comments.length}</Badge>}
              </h3>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-green-600 italic">Aucun commentaire</p>
                ) : (
                  comments.map((comment, index) => (
                    <div key={comment.id} className="p-2 bg-white rounded border text-sm flex justify-between items-start">
                      <div>
                        <p className="text-neutral-700">{comment.texte}</p>
                        <p className="text-xs text-neutral-500 mt-1">{comment.auteur} - {new Date(comment.date).toLocaleString('fr-FR')}</p>
                      </div>
                      {isEditing && (
                        <button type="button" onClick={() => handleRemoveComment(index)} className="text-red-500 hover:text-red-700 p-1">
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
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddComment}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
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
            className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
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

export default RisqueFormContent;
