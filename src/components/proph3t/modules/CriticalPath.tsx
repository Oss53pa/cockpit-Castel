/**
 * Module Analyse du Chemin Critique
 * Affiche les actions critiques triées par marge
 */

import { useState } from 'react';
import {
  GitBranch,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  ChevronRight,
  Target,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { useCriticalPath, type CriticalAction } from '@/hooks/useCriticalPath';

// Indicateur de marge
function MarginIndicator({ margin }: { margin: number }) {
  const getConfig = (m: number) => {
    if (m === 0) return { color: 'bg-red-500', text: 'text-red-700', label: 'Aucune marge' };
    if (m <= 3) return { color: 'bg-red-400', text: 'text-red-600', label: `${m}j` };
    if (m <= 7) return { color: 'bg-orange-400', text: 'text-orange-600', label: `${m}j` };
    if (m <= 14) return { color: 'bg-amber-400', text: 'text-amber-600', label: `${m}j` };
    return { color: 'bg-green-400', text: 'text-green-600', label: `${m}j` };
  };

  const config = getConfig(margin);

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-2 h-2 rounded-full', config.color)} />
      <span className={cn('text-xs font-medium', config.text)}>{config.label}</span>
    </div>
  );
}

// Carte d'action critique
function CriticalActionCard({ action }: { action: CriticalAction }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (statut: string) => {
    const configs: Record<string, { variant: string; label: string }> = {
      a_faire: { variant: 'secondary', label: 'À faire' },
      en_cours: { variant: 'info', label: 'En cours' },
      bloque: { variant: 'error', label: 'Bloqué' },
      en_attente: { variant: 'warning', label: 'En attente' },
    };
    return configs[statut] || { variant: 'secondary', label: statut };
  };

  const statusConfig = getStatusBadge(action.statut);

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all cursor-pointer',
        action.margin === 0
          ? 'bg-red-50 border-red-200 hover:border-red-300'
          : action.margin <= 7
            ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
            : 'bg-white border-neutral-200 hover:border-neutral-300'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {action.isBottleneck && (
              <Badge variant="error" className="text-[10px] px-1.5 py-0">
                GOULOT
              </Badge>
            )}
            {action.margin === 0 && (
              <Badge variant="error" className="text-[10px] px-1.5 py-0">
                CRITIQUE
              </Badge>
            )}
          </div>
          <h4 className="text-sm font-medium text-neutral-900 truncate">{action.titre}</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {action.responsable}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(action.dateFinPrevue).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <MarginIndicator margin={action.margin} />
          <Badge variant={statusConfig.variant as 'secondary' | 'info' | 'error' | 'warning'} className="text-[10px]">
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-neutral-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">Avancement</span>
            <span className="font-medium">{action.avancement}%</span>
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${action.avancement}%` }}
            />
          </div>
          {action.successorsCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <GitBranch className="w-3 h-3" />
              <span>{action.successorsCount} action(s) dépendante(s)</span>
            </div>
          )}
          {action.jalonTitre && (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Target className="w-3 h-3" />
              <span className="truncate">{action.jalonTitre}</span>
            </div>
          )}
        </div>
      )}

      <ChevronRight
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 transition-transform',
          isExpanded && 'rotate-90'
        )}
      />
    </div>
  );
}

export function CriticalPath() {
  const data = useCriticalPath();

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8 text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm">Analyse du chemin critique...</span>
      </div>
    );
  }

  if (data.criticalActions.length === 0) {
    return (
      <div className="text-center py-8">
        <GitBranch className="h-10 w-10 text-green-500 mx-auto mb-2" />
        <p className="text-green-700 font-medium">Aucune action critique</p>
        <p className="text-sm text-neutral-500">Toutes les actions ont une marge suffisante.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats résumé */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 bg-red-50 rounded-lg text-center">
          <div className="text-lg font-bold text-red-600">{data.actionsNoMargin}</div>
          <div className="text-[10px] text-red-500">Sans marge</div>
        </div>
        <div className="p-2 bg-orange-50 rounded-lg text-center">
          <div className="text-lg font-bold text-orange-600">{data.actionsLowMargin}</div>
          <div className="text-[10px] text-orange-500">Marge faible</div>
        </div>
        <div className="p-2 bg-amber-50 rounded-lg text-center">
          <div className="text-lg font-bold text-amber-600">{data.bottlenecks.length}</div>
          <div className="text-[10px] text-amber-500">Goulots</div>
        </div>
      </div>

      {/* Alerte goulots */}
      {data.bottlenecks.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-amber-800">
                {data.bottlenecks.length} goulot(s) d'étranglement détecté(s)
              </div>
              <div className="text-xs text-amber-600 mt-0.5">
                Ces actions bloquent plusieurs autres tâches. Priorisez leur résolution.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des actions critiques */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Actions sur chemin critique
          </h4>
          <span className="text-xs text-neutral-400">{data.totalCriticalActions} total</span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {data.criticalActions.map(action => (
            <CriticalActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-neutral-400 border-t border-neutral-100">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          0j marge
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          1-7j
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          8-14j
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          15j+
        </span>
      </div>
    </div>
  );
}

export default CriticalPath;
