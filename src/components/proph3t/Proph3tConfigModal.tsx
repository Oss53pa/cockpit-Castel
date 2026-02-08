/**
 * PROPH3T Configuration Modal
 * Permet de configurer le provider IA (Local, OpenRouter, Anthropic)
 */

import { useState, useEffect } from 'react';
import {
  Brain,
  Key,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';
import { useProph3tConfig } from '@/hooks';
import type { AIProvider } from '@/services/proph3tEngine';

interface Proph3tConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Proph3tConfigModal({ isOpen, onClose }: Proph3tConfigModalProps) {
  const { config, updateConfig } = useProph3tConfig();

  const [provider, setProvider] = useState<AIProvider>(config.provider);
  const [openrouterKey, setOpenrouterKey] = useState(config.openrouterApiKey || '');
  const [openrouterModel, setOpenrouterModel] = useState(config.openrouterModel || 'anthropic/claude-3.5-sonnet');
  const [anthropicKey, setAnthropicKey] = useState(config.anthropicApiKey || '');
  const [anthropicModel, setAnthropicModel] = useState(config.anthropicModel || 'claude-sonnet-4-20250514');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProvider(config.provider);
      setOpenrouterKey(config.openrouterApiKey || '');
      setOpenrouterModel(config.openrouterModel || 'anthropic/claude-3.5-sonnet');
      setAnthropicKey(config.anthropicApiKey || '');
      setAnthropicModel(config.anthropicModel || 'claude-sonnet-4-20250514');
      setTestStatus('idle');
      setTestError(null);
    }
  }, [isOpen, config]);

  const handleSave = () => {
    updateConfig({
      provider,
      openrouterApiKey: openrouterKey || undefined,
      openrouterModel,
      anthropicApiKey: anthropicKey || undefined,
      anthropicModel,
    });
    onClose();
  };

  const testConnection = async () => {
    setTestStatus('testing');
    setTestError(null);

    try {
      if ((provider === 'openrouter' || provider === 'hybrid') && openrouterKey) {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
          },
        });
        if (!response.ok) throw new Error('Clé OpenRouter invalide');
      } else if (provider === 'anthropic' && anthropicKey) {
        // Test simple avec un message court
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: anthropicModel,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || 'Clé Anthropic invalide');
        }
      } else if (provider === 'local') {
        // Local fonctionne toujours
      } else {
        throw new Error('Clé API manquante');
      }

      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
      setTestError(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  };

  if (!isOpen) return null;

  const openrouterModels = [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
    { value: 'mistralai/mistral-large', label: 'Mistral Large' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
  ];

  const anthropicModels = [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (rapide)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-primary-200 bg-gradient-to-r from-primary-900 to-primary-700 rounded-t-xl">
          <Brain className="h-6 w-6 text-white" />
          <div>
            <h2 className="text-lg font-semibold text-white">Configuration PROPH3T</h2>
            <p className="text-xs text-primary-200">Choisissez votre provider IA</p>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">Provider IA</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'hybrid', label: 'Hybride (Recommande)', desc: 'Local et OpenRouter' },
                { value: 'local', label: 'Local', desc: 'Algorithme integre' },
                { value: 'openrouter', label: 'OpenRouter', desc: 'Multi-modeles' },
                { value: 'anthropic', label: 'Anthropic', desc: 'Claude direct' },
              ].map(p => (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value as AIProvider)}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-all',
                    provider === p.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-primary-200 hover:border-primary-300'
                  )}
                >
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs text-primary-500">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* OpenRouter Config (also shown for hybrid) */}
          {(provider === 'openrouter' || provider === 'hybrid') && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-purple-800">OpenRouter</h3>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  Obtenir une clé <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs text-purple-700 mb-1">Clé API</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                  <input
                    type="password"
                    value={openrouterKey}
                    onChange={e => setOpenrouterKey(e.target.value)}
                    placeholder="sk-or-..."
                    className="w-full pl-10 pr-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-purple-700 mb-1">Modèle</label>
                <select
                  value={openrouterModel}
                  onChange={e => setOpenrouterModel(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {openrouterModels.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Anthropic Config */}
          {provider === 'anthropic' && (
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-orange-800">Anthropic (Claude)</h3>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-1"
                >
                  Obtenir une clé <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs text-orange-700 mb-1">Clé API</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                  <input
                    type="password"
                    value={anthropicKey}
                    onChange={e => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full pl-10 pr-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-orange-700 mb-1">Modèle</label>
                <select
                  value={anthropicModel}
                  onChange={e => setAnthropicModel(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                >
                  {anthropicModels.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                Note: L'API Anthropic nécessite l'activation de l'accès navigateur direct.
              </div>
            </div>
          )}

          {/* Local Info */}
          {provider === 'local' && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-2">Mode Local</h3>
              <p className="text-sm text-gray-600">
                L'algorithme local utilise des règles intelligentes pour analyser votre projet.
                Aucune connexion internet ni clé API requise.
              </p>
              <ul className="mt-3 text-xs text-gray-500 space-y-1">
                <li>• Analyse de santé du projet</li>
                <li>• Détection des problèmes et risques</li>
                <li>• Calculs EVM (Earned Value Management)</li>
                <li>• Recommandations basées sur des règles</li>
              </ul>
            </div>
          )}

          {/* Test Connection */}
          {provider !== 'local' && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={testStatus === 'testing' || ((provider === 'openrouter' || provider === 'hybrid') ? !openrouterKey : !anthropicKey)}
              >
                {testStatus === 'testing' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Tester la connexion
              </Button>

              {testStatus === 'success' && (
                <Badge className="bg-success-100 text-success-700">
                  <Check className="h-3 w-3 mr-1" />
                  Connexion réussie
                </Badge>
              )}

              {testStatus === 'error' && (
                <Badge className="bg-error-100 text-error-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {testError || 'Erreur'}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-primary-200 bg-primary-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Proph3tConfigModal;
