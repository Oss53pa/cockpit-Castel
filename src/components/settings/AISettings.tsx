import { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Cloud,
  Cpu,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  TestTube,
  Loader2,
  Info,
  X,
  Activity,
  TrendingUp,
  FileText,
  Lightbulb,
  BarChart3,
  Shield,
  Calculator,
  Target,
} from 'lucide-react';
import { Card, Button, Input, Label, Badge } from '@/components/ui';
import {
  getConfig,
  saveConfig,
  clearHistory,
  chat,
  type AIConfig,
  type AIProvider,
} from '@/services/prophet';

const grandHotelStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap');
`;

export function AISettings() {
  const [config, setConfig] = useState<AIConfig>(getConfig());
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [showAlgorithmModal, setShowAlgorithmModal] = useState(false);

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  const handleProviderChange = (provider: AIProvider) => {
    const newConfig = { ...config, provider };
    setConfig(newConfig);
    saveConfig({ provider });
    showSavedMessage();
  };

  const handleApiKeyChange = (key: 'openrouterApiKey' | 'anthropicApiKey', value: string) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
  };

  const handleSaveApiKey = (key: 'openrouterApiKey' | 'anthropicApiKey') => {
    saveConfig({ [key]: config[key] });
    showSavedMessage();
  };

  const handleModelChange = (key: 'openrouterModel' | 'anthropicModel', value: string) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    saveConfig({ [key]: value });
    showSavedMessage();
  };

  const showSavedMessage = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Effacer tout l\'historique des conversations avec Proph3t ?')) {
      clearHistory();
      alert('Historique efface');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      await chat(
        'Test de connexion. Reponds juste "OK" si tu fonctionnes.',
        {
          actions: [],
          jalons: [],
          risques: [],
          budget: { prevu: 0, engage: 0, realise: 0 },
          alertes: [],
          users: [],
          teams: [],
          kpis: {},
        },
        []
      );

      setTestResult({
        success: true,
        message: config.provider === 'local'
          ? 'Mode local fonctionne correctement'
          : `Connexion reussie a ${config.provider}`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion',
      });
    } finally {
      setTesting(false);
    }
  };

  const providers: { id: AIProvider; label: string; description: string; icon: React.ElementType }[] = [
    {
      id: 'local',
      label: 'Algorithme Local',
      description: 'Analyse basee sur des regles, fonctionne hors-ligne',
      icon: Cpu,
    },
    {
      id: 'openrouter',
      label: 'OpenRouter',
      description: 'Acces a Claude, GPT-4, Gemini et autres modeles',
      icon: Zap,
    },
    {
      id: 'anthropic',
      label: 'Anthropic',
      description: 'Acces direct a Claude (API officielle)',
      icon: Cloud,
    },
  ];

  const openrouterModels = [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Recommande)' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
  ];

  const anthropicModels = [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommande)' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Rapide)' },
  ];

  return (
    <>
      <style>{grandHotelStyle}</style>

      <div className="space-y-6">
        {/* Header Card */}
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3
                className="text-3xl text-purple-700"
                style={{ fontFamily: "'Grand Hotel', cursive" }}
              >
                Proph3t
              </h3>
              <p className="text-sm text-primary-500">
                Assistant IA pour l'analyse et la redaction de rapports
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saved && (
                <Badge variant="success" className="animate-pulse">
                  <Check className="h-3 w-3 mr-1" />
                  Sauvegarde
                </Badge>
              )}
              <Badge
                variant={config.provider === 'local' ? 'secondary' : 'info'}
              >
                {providers.find(p => p.id === config.provider)?.label}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Provider Selection */}
        <Card padding="md">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Fournisseur IA
          </h3>
          <p className="text-sm text-primary-500 mb-4">
            Choisissez le backend pour les reponses de Proph3t
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providers.map((provider) => {
              const Icon = provider.icon;
              const isSelected = config.provider === provider.id;

              return (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-primary-200 hover:border-primary-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-primary-100 text-primary-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-primary-900">{provider.label}</h4>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <p className="text-xs text-primary-500">{provider.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* OpenRouter Configuration */}
        {config.provider === 'openrouter' && (
          <Card padding="md">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              Configuration OpenRouter
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="openrouterKey">Cle API OpenRouter</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      id="openrouterKey"
                      type={showOpenRouterKey ? 'text' : 'password'}
                      placeholder="sk-or-v1-..."
                      value={config.openrouterApiKey || ''}
                      onChange={(e) => handleApiKeyChange('openrouterApiKey', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                    >
                      {showOpenRouterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button onClick={() => handleSaveApiKey('openrouterApiKey')}>
                    Sauvegarder
                  </Button>
                </div>
                <p className="text-xs text-primary-500 mt-2 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    Obtenir une cle API sur openrouter.ai
                  </a>
                </p>
              </div>

              <div>
                <Label htmlFor="openrouterModel">Modele</Label>
                <select
                  id="openrouterModel"
                  value={config.openrouterModel || 'anthropic/claude-3.5-sonnet'}
                  onChange={(e) => handleModelChange('openrouterModel', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {openrouterModels.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Anthropic Configuration */}
        {config.provider === 'anthropic' && (
          <Card padding="md">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              Configuration Anthropic
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="anthropicKey">Cle API Anthropic</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      id="anthropicKey"
                      type={showAnthropicKey ? 'text' : 'password'}
                      placeholder="sk-ant-api03-..."
                      value={config.anthropicApiKey || ''}
                      onChange={(e) => handleApiKeyChange('anthropicApiKey', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                    >
                      {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button onClick={() => handleSaveApiKey('anthropicApiKey')}>
                    Sauvegarder
                  </Button>
                </div>
                <p className="text-xs text-primary-500 mt-2 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    Obtenir une cle API sur console.anthropic.com
                  </a>
                </p>
              </div>

              <div>
                <Label htmlFor="anthropicModel">Modele</Label>
                <select
                  id="anthropicModel"
                  value={config.anthropicModel || 'claude-3-5-sonnet-20241022'}
                  onChange={(e) => handleModelChange('anthropicModel', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {anthropicModels.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800">
                  <strong>Note:</strong> En mode developpement, un proxy local gere automatiquement le CORS.
                  En production, assurez-vous d'avoir un backend proxy configure.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Local Algorithm Info */}
        {config.provider === 'local' && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-900">
                Mode Algorithme Local
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAlgorithmModal(true)}
              >
                <Info className="h-4 w-4 mr-2" />
                Voir les fonctionnalités
              </Button>
            </div>

            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-700 mb-3">
                Le mode local utilise des algorithmes JavaScript integres pour analyser vos donnees.
              </p>
              <div className="space-y-2 text-sm text-primary-600">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success-500" />
                  <span>Fonctionne hors-ligne</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success-500" />
                  <span>Pas de cle API requise</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success-500" />
                  <span>Donnees restent sur votre appareil</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success-500" />
                  <span>Analyse EVM complete (SPI, CPI, EAC...)</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning-500" />
                  <span>Pas de generation de texte avancee</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Modal Fonctionnalités Algorithme Local */}
        {showAlgorithmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header du modal */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <Cpu className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Algorithme Local PROPH3T</h2>
                      <p className="text-purple-200">Moteur d'analyse avancé 100% frontend</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAlgorithmModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contenu du modal */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Introduction */}
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-primary-700">
                    L'algorithme local analyse vos données projet en temps réel sans connexion externe.
                    Toutes les analyses sont effectuées directement dans votre navigateur.
                  </p>
                </div>

                {/* Grille des fonctionnalités */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Analyse de Santé */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-green-800">Analyse de Santé</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-green-700">
                      <li>• Score global du projet (0-100)</li>
                      <li>• Statut visuel (Vert/Jaune/Rouge)</li>
                      <li>• Détail par dimension (planning, budget, risques)</li>
                      <li>• Points d'attention automatiques</li>
                    </ul>
                  </div>

                  {/* Indicateurs EVM */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Calculator className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-blue-800">Indicateurs EVM</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>• <strong>SPI</strong> - Performance planning</li>
                      <li>• <strong>CPI</strong> - Performance coûts</li>
                      <li>• <strong>EAC</strong> - Estimation à achèvement</li>
                      <li>• <strong>VAC</strong> - Écart à terminaison</li>
                      <li>• <strong>TCPI</strong> - Indice de performance</li>
                    </ul>
                  </div>

                  {/* Analyse des Problèmes */}
                  <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-red-800">Détection de Problèmes</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-red-700">
                      <li>• Actions bloquées</li>
                      <li>• Actions en retard</li>
                      <li>• Risques critiques</li>
                      <li>• Alertes non traitées</li>
                    </ul>
                  </div>

                  {/* Analyse des Risques */}
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-amber-800">Analyse des Risques</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-amber-700">
                      <li>• Répartition par niveau de criticité</li>
                      <li>• Identification des risques critiques</li>
                      <li>• Calcul des scores (P × I)</li>
                      <li>• Suivi des plans de mitigation</li>
                    </ul>
                  </div>

                  {/* Analyse Budgétaire */}
                  <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-violet-800">Analyse Budgétaire</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-violet-700">
                      <li>• Situation globale (prévu/engagé/réalisé)</li>
                      <li>• Taux de consommation</li>
                      <li>• Indicateurs EVM financiers</li>
                      <li>• Prévision de dépassement</li>
                    </ul>
                  </div>

                  {/* Génération de Rapports */}
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-800">Rapports de Synthèse</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li>• Rapport de synthèse automatique</li>
                      <li>• Indicateurs clés consolidés</li>
                      <li>• Format Markdown exportable</li>
                      <li>• Points d'attention hiérarchisés</li>
                    </ul>
                  </div>

                  {/* Recommandations */}
                  <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-teal-800">Recommandations</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-teal-700">
                      <li>• Recommandations intelligentes</li>
                      <li>• Priorisation par impact/effort</li>
                      <li>• Actions suggérées concrètes</li>
                      <li>• Catégorisation automatique</li>
                    </ul>
                  </div>

                  {/* Prévisions */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-indigo-800">Prévisions</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-indigo-700">
                      <li>• Estimation date de fin</li>
                      <li>• Scénarios (optimiste/réaliste/pessimiste)</li>
                      <li>• Prévision budgétaire finale</li>
                      <li>• Niveau de confiance</li>
                    </ul>
                  </div>
                </div>

                {/* Tableau des commandes */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Mots-clés reconnus par l'algorithme
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2 bg-white rounded-lg text-center">
                      <code className="text-sm text-purple-600">santé, état, statut</code>
                    </div>
                    <div className="p-2 bg-white rounded-lg text-center">
                      <code className="text-sm text-purple-600">problème, blocage</code>
                    </div>
                    <div className="p-2 bg-white rounded-lg text-center">
                      <code className="text-sm text-purple-600">risque, danger</code>
                    </div>
                    <div className="p-2 bg-white rounded-lg text-center">
                      <code className="text-sm text-purple-600">budget, coût</code>
                    </div>
                    <div className="p-2 bg-white rounded-lg text-center">
                      <code className="text-sm text-purple-600">rapport, synthèse</code>
                    </div>
                    <div className="p-2 bg-white rounded-lg text-center">
                      <code className="text-sm text-purple-600">recommandation</code>
                    </div>
                    <div className="p-2 bg-white rounded-lg text-center">
                      <code className="text-sm text-purple-600">prévision, forecast</code>
                    </div>
                    <div className="p-2 bg-white rounded-lg text-center">
                      <code className="text-sm text-purple-600">conseil, suggestion</code>
                    </div>
                  </div>
                </div>

                {/* Note de confidentialité */}
                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800">Confidentialité garantie</h4>
                    <p className="text-sm text-green-700">
                      Aucune donnée n'est envoyée à des serveurs externes. Tout le traitement s'effectue
                      localement dans votre navigateur. Vos données projet restent 100% confidentielles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer du modal */}
              <div className="p-4 bg-gray-50 border-t flex justify-end">
                <Button onClick={() => setShowAlgorithmModal(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Test & Actions */}
        <Card padding="md">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Test et Maintenance
          </h3>

          <div className="space-y-4">
            {/* Test Connection */}
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div>
                <h4 className="font-medium text-primary-900">Tester la connexion</h4>
                <p className="text-sm text-primary-500">
                  Verifier que Proph3t fonctionne correctement
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Tester
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  testResult.success
                    ? 'bg-success-50 border border-success-200'
                    : 'bg-error-50 border border-error-200'
                }`}
              >
                {testResult.success ? (
                  <Check className="h-5 w-5 text-success-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-error-500 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      testResult.success ? 'text-success-800' : 'text-error-800'
                    }`}
                  >
                    {testResult.success ? 'Succes' : 'Echec'}
                  </p>
                  <p
                    className={`text-sm ${
                      testResult.success ? 'text-success-600' : 'text-error-600'
                    }`}
                  >
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Clear History */}
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div>
                <h4 className="font-medium text-primary-900">Historique des conversations</h4>
                <p className="text-sm text-primary-500">
                  Effacer toutes les conversations avec Proph3t
                </p>
              </div>
              <Button variant="danger" onClick={handleClearHistory}>
                Effacer l'historique
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
