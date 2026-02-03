/**
 * AxisHeader - En-tête du Deep Dive avec score santé et météo de l'axe
 */

import { useMemo } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Action, Jalon, Risque } from '@/types';

interface AxisHeaderProps {
  axe: string;
  label: string;
  icon: React.ElementType;
  color: string;
  actions: Action[];
  jalons: Jalon[];
  risques: Risque[];
  avancementPrevu: number;
  avancementRealise: number;
}

type MeteoType = 'soleil' | 'soleil_nuage' | 'nuage' | 'pluie';

const meteoConfig: Record<MeteoType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  soleil: { label: 'Excellent', icon: Sun, color: 'text-success-600', bgColor: 'bg-success-100' },
  soleil_nuage: { label: 'Bon', icon: CloudSun, color: 'text-warning-600', bgColor: 'bg-warning-100' },
  nuage: { label: 'Vigilance', icon: Cloud, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  pluie: { label: 'Critique', icon: CloudRain, color: 'text-error-600', bgColor: 'bg-error-100' },
};

// Safe helper to get meteo config with fallback
const getMeteoConfig = (meteo: string) => {
  return meteoConfig[meteo as MeteoType] || meteoConfig.soleil_nuage;
};

export function AxisHeader({
  axe,
  label,
  icon: AxisIcon,
  color,
  actions,
  jalons,
  risques,
  avancementPrevu,
  avancementRealise,
}: AxisHeaderProps) {
  // Calculs des métriques
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    // Actions
    const actionsTerminees = actions.filter(a => a.statut === 'termine').length;
    const actionsEnRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
    ).length;
    const actionsBloquees = actions.filter(a => a.statut === 'bloque').length;

    // Jalons
    const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
    const jalonsEnRetard = jalons.filter(j =>
      j.statut !== 'atteint' && j.date_prevue && j.date_prevue < today
    ).length;

    // Risques
    const risquesCritiques = risques.filter(r =>
      (r.score || (r.probabilite || 0) * (r.impact || 0)) >= 12 && r.status !== 'ferme'
    ).length;

    // Score de santé (0-100)
    const scoreAvancement = Math.min(100, (avancementRealise / Math.max(1, avancementPrevu)) * 40);
    const scoreActions = Math.max(0, 30 - (actionsEnRetard * 5) - (actionsBloquees * 10));
    const scoreRisques = Math.max(0, 30 - (risquesCritiques * 10));
    const scoreSante = Math.round(scoreAvancement + scoreActions + scoreRisques);

    // Vélocité
    const velocite = avancementPrevu > 0 ? (avancementRealise / avancementPrevu) * 100 : 0;

    // Météo
    let meteo: MeteoType = 'soleil';
    if (scoreSante < 40 || actionsEnRetard >= 5 || risquesCritiques >= 3) {
      meteo = 'pluie';
    } else if (scoreSante < 60 || actionsEnRetard >= 3 || risquesCritiques >= 2) {
      meteo = 'nuage';
    } else if (scoreSante < 80 || actionsEnRetard >= 1 || risquesCritiques >= 1) {
      meteo = 'soleil_nuage';
    }

    return {
      actionsTotal: actions.length,
      actionsTerminees,
      actionsEnRetard,
      actionsBloquees,
      jalonsTotal: jalons.length,
      jalonsAtteints,
      jalonsEnRetard,
      risquesTotal: risques.length,
      risquesCritiques,
      scoreSante,
      velocite,
      meteo,
    };
  }, [actions, jalons, risques, avancementPrevu, avancementRealise]);

  const MeteoIcon = getMeteoConfig(metrics.meteo).icon;
  const ecart = avancementRealise - avancementPrevu;

  return (
    <Card padding="lg" className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Identité de l'axe */}
        <div className="flex items-center gap-4">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: `${color}20` }}
          >
            <AxisIcon className="h-8 w-8" style={{ color }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary-900">{label}</h2>
            <p className="text-sm text-primary-500">Deep Dive détaillé</p>
          </div>
        </div>

        {/* Météo et Score */}
        <div className="flex items-center gap-6">
          {/* Météo */}
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl',
            getMeteoConfig(metrics.meteo).bgColor
          )}>
            <MeteoIcon className={cn('h-8 w-8', getMeteoConfig(metrics.meteo).color)} />
            <div>
              <p className="text-xs text-gray-600">Météo</p>
              <p className={cn('font-bold', getMeteoConfig(metrics.meteo).color)}>
                {getMeteoConfig(metrics.meteo).label}
              </p>
            </div>
          </div>

          {/* Score Santé */}
          <div className="text-center">
            <div className={cn(
              'text-4xl font-bold',
              metrics.scoreSante >= 70 ? 'text-success-600' :
              metrics.scoreSante >= 50 ? 'text-warning-600' :
              'text-error-600'
            )}>
              {metrics.scoreSante}
            </div>
            <p className="text-xs text-gray-500">Score Santé</p>
          </div>

          {/* Vélocité */}
          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold flex items-center gap-1',
              metrics.velocite >= 90 ? 'text-success-600' :
              metrics.velocite >= 70 ? 'text-warning-600' :
              'text-error-600'
            )}>
              {metrics.velocite >= 100 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {metrics.velocite.toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500">Vélocité</p>
          </div>
        </div>
      </div>

      {/* Barre d'avancement */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Avancement: {avancementRealise}% réalisé vs {avancementPrevu}% prévu
          </span>
          <Badge variant={ecart >= 0 ? 'success' : 'error'}>
            {ecart >= 0 ? '+' : ''}{ecart}%
          </Badge>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden relative">
          {/* Barre prévu */}
          <div
            className="absolute h-full bg-gray-300 rounded-full"
            style={{ width: `${avancementPrevu}%` }}
          />
          {/* Barre réalisé */}
          <div
            className={cn(
              'absolute h-full rounded-full transition-all duration-500',
              avancementRealise >= avancementPrevu ? 'bg-success-500' :
              avancementRealise >= avancementPrevu * 0.8 ? 'bg-warning-500' :
              'bg-error-500'
            )}
            style={{ width: `${avancementRealise}%` }}
          />
        </div>
      </div>

      {/* Métriques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle className="h-5 w-5 text-success-500" />
          <div>
            <p className="text-lg font-bold text-gray-900">
              {metrics.actionsTerminees}/{metrics.actionsTotal}
            </p>
            <p className="text-xs text-gray-500">Actions terminées</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Target className="h-5 w-5 text-primary-500" />
          <div>
            <p className="text-lg font-bold text-gray-900">
              {metrics.jalonsAtteints}/{metrics.jalonsTotal}
            </p>
            <p className="text-xs text-gray-500">Jalons atteints</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Clock className={cn(
            'h-5 w-5',
            metrics.actionsEnRetard > 0 ? 'text-error-500' : 'text-gray-400'
          )} />
          <div>
            <p className={cn(
              'text-lg font-bold',
              metrics.actionsEnRetard > 0 ? 'text-error-600' : 'text-gray-900'
            )}>
              {metrics.actionsEnRetard}
            </p>
            <p className="text-xs text-gray-500">En retard</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <AlertTriangle className={cn(
            'h-5 w-5',
            metrics.risquesCritiques > 0 ? 'text-error-500' : 'text-gray-400'
          )} />
          <div>
            <p className={cn(
              'text-lg font-bold',
              metrics.risquesCritiques > 0 ? 'text-error-600' : 'text-gray-900'
            )}>
              {metrics.risquesCritiques}
            </p>
            <p className="text-xs text-gray-500">Risques critiques</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AxisHeader;
