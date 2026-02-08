// ============================================================================
// PROPH3T V2 — PROJECT JOURNAL VIEW
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Filter,
  Search,
  Calendar,
  Download,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Lightbulb,
  MessageSquare,
  Tag,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type {
  JournalEntry,
  JournalEntryType,
  JournalEntryImportance,
  JournalSummary,
} from '../../engines/proph3t/journal/projectJournal';

// ============================================================================
// TYPES
// ============================================================================

interface ProjectJournalViewProps {
  entries: JournalEntry[];
  summary: JournalSummary;
  onAddEntry?: () => void;
  onSelectEntry?: (entry: JournalEntry) => void;
  onExport?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getTypeConfig = (type: JournalEntryType) => {
  const configs: Record<JournalEntryType, { icon: React.ReactNode; color: string; label: string }> = {
    milestone_completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600 bg-green-100', label: 'Jalon atteint' },
    milestone_delayed: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600 bg-red-100', label: 'Jalon en retard' },
    action_completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-blue-600 bg-blue-100', label: 'Action terminée' },
    action_blocked: { icon: <XCircle className="w-4 h-4" />, color: 'text-orange-600 bg-orange-100', label: 'Action bloquée' },
    risk_identified: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-yellow-600 bg-yellow-100', label: 'Risque identifié' },
    risk_mitigated: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600 bg-green-100', label: 'Risque mitigé' },
    decision_made: { icon: <Lightbulb className="w-4 h-4" />, color: 'text-purple-600 bg-purple-100', label: 'Décision prise' },
    issue_raised: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600 bg-red-100', label: 'Problème soulevé' },
    issue_resolved: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600 bg-green-100', label: 'Problème résolu' },
    budget_alert: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600 bg-red-100', label: 'Alerte budget' },
    schedule_alert: { icon: <Clock className="w-4 h-4" />, color: 'text-orange-600 bg-orange-100', label: 'Alerte planning' },
    team_update: { icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-600 bg-blue-100', label: 'Mise à jour équipe' },
    external_event: { icon: <Calendar className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100', label: 'Événement externe' },
    lesson_learned: { icon: <Lightbulb className="w-4 h-4" />, color: 'text-yellow-600 bg-yellow-100', label: 'Leçon apprise' },
    manual_note: { icon: <MessageSquare className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100', label: 'Note manuelle' },
  };
  return configs[type] || configs.manual_note;
};

const getImportanceBadge = (importance: JournalEntryImportance) => {
  const badges = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const labels = {
    critical: 'Critique',
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
  };
  return { className: badges[importance], label: labels[importance] };
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const ProjectJournalView: React.FC<ProjectJournalViewProps> = ({
  entries,
  summary,
  onAddEntry,
  onSelectEntry,
  onExport,
}) => {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<JournalEntryType | 'all'>('all');
  const [filterImportance, setFilterImportance] = useState<JournalEntryImportance | 'all'>('all');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Filtrer les entrées
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (filterType !== 'all' && entry.type !== filterType) return false;
      if (filterImportance !== 'all' && entry.importance !== filterImportance) return false;
      if (searchText) {
        const search = searchText.toLowerCase();
        if (!entry.title.toLowerCase().includes(search) &&
            !entry.content.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  }, [entries, filterType, filterImportance, searchText]);

  // Grouper par date
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, JournalEntry[]>();
    for (const entry of filteredEntries) {
      const dateKey = new Date(entry.timestamp).toISOString().split('T')[0];
      const existing = groups.get(dateKey) || [];
      groups.set(dateKey, [...existing, entry]);
    }
    return groups;
  }, [filteredEntries]);

  const toggleDate = (dateKey: string) => {
    const newSet = new Set(expandedDates);
    if (newSet.has(dateKey)) {
      newSet.delete(dateKey);
    } else {
      newSet.add(dateKey);
    }
    setExpandedDates(newSet);
  };

  // Expand tous par défaut si peu d'entrées
  React.useEffect(() => {
    if (groupedByDate.size <= 5) {
      setExpandedDates(new Set(groupedByDate.keys()));
    }
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Journal de Projet
              </h2>
              <p className="text-sm text-gray-500">
                {summary.totalEntries} événements enregistrés
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Exporter"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            {onAddEntry && (
              <button
                onClick={onAddEntry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100">
        <StatBadge
          label="Critiques"
          value={summary.byImportance.critical}
          color="red"
        />
        <StatBadge
          label="Importantes"
          value={summary.byImportance.high}
          color="orange"
        />
        <StatBadge
          label="Moyennes"
          value={summary.byImportance.medium}
          color="yellow"
        />
        <StatBadge
          label="Basses"
          value={summary.byImportance.low}
          color="gray"
        />
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="flex-1 text-sm border-0 bg-transparent focus:ring-0 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as JournalEntryType | 'all')}
            className="text-sm border-0 bg-transparent focus:ring-0"
          >
            <option value="all">Tous les types</option>
            <option value="milestone_completed">Jalons atteints</option>
            <option value="milestone_delayed">Jalons en retard</option>
            <option value="action_blocked">Actions bloquées</option>
            <option value="risk_identified">Risques</option>
            <option value="decision_made">Décisions</option>
            <option value="lesson_learned">Leçons apprises</option>
          </select>

          <select
            value={filterImportance}
            onChange={e => setFilterImportance(e.target.value as JournalEntryImportance | 'all')}
            className="text-sm border-0 bg-transparent focus:ring-0"
          >
            <option value="all">Toutes importances</option>
            <option value="critical">Critique</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune entrée trouvée</p>
          </div>
        ) : (
          Array.from(groupedByDate.entries()).map(([dateKey, dateEntries]) => {
            const isExpanded = expandedDates.has(dateKey);
            const date = new Date(dateKey);

            return (
              <div key={dateKey} className="border-b border-gray-100 last:border-0">
                <button
                  onClick={() => toggleDate(dateKey)}
                  className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">
                      {formatDate(date)}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {dateEntries.length}
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
                    {dateEntries.map(entry => (
                      <JournalEntryCard
                        key={entry.id}
                        entry={entry}
                        onSelect={onSelectEntry}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Événements marquants</h4>
          <div className="flex flex-wrap gap-2">
            {summary.highlights.slice(0, 5).map(entry => (
              <span
                key={entry.id}
                className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50"
                onClick={() => onSelectEntry?.(entry)}
              >
                {entry.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatBadgeProps {
  label: string;
  value: number;
  color: 'red' | 'orange' | 'yellow' | 'gray';
}

const StatBadge: React.FC<StatBadgeProps> = ({ label, value, color }) => {
  const colors = {
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    gray: 'bg-gray-50 text-gray-700',
  };

  return (
    <div className={`p-3 rounded-lg text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
};

interface JournalEntryCardProps {
  entry: JournalEntry;
  onSelect?: (entry: JournalEntry) => void;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onSelect }) => {
  const typeConfig = getTypeConfig(entry.type);
  const importanceBadge = getImportanceBadge(entry.importance);

  return (
    <div
      className="p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 cursor-pointer"
      onClick={() => onSelect?.(entry)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${typeConfig.color}`}>
          {typeConfig.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{entry.title}</h4>
            <span className={`px-2 py-0.5 text-xs rounded border ${importanceBadge.className}`}>
              {importanceBadge.label}
            </span>
            {entry.isAutoGenerated && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                Auto
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">{entry.content}</p>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-400">
              {formatTime(entry.timestamp)}
            </span>
            <span className="text-xs text-gray-400">
              {entry.category}
            </span>
            {entry.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {entry.tags.slice(0, 2).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectJournalView;
