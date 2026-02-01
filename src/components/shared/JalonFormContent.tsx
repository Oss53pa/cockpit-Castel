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
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Badge,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks';
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
  // Champs éditables en interne uniquement
  titre?: string;
  description?: string;
  date_prevue?: string;
  responsable?: string;
  // Champs éditables en interne ET externe
  preuve_url?: string;
  notes_mise_a_jour?: string;
  commentaires_externes?: string;
  date_validation?: string | null;
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
  // Champs éditables en interne uniquement
  const canEditInternal = isEditing && !isExternal;
  const users = useUsers();
  const [titre, setTitre] = useState(jalon.titre || '');
  const [description, setDescription] = useState(jalon.description || '');
  const [datePrevue, setDatePrevue] = useState(jalon.date_prevue || '');
  const [responsable, setResponsable] = useState(jalon.responsable || '');

  // Champs éditables en interne ET externe
  const [dateValidation, setDateValidation] = useState<string | null>((jalon as any).date_validation || null);
  const [preuveUrl, setPreuveUrl] = useState(jalon.preuve_url || '');
  const [notesMiseAJour, setNotesMiseAJour] = useState((jalon as any).notes_mise_a_jour || '');
  const [comments, setComments] = useState<Comment[]>(() => {
    // Priorité: commentaires_externes (sync Firebase) > commentaires existants
    const externesStr = (jalon as any).commentaires_externes;
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
        console.warn('Erreur parsing commentaires_externes jalon:', e);
      }
    }
    return jalon.commentaires?.map((c: any) => ({
      id: c.id || crypto.randomUUID(),
      texte: c.texte,
      auteur: c.auteur,
      date: c.date,
    })) || [];
  });
  const [newComment, setNewComment] = useState('');

  // Calculs
  const joursRestants = jalon.date_prevue
    ? Math.ceil((new Date(jalon.date_prevue).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Calcul automatique du statut
  const calculerStatutAuto = useCallback((): StatutJalon => {
    // Si validé → atteint
    if (dateValidation) return 'atteint';

    if (!jalon.date_prevue) return 'a_venir';

    const now = new Date();
    const echeance = new Date(jalon.date_prevue);

    // Si échéance dépassée → dépassé
    if (echeance < now) return 'depasse';

    // Si proche de l'échéance (< 7 jours) → en danger
    if (joursRestants !== null && joursRestants <= 7) return 'en_danger';

    // Sinon → à venir
    return 'a_venir';
  }, [jalon.date_prevue, joursRestants, dateValidation]);

  const statut = calculerStatutAuto();

  const calculerMeteo = useCallback((): MeteoJalon => {
    if (!jalon.date_prevue) return 'SOLEIL';
    if (joursRestants && joursRestants < 0) return 'ORAGEUX';
    if (joursRestants && joursRestants <= 7) return 'NUAGEUX';
    return 'SOLEIL';
  }, [jalon.date_prevue, joursRestants]);

  const meteo = calculerMeteo();

  // Notifier les changements de statut
  useEffect(() => {
    onStatutChange?.(statut);
  }, [statut]);

  // Handler validation
  const handleValiderJalon = () => {
    if (dateValidation) {
      // Annuler la validation
      setDateValidation(null);
    } else {
      // Valider le jalon
      setDateValidation(new Date().toISOString());
    }
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
      // Champs internes (seulement si édition interne)
      ...(canEditInternal && {
        titre,
        description,
        date_prevue: datePrevue,
        responsable,
      }),
      // Champs communs (interne + externe)
      preuve_url: preuveUrl,
      notes_mise_a_jour: notesMiseAJour,
      commentaires_externes: JSON.stringify(comments),
      date_validation: dateValidation,
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Statut auto-calculé + Validation */}
      <div className="p-4 bg-neutral-50 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-600">Statut:</span>
            <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${STATUT_CONFIG[statut].color}`}>
              {STATUT_CONFIG[statut].label}
            </div>
            <span className="text-xs text-neutral-400 italic">(auto-calculé)</span>
          </div>

          {/* Bouton Valider/Invalider */}
          {isEditing && (
            <Button
              type="button"
              variant={dateValidation ? 'outline' : 'default'}
              size="sm"
              onClick={handleValiderJalon}
              className={dateValidation ? 'border-orange-300 text-orange-600 hover:bg-orange-50' : 'bg-green-600 hover:bg-green-700'}
            >
              {dateValidation ? (
                <>
                  <XCircle className="w-4 h-4 mr-1" />
                  Annuler validation
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Valider le jalon
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info validation */}
        {dateValidation && (
          <div className="flex items-center gap-2 p-2 bg-green-100 rounded-lg text-sm text-green-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>Jalon validé le {new Date(dateValidation).toLocaleDateString('fr-FR')}</span>
          </div>
        )}

        {/* Explication du statut */}
        <p className="text-xs text-neutral-500">
          {statut === 'atteint' && 'Le jalon a été validé.'}
          {statut === 'depasse' && 'L\'échéance est dépassée. Validez le jalon une fois atteint.'}
          {statut === 'en_danger' && 'L\'échéance approche (< 7 jours).'}
          {statut === 'a_venir' && 'Le jalon est planifié pour une date future.'}
        </p>
      </div>

      {/* Informations du jalon */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Informations du jalon
          {isExternal && <span className="text-xs font-normal text-purple-500">(lecture seule)</span>}
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
            {canEditInternal ? (
              <Input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Titre du jalon..."
                className="bg-white"
              />
            ) : (
              <div className="p-2 bg-white rounded border text-sm font-medium">{titre || '-'}</div>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Échéance
            </Label>
            {canEditInternal ? (
              <Input
                type="date"
                value={datePrevue}
                onChange={(e) => setDatePrevue(e.target.value)}
                className="bg-white"
              />
            ) : (
              <div className="p-2 bg-white rounded border text-sm">
                {datePrevue ? new Date(datePrevue).toLocaleDateString('fr-FR') : '-'}
              </div>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <User className="w-4 h-4 text-green-600" />
              Responsable
            </Label>
            {canEditInternal ? (
              <select
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="">Sélectionner un responsable...</option>
                {users.map((user) => (
                  <option key={user.id} value={`${user.prenom} ${user.nom}`}>
                    {user.prenom} {user.nom} {user.role ? `(${user.role})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2 bg-white rounded border text-sm">{responsable || '-'}</div>
            )}
          </div>

          <div className="md:col-span-2">
            <Label className="text-sm font-medium mb-1.5 block">Description / Cible</Label>
            {canEditInternal ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du jalon..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
              />
            ) : (
              <div className="p-2 bg-white rounded border text-sm">{description || '-'}</div>
            )}
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

      {/* Notes de mise à jour */}
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
