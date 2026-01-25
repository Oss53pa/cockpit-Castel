import { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Settings,
  Trash2,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertCircle,
  ChevronUp,
  Zap,
  Cloud,
  Cpu,
  BookOpen,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import {
  useActions,
  useJalons,
  useRisques,
  useBudgetSynthese,
  useAlertes,
  useUsers,
  useTeams,
  useDashboardKPIs,
} from '@/hooks';
import {
  chat,
  getConfig,
  saveConfig,
  getHistory,
  saveHistory,
  clearHistory,
  type AIConfig,
  type AIMessage,
  type AIProvider,
} from '@/services/prophet';
import ReactMarkdown from 'react-markdown';

// Add Grand Hotel font
const grandHotelStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap');
`;

export function ProphetChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCapabilitiesOpen, setIsCapabilitiesOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AIConfig>(getConfig());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all project data
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();
  const budget = useBudgetSynthese();
  const alertes = useAlertes();
  const users = useUsers();
  const teams = useTeams();
  const kpis = useDashboardKPIs();

  // Load history on mount
  useEffect(() => {
    setMessages(getHistory());
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const projectContext = {
    actions,
    jalons,
    risques,
    budget,
    alertes,
    users,
    teams,
    kpis,
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setError(null);

    const newMessages: AIMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);

    setIsLoading(true);

    try {
      const response = await chat(userMessage, projectContext, messages);

      const updatedMessages: AIMessage[] = [
        ...newMessages,
        { role: 'assistant', content: response },
      ];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setMessages([]);
  };

  const handleConfigChange = (updates: Partial<AIConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveConfig(updates);
  };

  const getProviderIcon = (provider: AIProvider) => {
    switch (provider) {
      case 'openrouter':
        return <Zap className="h-4 w-4" />;
      case 'anthropic':
        return <Cloud className="h-4 w-4" />;
      case 'local':
        return <Cpu className="h-4 w-4" />;
    }
  };

  const getProviderLabel = (provider: AIProvider) => {
    switch (provider) {
      case 'openrouter':
        return 'OpenRouter';
      case 'anthropic':
        return 'Anthropic';
      case 'local':
        return 'Local';
    }
  };

  return (
    <>
      {/* Inject Grand Hotel font */}
      <style>{grandHotelStyle}</style>

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
        >
          <div className="relative">
            <Sparkles className="h-7 w-7 group-hover:scale-110 transition-transform" />
            <span
              className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ fontFamily: "'Grand Hotel', cursive", fontSize: '18px' }}
            >
              Proph3t
            </span>
          </div>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className="text-xl"
                  style={{ fontFamily: "'Grand Hotel', cursive" }}
                >
                  Proph3t
                </h3>
                <div className="flex items-center gap-1 text-xs text-white/80">
                  {getProviderIcon(config.provider)}
                  <span>{getProviderLabel(config.provider)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsCapabilitiesOpen(!isCapabilitiesOpen);
                  setIsSettingsOpen(false);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Capacites de l'algorithme"
              >
                <BookOpen className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                  setIsCapabilitiesOpen(false);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Parametres"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleClearHistory}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Effacer l'historique"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {isSettingsOpen && (
            <div className="border-b bg-gray-50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-700">Configuration IA</span>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Fournisseur
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['local', 'openrouter', 'anthropic'] as AIProvider[]).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleConfigChange({ provider })}
                      className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-colors ${
                        config.provider === provider
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {getProviderIcon(provider)}
                      <span>{getProviderLabel(provider)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* OpenRouter API Key */}
              {config.provider === 'openrouter' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cle API OpenRouter
                  </label>
                  <Input
                    type="password"
                    placeholder="sk-or-..."
                    value={config.openrouterApiKey || ''}
                    onChange={(e) => handleConfigChange({ openrouterApiKey: e.target.value })}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Obtenez votre cle sur openrouter.ai
                  </p>
                </div>
              )}

              {/* Anthropic API Key */}
              {config.provider === 'anthropic' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cle API Anthropic
                  </label>
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    value={config.anthropicApiKey || ''}
                    onChange={(e) => handleConfigChange({ anthropicApiKey: e.target.value })}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Obtenez votre cle sur console.anthropic.com
                  </p>
                </div>
              )}

              {config.provider === 'local' && (
                <p className="text-xs text-gray-500 bg-white p-3 rounded-lg">
                  Mode local: Analyse basee sur des algorithmes integres.
                  Pas besoin de cle API. Cliquez sur <BookOpen className="inline h-3 w-3" /> pour voir toutes les capacites.
                </p>
              )}
            </div>
          )}

          {/* Capabilities Panel */}
          {isCapabilitiesOpen && (
            <div className="border-b bg-gray-50 p-4 space-y-3 max-h-[350px] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary-600" />
                  Capacites de l'Algorithme Local
                </span>
                <button
                  onClick={() => setIsCapabilitiesOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>

              {/* NLP */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">🧠</span>
                  Detection d'Intention NLP
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 18 categories d'intentions reconnues</li>
                  <li>• Reconnaissance avec synonymes et accents</li>
                  <li>• Extraction d'entites (dates, nombres)</li>
                  <li>• Memoire conversationnelle</li>
                </ul>
              </div>

              {/* EVM */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">📈</span>
                  Analyse EVM (Valeur Acquise)
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 11 indicateurs: PV, EV, AC, SV, CV, SPI, CPI, EAC, ETC, VAC, TCPI</li>
                  <li>• Previsions budgetaires automatiques</li>
                  <li>• Diagnostic de performance</li>
                </ul>
              </div>

              {/* Analyses */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">🔍</span>
                  Analyses Avancees
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Tendances et previsions (actions, risques, budget)</li>
                  <li>• Charge de travail par membre</li>
                  <li>• Chemin critique et goulots</li>
                  <li>• Score de sante global 0-100</li>
                </ul>
              </div>

              {/* Recommandations */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">💡</span>
                  Recommandations Intelligentes
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Priorite 1-5 avec impact/effort</li>
                  <li>• Actions suggerees specifiques</li>
                  <li>• Basees sur EVM, risques, charge</li>
                </ul>
              </div>

              {/* Commandes */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">💬</span>
                  Commandes Disponibles
                </h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="bg-gray-50 px-2 py-1 rounded">"problemes"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"risques"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"rapport"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"budget"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"actions"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"jalons"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"equipe"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"charge"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"EVM"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"previsions"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"recommandations"</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">"aide"</span>
                </div>
              </div>

              <p className="text-xs text-center text-gray-400 pt-2">
                Fonctionne 100% hors ligne - Aucune API requise
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary-600" />
                </div>
                <h4
                  className="text-2xl text-purple-700 mb-2"
                  style={{ fontFamily: "'Grand Hotel', cursive" }}
                >
                  Bienvenue!
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Je suis Proph3t, votre assistant IA pour COSMOS ANGRE.
                </p>
                <div className="space-y-2">
                  {[
                    'Quels sont les problemes du projet?',
                    'Fais une synthese',
                    'Analyse les risques',
                    'Recommandations',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setMessage(suggestion)}
                      className="block w-full text-left px-4 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white shadow-sm border border-gray-100'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-lg font-bold text-purple-800 mb-2">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base font-semibold text-purple-700 mt-3 mb-2">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-semibold text-gray-800 mt-2 mb-1">{children}</h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-sm text-gray-600 mb-2">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside text-sm space-y-1 mb-2">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside text-sm space-y-1 mb-2">{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-gray-600">{children}</li>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2">
                              <table className="min-w-full text-xs border-collapse">{children}</table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="border border-gray-200 px-2 py-1 bg-gray-50 font-medium text-left">{children}</th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-gray-200 px-2 py-1">{children}</td>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-800">{children}</strong>
                          ),
                          hr: () => <hr className="my-3 border-gray-200" />,
                          code: ({ children }) => (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Proph3t reflechit...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Erreur</p>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Posez votre question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">
                Appuyez sur Entree pour envoyer
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                {getProviderIcon(config.provider)}
                <span>{getProviderLabel(config.provider)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
