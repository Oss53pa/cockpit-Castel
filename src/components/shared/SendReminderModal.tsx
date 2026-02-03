import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button, Input, Badge, Textarea } from '@/components/ui';
import {
  sendReminderEmail,
  getEmailConfig,
  isEmailConfigured,
  getUpdateLinkUrl,
  getTemplateByType,
} from '@/services/emailService';
import { useUsers } from '@/hooks';
import type { UpdateLink } from '@/db';

interface ReminderEntity {
  titre: string;
  statut: string;
  avancement?: number;
  date_fin_prevue?: string;
  date_prevue?: string;
  livrables?: string;
  categorie?: string;
  score?: number;
  probabilite?: number;
  impact?: number;
}

interface ReminderResult {
  link: UpdateLink;
  emailResult: { success: boolean; messageId?: string };
}

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'action' | 'jalon' | 'risque';
  entityId: number;
  entity: ReminderEntity;
  defaultRecipientId?: number;
}

export function SendReminderModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entity,
  defaultRecipientId,
}: SendReminderModalProps) {
  const users = useUsers();
  const config = getEmailConfig();

  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState(config.defaultLinkDuration);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ReminderResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Auto-fill from default recipient
  useEffect(() => {
    if (defaultRecipientId && users.length > 0) {
      const user = users.find(u => u.id === defaultRecipientId);
      if (user) {
        setRecipientEmail(user.email || '');
        setRecipientName(`${user.prenom} ${user.nom}`);
      }
    }
  }, [defaultRecipientId, users]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setShowPreview(false);
      setNote('');
    }
  }, [isOpen]);

  // Generate preview
  const generatePreview = async () => {
    const template = await getTemplateByType(entityType);
    if (!template) {
      setPreviewHtml('<p>Aucun template disponible</p>');
      return;
    }

    let html = template.bodyHtml;
    const expirationDate = new Date(Date.now() + duration * 60 * 60 * 1000);

    const replacements: Record<string, string> = {
      recipient_name: recipientName || '[Nom du destinataire]',
      update_link: '#preview-link',
      expiration_date: expirationDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      note: note || '',
    };

    if (entityType === 'action') {
      replacements.action_titre = entity.titre || '[Titre action]';
      replacements.action_statut = entity.statut || '[Statut]';
      replacements.action_avancement = String(entity.avancement || 0);
      replacements.action_date_fin = entity.date_fin_prevue || '[Date]';
    } else if (entityType === 'jalon') {
      replacements.jalon_titre = entity.titre || '[Titre jalon]';
      replacements.jalon_statut = entity.statut || '[Statut]';
      replacements.jalon_date = entity.date_prevue || '[Date]';
      replacements.jalon_livrables = entity.livrables || '[Livrables]';
    } else if (entityType === 'risque') {
      replacements.risque_titre = entity.titre || '[Titre risque]';
      replacements.risque_categorie = entity.categorie || '[Catégorie]';
      replacements.risque_score = String(entity.score || 0);
      replacements.risque_probabilite = String(entity.probabilite || 0);
      replacements.risque_impact = String(entity.impact || 0);
      replacements.risque_score_class = entity.score >= 12 ? 'score-high' : entity.score >= 6 ? 'score-medium' : 'score-low';
    }

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    }

    setPreviewHtml(html);
  };

  const handleTogglePreview = async () => {
    if (!showPreview) {
      await generatePreview();
    }
    setShowPreview(!showPreview);
  };

  const handleSelectUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setRecipientEmail(user.email || '');
      setRecipientName(`${user.prenom} ${user.nom}`);
    }
  };

  const handleSend = async () => {
    if (!recipientEmail || !recipientName) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!isEmailConfigured()) {
      setError('La configuration email n\'est pas complete. Allez dans Parametres > Emails.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const result = await sendReminderEmail(
        entityType,
        entityId,
        entity,
        recipientEmail,
        recipientName,
        duration,
        note
      );
      setSuccess(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = () => {
    if (success?.link) {
      const url = getUpdateLinkUrl(success.link.token, entityType);
      navigator.clipboard.writeText(url);
      alert('Lien copie dans le presse-papier!');
    }
  };

  if (!isOpen) return null;

  const entityLabel = entityType === 'action' ? 'l\'action' : entityType === 'jalon' ? 'le jalon' : 'le risque';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Mail className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900">Envoyer une relance</h3>
              <p className="text-sm text-primary-500">Pour {entityLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {success ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-success-600" />
                </div>
                <h4 className="font-semibold text-primary-900 mb-1">Email envoye!</h4>
                <p className="text-sm text-primary-500">
                  Un email de relance a ete envoye a {recipientName}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-500">Destinataire:</span>
                  <span className="font-medium">{recipientEmail}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-500">Expire le:</span>
                  <span className="font-medium">
                    {new Date(success.link.expiresAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le lien
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Entity info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-primary-900">{entity.titre}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={
                    entityType === 'action' ? 'info' :
                    entityType === 'jalon' ? 'success' : 'error'
                  }>
                    {entityType}
                  </Badge>
                  <span className="text-xs text-primary-500">
                    Statut: {entity.statut}
                  </span>
                </div>
              </div>

              {/* Quick select user */}
              {users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Selectionner un membre
                  </label>
                  <select
                    onChange={e => handleSelectUser(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    defaultValue=""
                  >
                    <option value="">-- Choisir --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.prenom} {user.nom} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipient name */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Nom du destinataire
                </label>
                <Input
                  placeholder="Jean Dupont"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                />
              </div>

              {/* Recipient email */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Email du destinataire
                </label>
                <Input
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Duree de validite du lien
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="720"
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-primary-500">
                    heures ({Math.round(duration / 24)} jours)
                  </span>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Note personnalisée (optionnel)
                </label>
                <Textarea
                  placeholder="Ajouter un message personnalisé pour le destinataire..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-error-50 text-error-700 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Warning if not configured */}
              {!isEmailConfigured() && (
                <div className="flex items-center gap-2 p-3 bg-warning-50 text-warning-700 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  Configuration email incomplete. L'email sera simule.
                </div>
              )}

              {/* Preview button */}
              <div>
                <Button
                  variant="secondary"
                  onClick={handleTogglePreview}
                  className="w-full"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Masquer la previsualisation
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Previsualiser le template
                    </>
                  )}
                </Button>
              </div>

              {/* Preview panel */}
              {showPreview && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 border-b">
                    Apercu de l'email
                  </div>
                  <div className="max-h-80 overflow-auto bg-white">
                    <iframe
                      srcDoc={previewHtml}
                      title="Email Preview"
                      className="w-full h-80 border-0"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSend} disabled={sending} className="flex-1">
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer la relance
                    </>
                  )}
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
