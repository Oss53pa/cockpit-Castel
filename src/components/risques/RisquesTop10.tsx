import { useState, useMemo } from 'react';
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
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  FileWarning,
  Loader2,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useRisques } from '@/hooks';
import { SEUILS_RISQUES } from '@/data/constants';
import type { Risque } from '@/types';

// Types pour la compatibilité
type RisqueNiveau = 'critique' | 'majeur' | 'modere' | 'faible';

// Fonction pour déterminer le niveau du risque (seuils depuis constants.ts)
const getNiveauRisque = (score: number): RisqueNiveau => {
  if (score >= SEUILS_RISQUES.critique) return 'critique';
  if (score >= SEUILS_RISQUES.majeur) return 'majeur';
  if (score >= SEUILS_RISQUES.modere) return 'modere';
  return 'faible';
};

// Score color helper based on niveau
const getScoreConfig = (niveau: RisqueNiveau) => {
  switch (niveau) {
    case 'critique':
      return { bg: 'bg-error-500', text: 'text-error-700', border: 'border-error-200', bgLight: 'bg-error-50' };
    case 'majeur':
      return { bg: 'bg-warning-500', text: 'text-warning-700', border: 'border-warning-200', bgLight: 'bg-warning-50' };
    case 'modere':
      return { bg: 'bg-info-500', text: 'text-info-700', border: 'border-info-200', bgLight: 'bg-info-50' };
    default:
      return { bg: 'bg-success-500', text: 'text-success-700', border: 'border-success-200', bgLight: 'bg-success-50' };
  }
};

// Get phase label
const getPhaseLabel = (phase: string): string => {
  switch (phase) {
    case 'phase1_preparation': return 'Phase 1 - Préparation';
    case 'phase2_mobilisation': return 'Phase 2 - Mobilisation';
    case 'phase3_lancement': return 'Phase 3 - Lancement';
    case 'phase4_stabilisation': return 'Phase 4 - Stabilisation';
    default: return phase;
  }
};

// Get category label
const getCategoryLabel = (categorie: string): string => {
  switch (categorie) {
    case 'technique': return 'Technique';
    case 'commercial': return 'Commercial';
    case 'rh': return 'RH';
    case 'financier': return 'Financier';
    case 'reglementaire': return 'Réglementaire';
    case 'operationnel': return 'Opérationnel';
    default: return categorie;
  }
};

// Get status badge for mitigation action
const getStatusBadge = (statut?: string) => {
  switch (statut) {
    case 'fait':
      return <Badge variant="success" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Fait</Badge>;
    case 'en_cours':
      return <Badge variant="info" className="text-xs"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs"><Calendar className="h-3 w-3 mr-1" />Planifié</Badge>;
  }
};

// Single Risk Card Component - utilise les données de la DB
function RiskCardDetail({
  risk,
  rank,
  isExpanded,
  onToggle,
}: {
  risk: Risque;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const niveau = getNiveauRisque(risk.score || 0);
  const scoreConfig = getScoreConfig(niveau);

  return (
    <Card className={cn('overflow-hidden', scoreConfig.border, 'border-l-4')}>
      {/* Header */}
      <div
        className={cn('p-4 cursor-pointer', scoreConfig.bgLight)}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Rank Badge */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                #{rank}
              </div>
            </div>
            {/* Score */}
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg', scoreConfig.bg)}>
              {risk.score || 0}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="secondary" className="text-xs font-mono">{risk.id_risque || risk.code_wbs}</Badge>
                <Badge variant="secondary" className="text-xs">{getCategoryLabel(risk.categorie)}</Badge>
                <Badge
                  variant={niveau === 'critique' ? 'error' : niveau === 'majeur' ? 'warning' : 'secondary'}
                  className="text-xs uppercase"
                >
                  {niveau}
                </Badge>
              </div>
              <h3 className="font-semibold text-primary-900">{risk.titre}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-primary-600 flex-wrap">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  P: {risk.probabilite}/4
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  I: {risk.impact}/4
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {risk.proprietaire || '-'}
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
          {/* Phase & Catégorie */}
          <div className="px-4 py-2 bg-primary-50 border-b flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-primary-700 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {risk.phase_projet ? getPhaseLabel(risk.phase_projet) : 'Non défini'}
            </span>
            <span className="text-sm font-medium text-primary-700 flex items-center gap-1">
              <Target className="h-4 w-4" />
              {getCategoryLabel(risk.categorie)}
            </span>
          </div>

          <div className="p-4 space-y-6">
            {/* Description */}
            <div>
              <h4 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-primary-500" />
                Description
              </h4>
              <p className="text-sm text-primary-700">{risk.description || 'Aucune description'}</p>
            </div>

            {/* Plan de mitigation */}
            {risk.plan_mitigation && (
              <div>
                <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-info-500" />
                  Plan de mitigation
                </h4>
                <p className="text-sm text-primary-700">{risk.plan_mitigation}</p>
              </div>
            )}

            {/* Stratégie de réponse */}
            {risk.strategie_reponse && (
              <div className="bg-info-50 rounded-lg p-4">
                <h4 className="font-semibold text-info-800 mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Stratégie de réponse
                </h4>
                <Badge variant="info" className="capitalize">{risk.strategie_reponse}</Badge>
              </div>
            )}

            {/* Indicateurs */}
            {risk.indicateurs_declenchement && (
              <div className="bg-warning-50 rounded-lg p-4">
                <h4 className="font-semibold text-warning-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Indicateurs de déclenchement
                </h4>
                <p className="text-sm text-warning-700">{risk.indicateurs_declenchement}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// Main Component - utilise les données de la DB via useRisques()
export function RisquesTop10() {
  const { data: risquesData, isLoading } = useRisques();

  // Top 10 risques par score (données réelles de la base)
  const top10Risks = useMemo(() => {
    if (!risquesData) return [];
    return [...risquesData]
      .filter(r => r.status !== 'ferme')
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10);
  }, [risquesData]);

  // Synthèse calculée depuis les données réelles
  const synthese = useMemo(() => {
    if (!risquesData) return { total: 0, critique: 0, majeur: 0, modere: 0, faible: 0 };
    const actifs = risquesData.filter(r => r.status !== 'ferme');
    return {
      total: actifs.length,
      critique: actifs.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique).length,
      majeur: actifs.filter(r => (r.score || 0) >= SEUILS_RISQUES.majeur && (r.score || 0) < SEUILS_RISQUES.critique).length,
      modere: actifs.filter(r => (r.score || 0) >= SEUILS_RISQUES.modere && (r.score || 0) < SEUILS_RISQUES.majeur).length,
      faible: actifs.filter(r => (r.score || 0) < SEUILS_RISQUES.modere).length,
    };
  }, [risquesData]);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Expand first risk when data loads
  useMemo(() => {
    if (top10Risks.length > 0 && expandedIds.size === 0 && top10Risks[0]?.id) {
      setExpandedIds(new Set([top10Risks[0].id]));
    }
  }, [top10Risks]);

  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const expandAll = () => {
    setExpandedIds(new Set(top10Risks.map(r => r.id!).filter(Boolean)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Stats calculées depuis données réelles
  const criticalCount = top10Risks.filter(r => (r.score || 0) >= SEUILS_RISQUES.critique).length;
  const majeurCount = top10Risks.filter(r => (r.score || 0) >= SEUILS_RISQUES.majeur && (r.score || 0) < SEUILS_RISQUES.critique).length;
  const avgScore = top10Risks.length > 0
    ? Math.round(top10Risks.reduce((sum, r) => sum + (r.score || 0), 0) / top10Risks.length)
    : 0;

  if (isLoading) {
    return (
      <Card padding="lg" className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2 text-primary-600">Chargement des risques...</span>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error-500" />
              Top 10 Risques Critiques
            </h3>
            <p className="text-sm text-primary-500 mt-1">
              Données temps réel | {synthese.total} risques actifs identifiés
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-error-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-error-700">{criticalCount}</div>
            <div className="text-xs text-error-600">Critiques (Score 12-16)</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-warning-700">{majeurCount}</div>
            <div className="text-xs text-warning-600">Majeurs (Score 8-11)</div>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary-700">{synthese.total}</div>
            <div className="text-xs text-primary-600">Total risques</div>
          </div>
          <div className="bg-info-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-info-700">{avgScore}</div>
            <div className="text-xs text-info-600">Score moyen</div>
          </div>
        </div>

        {/* Synthèse globale */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-primary-500">Total registre:</span>
              <span className="ml-2 font-semibold">{synthese.total} risques</span>
            </div>
            <div>
              <span className="text-error-500">Critiques:</span>
              <span className="ml-2 font-semibold">{synthese.critique}</span>
            </div>
            <div>
              <span className="text-warning-500">Majeurs:</span>
              <span className="ml-2 font-semibold">{synthese.majeur}</span>
            </div>
            <div>
              <span className="text-info-500">Modérés:</span>
              <span className="ml-2 font-semibold">{synthese.modere}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <span className="text-primary-500 font-medium">Légende criticité:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-error-500" />
          <span>Critique (12-16)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning-500" />
          <span>Majeur (8-11)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-info-500" />
          <span>Modéré (4-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success-500" />
          <span>Faible (1-3)</span>
        </div>
      </div>

      {/* Plan de suivi */}
      <Card padding="sm" className="bg-primary-50">
        <h4 className="font-semibold text-primary-900 mb-2 text-sm">Plan de suivi des risques</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="error" className="text-xs">Hebdo</Badge>
            <span className="text-primary-600">Critiques (DGA)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-xs">Bi-mensuel</Badge>
            <span className="text-primary-600">Majeurs (Managers)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-xs">Mensuel</Badge>
            <span className="text-primary-600">Modérés (COPIL)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Trimestriel</Badge>
            <span className="text-primary-600">Faibles + Revue (DGA+PDG)</span>
          </div>
        </div>
      </Card>

      {/* Risk Cards */}
      <div className="space-y-4">
        {top10Risks.length > 0 ? (
          top10Risks.map((risk, index) => (
            <RiskCardDetail
              key={risk.id || index}
              risk={risk}
              rank={index + 1}
              isExpanded={expandedIds.has(risk.id!)}
              onToggle={() => toggleExpand(risk.id!)}
            />
          ))
        ) : (
          <Card padding="lg" className="text-center">
            <AlertTriangle className="h-12 w-12 text-primary-300 mx-auto mb-4" />
            <p className="text-primary-500">Aucun risque identifié dans la base de données</p>
          </Card>
        )}
      </div>
    </div>
  );
}
