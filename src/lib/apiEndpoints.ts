/**
 * API Endpoints Configuration
 * Utilise les proxies Vite en développement pour éviter les problèmes CORS
 * En production, utilise le Cloudflare Worker ou les URLs directes
 */

const isDev = import.meta.env.DEV;

// URL du Cloudflare Worker (a configurer apres deploiement)
// Exemple: 'https://cosmos-angre-proxy.votre-compte.workers.dev'
// const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';

export const API_ENDPOINTS = {
  // Anthropic (Claude)
  anthropic: {
    messages: isDev
      ? '/api/anthropic/v1/messages'
      : 'https://api.anthropic.com/v1/messages',
  },

  // OpenRouter
  openrouter: {
    chat: isDev
      ? '/api/openrouter/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions',
  },
};

/**
 * Helper pour construire l'URL complète
 */
export function getApiUrl(service: keyof typeof API_ENDPOINTS, endpoint: string): string {
  const serviceEndpoints = API_ENDPOINTS[service];
  return (serviceEndpoints as Record<string, string>)[endpoint] || '';
}

/**
 * Indique si on utilise le proxy (développement)
 */
export function isUsingProxy(): boolean {
  return isDev;
}
