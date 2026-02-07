import { useState } from 'react';
import {
  Brain,
  TrendingUp,
  Network,
  Calculator,
  Target,
  GitBranch,
  Calendar,
  Shuffle,
  CloudSun,
  Users,
  BarChart3,
  History,
  Sparkles,
  X,
  ChevronRight,
  Cpu
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================

interface Algorithm {
  id: string;
  name: string;
  category: 'intelligence' | 'planning' | 'finance' | 'sync' | 'prediction';
  icon: React.ElementType;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  usedIn: string[];
  technicalDetails?: string;
}

// ============================================================================
// ALGORITHMS DATA
// ============================================================================

const ALGORITHMS: Algorithm[] = [
  {
    id: 'confidence-score',
    name: 'Score de Confiance',
    category: 'intelligence',
    icon: Brain,
    shortDescription: 'Calcul du niveau de confiance global du projet (0-100)',
    fullDescription: `Le Score de Confiance est un indicateur composite qui évalue la santé globale du projet en combinant plusieurs métriques pondérées. Il utilise un historique sur 30 jours pour calculer les tendances.`,
    features: [
      'Vélocité des actions (taux de complétion dans les délais)',
      'Respect des jalons (% jalons validés à temps)',
      'Maîtrise des risques (score moyen des risques actifs)',
      'Santé budgétaire (taux d\'engagement et réalisation)',
      'Synchronisation Construction/Mobilisation',
      'Tendance sur 7 jours (up/down/stable)',
    ],
    usedIn: ['Dashboard principal', 'Rapport EXCO', 'Module Proph3t'],
    technicalDetails: `Formule: Score = (Vélocité × 25%) + (Jalons × 25%) + (Risques × 20%) + (Budget × 15%) + (Sync × 15%)

Seuils:
- 80-100: Excellent (vert)
- 60-79: Bon (jaune)
- 40-59: Attention (orange)
- 0-39: Critique (rouge)

L'historique est stocké en localStorage avec rétention de 30 jours.`,
  },
  {
    id: 'critical-path',
    name: 'Chemin Critique (CPM/PERT)',
    category: 'planning',
    icon: Network,
    shortDescription: 'Identification du chemin critique et calcul des marges',
    fullDescription: `Implémentation de l'algorithme CPM (Critical Path Method) combiné avec la méthode PERT pour identifier les tâches critiques qui déterminent la durée minimale du projet.`,
    features: [
      'Calcul forward pass (dates au plus tôt)',
      'Calcul backward pass (dates au plus tard)',
      'Identification des marges totales et libres',
      'Détection automatique du chemin critique',
      'Visualisation PERT interactive',
      'Analyse des interdépendances',
    ],
    usedIn: ['Vue PERT Actions', 'Vue PERT Jalons', 'Rapport EXCO slide Chemin Critique'],
    technicalDetails: `Algorithme:
1. Construction du graphe de dépendances (DAG)
2. Tri topologique des nœuds
3. Forward pass: ES(i) = max(EF(prédécesseurs))
4. Backward pass: LF(i) = min(LS(successeurs))
5. Marge totale = LF - EF
6. Chemin critique = nœuds avec marge = 0`,
  },
  {
    id: 'evm',
    name: 'Earned Value Management (EVM)',
    category: 'finance',
    icon: Calculator,
    shortDescription: 'Calcul des indicateurs de performance coût/délai',
    fullDescription: `Le système EVM permet de mesurer objectivement la performance du projet en comparant le travail planifié, le travail réalisé et les coûts réels.`,
    features: [
      'Planned Value (PV) - Valeur planifiée',
      'Earned Value (EV) - Valeur acquise',
      'Actual Cost (AC) - Coût réel',
      'Schedule Performance Index (SPI)',
      'Cost Performance Index (CPI)',
      'Estimate at Completion (EAC)',
      'Variance at Completion (VAC)',
    ],
    usedIn: ['Module Budget', 'Rapport EXCO', 'Proph3t Engine'],
    technicalDetails: `Formules:
- SPI = EV / PV (< 1 = retard, > 1 = avance)
- CPI = EV / AC (< 1 = dépassement, > 1 = économies)
- EAC = BAC / CPI (estimation finale)
- VAC = BAC - EAC (variance finale)

Seuils d'alerte:
- SPI < 0.9 ou CPI < 0.9: Alerte orange
- SPI < 0.8 ou CPI < 0.8: Alerte rouge`,
  },
  {
    id: 'scenarios-impact',
    name: 'Scénarios d\'Impact',
    category: 'prediction',
    icon: Target,
    shortDescription: 'Projections dynamiques en cas de report (1-6 mois)',
    fullDescription: `Algorithme de simulation qui calcule les impacts potentiels d'un report du projet sur chaque axe (RH, Commercial, Technique, Budget, Marketing, Exploitation, Construction, Divers).`,
    features: [
      'Impacts par axe avec niveau de risque',
      'Calcul proportionnel des pertes An1',
      'Facteur d\'accélération non-linéaire',
      'Score de risque global (0-100)',
      'Synthèses transversales (Budget, Planning MOE, GO Commercial)',
      'Coût financier estimé du report',
    ],
    usedIn: ['Rapport EXCO slide Scénarios d\'Impact'],
    technicalDetails: `Calcul des pertes An1:
- moisAn1Effectifs = 12 - moisReport
- Report 1 mois → ~8% perte revenus
- Report 3 mois → ~25% perte revenus
- Report 6 mois → ~50% perte revenus

Facteur d'accélération:
fa = proximiteFactor × dureeFactor
- proximiteFactor = 1 + (12 - moisRestants) / 12
- dureeFactor = 1 + (moisReport - 1) × 0.3`,
  },
  {
    id: 'sync-cc-mob',
    name: 'Synchronisation CC/Mobilisation',
    category: 'sync',
    icon: GitBranch,
    shortDescription: 'Mesure de l\'écart entre avancement construction et mobilisation',
    fullDescription: `Algorithme qui compare l'avancement des phases Construction et Mobilisation Commerciale pour détecter les désynchronisations potentiellement problématiques.`,
    features: [
      'Calcul % avancement Construction (axe7)',
      'Calcul % avancement Mobilisation (axe2 phase mobilisation)',
      'Écart absolu et relatif',
      'Seuils d\'alerte configurables',
      'Scénarios de rattrapage',
      'Recommandations automatiques',
    ],
    usedIn: ['Module Synchronisation', 'Rapport EXCO slide Sync', 'Dashboard'],
    technicalDetails: `Formule écart:
écart = Construction% - Mobilisation%

Statuts:
- |écart| ≤ 5%: Synchronisé (vert)
- |écart| ≤ 15%: Attention (orange)
- |écart| > 15%: Désynchronisé (rouge)

Scénarios de rattrapage calculés avec vitesse d'exécution requise.`,
  },
  {
    id: 'dates-relatives',
    name: 'Dates Relatives au Soft Opening',
    category: 'planning',
    icon: Calendar,
    shortDescription: 'Calcul automatique des dates basé sur les phases du projet',
    fullDescription: `Système de calcul des dates qui utilise des références relatives (J-30, J-7, etc.) par rapport aux jalons de phase, permettant une mise à jour automatique de tout le planning en cas de modification d'une date clé.`,
    features: [
      'Références relatives aux jalons (ex: "phase:soft_opening")',
      'Délais en jours (positifs ou négatifs)',
      'Recalcul automatique en cascade',
      'Respect des dates verrouillées manuellement',
      'Migration automatique des anciennes données',
    ],
    usedIn: ['Formulaire Actions', 'Formulaire Jalons', 'Paramètres Projet'],
    technicalDetails: `Structure de référence:
{
  jalon_reference: "phase:soft_opening",
  delai_declenchement: -30 // J-30
}

Lors du recalcul:
1. Récupérer la date du jalon de référence
2. Appliquer le délai en jours
3. Mettre à jour date_prevue
4. Ignorer si date_verrouillage_manuel = true`,
  },
  {
    id: 'what-if',
    name: 'Simulation What-If',
    category: 'prediction',
    icon: Shuffle,
    shortDescription: 'Simulation d\'impacts en cas de modification de dates',
    fullDescription: `Moteur de simulation qui permet de tester l'impact d'une modification de date sur l'ensemble du planning via le graphe d'interdépendances.`,
    features: [
      'Propagation des impacts via le graphe',
      'Calcul des nouvelles dates au plus tôt',
      'Identification des tâches impactées',
      'Visualisation des dépendances affectées',
      'Comparaison avant/après',
    ],
    usedIn: ['Module Interdépendances', 'Panel What-If'],
    technicalDetails: `Algorithme:
1. Identifier le nœud modifié
2. Parcourir les successeurs (BFS)
3. Pour chaque successeur:
   - Recalculer date_debut = max(date_fin prédécesseurs)
   - Propager si modification
4. Retourner liste des nœuds impactés avec delta`,
  },
  {
    id: 'meteo-projet',
    name: 'Météo Projet',
    category: 'intelligence',
    icon: CloudSun,
    shortDescription: 'Indicateur visuel de la santé globale du projet',
    fullDescription: `Algorithme qui synthétise plusieurs indicateurs pour produire une météo globale du projet (Soleil, Nuageux, Orageux) avec des météos par axe.`,
    features: [
      'Météo globale (Soleil/Nuageux/Orageux)',
      'Météo par axe',
      'Prise en compte de l\'avancement vs objectif',
      'Intégration des actions en retard',
      'Tendance (amélioration/dégradation/stable)',
    ],
    usedIn: ['Dashboard principal', 'Rapport EXCO', 'Rapport Mensuel Manager'],
    technicalDetails: `Calcul météo axe:
- Soleil: avancement ≥ objectif - 5%
- Nuageux: avancement ≥ objectif - 15%
- Orageux: sinon

Météo globale:
- Moyenne pondérée des météos axes
- Pénalité si actions en retard > 10%`,
  },
  {
    id: 'workload-analysis',
    name: 'Analyse de Charge',
    category: 'intelligence',
    icon: Users,
    shortDescription: 'Détection des surcharges et sous-charges par responsable',
    fullDescription: `Algorithme d'analyse de la répartition de charge de travail entre les responsables pour identifier les déséquilibres et optimiser les affectations.`,
    features: [
      'Calcul de charge par responsable',
      'Score de charge (0-100)',
      'Alertes de surcharge (> 80%)',
      'Alertes de sous-charge (< 20%)',
      'Recommandations de rééquilibrage',
    ],
    usedIn: ['Dashboard', 'Vue Responsables'],
    technicalDetails: `Score de charge:
- Nombre d'actions actives
- Pondération par priorité (haute = 3, moyenne = 2, basse = 1)
- Pondération par proximité échéance

Seuils:
- Critique: score > 100
- Élevé: score > 80
- Normal: score 20-80
- Faible: score < 20`,
  },
  {
    id: 'occupancy-projection',
    name: 'Projections d\'Occupation',
    category: 'prediction',
    icon: BarChart3,
    shortDescription: 'Prévision du taux d\'occupation jusqu\'au Grand Opening',
    fullDescription: `Modèle prédictif qui projette l'évolution du taux d'occupation en fonction des actions commerciales en cours et des engagements locataires.`,
    features: [
      'Projection linéaire vers objectif',
      'Intégration des engagements fermes',
      'Scénarios optimiste/réaliste/pessimiste',
      'Timeline visuelle',
      'Recommandations commerciales',
    ],
    usedIn: ['Dashboard Commercial', 'Rapport EXCO'],
    technicalDetails: `Modèle:
1. Taux actuel = surfaces louées / surface totale
2. Vitesse = (taux cible - taux actuel) / jours restants
3. Projection = taux actuel + (vitesse × jours)

Scénarios:
- Optimiste: vitesse × 1.3
- Réaliste: vitesse × 1.0
- Pessimiste: vitesse × 0.7`,
  },
  {
    id: 'audit-diff',
    name: 'Audit Différentiel',
    category: 'sync',
    icon: History,
    shortDescription: 'Suivi automatique des modifications avec historique',
    fullDescription: `Middleware Dexie qui capture automatiquement toutes les modifications sur les entités principales (actions, jalons, risques, budget) avec calcul de diff.`,
    features: [
      'Capture automatique des modifications',
      'Calcul de diff (champs modifiés)',
      'Horodatage précis',
      'Identification de l\'auteur',
      'Source de la modification (UI, import, sync)',
      'Historique consultable par entité',
    ],
    usedIn: ['Toutes les entités', 'Historique des modifications'],
    technicalDetails: `Middleware Dexie sur tables:
- actions, jalons, risques, budget, alertes, budgetExploitation

Structure historique:
{
  date: ISO string,
  auteur: string,
  type: 'creation' | 'modification' | 'suppression',
  source: 'ui' | 'import' | 'sync' | 'migration',
  diff: { field: { old, new } }
}`,
  },
  {
    id: 'proph3t',
    name: 'Proph3t IA Engine',
    category: 'intelligence',
    icon: Sparkles,
    shortDescription: 'Moteur d\'intelligence artificielle pour rapports et recommandations',
    fullDescription: `Moteur d'analyse avancée qui génère des rapports intelligents, des recommandations contextuelles et des prédictions basées sur l'état du projet.`,
    features: [
      'Génération de rapports exécutifs',
      'Recommandations priorisées',
      'Prédictions de risques',
      'Analyse des tendances',
      'Insights proactifs',
      'Intégration API Claude (optionnel)',
    ],
    usedIn: ['Module Proph3t', 'Rapport EXCO', 'Alertes Intelligentes'],
    technicalDetails: `Modes de fonctionnement:
1. Local (proph3tEngine.ts): Algorithmes embarqués
2. API Claude: Analyse IA avancée (si configuré)

Composants:
- calculateEVM(): Indicateurs financiers
- generateSmartRecommendations(): Suggestions contextuelles
- generateHonestReport(): Rapport factuel sans embellissement
- generatePredictions(): Prévisions basées sur les tendances`,
  },
];

const CATEGORY_CONFIG = {
  intelligence: { label: 'Intelligence', color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700' },
  planning: { label: 'Planning', color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700' },
  finance: { label: 'Finance', color: 'green', bg: 'bg-green-100', text: 'text-green-700' },
  sync: { label: 'Synchronisation', color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700' },
  prediction: { label: 'Prédiction', color: 'pink', bg: 'bg-pink-100', text: 'text-pink-700' },
};

// ============================================================================
// MODAL COMPONENT
// ============================================================================

function AlgorithmModal({
  algorithm,
  onClose
}: {
  algorithm: Algorithm;
  onClose: () => void;
}) {
  const Icon = algorithm.icon;
  const category = CATEGORY_CONFIG[algorithm.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{algorithm.name}</h2>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${category.bg} ${category.text}`}>
                {category.label}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-2">
              Description
            </h3>
            <p className="text-primary-700 leading-relaxed">
              {algorithm.fullDescription}
            </p>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-3">
              Fonctionnalités
            </h3>
            <ul className="space-y-2">
              {algorithm.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span className="text-primary-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Used In */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-3">
              Utilisé dans
            </h3>
            <div className="flex flex-wrap gap-2">
              {algorithm.usedIn.map((location, index) => (
                <Badge key={index} variant="secondary">
                  {location}
                </Badge>
              ))}
            </div>
          </div>

          {/* Technical Details */}
          {algorithm.technicalDetails && (
            <div>
              <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-3">
                Détails Techniques
              </h3>
              <pre className="bg-primary-50 rounded-lg p-4 text-sm text-primary-700 overflow-x-auto whitespace-pre-wrap font-mono">
                {algorithm.technicalDetails}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ALGORITHM CARD COMPONENT
// ============================================================================

function AlgorithmCard({
  algorithm,
  onClick
}: {
  algorithm: Algorithm;
  onClick: () => void;
}) {
  const Icon = algorithm.icon;
  const category = CATEGORY_CONFIG[algorithm.category];

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-primary-100 rounded-xl p-4 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${category.bg} group-hover:scale-110 transition-transform`}>
          <Icon className={`h-6 w-6 ${category.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-primary-900 truncate">
              {algorithm.name}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.bg} ${category.text}`}>
              {category.label}
            </span>
          </div>
          <p className="text-sm text-primary-500 line-clamp-2">
            {algorithm.shortDescription}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-primary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AlgorithmsSettings() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredAlgorithms = filterCategory
    ? ALGORITHMS.filter(a => a.category === filterCategory)
    : ALGORITHMS;

  const categories = Object.entries(CATEGORY_CONFIG);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Cpu className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary-900">
              Algorithmes Avancés
            </h3>
            <p className="text-primary-500">
              {ALGORITHMS.length} algorithmes intelligents au service de votre projet
            </p>
          </div>
        </div>

        <p className="text-sm text-primary-600 leading-relaxed">
          Cockpit utilise des algorithmes avancés pour analyser votre projet, calculer des indicateurs,
          détecter des risques et générer des recommandations. Cliquez sur un algorithme pour
          découvrir son fonctionnement détaillé.
        </p>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterCategory === null ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilterCategory(null)}
        >
          Tous ({ALGORITHMS.length})
        </Button>
        {categories.map(([key, config]) => {
          const count = ALGORITHMS.filter(a => a.category === key).length;
          return (
            <Button
              key={key}
              variant={filterCategory === key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterCategory(key)}
              className={filterCategory === key ? '' : `hover:${config.bg}`}
            >
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Algorithms Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredAlgorithms.map(algorithm => (
          <AlgorithmCard
            key={algorithm.id}
            algorithm={algorithm}
            onClick={() => setSelectedAlgorithm(algorithm)}
          />
        ))}
      </div>

      {/* Modal */}
      {selectedAlgorithm && (
        <AlgorithmModal
          algorithm={selectedAlgorithm}
          onClose={() => setSelectedAlgorithm(null)}
        />
      )}
    </div>
  );
}

export default AlgorithmsSettings;
