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
  JournalSummary,
} from '../../hooks/useProph3tDashboard';

// ============================================================================
// TYPES
// ============================================================================

type JournalEntryType = 'milestone_completed' | 'milestone_delayed' | 'action_completed' | 'action_blocked' | 'risk_identified' | 'risk_mitigated' | 'decision_made' | 'issue_raised' | 'issue_resolved' | 'budget_alert' | 'schedule_alert' | 'team_update' | 'external_event' | 'lesson_learned' | 'manual_note';
type JournalEntryImportance = 'critical' | 'high' | 'medium' | 'low';

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
    milestone_completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-500 bg-green-50/50', label: 'Jalon atteint' },
    milestone_delayed: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-50/50', label: 'Jalon en retard' },
    action_completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-50/50', label: 'Action terminée' },
    action_blocked: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-orange-400 bg-orange-50/50', label: 'Action bloquée' },
    risk_identified: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-amber-500 bg-amber-50/50', label: 'Risque identifié' },
    risk_mitigated: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-500 bg-green-50/50', label: 'Risque mitigé' },
    decision_made: { icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-purple-400 bg-purple-50/50', label: 'Décision prise' },
    issue_raised: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-50/50', label: 'Problème soulevé' },
    issue_resolved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-500 bg-green-50/50', label: 'Problème résolu' },
    budget_alert: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-50/50', label: 'Alerte budget' },
    schedule_alert: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-orange-400 bg-orange-50/50', label: 'Alerte planning' },
    team_update: { icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-50/50', label: 'Mise à jour équipe' },
    external_event: { icon: <Calendar className="w-3.5 h-3.5" />, color: 'text-gray-400 bg-gray-50', label: 'Événement externe' },
    lesson_learned: { icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-amber-500 bg-amber-50/50', label: 'Leçon apprise' },
    manual_note: { icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'text-gray-400 bg-gray-50', label: 'Note manuelle' },
  };
  return configs[type] || configs.manual_note;
};

const getImportanceBadge = (importance: JournalEntryImportance) => {
  const badges = {
    critical: 'bg-red-50 text-red-400 border-red-100',
    high: 'bg-orange-50 text-orange-400 border-orange-100',
    medium: 'bg-amber-50 text-amber-400 border-amber-100',
    low: 'bg-gray-50 text-gray-400 border-gray-100',
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
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <div>
              <h2 className="text-sm font-medium text-gray-700">
                Journal de Projet
              </h2>
              <p className="text-xs text-gray-400">
                {summary.totalEntries} événements enregistrés
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-50 rounded-lg"
                title="Exporter"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onAddEntry && (
              <button
                onClick={onAddEntry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 px-5 py-2.5 border-b border-gray-50">
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
      <div className="px-5 py-2.5 border-b border-gray-50 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 flex-1">
          <Search className="w-3.5 h-3.5 text-gray-300" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="flex-1 text-xs border-0 bg-transparent focus:ring-0 placeholder-gray-300 text-gray-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-300" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as JournalEntryType | 'all')}
            className="text-xs border-0 bg-transparent focus:ring-0 text-gray-500"
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
            className="text-xs border-0 bg-transparent focus:ring-0 text-gray-500"
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
          <div className="px-5 py-8 text-center text-gray-400">
            <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Aucune entrée trouvée</p>
          </div>
        ) : (
          Array.from(groupedByDate.entries()).map(([dateKey, dateEntries]) => {
            const isExpanded = expandedDates.has(dateKey);
            const date = new Date(dateKey);

            return (
              <div key={dateKey} className="border-b border-gray-50 last:border-0">
                <button
                  onClick={() => toggleDate(dateKey)}
                  className="w-full px-5 py-2.5 flex items-center justify-between hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-xs font-medium text-gray-600">
                      {formatDate(date)}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-gray-50 text-gray-400 rounded-full">
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
                  <div className="px-5 pb-3 space-y-1.5">
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
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
          <h4 className="text-xs font-medium text-gray-400 mb-1.5">Événements marquants</h4>
          <div className="flex flex-wrap gap-1.5">
            {summary.highlights.slice(0, 5).map(entry => (
              <span
                key={entry.id}
                className="px-2.5 py-1 text-[10px] bg-white border border-gray-100 rounded-full cursor-pointer hover:bg-gray-50 text-gray-500"
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
    red: 'bg-red-50/50 text-red-400',
    orange: 'bg-orange-50/50 text-orange-400',
    yellow: 'bg-amber-50/50 text-amber-400',
    gray: 'bg-gray-50 text-gray-400',
  };

  return (
    <div className={`px-2.5 py-2 rounded-lg text-center ${colors[color]}`}>
      <div className="text-sm font-medium">{value}</div>
      <div className="text-[10px]">{label}</div>
    </div>
  );
};

interface JournalEntryCardProps {
  entry: JournalEntry;
  onSelect?: (entry: JournalEntry) => void;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onSelect }) => {
  const typeConfig = getTypeConfig(entry.type as JournalEntryType);
  const importanceBadge = getImportanceBadge(entry.importance as JournalEntryImportance);

  return (
    <div
      className="px-2.5 py-2 bg-white border border-gray-50 rounded-lg hover:border-gray-100 cursor-pointer"
      onClick={() => onSelect?.(entry)}
    >
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-lg ${typeConfig.color}`}>
          {typeConfig.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="text-xs font-medium text-gray-600 truncate">{entry.title}</h4>
            <span className={`px-1.5 py-0.5 text-[10px] rounded border ${importanceBadge.className}`}>
              {importanceBadge.label}
            </span>
            {entry.isAutoGenerated && (
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-400 rounded">
                Auto
              </span>
            )}
          </div>

          <p className="text-[11px] text-gray-400 line-clamp-2">{entry.content}</p>

          <div className="flex items-center gap-2.5 mt-1">
            <span className="text-[10px] text-gray-300">
              {formatTime(entry.timestamp)}
            </span>
            <span className="text-[10px] text-gray-300">
              {entry.category}
            </span>
            {entry.tags.length > 0 && (
              <div className="flex items-center gap-0.5">
                <Tag className="w-2.5 h-2.5 text-gray-300" />
                <span className="text-[10px] text-gray-300">
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
