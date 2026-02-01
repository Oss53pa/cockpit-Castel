import { Sun, CloudSun, Cloud, CloudRain, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useMeteoProjet } from '@/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { MeteoProjet as MeteoType, Axe, Jalon } from '@/types';
import { AXE_SHORT_LABELS, JALON_STATUS_LABELS } from '@/types';

const meteoConfig: Record<
  MeteoType,
  { icon: typeof Sun; color: string; bgColor: string; label: string }
> = {
  vert: {
    icon: Sun,
    color: 'text-success-500',
    bgColor: 'bg-success-100',
    label: 'Favorable',
  },
  jaune: {
    icon: CloudSun,
    color: 'text-warning-500',
    bgColor: 'bg-warning-100',
    label: 'Attention',
  },
  orange: {
    icon: Cloud,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    label: 'Vigilance',
  },
  rouge: {
    icon: CloudRain,
    color: 'text-error-500',
    bgColor: 'bg-error-100',
    label: 'Critique',
  },
};

interface JalonProblematique {
  axe: Axe;
  jalon: Jalon | null;
  count: number; // nombre de jalons problématiques dans cet axe
}

/**
 * Hook pour obtenir le jalon le plus problématique par axe
 */
function useJalonsProblematiquesParAxe(): JalonProblematique[] {
  const data = useLiveQuery(async () => {
    const jalons = await db.jalons.toArray();
    const today = new Date().toISOString().split('T')[0];

    const axes: Axe[] = [
      'axe1_rh',
      'axe2_commercial',
      'axe3_technique',
      'axe4_budget',
      'axe5_marketing',
      'axe6_exploitation',
    ];

    return axes.map(axe => {
      const jalonsAxe = jalons.filter(j => j.axe === axe);

      // Filtrer les jalons problématiques (en_danger ou depasse)
      const jalonsProblematiques = jalonsAxe.filter(j =>
        j.statut === 'en_danger' || j.statut === 'depasse'
      );

      // Trier par criticité: depasse > en_danger, puis par date la plus proche
      const sorted = jalonsProblematiques.sort((a, b) => {
        // Priorité au statut "depasse"
        if (a.statut === 'depasse' && b.statut !== 'depasse') return -1;
        if (b.statut === 'depasse' && a.statut !== 'depasse') return 1;
        // Puis par date
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

/**
 * Composant pour afficher un jalon problématique (1 par axe)
 */
function JalonProblematiqueLine({ data }: { data: JalonProblematique }) {
  if (!data.jalon) return null; // Ne pas afficher si pas de problème

  const isDepasse = data.jalon.statut === 'depasse';

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs py-1.5 rounded px-2 -mx-1",
      isDepasse ? "bg-error-50" : "bg-warning-50"
    )}>
      <span className="w-20 font-medium text-primary-700 truncate flex-shrink-0">
        {AXE_SHORT_LABELS[data.axe]?.split(' ')[0] || data.axe}
      </span>
      <AlertTriangle className={cn(
        "h-3.5 w-3.5 flex-shrink-0",
        isDepasse ? "text-error-500" : "text-warning-500"
      )} />
      <span className={cn(
        "flex-1 truncate font-medium",
        isDepasse ? "text-error-700" : "text-warning-700"
      )} title={data.jalon.titre}>
        {data.jalon.titre}
      </span>
      {data.count > 1 && (
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0",
          isDepasse ? "bg-error-200 text-error-700" : "bg-warning-200 text-warning-700"
        )}>
          +{data.count - 1}
        </span>
      )}
    </div>
  );
}

export function MeteoProjetCard() {
  const meteo = useMeteoProjet();
  const config = meteoConfig[meteo];
  const Icon = config.icon;
  const jalonsProblematiques = useJalonsProblematiquesParAxe();

  // Compter les axes avec problèmes
  const axesAvecProblemes = jalonsProblematiques.filter(j => j.jalon !== null);
  const totalProblemes = jalonsProblematiques.reduce((sum, j) => sum + j.count, 0);

  return (
    <Card className="card-hover" padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-primary-500">Météo du projet</p>
          <p className="mt-1 text-xl font-bold text-primary-900">
            {config.label}
          </p>
          <p className="text-xs text-primary-400">
            État général du projet
          </p>
        </div>

        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full',
            config.bgColor
          )}
        >
          <Icon className={cn('h-7 w-7', config.color)} />
        </div>
      </div>

      {/* Liste des jalons problématiques - 1 par axe */}
      {axesAvecProblemes.length > 0 ? (
        <div className="border-t border-primary-100 pt-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
              Jalon critique par axe
            </p>
            <span className="text-xs text-error-500 font-medium">
              {axesAvecProblemes.length} axe{axesAvecProblemes.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {axesAvecProblemes.map(data => (
              <JalonProblematiqueLine key={data.axe} data={data} />
            ))}
          </div>
        </div>
      ) : (
        <div className="border-t border-primary-100 pt-3 mt-3">
          <div className="flex items-center gap-2 text-sm text-success-600">
            <Sun className="h-4 w-4" />
            <span>Tous les jalons sont dans les temps</span>
          </div>
        </div>
      )}
    </Card>
  );
}
