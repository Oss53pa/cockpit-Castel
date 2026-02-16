// ============================================================================
// ADMIN - Configuration de l'envoi programmé des emails
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Clock,
  Calendar,
  Users,
  Send,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useUsers } from '@/hooks';
import { logger } from '@/lib/logger';

interface EmailScheduleSettings {
  enabled: boolean;
  dayOfMonth: number;
  hour: number;
  minute: number;
  midMonthReminder: boolean;
  midMonthDay: number;
  recipients: string[];
}

const DEFAULT_SETTINGS: EmailScheduleSettings = {
  enabled: false,
  dayOfMonth: 1,
  hour: 8,
  minute: 0,
  midMonthReminder: false,
  midMonthDay: 15,
  recipients: [],
};

const STORAGE_KEY = 'cockpit_email_schedule_settings';

export function EmailScheduleConfig() {
  const users = useUsers();
  const [settings, setSettings] = useState<EmailScheduleSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Charger les paramètres depuis le localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        logger.error('Erreur parsing settings:', e);
      }
    }
  }, []);

  // Managers disponibles
  const managers = users.filter(
    (u) => u.role === 'manager' || u.role === 'admin' || u.role === 'responsable'
  );

  // Sauvegarder les paramètres
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      // Simuler un délai pour l'UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      logger.error('Erreur sauvegarde:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Envoyer un email de test
  const handleSendTest = async () => {
    setIsSendingTest(true);

    try {
      // Simuler l'envoi
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert('Email de test envoyé avec succès ! (simulation)');
    } catch (error) {
      logger.error('Erreur envoi test:', error);
      alert('Erreur lors de l\'envoi du test');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Toggle un destinataire
  const toggleRecipient = (email: string) => {
    setSettings((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(email)
        ? prev.recipients.filter((r) => r !== email)
        : [...prev.recipients, email],
    }));
  };

  // Sélectionner tous les managers
  const selectAllManagers = () => {
    setSettings((prev) => ({
      ...prev,
      recipients: managers.map((m) => m.email).filter(Boolean) as string[],
    }));
  };

  // Désélectionner tous
  const deselectAll = () => {
    setSettings((prev) => ({
      ...prev,
      recipients: [],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-blue-400 text-sm font-medium tracking-wider uppercase mb-2">
            Administration
          </p>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            Configuration des Rapports Email
          </h1>
          <p className="text-slate-400 mt-2">
            Paramétrez l'envoi automatique des rapports mensuels aux managers
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

      {/* Toggle activation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className={`h-1 ${settings.enabled ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-slate-200'}`} />
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.enabled ? 'bg-blue-50' : 'bg-slate-50'}`}>
              <Send className={`h-6 w-6 ${settings.enabled ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Envoi automatique
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Activer l'envoi programmé des rapports mensuels
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`p-1 rounded-full transition-colors ${
              settings.enabled ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            {settings.enabled ? (
              <ToggleRight className="h-12 w-12" />
            ) : (
              <ToggleLeft className="h-12 w-12" />
            )}
          </button>
        </div>
      </div>

      {/* Programmation */}
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-600" />
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
            Programmation
          </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Jour d'envoi principal */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Jour d'envoi mensuel
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-400" />
              <select
                value={settings.dayOfMonth}
                onChange={(e) => setSettings((prev) => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day === 1 ? '1er' : day} du mois
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Heure d'envoi */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Heure d'envoi (GMT)
            </label>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              <select
                value={settings.hour}
                onChange={(e) => setSettings((prev) => ({ ...prev, hour: parseInt(e.target.value) }))}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, '0')}:{String(settings.minute).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Abidjan (GMT+0)
            </p>
          </div>
        </div>

        {/* Rappel mi-mois */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900">Rappel mi-mois</h3>
              <p className="text-sm text-slate-500">
                Envoyer un rappel supplémentaire au milieu du mois
              </p>
            </div>
            <button
              onClick={() => setSettings((prev) => ({ ...prev, midMonthReminder: !prev.midMonthReminder }))}
              className={`p-1 rounded-full transition-colors ${
                settings.midMonthReminder ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              {settings.midMonthReminder ? (
                <ToggleRight className="h-10 w-10" />
              ) : (
                <ToggleLeft className="h-10 w-10" />
              )}
            </button>
          </div>

          {settings.midMonthReminder && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Jour du rappel
              </label>
              <select
                value={settings.midMonthDay}
                onChange={(e) => setSettings((prev) => ({ ...prev, midMonthDay: parseInt(e.target.value) }))}
                className="w-full md:w-48 px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day === 1 ? '1er' : day} du mois
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Destinataires */}
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              Destinataires
              <span className="ml-2 px-2.5 py-0.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                {settings.recipients.length}
              </span>
            </h2>
            <div className="flex gap-2 text-sm">
              <button
                onClick={selectAllManagers}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Tout sélectionner
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={deselectAll}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          {managers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">
                Aucun manager trouvé dans la base de données
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {managers.map((manager) => {
                const email = manager.email || `${manager.nom?.toLowerCase().replace(' ', '.')}@cosmos.ci`;
                const isSelected = settings.recipients.includes(email);

                return (
                  <label
                    key={manager.id}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRecipient(email)}
                      className="h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {manager.nom || 'Sans nom'}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {email}
                      </p>
                    </div>
                    <span className={`
                      text-xs px-2.5 py-1 rounded-lg font-medium
                      ${manager.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        manager.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }
                    `}>
                      {manager.role}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={handleSendTest}
            disabled={isSendingTest || settings.recipients.length === 0}
            className="
              inline-flex items-center gap-2 px-5 py-3
              border-2 border-slate-200 rounded-xl
              text-slate-700 font-medium
              hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            "
          >
            {isSendingTest ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            Envoyer un test
          </button>

          <div className="flex items-center gap-4">
            {saveStatus === 'success' && (
              <span className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="h-5 w-5" />
                Sauvegardé
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-2 text-red-600 font-medium">
                <AlertCircle className="h-5 w-5" />
                Erreur
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="
                inline-flex items-center gap-2 px-6 py-3
                bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
                font-medium shadow-lg shadow-blue-500/25
                hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              "
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default EmailScheduleConfig;
