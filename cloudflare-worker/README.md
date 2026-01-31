# Cloudflare Worker - API Proxy

Proxy serverless pour COSMOS ANGRE Cockpit permettant de contourner les restrictions CORS et de securiser les cles API.

## Deploiement rapide (sans CLI)

1. Allez sur https://dash.cloudflare.com/
2. **Workers & Pages** > **Create Application** > **Create Worker**
3. Nommez-le `cosmos-angre-proxy`
4. Cliquez sur **Deploy**
5. Cliquez sur **Edit code**
6. Collez le contenu de `worker.js`
7. Cliquez sur **Save and Deploy**

## Configuration des secrets

Dans le dashboard Cloudflare:
1. Allez dans votre Worker > **Settings** > **Variables**
2. Ajoutez les variables d'environnement:

| Variable | Description |
|----------|-------------|
| `ALLOWED_ORIGIN` | URL de votre app (ex: `https://cosmos-angre.vercel.app`) |
| `ANTHROPIC_API_KEY` | Cle API Anthropic (Claude) |
| `OPENROUTER_API_KEY` | Cle API OpenRouter |

## Deploiement avec Wrangler CLI (optionnel)

```bash
# Installer Wrangler
npm install -g wrangler

# Se connecter
wrangler login

# Deployer
cd cloudflare-worker
wrangler deploy

# Ajouter les secrets
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENROUTER_API_KEY
```

## Endpoints disponibles

| Endpoint | Cible |
|----------|-------|
| `/api/anthropic/*` | `https://api.anthropic.com/*` |
| `/api/openrouter/*` | `https://openrouter.ai/api/*` |
| `/health` | Health check |

## URL du Worker

Apres deploiement, votre URL sera:
```
https://cosmos-angre-proxy.<votre-compte>.workers.dev
```

## Utilisation dans l'app

Mettez a jour `src/lib/apiEndpoints.ts` avec l'URL de votre worker:

```typescript
const WORKER_URL = 'https://cosmos-angre-proxy.votre-compte.workers.dev';
```

## Limites gratuites Cloudflare

- 100,000 requetes/jour
- 10ms CPU time/requete
- Illimite en bande passante
