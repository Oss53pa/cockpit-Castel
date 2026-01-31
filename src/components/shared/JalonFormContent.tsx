// ============================================================================
// CONTENU FORMULAIRE JALON - Composant réutilisable (interne + externe)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Calendar,
  User,
  Link2,
  MessageSquare,
  Sun,
  Cloud,
  CloudRain,
  Save,
  Sparkles,
  Clock,
  X,
  Plus,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Badge,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { AXE_LABELS, type Jalon, type Axe, type MeteoJalon } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface Comment {
  id: string;
  texte: string;
  auteur: string;
  date: string;
}

// Statuts jalon
const STATUT_CONFIG = {
  a_venir: { label: 'À venir', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  en_danger: { label: 'En danger', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  atteint: { label: 'Atteint', color: 'bg-green-100 text-green-700 border-green-300' },
  depasse: { label: 'Dépassé', color: 'bg-red-100 text-red-700 border-red-300' },
};

type StatutJalon = keyof typeof STATUT_CONFIG;

// Météo
function MeteoIcon({ meteo, className }: { meteo: MeteoJalon; className?: string }) {
  switch (meteo) {
    case 'SOLEIL': return <Sun className={cn('text-yellow-500', className)} />;
    case 'NUAGEUX': return <Cloud className={cn('text-gray-500', className)} />;
    case 'ORAGEUX': return <CloudRain className={cn('text-red-500', className)} />;
    default: return <Sun className={cn('text-yellow-500', className)} />;
  }
}

// ============================================================================
// PROPS
// ============================================================================

export interface JalonFormContentProps {
  jalon: Partial<Jalon> & { titre: string };
  isEditing?: boolean;
  isExternal?: boolean;
  onStatutChange?: (statut: StatutJalon) => void;
  onSave?: (data: JalonFormSaveData) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export interface JalonFormSaveData {
  statut: StatutJalon;
  preuve_url?: string;
  notes_mise_a_jour?: string;
  commentaires_externes?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function JalonFormContent({
  jalon,
  isEditing = true,
  isExternal = false,
  onStatutChange,
  onSave,
  onCancel,
  isSaving = false,
}: JalonFormContentProps) {
  // État du formulaire
  const [statut, setStatut] = useState<StatutJalon>((jalon.statut as StatutJalon) || 'a_venir');
  const [preuveUrl, setPreuveUrl] = useState(jalon.preuve_url || '');
  const [notesMiseAJour, setNotesMiseAJour] = useState((jalon as any).notes_mise_a_jour || '');
  const [comments, setComments] = useState<Comment[]>(jalon.commentaires || []);
  const [newComment, setNewComment] = useState('');

  // Calculs
  const joursRestants = jalon.date_prevue
    ? Math.ceil((new Date(jalon.date_prevue).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const calculerMeteo = useCallback((): MeteoJalon => {
    if (!jalon.date_prevue) return 'SOLEIL';
    if (joursRestants && joursRestants < 0) return 'ORAGEUX';
    if (joursRestants && joursRestants <= 7) return 'NUAGEUX';
    return 'SOLEIL';
  }, [jalon.date_prevue, joursRestants]);

  const meteo = calculerMeteo();

  // Handlers
  const handleStatutChange = (newStatut: StatutJalon) => {
    setStatut(newStatut);
    onStatutChange?.(newStatut);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([...comments, {
        id: crypto.randomUUID(),
        texte: newComment.trim(),
        auteur: isExternal ? (jalon.responsable || 'Externe') : 'Utilisateur',
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
    onSave?.({
      statut,
      preuve_url: preuveUrl,
      notes_mise_a_jour: notesMiseAJour,
      commentaires_externes: JSON.stringify(comments),
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Statut rapide */}
      <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
        <span className="text-sm font-medium text-neutral-600">Statut:</span>
        <div className="flex gap-1 flex-1 flex-wrap">
          {(Object.entries(STATUT_CONFIG) as [StatutJalon, typeof STATUT_CONFIG[StatutJalon]][]).map(([key, config]) => {
            const isActive = statut === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => isEditing && handleStatutChange(key)}
                disabled={!isEditing}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  isActive ? `${config.color} ring-2 ring-offset-1` : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Champs obligatoires (lecture seule) */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Informations du jalon
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <Target className="w-4 h-4 text-purple-600" />
              ID Jalon
            </Label>
            <div className="p-2 bg-white rounded border text-sm font-mono">{jalon.id_jalon || '-'}</div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              Axe
            </Label>
            <div className="p-2 bg-white rounded border text-sm">{jalon.axe ? AXE_LABELS[jalon.axe] : '-'}</div>
          </div>

          <div className="md:col-span-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              Libellé
            </Label>
            <div className="p-2 bg-white rounded border text-sm font-medium">{jalon.titre || '-'}</div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Échéance
            </Label>
            <div className="p-2 bg-white rounded border text-sm">
              {jalon.date_prevue ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR') : '-'}
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <User className="w-4 h-4 text-green-600" />
              Responsable
            </Label>
            <div className="p-2 bg-white rounded border text-sm">{jalon.responsable || '-'}</div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Cible</Label>
            <div className="p-2 bg-white rounded border text-sm">{jalon.description || '-'}</div>
          </div>
        </div>
      </div>

      {/* Indicateurs auto-calculés */}
      <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg text-sm">
        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <div className="flex items-center gap-1">
          <span className="text-neutral-500">Jours restants:</span>
          <span className={cn('font-semibold', joursRestants && joursRestants < 0 ? 'text-red-600' : joursRestants && joursRestants <= 7 ? 'text-orange-600' : 'text-green-600')}>
            {joursRestants !== null ? (joursRestants < 0 ? `${Math.abs(joursRestants)}j retard` : `${joursRestants}j`) : '-'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-neutral-500">Météo:</span>
          <MeteoIcon meteo={meteo} className="w-4 h-4" />
        </div>
      </div>

      {/* Preuve */}
      <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
        <h3 className="text-sm font-semibold text-cyan-800 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Preuve de réalisation
        </h3>
        {isEditing ? (
          <Input
            value={preuveUrl}
            onChange={(e) => setPreuveUrl(e.target.value)}
            placeholder="Lien vers le document justificatif..."
          />
        ) : (
          <div className="p-2 bg-white rounded border text-sm">
            {preuveUrl ? (
              <a href={preuveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {preuveUrl}
              </a>
            ) : '-'}
          </div>
        )}
      </div>

      {/* Notes de mise à jour (externe) */}
      {isExternal && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes de mise à jour
          </h3>
          <textarea
            value={notesMiseAJour}
            onChange={(e) => setNotesMiseAJour(e.target.value)}
            placeholder="Ajoutez vos notes, observations ou informations supplémentaires..."
            className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={!isEditing}
          />
        </div>
      )}

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
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
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

export default JalonFormContent;
