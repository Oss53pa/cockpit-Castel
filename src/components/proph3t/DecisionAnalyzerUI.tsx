// ============================================================================
// PROPH3T V2 — DECISION ANALYZER UI
// ============================================================================

import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Star,
  Sparkles,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
// Types locaux (alignés sur les données construites par le hook)
type DecisionUrgency = 'immediate' | 'this_week' | 'this_month' | 'when_possible';

interface DecisionContext {
  category: string;
  question: string;
  background: string;
  urgency: DecisionUrgency;
  stakeholders: string[];
  constraints: string[];
  objectives: string[];
}

interface DecisionOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  risks: string[];
  estimatedCost: number;
  estimatedDuration: number;
  feasibility: 'high' | 'medium' | 'low';
  alignment: number;
}

export interface DecisionAnalysis {
  context: DecisionContext;
  options: DecisionOption[];
  recommendation: {
    optionId: string;
    confidence: number;
    rationale: string;
  };
  tradeoffs: Array<{ factor: string; optionA: string; optionB: string; winner: string }>;
  nextSteps: string[];
  deadline?: Date;
}

interface AlternativeOption extends DecisionOption {
  creativity: 'conventional' | 'innovative' | 'radical';
  implementation: string[];
}

// ============================================================================
// TYPES
// ============================================================================

interface DecisionAnalyzerUIProps {
  analysis: DecisionAnalysis;
  alternatives?: AlternativeOption[];
  onSelectOption?: (optionId: string) => void;
  onRequestMoreOptions?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getUrgencyBadge = (urgency: DecisionContext['urgency']) => {
  const badges = {
    immediate: { className: 'bg-red-100 text-red-800', label: 'Immédiat' },
    this_week: { className: 'bg-orange-100 text-orange-800', label: 'Cette semaine' },
    this_month: { className: 'bg-yellow-100 text-yellow-800', label: 'Ce mois' },
    when_possible: { className: 'bg-gray-100 text-gray-600', label: 'Quand possible' },
  };
  return badges[urgency];
};

const getFeasibilityConfig = (feasibility: 'high' | 'medium' | 'low') => {
  const configs = {
    high: { color: 'text-green-600', bg: 'bg-green-100', label: 'Haute' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Moyenne' },
    low: { color: 'text-red-600', bg: 'bg-red-100', label: 'Basse' },
  };
  return configs[feasibility];
};

// getImpactColor used by OptionCard sub-component implicitly via config
// keeping for reference but not as standalone function

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const DecisionAnalyzerUI: React.FC<DecisionAnalyzerUIProps> = ({
  analysis,
  alternatives,
  onSelectOption,
  onRequestMoreOptions,
}) => {
  const [expandedOption, setExpandedOption] = useState<string | null>(
    analysis.recommendation.optionId
  );
  const [showAlternatives, setShowAlternatives] = useState(false);

  const urgencyBadge = getUrgencyBadge(analysis.context.urgency);
  const recommendedOption = analysis.options.find(o => o.id === analysis.recommendation.optionId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Analyse de Décision
              </h2>
              <p className="text-sm text-gray-500">
                {analysis.context.category} • {analysis.options.length} options
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 text-sm rounded-full ${urgencyBadge.className}`}>
            {urgencyBadge.label}
          </span>
        </div>
      </div>

      {/* Context */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-medium text-gray-900 mb-2">{analysis.context.question}</h3>
        <p className="text-sm text-gray-600">{analysis.context.background}</p>

        {analysis.context.constraints.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500">Contraintes:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {analysis.context.constraints.map((c, i) => (
                <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendation */}
      {recommendedOption && (
        <div className="px-6 py-4 bg-green-50 border-b border-green-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-green-800">Recommandation</h4>
                <span className="px-2 py-0.5 text-xs bg-green-200 text-green-800 rounded">
                  Confiance: {analysis.recommendation.confidence}%
                </span>
              </div>
              <p className="text-sm text-green-700">{analysis.recommendation.rationale}</p>
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="divide-y divide-gray-100">
        {analysis.options.map(option => (
          <OptionCard
            key={option.id}
            option={option}
            isRecommended={option.id === analysis.recommendation.optionId}
            isExpanded={expandedOption === option.id}
            onToggle={() => setExpandedOption(expandedOption === option.id ? null : option.id)}
            onSelect={onSelectOption}
          />
        ))}
      </div>

      {/* Tradeoffs */}
      {analysis.tradeoffs.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Analyse des compromis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {analysis.tradeoffs.map((t, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">{t.factor}</div>
                <div className="text-sm font-medium text-gray-900">{t.winner}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {alternatives && alternatives.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-gray-700">Options alternatives</span>
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                {alternatives.length}
              </span>
            </div>
            {showAlternatives ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showAlternatives && (
            <div className="px-6 pb-4 space-y-3">
              {alternatives.map(alt => (
                <AlternativeCard key={alt.id} alternative={alt} onSelect={onSelectOption} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Prochaines étapes</h4>
        <div className="space-y-2">
          {analysis.nextSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <ArrowRight className="w-4 h-4 text-blue-500" />
              {step}
            </div>
          ))}
        </div>

        {analysis.deadline && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
            <span className="text-sm text-yellow-800">
              <strong>Date limite:</strong> {new Date(analysis.deadline).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {onRequestMoreOptions && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onRequestMoreOptions}
            className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Générer plus d'options
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface OptionCardProps {
  option: DecisionOption;
  isRecommended: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: (optionId: string) => void;
}

const OptionCard: React.FC<OptionCardProps> = ({
  option,
  isRecommended,
  isExpanded,
  onToggle,
  onSelect,
}) => {
  const feasibility = getFeasibilityConfig(option.feasibility);

  return (
    <div className={`${isRecommended ? 'bg-green-50/50' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {isRecommended && <Star className="w-5 h-5 text-green-500" />}
          <div className="text-left">
            <h4 className="font-medium text-gray-900">{option.name}</h4>
            <p className="text-sm text-gray-500">{option.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs rounded ${feasibility.bg} ${feasibility.color}`}>
            {feasibility.label}
          </span>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              {option.alignment}%
            </div>
            <div className="text-xs text-gray-400">Alignement</div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-4 space-y-4">
          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> Avantages
              </h5>
              <ul className="space-y-1">
                {option.pros.map((pro, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" /> Inconvénients
              </h5>
              <ul className="space-y-1">
                {option.cons.map((con, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risks */}
          {option.risks.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-yellow-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Risques
              </h5>
              <div className="flex flex-wrap gap-2">
                {option.risks.map((risk, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Estimates */}
          <div className="flex items-center gap-4 text-sm">
            {option.estimatedCost > 0 && (
              <span className="text-gray-600">
                <strong>Coût:</strong> {option.estimatedCost.toLocaleString('fr-FR')}€
              </span>
            )}
            {option.estimatedDuration > 0 && (
              <span className="text-gray-600">
                <strong>Durée:</strong> {option.estimatedDuration} jours
              </span>
            )}
          </div>

          {/* Select Button */}
          {onSelect && (
            <button
              onClick={() => onSelect(option.id)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sélectionner cette option
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface AlternativeCardProps {
  alternative: AlternativeOption;
  onSelect?: (optionId: string) => void;
}

const AlternativeCard: React.FC<AlternativeCardProps> = ({ alternative, onSelect }) => {
  const creativityColors = {
    conventional: 'bg-gray-100 text-gray-600',
    innovative: 'bg-purple-100 text-purple-700',
    radical: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{alternative.name}</h4>
            <span className={`px-2 py-0.5 text-xs rounded ${creativityColors[alternative.creativity]}`}>
              {alternative.creativity === 'conventional' ? 'Conventionnel' :
                alternative.creativity === 'innovative' ? 'Innovant' : 'Radical'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{alternative.description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-purple-600">{alternative.alignment}%</div>
        </div>
      </div>

      {alternative.implementation.length > 0 && (
        <div className="mt-3">
          <span className="text-xs font-medium text-gray-500">Implémentation:</span>
          <div className="mt-1 space-y-1">
            {alternative.implementation.slice(0, 3).map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {onSelect && (
        <button
          onClick={() => onSelect(alternative.id)}
          className="mt-3 w-full px-3 py-1.5 text-sm text-purple-700 border border-purple-200 rounded hover:bg-purple-100"
        >
          Explorer cette option
        </button>
      )}
    </div>
  );
};

export default DecisionAnalyzerUI;
