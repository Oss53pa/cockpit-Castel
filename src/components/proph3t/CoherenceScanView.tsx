// ============================================================================
// PROPH3T V2 — COHERENCE SCAN VIEW
// ============================================================================

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Wrench,
  Clock,
  Filter,
} from 'lucide-react';
import type {
  CoherenceScanResult,
  CoherenceIssue,
  CoherenceCheckCategory,
  CoherenceSeverity,
} from '../../engines/proph3t/analyzers/coherenceScanner';

// ============================================================================
// TYPES
// ============================================================================

interface CoherenceScanViewProps {
  scanResult: CoherenceScanResult | null;
  isScanning: boolean;
  onRunScan: () => void;
  onRunQuickScan: () => void;
  onAutoFix?: (issues: CoherenceIssue[]) => Promise<{ fixed: number; failed: number }>;
}

// ============================================================================
// HELPERS
// ============================================================================

const getCategoryLabel = (category: CoherenceCheckCategory): string => {
  const labels: Record<CoherenceCheckCategory, string> = {
    data_integrity: 'Intégrité des données',
    business_rules: 'Règles métier',
    temporal_consistency: 'Cohérence temporelle',
    cross_module: 'Cross-module',
    reference_data: 'Données référentielles',
  };
  return labels[category];
};

const getCategoryIcon = (category: CoherenceCheckCategory) => {
  const icons: Record<CoherenceCheckCategory, React.ReactNode> = {
    data_integrity: <Shield className="w-4 h-4" />,
    business_rules: <CheckCircle2 className="w-4 h-4" />,
    temporal_consistency: <Clock className="w-4 h-4" />,
    cross_module: <RefreshCw className="w-4 h-4" />,
    reference_data: <Info className="w-4 h-4" />,
  };
  return icons[category];
};

const getSeverityConfig = (severity: CoherenceSeverity) => {
  const configs = {
    critical: {
      icon: <XCircle className="w-4 h-4" />,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Critique',
    },
    error: {
      icon: <ShieldX className="w-4 h-4" />,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      label: 'Erreur',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Attention',
    },
    info: {
      icon: <Info className="w-4 h-4" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      label: 'Info',
    },
  };
  return configs[severity];
};

const getStatusConfig = (status: CoherenceScanResult['status']) => {
  const configs = {
    healthy: {
      icon: <ShieldCheck className="w-8 h-8" />,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Données cohérentes',
      description: 'Aucun problème critique détecté',
    },
    issues_found: {
      icon: <ShieldAlert className="w-8 h-8" />,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Problèmes détectés',
      description: 'Des incohérences nécessitent attention',
    },
    critical_issues: {
      icon: <ShieldX className="w-8 h-8" />,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Problèmes critiques',
      description: 'Action immédiate requise',
    },
  };
  return configs[status];
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const CoherenceScanView: React.FC<CoherenceScanViewProps> = ({
  scanResult,
  isScanning,
  onRunScan,
  onRunQuickScan,
  onAutoFix,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<CoherenceSeverity | 'all'>('all');
  const [isFixing, setIsFixing] = useState(false);

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  const handleAutoFix = async () => {
    if (!scanResult || !onAutoFix) return;
    const fixableIssues = scanResult.issues.filter(i => i.autoFixable);
    if (fixableIssues.length === 0) return;

    setIsFixing(true);
    try {
      const result = await onAutoFix(fixableIssues);
      alert(`${result.fixed} problème(s) corrigé(s), ${result.failed} échec(s)`);
    } finally {
      setIsFixing(false);
    }
  };

  // Grouper les issues par catégorie
  const issuesByCategory = scanResult?.issues.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    if (filterSeverity === 'all' || issue.severity === filterSeverity) {
      acc[issue.category].push(issue);
    }
    return acc;
  }, {} as Record<CoherenceCheckCategory, CoherenceIssue[]>) ?? {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Scanner de Cohérence
              </h2>
              <p className="text-sm text-gray-500">
                Vérification de l'intégrité des données projet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunQuickScan}
              disabled={isScanning}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Scan rapide
            </button>
            <button
              onClick={onRunScan}
              disabled={isScanning}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scan en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Scan complet
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Résultat */}
      {scanResult && (
        <>
          {/* Status Card */}
          <div className="p-6 border-b border-gray-100">
            <div className={`p-4 rounded-lg border ${getStatusConfig(scanResult.status).bg} ${getStatusConfig(scanResult.status).border}`}>
              <div className="flex items-center gap-4">
                <div className={getStatusConfig(scanResult.status).color}>
                  {getStatusConfig(scanResult.status).icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${getStatusConfig(scanResult.status).color}`}>
                    {getStatusConfig(scanResult.status).label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getStatusConfig(scanResult.status).description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {scanResult.overallScore}/100
                  </div>
                  <p className="text-xs text-gray-500">
                    Score de cohérence
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                {(['critical', 'error', 'warning', 'info'] as const).map(severity => (
                  <div key={severity} className="text-center">
                    <div className={`text-xl font-semibold ${getSeverityConfig(severity).color}`}>
                      {scanResult.summary.bySeverity[severity]}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getSeverityConfig(severity).label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta info */}
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                {scanResult.checksExecuted} vérifications exécutées en {scanResult.duration}ms
              </span>
              <span>
                Dernier scan : {new Date(scanResult.timestamp).toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Filtres et actions */}
          {scanResult.issues.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value as CoherenceSeverity | 'all')}
                  className="text-sm border-0 bg-transparent focus:ring-0"
                >
                  <option value="all">Tous les niveaux</option>
                  <option value="critical">Critiques uniquement</option>
                  <option value="error">Erreurs</option>
                  <option value="warning">Avertissements</option>
                  <option value="info">Informations</option>
                </select>
              </div>

              {scanResult.summary.autoFixableCount > 0 && onAutoFix && (
                <button
                  onClick={handleAutoFix}
                  disabled={isFixing}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Wrench className="w-4 h-4" />
                  {isFixing ? 'Correction...' : `Corriger auto (${scanResult.summary.autoFixableCount})`}
                </button>
              )}
            </div>
          )}

          {/* Liste des issues par catégorie */}
          <div className="divide-y divide-gray-100">
            {Object.entries(issuesByCategory).map(([category, issues]) => {
              if (issues.length === 0) return null;
              const isExpanded = expandedCategories.has(category);

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">
                        {getCategoryIcon(category as CoherenceCheckCategory)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {getCategoryLabel(category as CoherenceCheckCategory)}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {issues.length}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4 space-y-2">
                      {issues.map(issue => (
                        <IssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {scanResult.issues.length === 0 && (
            <div className="p-8 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <h3 className="font-medium text-gray-900">Aucun problème détecté</h3>
              <p className="text-sm text-gray-500 mt-1">
                Toutes les vérifications de cohérence sont passées avec succès
              </p>
            </div>
          )}
        </>
      )}

      {/* État initial */}
      {!scanResult && !isScanning && (
        <div className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-medium text-gray-900">Aucun scan effectué</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Lancez un scan pour vérifier la cohérence des données
          </p>
          <button
            onClick={onRunScan}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Lancer le scan
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ISSUE CARD
// ============================================================================

interface IssueCardProps {
  issue: CoherenceIssue;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const config = getSeverityConfig(issue.severity);

  return (
    <div className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <div className={config.color}>{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${config.color}`}>{issue.title}</h4>
            {issue.autoFixable && (
              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                Auto-corrigeable
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{issue.description}</p>
          <p className="mt-2 text-xs text-gray-500">
            <strong>Suggestion :</strong> {issue.suggestion}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <span>Module : {issue.affectedModule}</span>
            {issue.affectedEntity && <span>Entité : {issue.affectedEntity}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoherenceScanView;
