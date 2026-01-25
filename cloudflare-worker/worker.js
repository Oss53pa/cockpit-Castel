/**
 * Cloudflare Worker - API Proxy pour COSMOS ANGRE Cockpit
 *
 * Ce worker sert de proxy pour contourner les restrictions CORS
 * et proteger les cles API sensibles.
 *
 * Deploiement:
 * 1. Allez sur https://dash.cloudflare.com/
 * 2. Workers & Pages > Create Application > Create Worker
 * 3. Collez ce code et deployez
 * 4. Ajoutez vos variables d'environnement (Settings > Variables)
 *
 * Variables d'environnement requises:
 * - ANTHROPIC_API_KEY: Votre cle API Anthropic
 * - OPENROUTER_API_KEY: Votre cle API OpenRouter
 * - ALLOWED_ORIGIN: URL de votre app (ex: https://votre-app.vercel.app)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Sera remplace par ALLOWED_ORIGIN en prod
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: getCorsHeaders(env),
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route requests
      if (path.startsWith('/api/anthropic')) {
        return await proxyAnthropic(request, env, path);
      }

      if (path.startsWith('/api/openrouter')) {
        return await proxyOpenRouter(request, env, path);
      }

      if (path.startsWith('/api/sendgrid')) {
        return await proxySendGrid(request, env, path);
      }

      if (path.startsWith('/api/resend')) {
        return await proxyResend(request, env, path);
      }

      // Health check
      if (path === '/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() }, env);
      }

      return jsonResponse({ error: 'Not found' }, env, 404);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: error.message || 'Internal server error' }, env, 500);
    }
  },
};

function getCorsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || '*';
  return {
    ...CORS_HEADERS,
    'Access-Control-Allow-Origin': origin,
  };
}

function jsonResponse(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(env),
    },
  });
}

async function proxyAnthropic(request, env, path) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, env, 500);
  }

  const targetPath = path.replace('/api/anthropic', '');
  const targetUrl = `https://api.anthropic.com${targetPath}`;

  const body = await request.text();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: request.method !== 'GET' ? body : undefined,
  });

  const responseData = await response.text();

  return new Response(responseData, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(env),
    },
  });
}

async function proxyOpenRouter(request, env, path) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'OPENROUTER_API_KEY not configured' }, env, 500);
  }

  const targetPath = path.replace('/api/openrouter', '');
  const targetUrl = `https://openrouter.ai/api${targetPath}`;

  const body = await request.text();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': env.ALLOWED_ORIGIN || 'https://cosmos-angre.app',
      'X-Title': 'COSMOS ANGRE Cockpit',
    },
    body: request.method !== 'GET' ? body : undefined,
  });

  const responseData = await response.text();

  return new Response(responseData, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(env),
    },
  });
}

async function proxySendGrid(request, env, path) {
  const apiKey = env.SENDGRID_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'SENDGRID_API_KEY not configured' }, env, 500);
  }

  const targetPath = path.replace('/api/sendgrid', '');
  const targetUrl = `https://api.sendgrid.com${targetPath}`;

  const body = await request.text();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: request.method !== 'GET' ? body : undefined,
  });

  const responseData = await response.text();

  return new Response(responseData, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(env),
    },
  });
}

async function proxyResend(request, env, path) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'RESEND_API_KEY not configured' }, env, 500);
  }

  const targetPath = path.replace('/api/resend', '');
  const targetUrl = `https://api.resend.com${targetPath}`;

  const body = await request.text();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: request.method !== 'GET' ? body : undefined,
  });

  const responseData = await response.text();

  return new Response(responseData, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(env),
    },
  });
}
