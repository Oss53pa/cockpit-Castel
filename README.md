# Cockpit COSMOS ANGRE

Application de pilotage de projet pour le centre commercial COSMOS ANGRE. Tableau de bord complet pour le suivi des actions, jalons, risques, budget et rapports.

## Fonctionnalites

- **Dashboard** : KPIs, meteo projet, avancement par axe, synchronisation chantier/mobilisation
- **Actions** : Gestion des taches avec vues Kanban, Gantt, PERT, Calendrier
- **Jalons** : Suivi des jalons projet avec timeline et livrables
- **Risques** : Registre des risques avec matrice de criticite
- **Budget** : Suivi budgetaire avec indicateurs EVM
- **Rapports** : Deep Dive mensuel, Report Studio, exports PDF/PPTX
- **Alertes** : Notifications automatiques des echeances et retards
- **IA Proph3t** : Assistant IA pour analyses et recommandations

## Technologies

- React 18 + TypeScript
- Vite (build)
- Tailwind CSS (styles)
- Dexie.js (IndexedDB)
- Recharts (graphiques)
- Lucide React (icones)
- PWA (mode hors-ligne)

## Installation

```bash
# Cloner le projet
git clone <repository-url>
cd Cockpit-Castel

# Installer les dependances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Editer .env avec vos valeurs

# Lancer en developpement
npm run dev

# Build production
npm run build

# Previsualiser le build
npm run preview
```

## Configuration

### Variables d'environnement

Copier `.env.example` en `.env` et configurer :

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `VITE_WORKER_URL` | URL du Cloudflare Worker | Production |
| `VITE_EMAILJS_SERVICE_ID` | ID service EmailJS | Si emails |
| `VITE_EMAILJS_TEMPLATE_ID` | ID template EmailJS | Si emails |
| `VITE_EMAILJS_PUBLIC_KEY` | Cle publique EmailJS | Si emails |
| `VITE_OPENROUTER_API_KEY` | Cle API OpenRouter | Si IA |
| `VITE_ANTHROPIC_API_KEY` | Cle API Anthropic | Si IA |

### Cloudflare Worker (Production)

Pour contourner CORS en production, deployer le proxy Cloudflare Worker :

1. Aller sur https://dash.cloudflare.com/
2. Workers & Pages > Create Application > Create Worker
3. Nommer : `cosmos-angre-proxy`
4. Coller le contenu de `cloudflare-worker/worker.js`
5. Configurer les secrets dans Settings > Variables :
   - `ALLOWED_ORIGIN` : URL de votre app
   - `ANTHROPIC_API_KEY` : Cle API Anthropic
   - `OPENROUTER_API_KEY` : Cle API OpenRouter

Documentation complete : `cloudflare-worker/README.md`

### EmailJS (Envoi d'emails)

1. Creer un compte sur https://www.emailjs.com/
2. Ajouter un service email (Gmail, Outlook, etc.)
3. Creer un template avec les variables :
   - `to_email`, `to_name`, `from_name`, `subject`, `message_html`
4. Configurer dans Parametres > Email de l'application

## Structure du projet

```
src/
├── components/          # Composants React
│   ├── actions/         # Gestion des actions
│   ├── budget/          # Suivi budgetaire
│   ├── dashboard/       # Tableau de bord
│   ├── gantt/           # Diagramme de Gantt
│   ├── jalons/          # Gestion des jalons
│   ├── layout/          # Layout principal
│   ├── pert/            # Diagramme PERT
│   ├── proph3t/         # Widget IA
│   ├── prophet/         # Chat IA
│   ├── rapports/        # Rapports et exports
│   ├── risques/         # Gestion des risques
│   ├── settings/        # Parametres
│   ├── shared/          # Composants partages
│   ├── sync/            # Synchronisation
│   └── ui/              # Composants UI de base
├── data/                # Donnees initiales
├── db/                  # Configuration IndexedDB
├── hooks/               # Hooks React personnalises
├── lib/                 # Utilitaires
├── pages/               # Pages de l'application
├── services/            # Services metier
└── types/               # Types TypeScript

cloudflare-worker/       # Proxy API serverless
├── worker.js            # Code du worker
├── wrangler.toml        # Configuration
└── README.md            # Documentation
```

## Scripts NPM

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build de production |
| `npm run preview` | Previsualisation du build |
| `npm run lint` | Verification ESLint |

## Deploiement

### Vercel (Recommande)

1. Connecter le repository GitHub
2. Configurer les variables d'environnement
3. Deployer

### Netlify

1. Build command : `npm run build`
2. Publish directory : `dist`
3. Configurer les variables d'environnement

### Serveur statique

Le dossier `dist/` contient les fichiers statiques a deployer sur n'importe quel serveur web.

## Base de donnees

L'application utilise IndexedDB (via Dexie.js) pour le stockage local :

- **Avantages** : Fonctionne hors-ligne, pas de backend requis
- **Limitation** : Donnees locales au navigateur

Pour une version multi-utilisateurs, implementer une synchronisation avec un backend.

## Support

Pour tout probleme ou suggestion :
- Creer une issue sur le repository
- Contacter l'equipe de developpement

## Licence

Proprietary - COSMOS ANGRE
