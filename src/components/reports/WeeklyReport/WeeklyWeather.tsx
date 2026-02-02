/**
 * WeeklyWeather - Météo par axe stratégique
 */

import { useMemo } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useActions, useJalons, useRisques, useCOPILTrends } from '@/hooks';
import { useSiteStore } from '@/stores/siteStore';
import { AXES_CONFIG_FULL } from '@/data/constants';

const axesList = Object.values(AXES_CONFIG_FULL);

interface WeeklyWeatherProps {
  className?: string;
}

type Weather = 'green' | 'yellow' | 'orange' | 'red';

interface AxeWeather {
  axeId: string;
  axeName: string;
  axeColor: string;
  weather: Weather;
  actionsEnCours: number;
  actionsEnRetard: number;
  jalonsEnRetard: number;
  risquesCritiques: number;
  avancement: number;
  trend: 'up' | 'down' | 'stable';
}

export function WeeklyWeather({ className }: WeeklyWeatherProps) {
  const { currentSiteId } = useSiteStore();
  const siteId = currentSiteId || 1;

  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();
  const trends = useCOPILTrends(siteId);

  const today = new Date().toISOString().split('T')[0];

  // Calcul de la météo par axe
  const axesWeather = useMemo(() => {
    const weatherData: AxeWeather[] = [];

    // Définition des axes avec leurs codes
    const axeDefinitions = [
      { code: 'axe1_rh', name: 'RH', color: 'blue' },
      { code: 'axe2_commercial', name: 'Commercial', color: 'green' },
      { code: 'axe3_technique', name: 'Technique', color: 'purple' },
      { code: 'axe4_budget', name: 'Budget', color: 'yellow' },
      { code: 'axe5_marketing', name: 'Marketing', color: 'pink' },
      { code: 'axe6_exploitation', name: 'Exploitation', color: 'orange' },
    ];

    axeDefinitions.forEach(axeDef => {
      // Filtrer les données par axe
      const axeActions = actions.filter(a =>
        a.axe_id === axeDef.code || a.axe === axeDef.code
      );

      const axeJalons = jalons.filter(j =>
        j.axe_id === axeDef.code || j.axe === axeDef.code
      );

      const axeRisques = risques.filter(r =>
        r.axe_id === axeDef.code || r.axe === axeDef.code
      );

      // Métriques
      const actionsEnCours = axeActions.filter(a => a.statut === 'en_cours').length;
      const actionsEnRetard = axeActions.filter(a =>
        a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
      ).length;
      const jalonsEnRetard = axeJalons.filter(j =>
        j.statut !== 'atteint' && j.date_prevue && j.date_prevue < today
      ).length;
      const risquesCritiques = axeRisques.filter(r => {
        const score = r.score || (r.probabilite || 0) * (r.impact || 0);
        return score >= 12 && r.status !== 'ferme';
      }).length;

      // Avancement moyen
      const avancement = axeActions.length > 0
        ? Math.round(axeActions.reduce((sum, a) => sum + (a.avancement || 0), 0) / axeActions.length)
        : 0;

      // Calcul de la météo
      let weather: Weather;
      if (jalonsEnRetard === 0 && actionsEnRetard === 0 && risquesCritiques === 0) {
        weather = 'green';
      } else if (jalonsEnRetard <= 1 && actionsEnRetard <= 2 && risquesCritiques <= 1) {
        weather = 'yellow';
      } else if (jalonsEnRetard <= 2 && actionsEnRetard <= 4 && risquesCritiques <= 2) {
        weather = 'orange';
      } else {
        weather = 'red';
      }

      // Trend (basé sur les données COPIL si disponibles)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (trends?.parAxe?.[axeDef.code]) {
        const axeTrend = trends.parAxe[axeDef.code];
        if (axeTrend.variation > 0) trend = 'up';
        else if (axeTrend.variation < 0) trend = 'down';
      }

      weatherData.push({
        axeId: axeDef.code,
        axeName: axeDef.name,
        axeColor: axeDef.color,
        weather,
        actionsEnCours,
        actionsEnRetard,
        jalonsEnRetard,
        risquesCritiques,
        avancement,
        trend,
      });
    });

    return weatherData;
  }, [actions, jalons, risques, trends, today]);

  const getWeatherIcon = (weather: Weather) => {
    switch (weather) {
      case 'green': return Sun;
      case 'yellow': return Cloud;
      case 'orange': return CloudRain;
      case 'red': return CloudLightning;
    }
  };

  const getWeatherLabel = (weather: Weather) => {
    switch (weather) {
      case 'green': return 'Favorable';
      case 'yellow': return 'Vigilance';
      case 'orange': return 'Dégradée';
      case 'red': return 'Critique';
    }
  };

  const getWeatherColors = (weather: Weather) => {
    switch (weather) {
      case 'green':
        return { bg: 'bg-success-50', border: 'border-success-200', icon: 'text-success-500', text: 'text-success-700' };
      case 'yellow':
        return { bg: 'bg-warning-50', border: 'border-warning-200', icon: 'text-warning-500', text: 'text-warning-700' };
      case 'orange':
        return { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500', text: 'text-orange-700' };
      case 'red':
        return { bg: 'bg-error-50', border: 'border-error-200', icon: 'text-error-500', text: 'text-error-700' };
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  // Météo globale
  const globalWeather = useMemo(() => {
    const weatherScores = { green: 4, yellow: 3, orange: 2, red: 1 };
    const avgScore = axesWeather.reduce((sum, ax) => sum + weatherScores[ax.weather], 0) / axesWeather.length;

    if (avgScore >= 3.5) return 'green';
    if (avgScore >= 2.5) return 'yellow';
    if (avgScore >= 1.5) return 'orange';
    return 'red';
  }, [axesWeather]);

  const GlobalWeatherIcon = getWeatherIcon(globalWeather);
  const globalColors = getWeatherColors(globalWeather);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Météo globale */}
      <Card className={cn(globalColors.bg, globalColors.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-full', globalColors.bg)}>
              <GlobalWeatherIcon className={cn('h-10 w-10', globalColors.icon)} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Météo Projet</p>
              <p className={cn('text-2xl font-bold', globalColors.text)}>
                {getWeatherLabel(globalWeather)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {axesWeather.reduce((sum, ax) => sum + ax.actionsEnCours, 0)} en cours
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-error-500" />
                {axesWeather.reduce((sum, ax) => sum + ax.actionsEnRetard, 0)} en retard
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Météo par axe */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {axesWeather.map(axe => {
          const WeatherIcon = getWeatherIcon(axe.weather);
          const TrendIcon = getTrendIcon(axe.trend);
          const colors = getWeatherColors(axe.weather);

          return (
            <Card
              key={axe.axeId}
              className={cn('relative overflow-hidden', colors.bg, colors.border)}
            >
              {/* Indicateur de couleur de l'axe */}
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: `var(--${axe.axeColor}-500, #6b7280)` }}
              />

              <div className="pl-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{axe.axeName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <WeatherIcon className={cn('h-6 w-6', colors.icon)} />
                      <span className={cn('text-sm font-semibold', colors.text)}>
                        {getWeatherLabel(axe.weather)}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-xs',
                    axe.trend === 'up' ? 'text-success-600' : axe.trend === 'down' ? 'text-error-600' : 'text-gray-500'
                  )}>
                    <TrendIcon className="h-3 w-3" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 mt-3 pt-2 border-t border-gray-200">
                  <span>{axe.avancement}% avancé</span>
                  <div className="flex items-center gap-2">
                    {axe.actionsEnRetard > 0 && (
                      <Badge variant="error" size="sm">{axe.actionsEnRetard} retard</Badge>
                    )}
                    {axe.risquesCritiques > 0 && (
                      <Badge variant="warning" size="sm">{axe.risquesCritiques} risque</Badge>
                    )}
                    {axe.actionsEnRetard === 0 && axe.risquesCritiques === 0 && (
                      <CheckCircle className="h-4 w-4 text-success-500" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Sun className="h-4 w-4 text-success-500" /> Favorable
        </span>
        <span className="flex items-center gap-1">
          <Cloud className="h-4 w-4 text-warning-500" /> Vigilance
        </span>
        <span className="flex items-center gap-1">
          <CloudRain className="h-4 w-4 text-orange-500" /> Dégradée
        </span>
        <span className="flex items-center gap-1">
          <CloudLightning className="h-4 w-4 text-error-500" /> Critique
        </span>
      </div>
    </div>
  );
}

export default WeeklyWeather;
