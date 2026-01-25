import { useState } from 'react';
import {
  AlertTriangle,
  Shield,
  Target,
  User,
  ChevronDown,
  ChevronUp,
  XCircle,
  AlertCircle,
  TrendingUp,
  Wrench,
  ArrowUpCircle,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

// Types
interface MitigationAction {
  action: string;
  responsable: string;
  deadline: string;
}

interface RiskCard {
  id: string;
  titre: string;
  categorie: string;
  probabilite: number;
  impact: number;
  score: number;
  scoreLevel: 'critical' | 'high' | 'medium' | 'low';
  axe: string;
  responsable: string;
  causes: string[];
  consequences: string[];
  mitigationPlan: MitigationAction[];
  contingencyPlan: string[];
  alertIndicators: string[];
  escalationThreshold: string;
}

// Top 10 Risk Data
const TOP_10_RISKS: RiskCard[] = [
  {
    id: 'R-001',
    titre: 'Retard significatif dans la livraison du chantier',
    categorie: 'Technique',
    probabilite: 4,
    impact: 5,
    score: 20,
    scoreLevel: 'critical',
    axe: 'AXE 3 - Technique & Handover',
    responsable: 'Facility Manager',
    causes: [
      'Retards approvisionnement matériaux',
      'Difficultés main d\'œuvre qualifiée',
      'Intempéries exceptionnelles',
      'Problèmes financiers constructeur',
      'Modifications demandées en cours de chantier',
    ],
    consequences: [
      'Report soft opening / inauguration',
      'Pénalités envers les preneurs (BEFA)',
      'Surcoûts équipe mobilisée sans activité',
      'Impact réputation / communication',
      'Perte de preneurs (désistements)',
    ],
    mitigationPlan: [
      { action: 'Réunions chantier hebdomadaires obligatoires', responsable: 'DGA', deadline: 'Continu' },
      { action: 'Clause pénalités retard dans contrat constructeur', responsable: 'Juridique', deadline: 'Fait' },
      { action: 'Identification anticipée des lots critiques', responsable: 'FM', deadline: 'Février 2026' },
      { action: 'Plan de rattrapage pré-établi', responsable: 'FM', deadline: 'Mars 2026' },
      { action: 'Suivi météo et planning intempéries', responsable: 'FM', deadline: 'Continu' },
    ],
    contingencyPlan: [
      'Décaler soft opening de 2-4 semaines maximum',
      'Communication transparente aux preneurs',
      'Négociation compensations preneurs',
      'Réorganisation équipes (mise en standby partielle)',
    ],
    alertIndicators: [
      'Retard constaté > 2 semaines sur planning',
      'Plus de 3 lots en retard simultanément',
      'Constructeur ne répond plus aux convocations',
    ],
    escalationThreshold: 'DGA → PDG si retard > 1 mois',
  },
  {
    id: 'R-002',
    titre: 'Mauvaise coordination entre fin de chantier et démarrage fit-out preneurs',
    categorie: 'Technique / Organisationnel',
    probabilite: 4,
    impact: 4,
    score: 16,
    scoreLevel: 'critical',
    axe: 'AXE 3',
    responsable: 'Facility Manager',
    causes: [
      'Planning non intégré chantier/fit-out',
      'Communication défaillante constructeur/preneurs',
      'Accès chantier non sécurisés pour travaux simultanés',
      'Interférences entre corps de métier',
    ],
    consequences: [
      'Retards fit-out preneurs',
      'Boutiques non prêtes à l\'ouverture',
      'Conflits juridiques avec preneurs',
      'Accidents de chantier',
    ],
    mitigationPlan: [
      { action: 'Planning intégré unique chantier + fit-out', responsable: 'FM', deadline: 'Mars 2026' },
      { action: 'Réunion coordination hebdo avec preneurs', responsable: 'Commercial', deadline: 'À partir de M-5' },
      { action: 'Zones fit-out livrées par phases définies', responsable: 'FM', deadline: 'Planning validé' },
      { action: 'Assurance tous risques chantier étendue', responsable: 'Admin', deadline: 'Avant fit-out' },
    ],
    contingencyPlan: [],
    alertIndicators: [
      'Preneur ne peut pas accéder à son local à la date prévue',
      'Plus de 2 conflits de planning par semaine',
    ],
    escalationThreshold: '',
  },
  {
    id: 'R-003',
    titre: 'Objectif de 70% d\'occupation non atteint au soft opening',
    categorie: 'Commercial',
    probabilite: 3,
    impact: 5,
    score: 15,
    scoreLevel: 'critical',
    axe: 'AXE 2 - Commercialisation',
    responsable: 'Commercial Manager',
    causes: [
      'Conjoncture économique défavorable',
      'Concurrence agressive (autres centres)',
      'Loyers trop élevés vs marché',
      'Manque d\'attractivité du projet',
      'Locomotive (Carrefour) ne signe pas',
    ],
    consequences: [
      'Image négative à l\'ouverture (boutiques vides)',
      'Revenus insuffisants pour couvrir charges',
      'Spirale négative (preneurs hésitent si peu de voisins)',
      'Pression sur la trésorerie',
    ],
    mitigationPlan: [
      { action: 'Signer Carrefour en priorité absolue', responsable: 'DGA', deadline: 'Mars 2026' },
      { action: 'Objectifs commercialisation mensuels stricts', responsable: 'Commercial', deadline: 'Continu' },
      { action: 'Incentives preneurs (mois gratuits, fit-out)', responsable: 'DGA', deadline: 'Si nécessaire' },
      { action: 'Grille tarifaire flexible selon timing', responsable: 'Commercial', deadline: 'Validé' },
      { action: 'Pipeline de backup pour chaque emplacement', responsable: 'Commercial', deadline: 'Continu' },
    ],
    contingencyPlan: [
      'Pop-up stores temporaires dans cellules vides',
      'Habillage des vitrines vides (coming soon)',
      'Report inauguration (soft opening maintenu)',
      'Révision à la baisse des loyers ciblée',
    ],
    alertIndicators: [
      '< 50% BEFA signés au 30/06',
      '< 60% occupation confirmée au 30/09',
      'Carrefour non signé au 31/03',
    ],
    escalationThreshold: '',
  },
  {
    id: 'R-004',
    titre: 'Carrefour ne signe pas ou se retire du projet',
    categorie: 'Commercial',
    probabilite: 2,
    impact: 5,
    score: 10,
    scoreLevel: 'high',
    axe: 'AXE 2',
    responsable: 'DGA',
    causes: [
      'Stratégie groupe Carrefour change',
      'Conditions commerciales non acceptables',
      'Retards chantier inacceptables pour eux',
      'Concurrent propose meilleur deal',
    ],
    consequences: [
      'Perte d\'attractivité majeure du centre',
      'Autres preneurs se retirent',
      'Repositionnement complet nécessaire',
      'Retard ouverture probable',
    ],
    mitigationPlan: [
      { action: 'Négociation prioritaire et dédiée', responsable: 'DGA', deadline: 'T1 2026' },
      { action: 'Conditions préférentielles (loyer, fit-out)', responsable: 'DGA', deadline: 'Négociation' },
      { action: 'Identification alternatives (Auchan, Casino, Prosuma)', responsable: 'Commercial', deadline: 'Février 2026' },
      { action: 'LOI signée rapidement pour engagement', responsable: 'DGA', deadline: 'Février 2026' },
    ],
    contingencyPlan: [
      'Approcher immédiatement alternative #1',
      'Revoir le concept (plusieurs moyennes surfaces vs 1 grande)',
      'Adapter la communication',
    ],
    alertIndicators: [],
    escalationThreshold: '',
  },
  {
    id: 'R-005',
    titre: 'La commission de sécurité émet un avis défavorable',
    categorie: 'Réglementaire',
    probabilite: 2,
    impact: 5,
    score: 10,
    scoreLevel: 'high',
    axe: 'AXE 6 - Exploitation',
    responsable: 'DGA + Security Manager',
    causes: [
      'SSI non conforme ou non opérationnel',
      'Issues de secours insuffisantes ou bloquées',
      'Documentation incomplète',
      'Formation personnel insuffisante',
      'Non-conformités fit-out preneurs',
    ],
    consequences: [
      'INTERDICTION D\'OUVRIR',
      'Report indéterminé de l\'ouverture',
      'Coûts de mise en conformité',
      'Catastrophe réputationnelle',
    ],
    mitigationPlan: [
      { action: 'Pré-visite commission (informelle)', responsable: 'DGA', deadline: 'Septembre 2026' },
      { action: 'Bureau de contrôle agréé pour validation', responsable: 'FM', deadline: 'Continu' },
      { action: 'Exercice évacuation avant commission', responsable: 'Security', deadline: 'Octobre 2026' },
      { action: 'Dossier sécurité complet préparé', responsable: 'Security', deadline: 'Octobre 2026' },
      { action: 'Vérification conformité fit-out preneurs', responsable: 'FM', deadline: 'Octobre 2026' },
    ],
    contingencyPlan: [
      'Travaux correctifs en urgence',
      'Report ouverture 2-4 semaines',
      'Nouvelle demande de passage commission',
    ],
    alertIndicators: [
      'Remarques négatives bureau de contrôle',
      'SSI non opérationnel à M-1',
      'Preneurs non conformes à M-1',
    ],
    escalationThreshold: '',
  },
  {
    id: 'R-006',
    titre: 'Carrefour n\'est pas prêt à ouvrir au soft opening',
    categorie: 'Technique / Commercial',
    probabilite: 3,
    impact: 5,
    score: 15,
    scoreLevel: 'critical',
    axe: 'AXE 3',
    responsable: 'FM + Commercial',
    causes: [],
    consequences: [],
    mitigationPlan: [
      { action: 'Livraison local Carrefour prioritaire', responsable: 'FM', deadline: 'Juin 2026' },
      { action: 'Réunions hebdo dédiées Carrefour', responsable: 'Commercial', deadline: 'À partir de M-6' },
      { action: 'Jalons intermédiaires contractuels', responsable: 'Juridique', deadline: 'Dans BEFA' },
      { action: 'Accès chantier privilégié', responsable: 'FM', deadline: 'Dès livraison local' },
    ],
    contingencyPlan: [],
    alertIndicators: [],
    escalationThreshold: '',
  },
  {
    id: 'R-007',
    titre: 'Impossibilité de recruter les managers clés dans les délais',
    categorie: 'RH',
    probabilite: 3,
    impact: 4,
    score: 12,
    scoreLevel: 'critical',
    axe: 'AXE 1',
    responsable: 'DGA',
    causes: [],
    consequences: [],
    mitigationPlan: [
      { action: 'Mandat 2-3 cabinets de recrutement', responsable: 'DGA', deadline: 'Janvier 2026' },
      { action: 'Packages salariaux compétitifs', responsable: 'DGA', deadline: 'Validé' },
      { action: 'Recherche régionale (Ghana, Sénégal)', responsable: 'DGA', deadline: 'Si nécessaire' },
      { action: 'Backup : promotion interne Cosmos Yopougon', responsable: 'DGA', deadline: 'Plan B' },
    ],
    contingencyPlan: [],
    alertIndicators: [],
    escalationThreshold: '',
  },
  {
    id: 'R-008',
    titre: 'Le budget projet dépasse les 1,85 milliards prévus',
    categorie: 'Financier',
    probabilite: 4,
    impact: 4,
    score: 16,
    scoreLevel: 'critical',
    axe: 'AXE 4',
    responsable: 'DGA + Finance',
    causes: [],
    consequences: [],
    mitigationPlan: [
      { action: 'Provisions imprévus 10% intégrées', responsable: 'Finance', deadline: 'Fait' },
      { action: 'Revue budgétaire mensuelle', responsable: 'Finance', deadline: 'Continu' },
      { action: 'Validation DGA pour tout dépassement > 5M', responsable: 'DGA', deadline: 'Règle' },
      { action: 'Arbitrages trimestriels formalisés', responsable: 'DGA', deadline: 'T1, T2, T3' },
    ],
    contingencyPlan: [],
    alertIndicators: [],
    escalationThreshold: '',
  },
  {
    id: 'R-009',
    titre: 'Prestataires (nettoyage, sécurité) ne sont pas au niveau',
    categorie: 'Opérationnel',
    probabilite: 3,
    impact: 4,
    score: 12,
    scoreLevel: 'critical',
    axe: 'AXE 6',
    responsable: 'Center Manager',
    causes: [],
    consequences: [],
    mitigationPlan: [
      { action: 'Appel d\'offres avec critères stricts', responsable: 'FM', deadline: 'Avril 2026' },
      { action: 'Visite références obligatoire', responsable: 'FM', deadline: 'Sélection' },
      { action: 'Période d\'essai contractuelle (3 mois)', responsable: 'Juridique', deadline: 'Dans contrats' },
      { action: 'KPIs et pénalités dans contrats', responsable: 'Juridique', deadline: 'Dans contrats' },
      { action: 'Backup prestataire identifié', responsable: 'FM', deadline: 'Avant signature' },
    ],
    contingencyPlan: [],
    alertIndicators: [],
    escalationThreshold: '',
  },
  {
    id: 'R-010',
    titre: 'ERP, GMAO, système parking non opérationnels à l\'ouverture',
    categorie: 'Technique / IT',
    probabilite: 3,
    impact: 4,
    score: 12,
    scoreLevel: 'critical',
    axe: 'AXE 6',
    responsable: 'Center Manager',
    causes: [],
    consequences: [],
    mitigationPlan: [
      { action: 'Sélection éditeurs dès T1', responsable: 'Admin', deadline: 'Mars 2026' },
      { action: 'Paramétrage démarré M-5', responsable: 'Admin', deadline: 'Juin 2026' },
      { action: 'Tests complets M-2', responsable: 'Admin', deadline: 'Septembre 2026' },
      { action: 'Formation utilisateurs M-1', responsable: 'Admin', deadline: 'Octobre 2026' },
      { action: 'Procédures dégradées (papier) prévues', responsable: 'Admin', deadline: 'Octobre 2026' },
    ],
    contingencyPlan: [],
    alertIndicators: [],
    escalationThreshold: '',
  },
];

// Score color helper
const getScoreConfig = (level: 'critical' | 'high' | 'medium' | 'low') => {
  switch (level) {
    case 'critical':
      return { bg: 'bg-error-500', text: 'text-error-700', border: 'border-error-200', bgLight: 'bg-error-50' };
    case 'high':
      return { bg: 'bg-warning-500', text: 'text-warning-700', border: 'border-warning-200', bgLight: 'bg-warning-50' };
    case 'medium':
      return { bg: 'bg-info-500', text: 'text-info-700', border: 'border-info-200', bgLight: 'bg-info-50' };
    default:
      return { bg: 'bg-success-500', text: 'text-success-700', border: 'border-success-200', bgLight: 'bg-success-50' };
  }
};

// Single Risk Card Component
function RiskCardDetail({ risk, isExpanded, onToggle }: { risk: RiskCard; isExpanded: boolean; onToggle: () => void }) {
  const scoreConfig = getScoreConfig(risk.scoreLevel);

  return (
    <Card className={cn('overflow-hidden', scoreConfig.border, 'border-l-4')}>
      {/* Header */}
      <div
        className={cn('p-4 cursor-pointer', scoreConfig.bgLight)}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold', scoreConfig.bg)}>
              {risk.score}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">{risk.id}</Badge>
                <Badge variant="secondary" className="text-xs">{risk.categorie}</Badge>
              </div>
              <h3 className="font-semibold text-primary-900">{risk.titre}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-primary-600">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  P: {risk.probabilite}/5
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  I: {risk.impact}/5
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {risk.responsable}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t">
          {/* Axe */}
          <div className="px-4 py-2 bg-primary-50 border-b">
            <span className="text-sm font-medium text-primary-700">
              <Target className="h-4 w-4 inline mr-2" />
              {risk.axe}
            </span>
          </div>

          <div className="p-4 space-y-6">
            {/* Causes */}
            {risk.causes.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-error-500" />
                  Causes potentielles
                </h4>
                <ul className="space-y-1">
                  {risk.causes.map((cause, i) => (
                    <li key={i} className="text-sm text-primary-700 flex items-start gap-2">
                      <span className="text-error-400 mt-1">•</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Consequences */}
            {risk.consequences.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning-500" />
                  Conséquences
                </h4>
                <ul className="space-y-1">
                  {risk.consequences.map((cons, i) => (
                    <li key={i} className="text-sm text-primary-700 flex items-start gap-2">
                      <span className="text-warning-400 mt-1">•</span>
                      {cons}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mitigation Plan */}
            {risk.mitigationPlan.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-info-500" />
                  Plan de mitigation
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary-50">
                        <th className="px-3 py-2 text-left font-medium text-primary-700">Action</th>
                        <th className="px-3 py-2 text-left font-medium text-primary-700 w-32">Responsable</th>
                        <th className="px-3 py-2 text-left font-medium text-primary-700 w-32">Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {risk.mitigationPlan.map((action, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-primary-50/50'}>
                          <td className="px-3 py-2 text-primary-800">{action.action}</td>
                          <td className="px-3 py-2 text-primary-600">{action.responsable}</td>
                          <td className="px-3 py-2">
                            <Badge variant={action.deadline === 'Fait' ? 'success' : action.deadline === 'Continu' ? 'info' : 'secondary'} className="text-xs">
                              {action.deadline}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Contingency Plan */}
            {risk.contingencyPlan.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-purple-500" />
                  Plan de contingence (si le risque se réalise)
                </h4>
                <ul className="space-y-1">
                  {risk.contingencyPlan.map((plan, i) => (
                    <li key={i} className="text-sm text-primary-700 flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alert Indicators */}
            {risk.alertIndicators.length > 0 && (
              <div className="bg-warning-50 rounded-lg p-4">
                <h4 className="font-semibold text-warning-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Indicateurs d'alerte
                </h4>
                <ul className="space-y-1">
                  {risk.alertIndicators.map((indicator, i) => (
                    <li key={i} className="text-sm text-warning-700 flex items-start gap-2">
                      <span className="text-warning-500 mt-1">⚠</span>
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Escalation */}
            {risk.escalationThreshold && (
              <div className="bg-error-50 rounded-lg p-4">
                <h4 className="font-semibold text-error-800 mb-1 flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  Seuil d'escalade
                </h4>
                <p className="text-sm text-error-700">{risk.escalationThreshold}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// Main Component
export function RisquesTop10() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['R-001']));

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const expandAll = () => {
    setExpandedIds(new Set(TOP_10_RISKS.map(r => r.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Stats
  const criticalCount = TOP_10_RISKS.filter(r => r.scoreLevel === 'critical').length;
  const highCount = TOP_10_RISKS.filter(r => r.scoreLevel === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error-500" />
              Fiches Risques Top 10
            </h3>
            <p className="text-sm text-primary-500 mt-1">
              Analyse détaillée des 10 risques majeurs du projet COSMOS ANGRE
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Tout déplier
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Tout replier
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-error-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-error-700">{criticalCount}</div>
            <div className="text-xs text-error-600">Critiques (≥12)</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-warning-700">{highCount}</div>
            <div className="text-xs text-warning-600">Élevés (≥9)</div>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary-700">
              {TOP_10_RISKS.reduce((sum, r) => sum + r.mitigationPlan.length, 0)}
            </div>
            <div className="text-xs text-primary-600">Actions mitigation</div>
          </div>
          <div className="bg-info-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-info-700">
              {Math.round(TOP_10_RISKS.reduce((sum, r) => sum + r.score, 0) / TOP_10_RISKS.length)}
            </div>
            <div className="text-xs text-info-600">Score moyen</div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-primary-500 font-medium">Légende:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-error-500" />
          <span>Critique (≥12)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning-500" />
          <span>Élevé (9-11)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-info-500" />
          <span>Modéré (5-8)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success-500" />
          <span>Faible (&lt;5)</span>
        </div>
      </div>

      {/* Risk Cards */}
      <div className="space-y-4">
        {TOP_10_RISKS.map((risk) => (
          <RiskCardDetail
            key={risk.id}
            risk={risk}
            isExpanded={expandedIds.has(risk.id)}
            onToggle={() => toggleExpand(risk.id)}
          />
        ))}
      </div>
    </div>
  );
}
