/**
 * AxisRisks - Analyse des risques spécifiques à un axe
 */

import { useMemo } from 'react';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Risque } from '@/types';
import { RISQUE_CATEGORY_LABELS, RISQUE_STATUS_LABELS } from '@/types';

interface AxisRisksProps {
  risques: Risque[];
  axeColor: string;
}

const scoreConfig = {
  critique: { min: 12, label: 'Critique', color: 'text-error-600', bgColor: 'bg-error-100' },
  majeur: { min: 8, label: 'Majeur', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  modere: { min: 4, label: 'Modéré', color: 'text-warning-600', bgColor: 'bg-warning-100' },
  faible: { min: 0, label: 'Faible', color: 'text-success-600', bgColor: 'bg-success-100' },
};

const getScoreLevel = (score: number) => {
  if (score >= 12) return scoreConfig.critique;
  if (score >= 8) return scoreConfig.majeur;
  if (score >= 4) return scoreConfig.modere;
  return scoreConfig.faible;
};

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  ouvert: { color: 'text-error-600', bgColor: 'bg-error-100', icon: AlertTriangle },
  en_analyse: { color: 'text-info-600', bgColor: 'bg-info-100', icon: Shield },
  attenue: { color: 'text-warning-600', bgColor: 'bg-warning-100', icon: TrendingDown },
  transfere: { color: 'text-primary-600', bgColor: 'bg-primary-100', icon: Minus },
  accepte: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: CheckCircle },
  ferme: { color: 'text-success-600', bgColor: 'bg-success-100', icon: CheckCircle },
  materialise: { color: 'text-error-700', bgColor: 'bg-error-200', icon: XCircle },
};

export function AxisRisks({ risques, axeColor }: AxisRisksProps) {
  // Statistiques
  const stats = useMemo(() => {
    const actifs = risques.filter(r => r.status !== 'ferme' && r.status !== 'materialise');
    const critiques = actifs.filter(r => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return score >= 12;
    });
    const sansPlans = actifs.filter(r => !r.plan_mitigation && !r.mesures_attenuation);
    const fermes = risques.filter(r => r.status === 'ferme');

    // Score moyen
    const scoreTotal = actifs.reduce((sum, r) => {
      const score = r.score || (r.probabilite || 0) * (r.impact || 0);
      return sum + score;
    }, 0);
    const scoreMoyen = actifs.length > 0 ? scoreTotal / actifs.length : 0;

    // Répartition par catégorie
    const parCategorie: Record<string, number> = {};
    actifs.forEach(r => {
      const cat = r.categorie || 'autre';
      parCategorie[cat] = (parCategorie[cat] || 0) + 1;
    });

    return {
      total: risques.length,
      actifs: actifs.length,
      critiques: critiques.length,
      sansPlans: sansPlans.length,
      fermes: fermes.length,
      scoreMoyen,
      parCategorie,
    };
  }, [risques]);

  // Risques triés par score
  const sortedRisques = useMemo(() => {
    return [...risques]
      .filter(r => r.status !== 'ferme')
      .sort((a, b) => {
        const scoreA = a.score || (a.probabilite || 0) * (a.impact || 0);
        const scoreB = b.score || (b.probabilite || 0) * (b.impact || 0);
        return scoreB - scoreA;
      });
  }, [risques]);

  // Calcul du score
  const getScore = (risque: Risque): number => {
    return risque.score || (risque.probabilite || 0) * (risque.impact || 0);
  };

  if (risques.length === 0) {
    return (
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" style={{ color: axeColor }} />
          <h3 className="text-lg font-semibold text-primary-900">Risques</h3>
        </div>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto text-success-300 mb-2" />
          <p className="text-success-600 font-medium">Aucun risque identifié pour cet axe</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" style={{ color: axeColor }} />
          <h3 className="text-lg font-semibold text-primary-900">
            Risques ({stats.actifs} actifs)
          </h3>
        </div>
        <div className="flex gap-2">
          {stats.critiques > 0 && (
            <Badge variant="error">{stats.critiques} critiques</Badge>
          )}
          {stats.sansPlans > 0 && (
            <Badge variant="warning">{stats.sansPlans} sans plan</Badge>
          )}
          <Badge variant="success">{stats.fermes} fermés</Badge>
        </div>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Score moyen */}
        <div className={cn(
          'p-3 rounded-lg',
          getScoreLevel(stats.scoreMoyen).bgColor
        )}>
          <p className="text-xs text-gray-600">Score moyen</p>
          <p className={cn('text-2xl font-bold', getScoreLevel(stats.scoreMoyen).color)}>
            {stats.scoreMoyen.toFixed(1)}
          </p>
          <p className={cn('text-xs', getScoreLevel(stats.scoreMoyen).color)}>
            {getScoreLevel(stats.scoreMoyen).label}
          </p>
        </div>

        {/* Risques critiques */}
        <div className={cn(
          'p-3 rounded-lg',
          stats.critiques > 0 ? 'bg-error-100' : 'bg-success-100'
        )}>
          <p className="text-xs text-gray-600">Critiques (≥12)</p>
          <p className={cn(
            'text-2xl font-bold',
            stats.critiques > 0 ? 'text-error-600' : 'text-success-600'
          )}>
            {stats.critiques}
          </p>
          <p className={cn(
            'text-xs',
            stats.critiques > 0 ? 'text-error-600' : 'text-success-600'
          )}>
            {stats.critiques > 0 ? 'À traiter en priorité' : 'Aucun'}
          </p>
        </div>

        {/* Sans plan */}
        <div className={cn(
          'p-3 rounded-lg',
          stats.sansPlans > 0 ? 'bg-warning-100' : 'bg-success-100'
        )}>
          <p className="text-xs text-gray-600">Sans mitigation</p>
          <p className={cn(
            'text-2xl font-bold',
            stats.sansPlans > 0 ? 'text-warning-600' : 'text-success-600'
          )}>
            {stats.sansPlans}
          </p>
          <p className={cn(
            'text-xs',
            stats.sansPlans > 0 ? 'text-warning-600' : 'text-success-600'
          )}>
            {stats.sansPlans > 0 ? 'Plans à définir' : 'Tous couverts'}
          </p>
        </div>

        {/* Fermés */}
        <div className="p-3 rounded-lg bg-gray-100">
          <p className="text-xs text-gray-600">Fermés</p>
          <p className="text-2xl font-bold text-gray-700">{stats.fermes}</p>
          <p className="text-xs text-gray-500">Risques traités</p>
        </div>
      </div>

      {/* Matrice simplifiée */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Répartition par criticité</p>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
          {Object.entries({
            critique: risques.filter(r => getScore(r) >= 12 && r.status !== 'ferme').length,
            majeur: risques.filter(r => getScore(r) >= 8 && getScore(r) < 12 && r.status !== 'ferme').length,
            modere: risques.filter(r => getScore(r) >= 4 && getScore(r) < 8 && r.status !== 'ferme').length,
            faible: risques.filter(r => getScore(r) < 4 && r.status !== 'ferme').length,
          }).map(([level, count]) => {
            if (count === 0) return null;
            const config = scoreConfig[level as keyof typeof scoreConfig];
            const percent = (count / stats.actifs) * 100;
            return (
              <div
                key={level}
                className={cn('h-full', config.bgColor.replace('bg-', 'bg-').replace('-100', '-500'))}
                style={{ width: `${percent}%` }}
                title={`${config.label}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Faible</span>
          <span>Critique</span>
        </div>
      </div>

      {/* Liste des risques */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Score</TableHead>
              <TableHead>Risque</TableHead>
              <TableHead className="w-24">Catégorie</TableHead>
              <TableHead className="w-20">P × I</TableHead>
              <TableHead className="w-24">Statut</TableHead>
              <TableHead className="w-32">Mitigation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRisques.slice(0, 10).map((risque) => {
              const score = getScore(risque);
              const level = getScoreLevel(score);
              const status = statusConfig[risque.status || 'ouvert'] || statusConfig.ouvert;
              const StatusIcon = status.icon;
              const hasPlan = !!(risque.plan_mitigation || risque.mesures_attenuation);

              return (
                <TableRow key={risque.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg',
                      level.bgColor,
                      level.color
                    )}>
                      {score}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{risque.titre}</p>
                      {risque.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {risque.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {RISQUE_CATEGORY_LABELS[risque.categorie as keyof typeof RISQUE_CATEGORY_LABELS] || risque.categorie}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-medium">{risque.probabilite || '?'}</span>
                      <span className="text-gray-400">×</span>
                      <span className="font-medium">{risque.impact || '?'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      status.bgColor,
                      status.color
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      {RISQUE_STATUS_LABELS[risque.status as keyof typeof RISQUE_STATUS_LABELS] || risque.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hasPlan ? (
                      <div className="flex items-center gap-1 text-success-600">
                        <Shield className="h-4 w-4" />
                        <span className="text-xs">Plan défini</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-warning-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs">À définir</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {sortedRisques.length > 10 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          + {sortedRisques.length - 10} autres risques
        </p>
      )}
    </Card>
  );
}

export default AxisRisks;
