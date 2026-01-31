/**
 * External Update Page - Firebase Version
 *
 * Cette page est utilisée par les utilisateurs externes pour soumettre leurs mises à jour.
 * Elle lit et écrit directement dans Firebase, permettant la synchronisation temps réel.
 */

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
  Cloud,
  CloudOff,
} from 'lucide-react';
import {
  initRealtimeSync,
  getUpdateLinkFromFirebase,
  markLinkAccessedInFirebase,
  submitExternalResponse,
  type ExternalUpdateData,
} from '@/services/firebaseRealtimeSync';

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

interface DocumentLink {
  id: string;
  title: string;
  url: string;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export function ExternalUpdateFirebasePage() {
  const { type, token } = useParams<{ type: EntityType; token: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [linkData, setLinkData] = useState<ExternalUpdateData | null>(null);

  // Form state
  const [statut, setStatut] = useState('');
  const [avancement, setAvancement] = useState(0);
  const [probabilite, setProbabilite] = useState(1);
  const [impact, setImpact] = useState(1);
  const [notes, setNotes] = useState('');
  const [newLinks, setNewLinks] = useState<DocumentLink[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  // New link form
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Submitter info
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');

  useEffect(() => {
    loadData();
  }, [token, type]);

  const loadData = async () => {
    if (!token || !type) {
      setError('Lien invalide');
      setLoading(false);
      return;
    }

    try {
      // Initialize Firebase
      const initialized = await initRealtimeSync();
      setFirebaseConnected(initialized);

      if (!initialized) {
        setError('Impossible de se connecter au serveur. Veuillez réessayer plus tard.');
        setLoading(false);
        return;
      }

      // Get link data from Firebase
      const data = await getUpdateLinkFromFirebase(token);

      if (!data) {
        setError("Ce lien n'existe pas ou a été supprimé.");
        setLoading(false);
        return;
      }

      if (data.isExpired) {
        setError('Ce lien a expiré. Veuillez demander un nouveau lien.');
        setLoading(false);
        return;
      }

      if (data.entityType !== type) {
        setError("Type d'entité incorrect.");
        setLoading(false);
        return;
      }

      if (data.isUsed) {
        setError('Ce lien a déjà été utilisé. Une seule mise à jour est autorisée par lien.');
        setLoading(false);
        return;
      }

      setLinkData(data);

      // Mark as accessed
      await markLinkAccessedInFirebase(token);

      // Initialize form with entity data
      setStatut(data.entitySnapshot.statut || '');
      setAvancement(data.entitySnapshot.avancement || 0);
      setProbabilite(data.entitySnapshot.probabilite || 1);
      setImpact(data.entitySnapshot.impact || 1);
      setSubmitterName(data.recipientName);
      setSubmitterEmail(data.recipientEmail);

      setLoading(false);
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Erreur lors du chargement des données.');
      setLoading(false);
    }
  };

  const handleAddLink = () => {
    if (!linkTitle || !linkUrl) return;

    const newLink: DocumentLink = {
      id: Date.now().toString(),
      title: linkTitle,
      url: linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`,
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
    if (!linkData || !token) return;

    setSaving(true);

    try {
      const response: ExternalUpdateData['response'] = {
        submittedAt: new Date().toISOString(),
        submittedBy: {
          name: submitterName,
          email: submitterEmail,
        },
        changes: {
          statut,
          notes,
        },
        liens: newLinks,
        comments,
      };

      // Add type-specific changes
      if (type === 'action' || type === 'jalon') {
        response.changes.avancement = avancement;
      }

      if (type === 'risque') {
        response.changes.probabilite = probabilite;
        response.changes.impact = impact;
        response.changes.score = probabilite * impact;
      }

      // Submit to Firebase
      const success = await submitExternalResponse(token, response);

      if (!success) {
        throw new Error('Erreur lors de la soumission');
      }

      setSuccess(true);
    } catch (e) {
      console.error('Error saving:', e);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusOptions = () => {
    if (type === 'action') {
      return [
        { value: 'a_faire', label: 'À faire' },
        { value: 'en_cours', label: 'En cours' },
        { value: 'termine', label: 'Terminé' },
        { value: 'bloque', label: 'Bloqué' },
      ];
    } else if (type === 'jalon') {
      return [
        { value: 'a_venir', label: 'À venir' },
        { value: 'en_danger', label: 'En danger' },
        { value: 'atteint', label: 'Atteint' },
        { value: 'depasse', label: 'Dépassé' },
      ];
    } else if (type === 'risque') {
      return [
        { value: 'actif', label: 'Actif' },
        { value: 'en_surveillance', label: 'En surveillance' },
        { value: 'mitige', label: 'Mitigé' },
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
          <p className="text-primary-500 mt-2">Connexion au serveur...</p>
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
            <h1 className="text-2xl font-bold text-white">Mise à jour envoyée!</h1>
          </div>

          {/* Success content */}
          <div className="p-6 text-center">
            <p className="text-primary-600 leading-relaxed mb-6">
              Vos modifications ont été transmises avec succès. L'équipe projet sera notifiée automatiquement.
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-success-700 bg-success-50 border border-success-200 p-4 rounded-xl">
              <Cloud className="h-5 w-5" />
              <span className="font-medium">Synchronisation temps réel activée</span>
            </div>

            <p className="text-sm text-primary-400 mt-6">Vous pouvez fermer cette page.</p>
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
            {firebaseConnected && (
              <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
                <Cloud className="h-3.5 w-3.5" />
                Temps réel
              </span>
            )}
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
              <h2 className="text-xl font-bold truncate">{linkData?.entitySnapshot.titre}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-white/80 text-sm">
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                  <User className="h-3.5 w-3.5" />
                  {linkData?.recipientName}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                  <Clock className="h-3.5 w-3.5" />
                  Expire le {new Date(linkData?.expiresAt || '').toLocaleDateString('fr-FR')}
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
                    value={statut}
                    onChange={e => setStatut(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-primary-200 rounded-lg bg-white focus:ring-2 ${theme.ring} focus:border-transparent transition-all text-primary-900`}
                  >
                    {getStatusOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(type === 'action' || type === 'jalon') && (
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
                      Avancement
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={avancement}
                        onChange={e => setAvancement(parseInt(e.target.value) || 0)}
                        className="flex-1 h-2 bg-primary-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className={`text-lg font-bold ${theme.text} min-w-[3rem] text-right`}>
                        {avancement}%
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 bg-primary-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-300`}
                        style={{ width: `${avancement}%` }}
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
                        value={probabilite}
                        onChange={e => setProbabilite(parseInt(e.target.value) || 1)}
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
                        value={impact}
                        onChange={e => setImpact(parseInt(e.target.value) || 1)}
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
                      probabilite * impact >= 12
                        ? 'text-error-700 bg-error-100'
                        : probabilite * impact >= 6
                        ? 'text-warning-700 bg-warning-100'
                        : 'text-success-700 bg-success-100'
                    }`}
                  >
                    {probabilite * impact}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
            <div className={`px-5 py-3 ${theme.light} border-b ${theme.border}`}>
              <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                <FileText className={`h-5 w-5 ${theme.text}`} />
                Notes de mise à jour
              </h3>
            </div>
            <div className="p-5">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
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

          {/* Submitter Info */}
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
            <div className={`px-5 py-3 ${theme.light} border-b ${theme.border}`}>
              <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                <User className={`h-5 w-5 ${theme.text}`} />
                Vos informations
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Votre nom</label>
                  <input
                    type="text"
                    value={submitterName}
                    onChange={e => setSubmitterName(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-primary-200 rounded-lg bg-primary-50 focus:bg-white focus:ring-2 ${theme.ring} focus:border-transparent transition-all text-primary-900`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Votre email</label>
                  <input
                    type="email"
                    value={submitterEmail}
                    onChange={e => setSubmitterEmail(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-primary-200 rounded-lg bg-primary-50 focus:bg-white focus:ring-2 ${theme.ring} focus:border-transparent transition-all text-primary-900`}
                  />
                </div>
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
                Envoi en cours...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Envoyer la mise à jour
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-sm text-primary-500 bg-success-50 border border-success-200 rounded-xl px-4 py-3">
            <Cloud className="h-4 w-4 text-success-600" />
            <span className="text-success-700">Les modifications seront synchronisées en temps réel</span>
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
