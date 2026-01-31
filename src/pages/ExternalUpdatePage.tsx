import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  Save,
  Loader2,
  Calendar,
  Target,
  AlertTriangle,
  User,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { db } from '@/db';
import { getUpdateLink, markLinkAccessed, markLinkUpdated } from '@/services/emailService';
import { saveExternalUpdate, type FirebaseUpdateLink } from '@/services/firebase';
import type { UpdateLink } from '@/db';
import type { Action, Jalon, Risque } from '@/types';

// Grand Hotel font
const grandHotelStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap');
`;

type EntityType = 'action' | 'jalon' | 'risque';

// Extended entity type for external updates with dynamic fields
interface ExternalUpdateFields {
  liens_documents?: string;
  commentaires_externes?: string;
  notes_mise_a_jour?: string;
  derniere_mise_a_jour_externe?: string;
}

type ExtendedEntity = (Action | Jalon | Risque) & ExternalUpdateFields;

interface FormDataType extends ExternalUpdateFields {
  statut?: string;
  avancement?: number;
  probabilite?: number;
  impact?: number;
  score?: number;
}

interface DocumentLink {
  id: string;
  title: string;
  url: string;
  type: 'link' | 'document';
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export function ExternalUpdatePage() {
  const { type, token } = useParams<{ type: EntityType; token: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [link, setLink] = useState<(UpdateLink & { entityData?: FirebaseUpdateLink['entityData'] }) | null>(null);
  const [entity, setEntity] = useState<ExtendedEntity | null>(null);
  const [isFirebaseMode, setIsFirebaseMode] = useState(false); // Mode Firebase (données depuis le cloud)

  // Form state
  const [formData, setFormData] = useState<FormDataType>({});
  const [newLinks, setNewLinks] = useState<DocumentLink[]>([]);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  // New link form
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, type]);

  const loadData = async () => {
    if (!token || !type) {
      setError('Lien invalide');
      setLoading(false);
      return;
    }

    try {
      // Verify link
      const updateLink = await getUpdateLink(token);

      if (!updateLink) {
        setError('Ce lien n\'existe pas ou a ete supprime.');
        setLoading(false);
        return;
      }

      if (updateLink.isExpired) {
        setError('Ce lien a expire. Veuillez demander un nouveau lien.');
        setLoading(false);
        return;
      }

      if (updateLink.entityType !== type) {
        setError('Type d\'entite incorrect.');
        setLoading(false);
        return;
      }

      setLink(updateLink);

      // Mark as accessed
      await markLinkAccessed(token);

      // Load entity - d'abord essayer IndexedDB local, sinon utiliser les données Firebase
      let entityData: ExtendedEntity | undefined = undefined;

      if (type === 'action') {
        entityData = await db.actions.get(updateLink.entityId);
      } else if (type === 'jalon') {
        entityData = await db.jalons.get(updateLink.entityId);
      } else if (type === 'risque') {
        entityData = await db.risques.get(updateLink.entityId);
      }

      // Si entité non trouvée localement, utiliser les données Firebase
      if (!entityData && updateLink.entityData) {
        console.log('Utilisation des données Firebase pour afficher le formulaire');
        setIsFirebaseMode(true);

        // Créer une entité virtuelle depuis les données Firebase
        entityData = {
          id: updateLink.entityId,
          titre: updateLink.entityData.titre || 'Sans titre',
          statut: updateLink.entityData.statut || '',
          date_prevue: updateLink.entityData.date_prevue,
          date_fin_prevue: updateLink.entityData.date_fin_prevue,
          avancement: updateLink.entityData.avancement,
          categorie: updateLink.entityData.categorie,
          score: updateLink.entityData.score,
          probabilite: updateLink.entityData.probabilite,
          impact: updateLink.entityData.impact,
        } as ExtendedEntity;
      }

      if (!entityData) {
        setError('Entite non trouvee. Les donnees n\'ont pas pu etre chargees.');
        setLoading(false);
        return;
      }

      setEntity(entityData);
      setFormData(entityData as FormDataType);

      // Load existing comments/links from entity if any
      if (entityData.liens_documents) {
        try {
          setNewLinks(JSON.parse(entityData.liens_documents));
        } catch {
          setNewLinks([]);
        }
      }

      if (entityData.commentaires_externes) {
        try {
          setComments(JSON.parse(entityData.commentaires_externes));
        } catch {
          setComments([]);
        }
      }

      setLoading(false);
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Erreur lors du chargement des donnees.');
      setLoading(false);
    }
  };

  const handleAddLink = () => {
    if (!linkTitle || !linkUrl) return;

    const newLink: DocumentLink = {
      id: Date.now().toString(),
      title: linkTitle,
      url: linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`,
      type: 'link',
    };

    setNewLinks([...newLinks, newLink]);
    setLinkTitle('');
    setLinkUrl('');
    setShowAddLink(false);
  };

  const handleRemoveLink = (id: string) => {
    setNewLinks(newLinks.filter(l => l.id !== id));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleSave = async () => {
    if (!link || !type) return;

    setSaving(true);

    try {
      const updateData = {
        ...formData,
        liens_documents: JSON.stringify(newLinks),
        commentaires_externes: JSON.stringify(comments),
        updated_at: new Date().toISOString(),
        derniere_mise_a_jour_externe: new Date().toISOString(),
      };

      // TOUJOURS sauvegarder dans Firebase pour synchronisation
      await saveExternalUpdate({
        token: token!,
        entityType: type,
        entityId: link.entityId,
        recipientEmail: link.recipientEmail,
        recipientName: link.recipientName,
        createdAt: new Date().toISOString(),
        updates: {
          statut: formData.statut,
          avancement: formData.avancement,
          probabilite: formData.probabilite,
          impact: formData.impact,
          score: formData.score,
          notes_mise_a_jour: formData.notes_mise_a_jour,
          liens_documents: JSON.stringify(newLinks),
          commentaires_externes: JSON.stringify(comments),
        },
        isSynced: false,
      });

      console.log('Mise à jour sauvegardée dans Firebase');

      // Si on a accès à IndexedDB local, mettre aussi à jour localement
      if (!isFirebaseMode) {
        if (type === 'action') {
          await db.actions.update(link.entityId, updateData);
        } else if (type === 'jalon') {
          await db.jalons.update(link.entityId, updateData);
        } else if (type === 'risque') {
          await db.risques.update(link.entityId, updateData);
        }

        // Add to history
        await db.historique.add({
          timestamp: new Date().toISOString(),
          entiteType: type,
          entiteId: link.entityId,
          champModifie: 'update_externe',
          ancienneValeur: '',
          nouvelleValeur: `Mise a jour externe par ${link.recipientName} (${link.recipientEmail})`,
          auteurId: 0,
        });

        // Create an alert notification for the team
        const entityTypeLabel = type === 'action' ? 'Action' : type === 'jalon' ? 'Jalon' : 'Risque';
        await db.alertes.add({
          type: 'info' as const,
          titre: `Mise a jour recue de ${link.recipientName}`,
          message: `${entityTypeLabel} "${entity?.titre}" a ete mis(e) a jour par ${link.recipientName} (${link.recipientEmail}). Statut: ${formData.statut || 'N/A'}${type === 'action' ? `, Avancement: ${formData.avancement || 0}%` : ''}`,
          criticite: 'medium',
          entiteType: type,
          entiteId: link.entityId,
          lu: false,
          traitee: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Mark link as updated
      await markLinkUpdated(token!);

      setSuccess(true);
    } catch (e) {
      console.error('Error saving:', e);
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusOptions = () => {
    if (type === 'action') {
      return [
        { value: 'a_faire', label: 'A faire' },
        { value: 'en_cours', label: 'En cours' },
        { value: 'termine', label: 'Termine' },
        { value: 'bloque', label: 'Bloque' },
      ];
    } else if (type === 'jalon') {
      return [
        { value: 'a_venir', label: 'A venir' },
        { value: 'en_danger', label: 'En danger' },
        { value: 'atteint', label: 'Atteint' },
        { value: 'depasse', label: 'Depasse' },
      ];
    } else if (type === 'risque') {
      return [
        { value: 'actif', label: 'Actif' },
        { value: 'en_surveillance', label: 'En surveillance' },
        { value: 'mitige', label: 'Mitige' },
        { value: 'clos', label: 'Clos' },
      ];
    }
    return [];
  };

  const getEntityColor = () => {
    if (type === 'action') return 'from-indigo-600 to-purple-700';
    if (type === 'jalon') return 'from-emerald-600 to-teal-700';
    if (type === 'risque') return 'from-red-600 to-rose-700';
    return 'from-gray-600 to-gray-700';
  };

  const getEntityIcon = () => {
    if (type === 'action') return <Target className="h-8 w-8" />;
    if (type === 'jalon') return <Calendar className="h-8 w-8" />;
    if (type === 'risque') return <AlertTriangle className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <style>{grandHotelStyle}</style>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <style>{grandHotelStyle}</style>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <style>{grandHotelStyle}</style>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Mise a jour enregistree!</h1>
          <p className="text-gray-600 mb-4">
            Vos modifications ont ete sauvegardees avec succes. L'equipe projet a ete notifiee.
          </p>
          <p className="text-sm text-gray-500">
            Vous pouvez fermer cette page.
          </p>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{grandHotelStyle}</style>

      {/* Header */}
      <header className={`bg-gradient-to-r ${getEntityColor()} text-white py-8`}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              {getEntityIcon()}
            </div>
            <div>
              <p className="text-white/80 text-sm uppercase tracking-wider">
                Mise a jour {type === 'action' ? "d'action" : type === 'jalon' ? 'de jalon' : 'de risque'}
              </p>
              <h1
                className="text-3xl"
                style={{ fontFamily: "'Grand Hotel', cursive" }}
              >
                COSMOS ANGRE
              </h1>
            </div>
          </div>
          <h2 className="text-xl font-semibold">{entity?.titre}</h2>
          <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {link?.recipientName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Expire le {new Date(link?.expiresAt || '').toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Status & Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary-600" />
              Statut et avancement
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={formData.statut || ''}
                  onChange={e => setFormData({ ...formData, statut: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {getStatusOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {type === 'action' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avancement (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.avancement || 0}
                    onChange={e => setFormData({ ...formData, avancement: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${formData.avancement || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {type === 'risque' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Probabilite (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.probabilite || 1}
                      onChange={e => setFormData({
                        ...formData,
                        probabilite: parseInt(e.target.value),
                        score: parseInt(e.target.value) * (formData.impact || 1)
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impact (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.impact || 1}
                      onChange={e => setFormData({
                        ...formData,
                        impact: parseInt(e.target.value),
                        score: (formData.probabilite || 1) * parseInt(e.target.value)
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            {type === 'risque' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Score actuel: <span className={`font-bold ${
                    (formData.score || 0) >= 12 ? 'text-red-600' :
                    (formData.score || 0) >= 6 ? 'text-orange-600' : 'text-green-600'
                  }`}>{formData.score || 0}</span>
                </p>
              </div>
            )}
          </div>

          {/* Description/Notes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              Notes de mise a jour
            </h3>
            <textarea
              value={formData.notes_mise_a_jour || ''}
              onChange={e => setFormData({ ...formData, notes_mise_a_jour: e.target.value })}
              placeholder="Ajoutez vos notes, observations ou informations supplementaires..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Documents & Links */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary-600" />
                Documents et liens
              </h3>
              <button
                onClick={() => setShowAddLink(true)}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>

            {showAddLink && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <input
                  type="text"
                  placeholder="Titre du lien"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="url"
                  placeholder="URL (https://...)"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddLink}
                    disabled={!linkTitle || !linkUrl}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => setShowAddLink(false)}
                    className="px-3 py-1.5 text-gray-600 text-sm hover:text-gray-800"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {newLinks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucun document ou lien ajoute
              </p>
            ) : (
              <div className="space-y-2">
                {newLinks.map(link => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {link.title}
                    </a>
                    <button
                      onClick={() => handleRemoveLink(link.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-600" />
              Commentaires
            </h3>

            <div className="space-y-3 mb-4">
              {comments.map(comment => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800">{comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(comment.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ajouter un commentaire..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 bg-gradient-to-r ${getEntityColor()} hover:opacity-90 transition-opacity disabled:opacity-50`}
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sauvegarde en cours...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Sauvegarder les modifications
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Les modifications seront automatiquement synchronisees avec le Cockpit COSMOS ANGRE
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 border-t bg-white">
        <p
          className="text-xl text-indigo-600 mb-1"
          style={{ fontFamily: "'Grand Hotel', cursive" }}
        >
          COSMOS ANGRE Cockpit
        </p>
        <p>Application de pilotage de projet</p>
      </footer>
    </div>
  );
}
