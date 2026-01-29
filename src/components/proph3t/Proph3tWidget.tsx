/**
 * PROPH3T Widget - Composant IA intégré
 * Affiche les analyses IA et permet les interactions
 */

import { useState, useRef, useEffect } from 'react';
import {
  Brain,
  Send,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  FileText,
  Lightbulb,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';
import {
  useProph3tChat,
  useProph3tHealth,
  useProph3tRecommendations,
  useProph3tConfig,
  useProph3tQuickAnalysis,
} from '@/hooks';
import ReactMarkdown from 'react-markdown';

// ============================================================================
// WIDGET PRINCIPAL
// ============================================================================

interface Proph3tWidgetProps {
  variant?: 'card' | 'inline' | 'full';
  className?: string;
  showChat?: boolean;
  showHealth?: boolean;
  showRecommendations?: boolean;
}

export function Proph3tWidget({
  variant = 'card',
  className,
  showChat = true,
  showHealth = true,
  showRecommendations = true,
}: Proph3tWidgetProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'health' | 'recommendations'>('health');
  const [isExpanded, setIsExpanded] = useState(true);

  if (variant === 'inline') {
    return <Proph3tInlineStatus className={className} />;
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-primary-200 overflow-hidden',
        variant === 'full' && 'h-full',
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-900 to-primary-700 text-white cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <span className="font-semibold">PROPH3T</span>
          <Badge variant="secondary" className="bg-accent-500/20 text-accent-300 text-xs">
            IA
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Proph3tProviderBadge />
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-primary-200">
            {showHealth && (
              <button
                onClick={() => setActiveTab('health')}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'health'
                    ? 'text-primary-900 border-b-2 border-primary-900'
                    : 'text-primary-500 hover:text-primary-700'
                )}
              >
                <Activity className="h-4 w-4 inline mr-1" />
                Santé
              </button>
            )}
            {showRecommendations && (
              <button
                onClick={() => setActiveTab('recommendations')}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'recommendations'
                    ? 'text-primary-900 border-b-2 border-primary-900'
                    : 'text-primary-500 hover:text-primary-700'
                )}
              >
                <Lightbulb className="h-4 w-4 inline mr-1" />
                Conseils
              </button>
            )}
            {showChat && (
              <button
                onClick={() => setActiveTab('chat')}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'chat'
                    ? 'text-primary-900 border-b-2 border-primary-900'
                    : 'text-primary-500 hover:text-primary-700'
                )}
              >
                <Sparkles className="h-4 w-4 inline mr-1" />
                Chat
              </button>
            )}
          </div>

          {/* Content */}
          <div className={cn('p-4', variant === 'full' && 'h-[calc(100%-100px)] overflow-auto')}>
            {activeTab === 'health' && <Proph3tHealthPanel />}
            {activeTab === 'recommendations' && <Proph3tRecommendationsPanel />}
            {activeTab === 'chat' && <Proph3tChatPanel />}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// PROVIDER BADGE
// ============================================================================

function Proph3tProviderBadge() {
  const { config, isConfigured } = useProph3tConfig();

  const providerLabels = {
    local: 'Local',
    openrouter: 'OpenRouter',
    anthropic: 'Claude',
  };

  const providerColors = {
    local: 'bg-gray-500',
    openrouter: 'bg-purple-500',
    anthropic: 'bg-orange-500',
  };

  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-xs font-medium text-white',
        providerColors[config.provider],
        !isConfigured && 'opacity-50'
      )}
    >
      {providerLabels[config.provider]}
    </span>
  );
}

// ============================================================================
// INLINE STATUS
// ============================================================================

function Proph3tInlineStatus({ className }: { className?: string }) {
  const health = useProph3tHealth();

  if (!health) return null;

  const statusColors = {
    vert: 'bg-success-500',
    jaune: 'bg-warning-500',
    rouge: 'bg-error-500',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-3 h-3 rounded-full', statusColors[health.status])} />
      <span className="text-sm font-medium">{health.score}/100</span>
      {health.issues.length > 0 && (
        <span className="text-xs text-primary-500">({health.issues.length} alertes)</span>
      )}
    </div>
  );
}

// ============================================================================
// HEALTH PANEL
// ============================================================================

function Proph3tHealthPanel() {
  const health = useProph3tHealth();
  const { analysis, isLoading, runAnalysis } = useProph3tQuickAnalysis();

  if (!health) {
    return (
      <div className="text-center py-8 text-primary-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Chargement des données...</p>
      </div>
    );
  }

  const statusColors = {
    vert: 'text-success-600 bg-success-50',
    jaune: 'text-warning-600 bg-warning-50',
    rouge: 'text-error-600 bg-error-50',
  };

  const statusLabels = {
    vert: 'Favorable',
    jaune: 'Vigilance',
    rouge: 'Critique',
  };

  return (
    <div className="space-y-4">
      {/* Score global */}
      <div className="text-center">
        <div
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold',
            statusColors[health.status]
          )}
        >
          <Activity className="h-5 w-5" />
          <span className="text-2xl">{health.score}</span>
          <span className="text-sm">/100 — {statusLabels[health.status]}</span>
        </div>
      </div>

      {/* Détail par dimension */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreBar label="Planning" value={health.planningScore} icon={<TrendingUp className="h-4 w-4" />} />
        <ScoreBar label="Budget" value={health.budgetScore} icon={<FileText className="h-4 w-4" />} />
        <ScoreBar label="Risques" value={health.riskScore} icon={<AlertTriangle className="h-4 w-4" />} />
        <ScoreBar label="Alertes" value={health.alertScore} icon={<Activity className="h-4 w-4" />} />
      </div>

      {/* EVM */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="text-center">
          <div className={cn('font-bold', health.spi >= 1 ? 'text-success-600' : 'text-error-600')}>
            {health.spi.toFixed(2)}
          </div>
          <div className="text-primary-500">SPI</div>
        </div>
        <div className="text-center">
          <div className={cn('font-bold', health.cpi >= 1 ? 'text-success-600' : 'text-error-600')}>
            {health.cpi.toFixed(2)}
          </div>
          <div className="text-primary-500">CPI</div>
        </div>
      </div>

      {/* Issues */}
      {health.issues.length > 0 && (
        <div className="bg-error-50 rounded-lg p-3">
          <div className="text-sm font-medium text-error-700 mb-2">Points d'attention:</div>
          <ul className="text-sm text-error-600 space-y-1">
            {health.issues.map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bouton analyse détaillée */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => runAnalysis('health')}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
        Analyse détaillée
      </Button>

      {/* Résultat analyse */}
      {analysis && (
        <div className="bg-primary-50 rounded-lg p-3 max-h-60 overflow-auto">
          <div className="prose prose-sm max-w-none"><ReactMarkdown>{analysis}</ReactMarkdown></div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 70 ? 'bg-success-500' : value >= 40 ? 'bg-warning-500' : 'bg-error-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-primary-600">
          {icon}
          {label}
        </span>
        <span className="font-medium">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ============================================================================
// RECOMMENDATIONS PANEL
// ============================================================================

function Proph3tRecommendationsPanel() {
  const recommendations = useProph3tRecommendations();
  const { analysis, isLoading, runAnalysis } = useProph3tQuickAnalysis();

  const priorityColors = {
    1: 'bg-error-100 text-error-700 border-error-200',
    2: 'bg-warning-100 text-warning-700 border-warning-200',
    3: 'bg-info-100 text-info-700 border-info-200',
    4: 'bg-success-100 text-success-700 border-success-200',
    5: 'bg-primary-100 text-primary-700 border-primary-200',
  };

  const priorityLabels = {
    1: 'Urgent',
    2: 'Important',
    3: 'Recommandé',
    4: 'Optionnel',
    5: 'Info',
  };

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="h-12 w-12 text-success-500 mx-auto mb-2" />
        <p className="text-success-700 font-medium">Projet en bonne santé!</p>
        <p className="text-sm text-primary-500">Aucune recommandation urgente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.slice(0, 5).map((rec, i) => (
        <div
          key={i}
          className={cn('p-3 rounded-lg border', priorityColors[rec.priority as keyof typeof priorityColors])}
        >
          <div className="flex items-start justify-between mb-1">
            <span className="font-medium text-sm">{rec.title}</span>
            <Badge variant="secondary" className="text-xs">
              {priorityLabels[rec.priority as keyof typeof priorityLabels]}
            </Badge>
          </div>
          <p className="text-xs mb-2 opacity-80">{rec.description}</p>
          {rec.actions.length > 0 && (
            <div className="text-xs">
              <span className="font-medium">Actions: </span>
              {rec.actions.slice(0, 2).join(', ')}
              {rec.actions.length > 2 && ` +${rec.actions.length - 2}`}
            </div>
          )}
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => runAnalysis('recommendations')}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
        Voir toutes les recommandations
      </Button>

      {analysis && (
        <div className="bg-primary-50 rounded-lg p-3 max-h-60 overflow-auto">
          <div className="prose prose-sm max-w-none"><ReactMarkdown>{analysis}</ReactMarkdown></div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CHAT PANEL
// ============================================================================

function Proph3tChatPanel() {
  const { messages, isLoading, _error, sendMessage, clearMessages } = useProph3tChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const quickQuestions = [
    'Quel est l\'état du projet?',
    'Quels sont les risques?',
    'Analyse du budget',
    'Recommandations',
  ];

  return (
    <div className="flex flex-col h-80">
      {/* Messages */}
      <div className="flex-1 overflow-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <Brain className="h-10 w-10 text-primary-300 mx-auto mb-2" />
            <p className="text-sm text-primary-500 mb-3">
              Je suis PROPH3T, votre assistant IA. Posez-moi une question!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              'rounded-lg p-3',
              message.role === 'user'
                ? 'bg-primary-100 ml-8'
                : 'bg-accent-50 border border-accent-200 mr-4'
            )}
          >
            {message.role === 'assistant' ? (
              <div className="prose prose-sm max-w-none"><ReactMarkdown>{message.content}</ReactMarkdown></div>
            ) : (
              <p className="text-sm">{message.content}</p>
            )}
            {message.provider && message.role === 'assistant' && (
              <div className="text-xs text-primary-400 mt-2">
                via {message.provider} {message.processingTime && `(${message.processingTime}ms)`}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-primary-500 p-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">PROPH3T réfléchit...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Posez votre question..."
          className="flex-1 px-3 py-2 text-sm border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isLoading}
        />
        <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {messages.length > 0 && (
        <button onClick={clearMessages} className="text-xs text-primary-400 hover:text-primary-600 mt-2 text-center">
          Effacer la conversation
        </button>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Proph3tWidget;
