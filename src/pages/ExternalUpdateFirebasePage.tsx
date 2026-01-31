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

// Grand Hotel font
const grandHotelStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap');
`;

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
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Connexion au serveur...</p>
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
            <AlertCircle className="h-8 w-8 text-red-600" />
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
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Mise à jour envoyée!</h1>
          <p className="text-gray-600 mb-4">
            Vos modifications ont été transmises avec succès. L'équipe projet sera notifiée
            automatiquement.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <Cloud className="h-4 w-4" />
            <span>Synchronisation temps réel activée</span>
          </div>
          <p className="text-sm text-gray-500 mt-4">Vous pouvez fermer cette page.</p>
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
            <div className="p-3 bg-white/20 rounded-xl">{getEntityIcon()}</div>
            <div>
              <p className="text-white/80 text-sm uppercase tracking-wider">
                Mise à jour{' '}
                {type === 'action' ? "d'action" : type === 'jalon' ? 'de jalon' : 'de risque'}
              </p>
              <h1 className="text-3xl" style={{ fontFamily: "'Grand Hotel', cursive" }}>
                COSMOS ANGRE
              </h1>
            </div>
          </div>
          <h2 className="text-xl font-semibold">{linkData?.entitySnapshot.titre}</h2>
          <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {linkData?.recipientName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Expire le {new Date(linkData?.expiresAt || '').toLocaleDateString('fr-FR')}
            </span>
            {firebaseConnected && (
              <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                <Cloud className="h-3 w-3" />
                Temps réel
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Status & Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Statut et avancement
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={statut}
                  onChange={e => setStatut(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avancement (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={avancement}
                    onChange={e => setAvancement(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${avancement}%` }}
                    />
                  </div>
                </div>
              )}

              {type === 'risque' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Probabilité (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={probabilite}
                      onChange={e => setProbabilite(parseInt(e.target.value) || 1)}
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
                      value={impact}
                      onChange={e => setImpact(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            {type === 'risque' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Score actuel:{' '}
                  <span
                    className={`font-bold ${
                      probabilite * impact >= 12
                        ? 'text-red-600'
                        : probabilite * impact >= 6
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {probabilite * impact}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Notes de mise à jour
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ajoutez vos notes, observations ou informations supplémentaires..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Documents & Links */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-indigo-600" />
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
              <p className="text-sm text-gray-500 text-center py-4">Aucun document ou lien ajouté</p>
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
              <MessageSquare className="h-5 w-5 text-indigo-600" />
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

          {/* Submitter Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Vos informations
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Votre nom</label>
                <input
                  type="text"
                  value={submitterName}
                  onChange={e => setSubmitterName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Votre email</label>
                <input
                  type="email"
                  value={submitterEmail}
                  onChange={e => setSubmitterEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
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
                Envoi en cours...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Envoyer la mise à jour
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Cloud className="h-4 w-4 text-green-500" />
            <span>Les modifications seront synchronisées en temps réel</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 border-t bg-white">
        <p className="text-xl text-indigo-600 mb-1" style={{ fontFamily: "'Grand Hotel', cursive" }}>
          COSMOS ANGRE Cockpit
        </p>
        <p>Application de pilotage de projet</p>
      </footer>
    </div>
  );
}
