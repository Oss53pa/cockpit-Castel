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

// COCKPIT Fonts
const cockpitFonts = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&family=Grand+Hotel&display=swap');
`;

// COCKPIT Design tokens
const entityColors = {
  action: {
    gradient: 'from-indigo-600 via-purple-600 to-indigo-700',
    bg: 'bg-indigo-600',
    text: 'text-indigo-600',
    light: 'bg-indigo-50',
    border: 'border-indigo-200',
    ring: 'focus:ring-indigo-500',
  },
  jalon: {
    gradient: 'from-purple-600 via-indigo-600 to-purple-700',
    bg: 'bg-purple-600',
    text: 'text-purple-600',
    light: 'bg-purple-50',
    border: 'border-purple-200',
    ring: 'focus:ring-purple-500',
  },
  risque: {
    gradient: 'from-rose-600 via-red-600 to-rose-700',
    bg: 'bg-rose-600',
    text: 'text-rose-600',
    light: 'bg-rose-50',
    border: 'border-rose-200',
    ring: 'focus:ring-rose-500',
  },
};

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

  const getEntityTheme = () => {
    return entityColors[type as keyof typeof entityColors] || entityColors.action;
  };

  const getEntityIcon = () => {
    if (type === 'action') return <Target className="h-8 w-8" />;
    if (type === 'jalon') return <Calendar className="h-8 w-8" />;
    if (type === 'risque') return <AlertTriangle className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  const theme = getEntityTheme();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        <style>{cockpitFonts}</style>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-primary-800" style={{ fontFamily: "'Grand Hotel', cursive" }}>
            Cockpit
          </h2>
          <p className="text-primary-500 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        <style>{cockpitFonts}</style>
        <div className="max-w-md w-full bg-white rounded-xl border border-primary-200 shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-error-100 to-error-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle className="h-10 w-10 text-error-600" />
          </div>
          <h1 className="text-2xl font-bold text-primary-900 mb-3">Lien invalide</h1>
          <p className="text-primary-600 leading-relaxed">{error}</p>
          <div className="mt-6 pt-6 border-t border-primary-100">
            <p className="text-sm text-primary-400">
              Contactez l'équipe projet si vous pensez qu'il s'agit d'une erreur.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        <style>{cockpitFonts}</style>
        <div className="max-w-md w-full bg-white rounded-xl border border-primary-200 shadow-lg overflow-hidden">
          {/* Success header */}
          <div className="bg-gradient-to-r from-success-500 to-success-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mise à jour enregistrée!</h1>
          </div>

          {/* Success content */}
          <div className="p-6 text-center">
            <p className="text-primary-600 leading-relaxed mb-6">
              Vos modifications ont été sauvegardées avec succès. L'équipe projet a été notifiée.
            </p>
            <p className="text-sm text-primary-400">Vous pouvez fermer cette page.</p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-primary-50 border-t border-primary-100 text-center">
            <p className="text-xl text-indigo-600" style={{ fontFamily: "'Grand Hotel', cursive" }}>
              Cockpit
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-primary-50" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <style>{cockpitFonts}</style>

      {/* Header with COCKPIT design */}
      <header className={`bg-gradient-to-r ${theme.gradient} text-white`}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Top bar with logo */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl" style={{ fontFamily: "'Grand Hotel', cursive" }}>
              Cockpit
            </h1>
          </div>

          {/* Entity info */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
              {getEntityIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs uppercase tracking-wider font-medium mb-1">
                Mise à jour {type === 'action' ? "d'action" : type === 'jalon' ? 'de jalon' : 'de risque'}
              </p>
              <h2 className="text-xl font-bold truncate">{entity?.titre}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-white/80 text-sm">
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                  <User className="h-3.5 w-3.5" />
                  {link?.recipientName}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                  <Clock className="h-3.5 w-3.5" />
                  Expire le {new Date(link?.expiresAt || '').toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-5">
          {/* Status & Progress */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
            <div className={`px-5 py-3 ${theme.light} border-b ${theme.border}`}>
              <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                <Target className={`h-5 w-5 ${theme.text}`} />
                Statut et avancement
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Statut</label>
                  <select
                    value={formData.statut || ''}
                    onChange={e => setFormData({ ...formData, statut: e.target.value })}
                    className={`w-full px-4 py-2.5 border border-primary-200 rounded-lg bg-white focus:ring-2 ${theme.ring} focus:border-transparent transition-all text-primary-900`}
                  >
                    {getStatusOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {type === 'action' && (
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
                      Avancement
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.avancement || 0}
                        onChange={e => setFormData({ ...formData, avancement: parseInt(e.target.value) })}
                        className="flex-1 h-2 bg-primary-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className={`text-lg font-bold ${theme.text} min-w-[3rem] text-right`}>
                        {formData.avancement || 0}%
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 bg-primary-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-300`}
                        style={{ width: `${formData.avancement || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {type === 'risque' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1.5">
                        Probabilité (1-5)
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
                        className={`w-full px-4 py-2.5 border border-primary-200 rounded-lg bg-white focus:ring-2 ${theme.ring} focus:border-transparent transition-all text-primary-900`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1.5">
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
                        className={`w-full px-4 py-2.5 border border-primary-200 rounded-lg bg-white focus:ring-2 ${theme.ring} focus:border-transparent transition-all text-primary-900`}
                      />
                    </div>
                  </>
                )}
              </div>

              {type === 'risque' && (
                <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <span className="text-sm font-medium text-primary-600">Score de risque</span>
                  <span
                    className={`text-2xl font-bold px-4 py-1 rounded-lg ${
                      (formData.score || 0) >= 12
                        ? 'text-error-700 bg-error-100'
                        : (formData.score || 0) >= 6
                        ? 'text-warning-700 bg-warning-100'
                        : 'text-success-700 bg-success-100'
                    }`}
                  >
                    {formData.score || 0}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description/Notes */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
            <div className={`px-5 py-3 ${theme.light} border-b ${theme.border}`}>
              <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                <FileText className={`h-5 w-5 ${theme.text}`} />
                Notes de mise à jour
              </h3>
            </div>
            <div className="p-5">
              <textarea
                value={formData.notes_mise_a_jour || ''}
                onChange={e => setFormData({ ...formData, notes_mise_a_jour: e.target.value })}
                placeholder="Ajoutez vos notes, observations ou informations supplémentaires..."
                className={`w-full h-32 px-4 py-3 border border-primary-200 rounded-lg bg-white focus:ring-2 ${theme.ring} focus:border-transparent resize-none transition-all text-primary-900 placeholder:text-primary-400`}
              />
            </div>
          </div>

          {/* Documents & Links */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
            <div className={`px-5 py-3 ${theme.light} border-b ${theme.border} flex items-center justify-between`}>
              <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                <LinkIcon className={`h-5 w-5 ${theme.text}`} />
                Documents et liens
              </h3>
              <button
                onClick={() => setShowAddLink(true)}
                className={`flex items-center gap-1.5 text-sm font-medium ${theme.text} hover:opacity-80 transition-opacity`}
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>

            <div className="p-5">
              {showAddLink && (
                <div className="mb-4 p-4 bg-primary-50 rounded-xl border border-primary-100 space-y-3">
                  <input
                    type="text"
                    placeholder="Titre du lien"
                    value={linkTitle}
                    onChange={e => setLinkTitle(e.target.value)}
                    className={`w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm bg-white focus:ring-2 ${theme.ring} focus:border-transparent transition-all`}
                  />
                  <input
                    type="url"
                    placeholder="URL (https://...)"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    className={`w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm bg-white focus:ring-2 ${theme.ring} focus:border-transparent transition-all`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddLink}
                      disabled={!linkTitle || !linkUrl}
                      className={`px-4 py-2 bg-gradient-to-r ${theme.gradient} text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all`}
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => setShowAddLink(false)}
                      className="px-4 py-2 text-primary-600 text-sm font-medium hover:text-primary-800 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {newLinks.length === 0 ? (
                <div className="text-center py-8">
                  <LinkIcon className="h-10 w-10 text-primary-300 mx-auto mb-2" />
                  <p className="text-sm text-primary-500">Aucun document ou lien ajouté</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {newLinks.map(link => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-100 hover:border-primary-200 transition-colors"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-sm font-medium ${theme.text} hover:opacity-80 transition-opacity`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {link.title}
                      </a>
                      <button
                        onClick={() => handleRemoveLink(link.id)}
                        className="p-1.5 text-primary-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
            <div className={`px-5 py-3 ${theme.light} border-b ${theme.border}`}>
              <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                <MessageSquare className={`h-5 w-5 ${theme.text}`} />
                Commentaires
              </h3>
            </div>

            <div className="p-5">
              {comments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                      <p className="text-sm text-primary-800 leading-relaxed">{comment.text}</p>
                      <p className="text-xs text-primary-400 mt-2">
                        {new Date(comment.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter un commentaire..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                  className={`flex-1 px-4 py-2.5 border border-primary-200 rounded-lg text-sm bg-white focus:ring-2 ${theme.ring} focus:border-transparent transition-all placeholder:text-primary-400`}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className={`px-4 py-2.5 bg-gradient-to-r ${theme.gradient} text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 bg-gradient-to-r ${theme.gradient} hover:opacity-90 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl`}
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

          <div className="flex items-center justify-center gap-2 text-sm text-primary-500 bg-info-50 border border-info-200 rounded-xl px-4 py-3">
            <span className="text-info-700">Les modifications seront automatiquement synchronisées avec le Cockpit</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-primary-200 bg-white">
        <p className="text-2xl text-indigo-600 mb-2" style={{ fontFamily: "'Grand Hotel', cursive" }}>
          Cockpit
        </p>
        <p className="text-sm text-primary-500">Application de pilotage de projet</p>
      </footer>
    </div>
  );
}
