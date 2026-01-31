import { useState, useEffect } from 'react';
import {
  Mail,
  Server,
  Save,
  RefreshCw,
  Send,
  FileText,
  Bell,
  Check,
  X,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit,
  Plus,
  AlertCircle,
  CheckCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { Card, Button, Input, Badge } from '@/components/ui';
import {
  getEmailConfig,
  saveEmailConfig,
  isEmailConfigured,
  getEmailTemplates,
  saveEmailTemplate,
  deleteEmailTemplate,
  initDefaultTemplates,
  cleanupDuplicateTemplates,
  resetDefaultTemplates,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAllUpdateLinks,
  deleteUpdateLink,
  type EmailConfig,
} from '@/services/emailService';
import type { EmailTemplate, UpdateLink, EmailNotification } from '@/db';

type TabType = 'config' | 'templates' | 'links' | 'notifications';

export function EmailSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [config, setConfig] = useState<EmailConfig>(getEmailConfig());
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [links, setLinks] = useState<UpdateLink[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    await initDefaultTemplates();
    // Clean up any duplicate templates
    await cleanupDuplicateTemplates();
    setTemplates(await getEmailTemplates());
    setLinks(await getAllUpdateLinks());
    setNotifications(await getNotifications());
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      saveEmailConfig(config);
      await new Promise(r => setTimeout(r, 500));
      alert('Configuration sauvegardee!');
    } catch {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      // Simulate connection test
      await new Promise(r => setTimeout(r, 1500));
      alert('Connexion reussie! (simulation)');
    } catch {
      alert('Echec de la connexion');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm('Supprimer ce template?')) {
      await deleteEmailTemplate(id);
      setTemplates(await getEmailTemplates());
    }
  };

  const handleResetTemplates = async () => {
    if (confirm('Reinitialiser tous les templates par defaut? Les templates personnalises ne seront pas affectes.')) {
      await resetDefaultTemplates();
      setTemplates(await getEmailTemplates());
      alert('Templates reinitialises avec succes!');
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    await saveEmailTemplate(editingTemplate);
    setTemplates(await getEmailTemplates());
    setEditingTemplate(null);
  };

  const handleDeleteLink = async (id: number) => {
    if (confirm('Supprimer ce lien?')) {
      await deleteUpdateLink(id);
      setLinks(await getAllUpdateLinks());
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(await getNotifications());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copie dans le presse-papier!');
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'config', label: 'Configuration', icon: Server },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'links', label: 'Liens actifs', icon: LinkIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{tab.label}</span>
            {tab.id === 'notifications' && unreadCount > 0 && (
              <Badge variant="error\" className="text-xs">{unreadCount}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Status */}
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isEmailConfigured() ? 'bg-success-100' : 'bg-warning-100'}`}>
                  <Mail className={`h-5 w-5 ${isEmailConfigured() ? 'text-success-600' : 'text-warning-600'}`} />
                </div>
                <div>
                  <h4 className="font-medium text-primary-900">Statut de la configuration</h4>
                  <p className="text-sm text-primary-500">
                    {isEmailConfigured() ? 'Email configure et pret' : 'Configuration incomplete'}
                  </p>
                </div>
              </div>
              {isEmailConfigured() && (
                <Badge variant="success">Active</Badge>
              )}
            </div>
          </Card>

          {/* Provider Selection */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Fournisseur d'email</h3>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'emailjs', label: 'EmailJS', desc: 'Cote client (Recommande)' },
                { id: 'simulation', label: 'Simulation', desc: 'Mode demo (pas d\'envoi)' },
                { id: 'smtp', label: 'SMTP', desc: 'Serveur personnalise' },
              ].map(provider => (
                <button
                  key={provider.id}
                  onClick={() => setConfig({ ...config, provider: provider.id as EmailConfig['provider'] })}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    config.provider === provider.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-primary-900">{provider.label}</p>
                  <p className="text-xs text-primary-500">{provider.desc}</p>
                </button>
              ))}
            </div>

            {/* SMTP Settings */}
            {config.provider === 'smtp' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-primary-800">Configuration SMTP</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Serveur SMTP
                    </label>
                    <Input
                      placeholder="smtp.example.com"
                      value={config.smtpHost || ''}
                      onChange={e => setConfig({ ...config, smtpHost: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Port
                    </label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={config.smtpPort || ''}
                      onChange={e => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Utilisateur
                    </label>
                    <Input
                      placeholder="user@example.com"
                      value={config.smtpUser || ''}
                      onChange={e => setConfig({ ...config, smtpUser: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={config.smtpPassword || ''}
                        onChange={e => setConfig({ ...config, smtpPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.smtpSecure || false}
                    onChange={e => setConfig({ ...config, smtpSecure: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-primary-700">Utiliser SSL/TLS</span>
                </label>
              </div>
            )}

            {/* EmailJS Settings */}
            {config.provider === 'emailjs' && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-primary-800">Configuration EmailJS</h4>
                  <a
                    href="https://www.emailjs.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-500 hover:text-primary-700"
                  >
                    Creer un compte gratuit (200 emails/mois)
                  </a>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <p className="text-xs text-green-800">
                    <strong>Recommande!</strong> EmailJS permet d'envoyer des emails directement depuis le navigateur,
                    sans backend. Ideal pour les applications statiques.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Service ID
                    </label>
                    <Input
                      placeholder="service_xxxxxxx"
                      value={config.emailjsServiceId || ''}
                      onChange={e => setConfig({ ...config, emailjsServiceId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Dashboard EmailJS &gt; Email Services &gt; Service ID</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Template ID
                    </label>
                    <Input
                      placeholder="template_xxxxxxx"
                      value={config.emailjsTemplateId || ''}
                      onChange={e => setConfig({ ...config, emailjsTemplateId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Dashboard EmailJS &gt; Email Templates &gt; Template ID</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Public Key
                    </label>
                    <Input
                      placeholder="xxxxxxxxxxxxx"
                      value={config.emailjsPublicKey || ''}
                      onChange={e => setConfig({ ...config, emailjsPublicKey: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Dashboard EmailJS &gt; Account &gt; Public Key</p>
                  </div>
                </div>
              </div>
            )}

            {/* Simulation Mode Info */}
            {config.provider === 'simulation' && (
              <div className="space-y-4 border-t pt-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Mode Simulation:</strong> Les emails ne sont pas reellement envoyes.
                    Ils sont stockes localement pour la demonstration. Ideal pour les tests.
                  </p>
                </div>
              </div>
            )}

          </Card>

          {/* Sender Settings */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Expediteur</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Nom d'expediteur
                </label>
                <Input
                  placeholder="COSMOS ANGRE Cockpit"
                  value={config.fromName}
                  onChange={e => setConfig({ ...config, fromName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Email d'expediteur
                </label>
                <Input
                  type="email"
                  placeholder="noreply@cosmos-angre.com"
                  value={config.fromEmail}
                  onChange={e => setConfig({ ...config, fromEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Email de reponse (optionnel)
                </label>
                <Input
                  type="email"
                  placeholder="support@cosmos-angre.com"
                  value={config.replyTo || ''}
                  onChange={e => setConfig({ ...config, replyTo: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Link Settings */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Parametres des liens</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Duree de validite par defaut (heures)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="720"
                  value={config.defaultLinkDuration}
                  onChange={e => setConfig({ ...config, defaultLinkDuration: parseInt(e.target.value) })}
                />
                <p className="text-xs text-primary-500 mt-1">
                  {config.defaultLinkDuration} heures = {Math.round(config.defaultLinkDuration / 24)} jours
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  URL de base
                </label>
                <Input
                  placeholder={window.location.origin}
                  value={config.baseUrl}
                  onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Sauvegarder
            </Button>
            <Button variant="secondary" onClick={handleTestConnection} disabled={testingConnection}>
              {testingConnection ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Tester la connexion
            </Button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {editingTemplate ? (
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-900">
                  {editingTemplate.id ? 'Modifier le template' : 'Nouveau template'}
                </h3>
                <Button variant="ghost" onClick={() => setEditingTemplate(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">Nom</label>
                    <Input
                      value={editingTemplate.name}
                      onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">Type</label>
                    <select
                      value={editingTemplate.entityType}
                      onChange={e => setEditingTemplate({ ...editingTemplate, entityType: e.target.value as EmailTemplate['entityType'] })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="action">Action</option>
                      <option value="jalon">Jalon</option>
                      <option value="risque">Risque</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Sujet</label>
                  <Input
                    value={editingTemplate.subject}
                    onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Contenu HTML</label>
                  <textarea
                    value={editingTemplate.bodyHtml}
                    onChange={e => setEditingTemplate({ ...editingTemplate, bodyHtml: e.target.value })}
                    className="w-full h-96 px-3 py-2 border rounded-lg font-mono text-sm"
                  />
                </div>

                <div className="bg-primary-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-primary-700 mb-2">Variables disponibles:</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['recipient_name', 'update_link', 'expiration_date', 'action_titre', 'action_statut', 'action_avancement', 'jalon_titre', 'jalon_date', 'risque_titre', 'risque_score'].map(v => (
                      <code key={v} className="bg-white px-2 py-1 rounded border">{`{{${v}}}`}</code>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button variant="secondary" onClick={() => setEditingTemplate(null)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-primary-500">{templates.length} template(s)</p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleResetTemplates}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reinitialiser les templates
                  </Button>
                  <Button onClick={() => setEditingTemplate({
                    name: '',
                    subject: '',
                    bodyHtml: '',
                    entityType: 'action',
                    isDefault: false,
                    createdAt: '',
                    updatedAt: '',
                  })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau template
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {templates.map(template => (
                  <Card key={template.id} padding="md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          template.entityType === 'action' ? 'bg-primary-100' :
                          template.entityType === 'jalon' ? 'bg-success-100' :
                          template.entityType === 'risque' ? 'bg-error-100' :
                          template.entityType === 'rapport' ? 'bg-info-100' : 'bg-gray-100'
                        }`}>
                          <FileText className={`h-5 w-5 ${
                            template.entityType === 'action' ? 'text-primary-600' :
                            template.entityType === 'jalon' ? 'text-success-600' :
                            template.entityType === 'risque' ? 'text-error-600' :
                            template.entityType === 'rapport' ? 'text-info-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-primary-900">{template.name}</h4>
                          <p className="text-sm text-primary-500">{template.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={template.entityType === 'action' ? 'info' : template.entityType === 'jalon' ? 'success' : template.entityType === 'risque' ? 'error' : template.entityType === 'rapport' ? 'primary' : 'secondary'}>
                          {template.entityType}
                        </Badge>
                        {template.isDefault && <Badge variant="secondary">Par defaut</Badge>}
                        <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(template)} title="Previsualiser">
                          <Eye className="h-4 w-4 text-primary-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(template)} title="Modifier">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id!)} title="Supprimer">
                            <Trash2 className="h-4 w-4 text-error-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Links Tab */}
      {activeTab === 'links' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-primary-500">{links.length} lien(s) cree(s)</p>
            <Button variant="secondary" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          {links.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <LinkIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-primary-500">Aucun lien de mise a jour</p>
                <p className="text-sm text-primary-400">Les liens apparaitront ici quand vous enverrez des emails de relance</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {links.map(link => (
                <Card key={link.id} padding="md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        link.isExpired ? 'bg-gray-100' :
                        link.isUsed ? 'bg-success-100' :
                        link.accessedAt ? 'bg-warning-100' : 'bg-primary-100'
                      }`}>
                        {link.isExpired ? (
                          <X className="h-5 w-5 text-gray-500" />
                        ) : link.isUsed ? (
                          <CheckCircle className="h-5 w-5 text-success-600" />
                        ) : link.accessedAt ? (
                          <Eye className="h-5 w-5 text-warning-600" />
                        ) : (
                          <LinkIcon className="h-5 w-5 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary-900">{link.recipientName}</span>
                          <Badge variant={
                            link.entityType === 'action' ? 'info' :
                            link.entityType === 'jalon' ? 'success' : 'error'
                          }>
                            {link.entityType}
                          </Badge>
                        </div>
                        <p className="text-sm text-primary-500">{link.recipientEmail}</p>
                        <div className="flex items-center gap-4 text-xs text-primary-400 mt-1">
                          <span>Cree: {new Date(link.createdAt).toLocaleString('fr-FR')}</span>
                          <span>Expire: {new Date(link.expiresAt).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {link.isExpired && <Badge variant="secondary">Expire</Badge>}
                      {link.isUsed && <Badge variant="success">Mis a jour</Badge>}
                      {link.accessedAt && !link.isUsed && <Badge variant="warning">Vu</Badge>}
                      {!link.isExpired && !link.isUsed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}/update/${link.entityType}/${link.token}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLink(link.id!)}>
                        <Trash2 className="h-4 w-4 text-error-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-primary-500">
              {notifications.length} notification(s) ({unreadCount} non lue(s))
            </p>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
                <Check className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-primary-500">Aucune notification</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => (
                <Card
                  key={notif.id}
                  padding="sm"
                  className={notif.isRead ? 'opacity-60' : ''}
                  onClick={async () => {
                    if (!notif.isRead) {
                      await markNotificationRead(notif.id!);
                      setNotifications(await getNotifications());
                    }
                  }}
                >
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div className={`p-2 rounded-full ${
                      notif.type === 'link_sent' ? 'bg-primary-100' :
                      notif.type === 'link_opened' ? 'bg-warning-100' :
                      notif.type === 'update_made' ? 'bg-success-100' : 'bg-gray-100'
                    }`}>
                      {notif.type === 'link_sent' && <Send className="h-4 w-4 text-primary-600" />}
                      {notif.type === 'link_opened' && <Eye className="h-4 w-4 text-warning-600" />}
                      {notif.type === 'update_made' && <CheckCircle className="h-4 w-4 text-success-600" />}
                      {notif.type === 'link_expired' && <AlertCircle className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-primary-900">{notif.message}</p>
                      <p className="text-xs text-primary-400">
                        {new Date(notif.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  previewTemplate.entityType === 'action' ? 'bg-primary-100' :
                  previewTemplate.entityType === 'jalon' ? 'bg-success-100' :
                  previewTemplate.entityType === 'risque' ? 'bg-error-100' : 'bg-gray-100'
                }`}>
                  <Eye className={`h-5 w-5 ${
                    previewTemplate.entityType === 'action' ? 'text-primary-600' :
                    previewTemplate.entityType === 'jalon' ? 'text-success-600' :
                    previewTemplate.entityType === 'risque' ? 'text-error-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900">Apercu du template</h3>
                  <p className="text-sm text-primary-500">{previewTemplate.name}</p>
                </div>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Subject */}
            <div className="px-4 py-3 bg-gray-50 border-b">
              <p className="text-xs text-primary-500 mb-1">Sujet:</p>
              <p className="text-sm font-medium text-primary-900">{previewTemplate.subject}</p>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto p-4">
              <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <iframe
                  srcDoc={previewTemplate.bodyHtml
                    .replace(/\{\{recipient_name\}\}/g, 'Jean Dupont')
                    .replace(/\{\{update_link\}\}/g, '#')
                    .replace(/\{\{expiration_date\}\}/g, new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
                    .replace(/\{\{action_titre\}\}/g, 'Exemple d\'action')
                    .replace(/\{\{action_statut\}\}/g, 'En cours')
                    .replace(/\{\{action_avancement\}\}/g, '45')
                    .replace(/\{\{action_date_fin\}\}/g, '15/02/2026')
                    .replace(/\{\{jalon_titre\}\}/g, 'Exemple de jalon')
                    .replace(/\{\{jalon_statut\}\}/g, 'A venir')
                    .replace(/\{\{jalon_date\}\}/g, '01/03/2026')
                    .replace(/\{\{jalon_livrables\}\}/g, 'Livrable 1, Livrable 2')
                    .replace(/\{\{risque_titre\}\}/g, 'Exemple de risque')
                    .replace(/\{\{risque_categorie\}\}/g, 'Technique')
                    .replace(/\{\{risque_score\}\}/g, '12')
                    .replace(/\{\{risque_probabilite\}\}/g, '4')
                    .replace(/\{\{risque_impact\}\}/g, '3')
                    .replace(/\{\{risque_score_class\}\}/g, 'score-high')
                  }
                  title="Template Preview"
                  className="w-full h-[500px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="secondary" onClick={() => {
                setEditingTemplate(previewTemplate);
                setPreviewTemplate(null);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button onClick={() => setPreviewTemplate(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
