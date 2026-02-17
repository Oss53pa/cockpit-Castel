import { Sun, CloudSun, Cloud, CloudRain, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useMeteoProjet, useAvancementParAxe } from '@/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { MeteoProjet as MeteoType, Axe, Jalon } from '@/types';
import { AXE_SHORT_LABELS, AXE_CONFIG, AXES } from '@/types';
import { SEUILS_METEO_AXE_DASHBOARD } from '@/data/constants';

const meteoConfig: Record<
  MeteoType,
  { icon: typeof Sun; color: string; bgColor: string; label: string; badgeColor: string }
> = {
  vert: {
    icon: Sun,
    color: 'text-success-500',
    bgColor: 'bg-success-100',
    label: 'Favorable',
    badgeColor: 'bg-success-100 text-success-700',
  },
  jaune: {
    icon: CloudSun,
    color: 'text-warning-500',
    bgColor: 'bg-warning-100',
    label: 'Attention',
    badgeColor: 'bg-warning-100 text-warning-700',
  },
  orange: {
    icon: Cloud,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    label: 'Vigilance',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  rouge: {
    icon: CloudRain,
    color: 'text-error-500',
    bgColor: 'bg-error-100',
    label: 'Critique',
    badgeColor: 'bg-error-100 text-error-700',
  },
};

// Safe helper to get meteo config with fallback
const getMeteoConfig = (meteo: string) => {
  return meteoConfig[meteo as MeteoType] || meteoConfig.jaune;
};

// Calculer la météo par axe en fonction de l'écart prévu/réalisé
function calculerMeteoAxe(avancement: number, prevu: number): MeteoType {
  const ecart = avancement - prevu;
  if (ecart >= SEUILS_METEO_AXE_DASHBOARD.soleil) return 'vert';
  if (ecart >= SEUILS_METEO_AXE_DASHBOARD.nuageux) return 'jaune';
  return 'rouge';
}

interface JalonProblematique {
  axe: Axe;
  jalon: Jalon | null;
  count: number;
}

/**
 * Hook pour obtenir le jalon le plus problématique par axe
 */
function useJalonsProblematiquesParAxe(): JalonProblematique[] {
  const data = useLiveQuery(async () => {
    const jalons = await db.jalons.toArray();

    const axes: Axe[] = AXES.filter(axe => {
      const config = AXE_CONFIG[axe];
      return config && config.poids > 0;
    });

    return axes.map(axe => {
      const jalonsAxe = jalons.filter(j => j.axe === axe);

      const jalonsProblematiques = jalonsAxe.filter(j =>
        j.statut === 'en_danger' || j.statut === 'depasse'
      );

      const sorted = jalonsProblematiques.sort((a, b) => {
        if (a.statut === 'depasse' && b.statut !== 'depasse') return -1;
        if (b.statut === 'depasse' && a.statut !== 'depasse') return 1;
        return (a.date_prevue || '').localeCompare(b.date_prevue || '');
      });

      return {
        axe,
        jalon: sorted[0] || null,
        count: jalonsProblematiques.length,
      };
    });
  });

  return data ?? [];
}

export function MeteoProjetCard() {
  const meteo = useMeteoProjet();
  const config = getMeteoConfig(meteo);
  const Icon = config.icon;
  const jalonsProblematiques = useJalonsProblematiquesParAxe();
  const avancements = useAvancementParAxe();

  // Filtrer les axes avec poids > 0
  const axesAffiches = avancements.filter((item) => {
    const axeConfig = AXE_CONFIG[item.axe];
    return axeConfig && axeConfig.poids > 0;
  });

  // Premier jalon critique trouvé
  const premierJalonCritique = jalonsProblematiques.find(j => j.jalon !== null);

  return (
    <Card className="card-hover" padding="none">
      {/* Section 1 — Météo du projet */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
              Météo du projet
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                config.badgeColor
              )}>
                {config.label}
              </span>
            </div>
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              config.bgColor
            )}
          >
            <Icon className={cn('h-6 w-6', config.color)} />
          </div>
        </div>
      </div>

      {/* Section 2 — Météo par axe */}
      <div className="px-4 py-3 border-t border-primary-100">
        <p className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider mb-2">
          Météo par axe
        </p>
        <div className="space-y-1.5">
          {axesAffiches.map((item) => {
            const axeMeteo = calculerMeteoAxe(item.avancement, item.prevu);
            const axeConfig = getMeteoConfig(axeMeteo);
            const AxeIcon = axeConfig.icon;
            const barColor = axeMeteo === 'vert' ? 'bg-success-500' :
                             axeMeteo === 'jaune' ? 'bg-warning-500' :
                             'bg-error-500';

            return (
              <div key={item.axe} className="flex items-center gap-2">
                <AxeIcon className={cn('h-3.5 w-3.5 flex-shrink-0', axeConfig.color)} />
                <span className="text-xs text-primary-700 w-24 truncate flex-shrink-0">
                  {AXE_SHORT_LABELS[item.axe]}
                </span>
                <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', barColor)}
                    style={{ width: `${Math.min(item.avancement, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-primary-900 w-9 text-right flex-shrink-0">
                  {Math.round(item.avancement)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3 — Jalon critique */}
      {premierJalonCritique && premierJalonCritique.jalon ? (
        <div className="px-4 py-3 border-t border-primary-100 bg-warning-50/50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-warning-700 uppercase tracking-wider">
                Jalon critique
              </p>
              <p className="text-xs text-warning-800 font-medium truncate" title={premierJalonCritique.jalon.titre}>
                {AXE_SHORT_LABELS[premierJalonCritique.axe]} — {premierJalonCritique.jalon.titre}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-primary-100">
          <div className="flex items-center gap-2 text-xs text-success-600">
            <Sun className="h-3.5 w-3.5" />
            <span>Tous les jalons sont dans les temps</span>
          </div>
        </div>
      )}
    </Card>
  );
}
