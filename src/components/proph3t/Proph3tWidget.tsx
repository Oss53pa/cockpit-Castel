/**
 * PROPH3T Widget - Composant IA intégré
 * Affiche les analyses IA et permet les interactions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Settings,
  Zap,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Target,
  GitBranch,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';
import {
  useProph3tChat,
  useProph3tHealth,
  useProph3tRecommendations,
  useProph3tConfig,
  useProph3tQuickAnalysis,
  useProjectContext,
} from '@/hooks';
import { useProph3tProactive } from '@/hooks/useProph3tProactive';
import ReactMarkdown from 'react-markdown';
import { Proph3tConfigModal } from './Proph3tConfigModal';
import { ConfidenceScore, CriticalPath, WorkloadAnalysis, OccupancyProjection } from './modules';

// ============================================================================
// WIDGET PRINCIPAL
// ============================================================================

interface Proph3tWidgetProps {
  variant?: 'card' | 'inline' | 'full';
  className?: string;
  showChat?: boolean;
  showHealth?: boolean;
  showRecommendations?: boolean;
  showProactive?: boolean;
  onClose?: () => void;
}

export function Proph3tWidget({
  variant = 'card',
  className,
  showChat = true,
  showHealth = true,
  showRecommendations = true,
  showProactive = true,
  onClose,
}: Proph3tWidgetProps) {
  const [activeTab, setActiveTab] = useState<'proactive' | 'chat' | 'health' | 'recommendations' | 'confiance' | 'chemin' | 'charge' | 'occupation'>('proactive');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { criticalCount, warningCount } = useProph3tProactive();

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
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-1">
              {criticalCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {criticalCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                  {warningCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Proph3tProviderBadge />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsConfigOpen(true);
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Configurer l'IA"
          >
            <Settings className="h-4 w-4" />
          </button>
          {onClose ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Config Modal */}
      <Proph3tConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />

      {isExpanded && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-primary-200">
            {showProactive && (
              <button
                onClick={() => setActiveTab('proactive')}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors relative',
                  activeTab === 'proactive'
                    ? 'text-primary-900 border-b-2 border-primary-900'
                    : 'text-primary-500 hover:text-primary-700'
                )}
              >
                <Zap className="h-4 w-4 inline mr-1" />
                Alertes
                {(criticalCount + warningCount) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {criticalCount + warningCount}
                  </span>
                )}
              </button>
            )}
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

          {/* Tabs secondaires - Modules avancés */}
          <div className="flex border-b border-primary-100 bg-neutral-50">
            <button
              onClick={() => setActiveTab('confiance')}
              className={cn(
                'flex-1 px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === 'confiance'
                  ? 'text-primary-900 border-b-2 border-primary-900 bg-white'
                  : 'text-primary-500 hover:text-primary-700'
              )}
            >
              <Target className="h-3 w-3 inline mr-1" />
              Confiance
            </button>
            <button
              onClick={() => setActiveTab('chemin')}
              className={cn(
                'flex-1 px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === 'chemin'
                  ? 'text-primary-900 border-b-2 border-primary-900 bg-white'
                  : 'text-primary-500 hover:text-primary-700'
              )}
            >
              <GitBranch className="h-3 w-3 inline mr-1" />
              Critique
            </button>
            <button
              onClick={() => setActiveTab('charge')}
              className={cn(
                'flex-1 px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === 'charge'
                  ? 'text-primary-900 border-b-2 border-primary-900 bg-white'
                  : 'text-primary-500 hover:text-primary-700'
              )}
            >
              <Users className="h-3 w-3 inline mr-1" />
              Charge
            </button>
            <button
              onClick={() => setActiveTab('occupation')}
              className={cn(
                'flex-1 px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === 'occupation'
                  ? 'text-primary-900 border-b-2 border-primary-900 bg-white'
                  : 'text-primary-500 hover:text-primary-700'
              )}
            >
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Occupation
            </button>
          </div>

          {/* Content */}
          <div className={cn('p-4', variant === 'full' && 'h-[calc(100%-140px)] overflow-auto')}>
            {activeTab === 'proactive' && <Proph3tProactivePanel />}
            {activeTab === 'health' && <Proph3tHealthPanel />}
            {activeTab === 'recommendations' && <Proph3tRecommendationsPanel />}
            {activeTab === 'chat' && <Proph3tChatPanel />}
            {activeTab === 'confiance' && <ConfidenceScore />}
            {activeTab === 'chemin' && <CriticalPath />}
            {activeTab === 'charge' && <WorkloadAnalysis />}
            {activeTab === 'occupation' && <OccupancyProjection />}
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

  const providerLabels: Record<string, string> = {
    hybrid: 'Hybride',
    local: 'Local',
    openrouter: 'OpenRouter',
    anthropic: 'Claude',
  };

  const providerColors: Record<string, string> = {
    hybrid: 'bg-blue-500',
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
  const context = useProjectContext();
  const { analysis, isLoading, runAnalysis } = useProph3tQuickAnalysis();
  const [showDataInfo, setShowDataInfo] = useState(false);

  if (!health) {
    return (
      <div className="text-center py-8 text-primary-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Chargement des données...</p>
      </div>
    );
  }

  // Calcul des statistiques réelles de la DB
  const dbStats = context ? {
    totalActions: context.actions.length,
    actionsEnCours: context.actions.filter(a => a.statut === 'en_cours').length,
    actionsBloquees: context.actions.filter(a => a.statut === 'bloque').length,
    actionsTerminees: context.actions.filter(a => a.statut === 'termine').length,
    totalJalons: context.jalons.length,
    totalRisques: context.risques.length,
    risquesCritiques: context.risques.filter(r => (r.score || 0) >= 16).length,
    risquesMajeurs: context.risques.filter(r => (r.score || 0) >= 10 && (r.score || 0) < 16).length,
    totalAlertes: context.alertes.length,
    alertesCritiques: context.alertes.filter(a => !a.traitee && a.criticite === 'critical').length,
    alertesNonTraitees: context.alertes.filter(a => !a.traitee).length,
  } : null;

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

      {/* Info données DB */}
      {dbStats && (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={() => setShowDataInfo(!showDataInfo)}
            className="flex items-center gap-2 text-xs text-primary-500 hover:text-primary-700"
          >
            <FileText className="h-3 w-3" />
            {showDataInfo ? 'Masquer' : 'Afficher'} les données source (IndexedDB)
          </button>
          {showDataInfo && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
              <div className="font-medium text-primary-700 mb-2">Données temps réel (IndexedDB)</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-primary-500">Actions totales:</span>
                <span className="font-medium">{dbStats.totalActions}</span>
                <span className="text-primary-500">- En cours:</span>
                <span className="font-medium">{dbStats.actionsEnCours}</span>
                <span className="text-primary-500">- Bloquées:</span>
                <span className="font-medium text-error-600">{dbStats.actionsBloquees}</span>
                <span className="text-primary-500">- Terminées:</span>
                <span className="font-medium text-success-600">{dbStats.actionsTerminees}</span>
                <span className="text-primary-500">Jalons:</span>
                <span className="font-medium">{dbStats.totalJalons}</span>
                <span className="text-primary-500">Risques totaux:</span>
                <span className="font-medium">{dbStats.totalRisques}</span>
                <span className="text-primary-500">- Critiques (≥12):</span>
                <span className="font-medium text-error-600">{dbStats.risquesCritiques}</span>
                <span className="text-primary-500">- Majeurs (8-11):</span>
                <span className="font-medium text-warning-600">{dbStats.risquesMajeurs}</span>
                <span className="text-primary-500">Alertes totales:</span>
                <span className="font-medium">{dbStats.totalAlertes}</span>
                <span className="text-primary-500">- Critiques non traitées:</span>
                <span className="font-medium text-error-600">{dbStats.alertesCritiques}</span>
              </div>
              <div className="mt-2 pt-2 border-t text-primary-400 italic">
                Ces données proviennent de la base locale IndexedDB.
              </div>
            </div>
          )}
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
  const navigate = useNavigate();
  const recommendations = useProph3tRecommendations();
  const { analysis, isLoading, runAnalysis } = useProph3tQuickAnalysis();

  const categoryRoutes: Record<string, string> = {
    'Actions': '/actions',
    'Risques': '/risques',
    'Budget': '/budget',
    'Planning': '/jalons',
    'Jalons': '/jalons',
  };

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
          onClick={() => { const route = categoryRoutes[rec.category]; if (route) navigate(route); }}
          className={cn('p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow', priorityColors[rec.priority as keyof typeof priorityColors])}
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
// PROACTIVE PANEL
// ============================================================================

function Proph3tProactivePanel() {
  const navigate = useNavigate();
  const {
    insights,
    criticalCount,
    warningCount,
    isScanning,
    lastScanTime,
    runScan,
    dismissInsight,
    config,
    updateConfig,
  } = useProph3tProactive();

  const handleInsightClick = useCallback((insight: { entityType?: string; category?: string }) => {
    // Navigation basée sur entityType ou category
    const route = insight.entityType === 'action' ? '/actions'
      : insight.entityType === 'jalon' ? '/jalons'
      : insight.entityType === 'risque' ? '/risques'
      : insight.entityType === 'budget' ? '/budget'
      : insight.category === 'risk' ? '/risques'
      : insight.category === 'budget' ? '/budget'
      : insight.category === 'deadline' || insight.category === 'blocker' ? '/actions'
      : null;
    if (route) navigate(route);
  }, [navigate]);

  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-500',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-500',
    },
  };

  return (
    <div className="space-y-4">
      {/* Header avec config et scan */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={cn('h-5 w-5', config.hybridMode ? 'text-purple-500' : 'text-primary-500')} />
          <span className="text-sm font-medium">
            Mode {config.hybridMode ? 'Hybride' : 'Local'}
          </span>
          {config.hybridMode && (
            <Badge variant="info" className="text-xs">Local + IA</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateConfig({ hybridMode: !config.hybridMode })}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              config.hybridMode
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            title="Basculer mode hybride"
          >
            {config.hybridMode ? 'Hybride ON' : 'Hybride OFF'}
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={runScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Dernier scan */}
      {lastScanTime && (
        <div className="flex items-center gap-1 text-xs text-primary-400">
          <Clock className="h-3 w-3" />
          Dernier scan: {lastScanTime.toLocaleTimeString('fr-FR')}
        </div>
      )}

      {/* Résumé */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div className="flex gap-4 p-3 bg-gradient-to-r from-red-50 to-amber-50 rounded-lg">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{criticalCount}</span>
              </div>
              <span className="text-sm text-red-700">Critique{criticalCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{warningCount}</span>
              </div>
              <span className="text-sm text-amber-700">Attention{warningCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Liste des insights */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-2" />
            <p className="text-success-700 font-medium">Tout va bien!</p>
            <p className="text-sm text-primary-500">Aucun problème détecté.</p>
          </div>
        ) : (
          insights.map(insight => {
            const config = severityConfig[insight.severity as keyof typeof severityConfig] || severityConfig.info;
            const Icon = config.icon;

            return (
              <div
                key={insight.id}
                onClick={() => handleInsightClick(insight)}
                className={cn(
                  'p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md',
                  config.bg,
                  config.border
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconColor)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('font-medium text-sm', config.text)}>
                          {insight.title}
                        </span>
                        {/* Catégorie badge */}
                        {insight.category === 'velocity' && (
                          <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">
                            Vélocité
                          </Badge>
                        )}
                        {insight.category === 'phase_sync' && (
                          <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700">
                            Synchro Phase
                          </Badge>
                        )}
                        {insight.category === 'postponement' && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                            Report suggéré
                          </Badge>
                        )}
                        {insight.source === 'hybrid' && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            IA
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-primary-600 mt-1">
                        {insight.description}
                      </p>
                      {insight.suggestion && (
                        <div className="mt-2 p-2 bg-white/50 rounded text-xs flex items-start gap-1">
                          <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-primary-700">{insight.suggestion}</span>
                        </div>
                      )}
                      {insight.aiEnhanced && (
                        <div className="mt-2 p-2 bg-purple-100/50 rounded text-xs flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-purple-800">{insight.aiEnhanced}</span>
                        </div>
                      )}
                      {insight.entityTitle && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-primary-500">
                          <Target className="h-3 w-3" />
                          {insight.entityTitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismissInsight(insight.id); }}
                    className="p-1 hover:bg-white/50 rounded text-primary-400 hover:text-primary-600"
                    title="Ignorer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Config rapide */}
      <div className="pt-3 border-t space-y-2">
        <div className="flex items-center justify-between text-xs text-primary-500">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoSuggest}
              onChange={(e) => updateConfig({ autoSuggest: e.target.checked })}
              className="w-4 h-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
            />
            Suggestions automatiques
          </label>
          <span>Scan: {config.scanIntervalMinutes}min</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-primary-500">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.velocityAnalysis}
              onChange={(e) => updateConfig({ velocityAnalysis: e.target.checked })}
              className="w-4 h-4 rounded border-primary-300 text-indigo-600 focus:ring-indigo-500"
            />
            Analyse vélocité
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.phaseSyncAnalysis}
              onChange={(e) => updateConfig({ phaseSyncAnalysis: e.target.checked })}
              className="w-4 h-4 rounded border-primary-300 text-cyan-600 focus:ring-cyan-500"
            />
            Synchro phases
          </label>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Proph3tWidget;
