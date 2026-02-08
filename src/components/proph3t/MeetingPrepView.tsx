// ============================================================================
// PROPH3T V2 — MEETING PREP VIEW
// ============================================================================

import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronRight,
  Download,
  Copy,
  Presentation,
} from 'lucide-react';
import type {
  MeetingType,
  MeetingPrep,
  TalkingPoint,
  DecisionPoint,
} from '../../engines/proph3t/meetings/meetingPrepEngine';

// ============================================================================
// TYPES
// ============================================================================

interface MeetingPrepViewProps {
  prep: MeetingPrep;
  onExport?: (format: 'markdown' | 'html' | 'slides') => void;
  onCopyToClipboard?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getMeetingTypeLabel = (type: MeetingType): string => {
  const labels: Record<MeetingType, string> = {
    exco: 'Comité Exécutif',
    comite_pilotage: 'Comité de Pilotage',
    point_hebdo: 'Point Hebdomadaire',
    revue_technique: 'Revue Technique',
    crise: 'Cellule de Crise',
    custom: 'Réunion personnalisée',
  };
  return labels[type];
};

const getHealthColor = (health: 'green' | 'yellow' | 'red') => {
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return colors[health];
};

const getPriorityBadge = (priority: TalkingPoint['priority']) => {
  const badges = {
    must_mention: 'bg-red-100 text-red-800',
    should_mention: 'bg-yellow-100 text-yellow-800',
    nice_to_have: 'bg-gray-100 text-gray-600',
  };
  const labels = {
    must_mention: 'Prioritaire',
    should_mention: 'Important',
    nice_to_have: 'Optionnel',
  };
  return { className: badges[priority], label: labels[priority] };
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const MeetingPrepView: React.FC<MeetingPrepViewProps> = ({
  prep,
  onExport,
  onCopyToClipboard,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['talking_points', 'decisions'])
  );

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Préparation: {getMeetingTypeLabel(prep.meetingType)}
              </h2>
              <p className="text-sm text-gray-500">
                Généré le {new Date(prep.preparedAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCopyToClipboard && (
              <button
                onClick={onCopyToClipboard}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Copier"
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
            {onExport && (
              <>
                <button
                  onClick={() => onExport('markdown')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="Exporter en Markdown"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onExport('slides')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="Exporter en slides"
                >
                  <Presentation className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className={`w-3 h-3 rounded-full mt-1.5 ${getHealthColor(prep.summary.projectHealth)}`} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{prep.summary.headline}</h3>

            {/* Key Metrics */}
            <div className="flex flex-wrap gap-4 mt-3">
              {prep.summary.keyMetrics.map((metric, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{metric.label}:</span>
                  <span className="font-medium text-gray-900">{metric.value}</span>
                  {metric.trend === 'up' && <span className="text-green-500">↑</span>}
                  {metric.trend === 'down' && <span className="text-red-500">↓</span>}
                </div>
              ))}
            </div>

            {/* Highlights & Concerns */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {prep.summary.periodHighlights.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-green-600 mb-2">Points positifs</h4>
                  <ul className="space-y-1">
                    {prep.summary.periodHighlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {prep.summary.concerns.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-red-600 mb-2">Points d'attention</h4>
                  <ul className="space-y-1">
                    {prep.summary.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Talking Points */}
      <CollapsibleSection
        title="Points à aborder"
        icon={<MessageSquare className="w-5 h-5" />}
        count={prep.talkingPoints.length}
        isExpanded={expandedSections.has('talking_points')}
        onToggle={() => toggleSection('talking_points')}
      >
        <div className="space-y-3">
          {prep.talkingPoints.map(point => (
            <TalkingPointCard key={point.id} point={point} />
          ))}
        </div>
      </CollapsibleSection>

      {/* Decisions */}
      {prep.decisions.length > 0 && (
        <CollapsibleSection
          title="Décisions à prendre"
          icon={<CheckCircle2 className="w-5 h-5" />}
          count={prep.decisions.length}
          isExpanded={expandedSections.has('decisions')}
          onToggle={() => toggleSection('decisions')}
        >
          <div className="space-y-3">
            {prep.decisions.map(decision => (
              <DecisionPointCard key={decision.id} decision={decision} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Risks */}
      {prep.risksToDiscuss.length > 0 && (
        <CollapsibleSection
          title="Risques à discuter"
          icon={<AlertTriangle className="w-5 h-5" />}
          count={prep.risksToDiscuss.length}
          isExpanded={expandedSections.has('risks')}
          onToggle={() => toggleSection('risks')}
        >
          <div className="space-y-2">
            {prep.risksToDiscuss.map((risk, i) => (
              <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-gray-800">{risk.risk.description}</p>
                <p className="text-xs text-red-600 mt-1">{risk.reason}</p>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>Action suggérée:</strong> {risk.suggestedAction}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Alerts Overview */}
      {(prep.alertsOverview.critical > 0 || prep.alertsOverview.high > 0) && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Alertes actives:</span>
            {prep.alertsOverview.critical > 0 && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                {prep.alertsOverview.critical} critique(s)
              </span>
            )}
            {prep.alertsOverview.high > 0 && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                {prep.alertsOverview.high} haute(s)
              </span>
            )}
            {prep.alertsOverview.medium > 0 && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                {prep.alertsOverview.medium} moyenne(s)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Suggested Agenda */}
      {prep.suggestedAgenda.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Ordre du jour suggéré</h4>
          <div className="space-y-2">
            {prep.suggestedAgenda.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {item.order}
                </span>
                <span className="flex-1 text-gray-700">{item.title}</span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3 h-3" />
                  {item.duration}min
                </span>
              </div>
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

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  count,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="border-t border-gray-100">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-500">{icon}</span>
        <span className="font-medium text-gray-900">{title}</span>
        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
          {count}
        </span>
      </div>
      {isExpanded ? (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-400" />
      )}
    </button>
    {isExpanded && (
      <div className="px-6 pb-4">
        {children}
      </div>
    )}
  </div>
);

interface TalkingPointCardProps {
  point: TalkingPoint;
}

const TalkingPointCard: React.FC<TalkingPointCardProps> = ({ point }) => {
  const badge = getPriorityBadge(point.priority);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{point.topic}</h4>
            <span className={`px-2 py-0.5 text-xs rounded ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-sm text-gray-600">{point.context}</p>
          <p className="text-sm text-blue-600 mt-2 italic">
            → {point.suggestedPosition}
          </p>
        </div>
      </div>
    </div>
  );
};

interface DecisionPointCardProps {
  decision: DecisionPoint;
}

const DecisionPointCard: React.FC<DecisionPointCardProps> = ({ decision }) => {
  const impactColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-gray-200 bg-gray-50',
  };

  return (
    <div className={`p-4 rounded-lg border ${impactColors[decision.impact]}`}>
      <h4 className="font-medium text-gray-900 mb-2">{decision.question}</h4>
      <p className="text-sm text-gray-600 mb-3">{decision.context}</p>

      {decision.options.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-500">Options:</span>
          {decision.options.map((opt, i) => (
            <div key={i} className="ml-4 text-sm">
              <span className="font-medium text-gray-700">{opt.label}</span>
              {opt.pros.length > 0 && (
                <span className="text-green-600 ml-2">+ {opt.pros[0]}</span>
              )}
              {opt.cons.length > 0 && (
                <span className="text-red-600 ml-2">- {opt.cons[0]}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {decision.recommendation && (
        <p className="text-sm text-blue-600 mt-3">
          <strong>Recommandation:</strong> {decision.recommendation}
        </p>
      )}
    </div>
  );
};

export default MeetingPrepView;
