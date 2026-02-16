// ============================================================================
// ADMIN - Historique des envois d'emails
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  History,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { logger } from '@/lib/logger';

interface EmailSendRecord {
  id: string;
  date: string;
  type: 'monthly' | 'mid-month' | 'test';
  periode: string;
  recipients: string[];
  successCount: number;
  failureCount: number;
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
}

const STORAGE_KEY = 'cockpit_email_history';

export function EmailHistory() {
  const [history, setHistory] = useState<EmailSendRecord[]>([]);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'historique depuis localStorage (données réelles uniquement)
  useEffect(() => {
    const loadHistory = () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setHistory(JSON.parse(saved));
        } else {
          // Pas de données = liste vide (pas de données de démo)
          setHistory([]);
        }
      } catch (e) {
        logger.error('Erreur chargement historique:', e);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Toggle un enregistrement
  const toggleRecord = (id: string) => {
    setExpandedRecords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Effacer l'historique
  const clearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Formater la date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Type badge
  const getTypeBadge = (type: EmailSendRecord['type']) => {
    switch (type) {
      case 'monthly':
        return { label: 'Mensuel', className: 'bg-blue-100 text-blue-700' };
      case 'mid-month':
        return { label: 'Mi-mois', className: 'bg-purple-100 text-purple-700' };
      case 'test':
        return { label: 'Test', className: 'bg-zinc-100 text-zinc-700' };
    }
  };

  // Status badge
  const getStatusBadge = (status: EmailSendRecord['status']) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle2,
          label: 'Succès',
          className: 'bg-green-100 text-green-700',
        };
      case 'partial':
        return {
          icon: Clock,
          label: 'Partiel',
          className: 'bg-amber-100 text-amber-700',
        };
      case 'failed':
        return {
          icon: XCircle,
          label: 'Échec',
          className: 'bg-red-100 text-red-700',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse" />
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-lg font-semibold text-slate-800">Chargement de l'historique</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium tracking-wider uppercase mb-2">
                Administration
              </p>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <History className="h-5 w-5 text-blue-400" />
                </div>
                Historique des envois
              </h1>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">

      {/* Liste */}
      {history.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-lg font-medium text-slate-900">Aucun envoi</p>
          <p className="text-slate-500 mt-1">L'historique des envois apparaîtra ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => {
            const isExpanded = expandedRecords.has(record.id);
            const typeBadge = getTypeBadge(record.type);
            const statusBadge = getStatusBadge(record.status);
            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header de l'enregistrement */}
                <button
                  onClick={() => toggleRecord(record.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isExpanded ? 'bg-blue-100' : 'bg-slate-100'
                    }`}>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${typeBadge.className}`}>
                          {typeBadge.label}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {record.periode}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDate(record.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">{record.recipients.length}</span>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${statusBadge.className}`}>
                      <StatusIcon className="h-4 w-4" />
                      {statusBadge.label}
                    </div>
                  </div>
                </button>

                {/* Détails */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div className="bg-white rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                          Statistiques
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Succès</span>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold">
                              {record.successCount}
                            </span>
                          </div>
                          {record.failureCount > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Échecs</span>
                              <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg font-semibold">
                                {record.failureCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                          Destinataires
                        </p>
                        <div className="space-y-1">
                          {record.recipients.map((email) => (
                            <p key={email} className="text-sm text-slate-700 truncate flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {email}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Erreurs */}
                    {record.errors && record.errors.length > 0 && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-3">
                          Erreurs
                        </p>
                        <ul className="space-y-2">
                          {record.errors.map((error, idx) => (
                            <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                              <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

export default EmailHistory;
