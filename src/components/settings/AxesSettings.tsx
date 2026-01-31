import { useState, useEffect } from 'react';
import {
  Users,
  Store,
  Wrench,
  Calculator,
  Megaphone,
  Settings,
  Building,
  TrendingUp,
  Percent,
  Palette,
  Link2,
  MoreHorizontal,
  Flag,
  CheckSquare,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { AXES, AXE_LABELS, AXE_SHORT_LABELS, AXE_CONFIG, type Axe } from '@/types';
import { db } from '@/db';

// Icones mappees
const AXE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users: Users,
  Store: Store,
  Wrench: Wrench,
  Calculator: Calculator,
  Megaphone: Megaphone,
  Settings: Settings,
  Building: Building,
  MoreHorizontal: MoreHorizontal,
};

interface AxeStats {
  jalonsTotal: number;
  jalonsTermines: number;
  jalonsEnRetard: number;
  actionsTotal: number;
  actionsTerminees: number;
  actionsEnRetard: number;
  risquesTotal: number;
  risquesCritiques: number;
}

interface AxeCardProps {
  axe: Axe;
  config: (typeof AXE_CONFIG)[Axe];
  stats: AxeStats;
  isExpanded: boolean;
  onToggle: () => void;
}

function AxeCard({ axe, config, stats, isExpanded, onToggle }: AxeCardProps) {
  const IconComponent = AXE_ICONS[config.icone] || TrendingUp;

  const jalonsProgress = stats.jalonsTotal > 0
    ? Math.round((stats.jalonsTermines / stats.jalonsTotal) * 100)
    : 0;
  const actionsProgress = stats.actionsTotal > 0
    ? Math.round((stats.actionsTerminees / stats.actionsTotal) * 100)
    : 0;

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${config.couleur}20`, color: config.couleur }}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary-900">{AXE_SHORT_LABELS[axe]}</span>
              <Badge variant="secondary" className="text-xs">{config.code}</Badge>
              {config.syncCC && (
                <Badge variant="info" className="text-xs flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Sync CC
                </Badge>
              )}
            </div>
            <p className="text-sm text-primary-500">{AXE_LABELS[axe]}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Stats rapides */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1" title="Jalons">
              <Flag className="h-4 w-4 text-primary-400" />
              <span className="text-primary-700">{stats.jalonsTermines}/{stats.jalonsTotal}</span>
            </div>
            <div className="flex items-center gap-1" title="Actions">
              <CheckSquare className="h-4 w-4 text-primary-400" />
              <span className="text-primary-700">{stats.actionsTerminees}/{stats.actionsTotal}</span>
            </div>
            <div className="flex items-center gap-1" title="Risques">
              <AlertTriangle className="h-4 w-4 text-primary-400" />
              <span className="text-primary-700">{stats.risquesTotal}</span>
              {stats.risquesCritiques > 0 && (
                <Badge variant="danger" className="text-xs ml-1">{stats.risquesCritiques}</Badge>
              )}
            </div>
          </div>

          {/* Poids */}
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-primary-400" />
            <span
              className="text-lg font-bold min-w-[3rem] text-right"
              style={{ color: config.couleur }}
            >
              {config.poids}%
            </span>
          </div>

          {/* Couleur */}
          <div
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: config.couleur }}
          />

          {/* Chevron */}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t p-4 bg-gray-50">
          {/* Stats detaillees */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Jalons */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="h-5 w-5 text-info-500" />
                <span className="font-medium text-primary-900">Jalons</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-600">Total</span>
                  <span className="font-medium">{stats.jalonsTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-success-600">Termines</span>
                  <span className="font-medium text-success-700">{stats.jalonsTermines}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-error-600">En retard</span>
                  <span className="font-medium text-error-700">{stats.jalonsEnRetard}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-info-500 h-2 rounded-full"
                    style={{ width: `${jalonsProgress}%` }}
                  />
                </div>
                <div className="text-xs text-right text-primary-500">{jalonsProgress}% complete</div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="h-5 w-5 text-success-500" />
                <span className="font-medium text-primary-900">Actions</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-600">Total</span>
                  <span className="font-medium">{stats.actionsTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-success-600">Terminees</span>
                  <span className="font-medium text-success-700">{stats.actionsTerminees}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-error-600">En retard</span>
                  <span className="font-medium text-error-700">{stats.actionsEnRetard}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-success-500 h-2 rounded-full"
                    style={{ width: `${actionsProgress}%` }}
                  />
                </div>
                <div className="text-xs text-right text-primary-500">{actionsProgress}% complete</div>
              </div>
            </div>

            {/* Risques */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
                <span className="font-medium text-primary-900">Risques</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-600">Total</span>
                  <span className="font-medium">{stats.risquesTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-error-600">Critiques</span>
                  <span className="font-medium text-error-700">{stats.risquesCritiques}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-success-600">Autres</span>
                  <span className="font-medium text-success-700">{stats.risquesTotal - stats.risquesCritiques}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-primary-500 mb-1">Code</div>
              <div className="font-medium text-primary-900">{config.code}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-primary-500 mb-1">Poids dans le calcul</div>
              <div className="font-medium text-primary-900">{config.poids}%</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-primary-500 mb-1">Couleur</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: config.couleur }}
                />
                <span className="font-mono text-sm text-primary-700">{config.couleur}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-primary-500 mb-1">Synchronisation CC</div>
              <div className="font-medium text-primary-900">
                {config.syncCC ? 'Activee' : 'Desactivee'}
              </div>
            </div>
          </div>

          {config.poids === 0 && (
            <div className="mt-4 p-3 bg-warning-50 rounded-lg text-sm text-warning-700">
              <strong>Note :</strong> Cet axe n'est pas pris en compte dans le calcul global de progression du projet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AxesSettings() {
  const [expandedAxe, setExpandedAxe] = useState<Axe | null>(null);
  const [loading, setLoading] = useState(true);
  const [axeStats, setAxeStats] = useState<Record<Axe, AxeStats>>({} as Record<Axe, AxeStats>);

  // Charger les statistiques depuis la base de donnees
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [jalons, actions, risques] = await Promise.all([
          db.jalons.toArray(),
          db.actions.toArray(),
          db.risques.toArray(),
        ]);

        const stats: Record<Axe, AxeStats> = {} as Record<Axe, AxeStats>;

        for (const axe of AXES) {
          const axeJalons = jalons.filter((j) => j.axe === axe);
          const axeActions = actions.filter((a) => a.axe === axe);
          const axeRisques = risques.filter((r) => r.axe_impacte === axe);

          stats[axe] = {
            jalonsTotal: axeJalons.length,
            jalonsTermines: axeJalons.filter((j) =>
              j.statut === 'ATTEINT' || j.statut === 'atteint' || j.statut === 'termine'
            ).length,
            jalonsEnRetard: axeJalons.filter((j) =>
              j.statut === 'EN_RETARD' || j.statut === 'en_retard'
            ).length,
            actionsTotal: axeActions.length,
            actionsTerminees: axeActions.filter((a) =>
              a.status === 'termine' || a.status === 'FAIT'
            ).length,
            actionsEnRetard: axeActions.filter((a) =>
              a.status === 'en_retard' || a.status === 'BLOQUE'
            ).length,
            risquesTotal: axeRisques.length,
            risquesCritiques: axeRisques.filter((r) =>
              r.criticite === 'critique' || r.score >= 15
            ).length,
          };
        }

        setAxeStats(stats);
      } catch (error) {
        console.error('Erreur chargement stats axes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Calculer les totaux
  const totalPoids = AXES.reduce((sum, axe) => sum + AXE_CONFIG[axe].poids, 0);
  const axesAvecPoids = AXES.filter((axe) => AXE_CONFIG[axe].poids > 0);
  const axesSyncCC = AXES.filter((axe) => AXE_CONFIG[axe].syncCC);

  // Totaux globaux
  const totals = AXES.reduce(
    (acc, axe) => {
      const stats = axeStats[axe] || {
        jalonsTotal: 0,
        jalonsTermines: 0,
        actionsTotal: 0,
        actionsTerminees: 0,
        risquesTotal: 0,
        risquesCritiques: 0,
      };
      return {
        jalons: acc.jalons + stats.jalonsTotal,
        jalonsTermines: acc.jalonsTermines + stats.jalonsTermines,
        actions: acc.actions + stats.actionsTotal,
        actionsTerminees: acc.actionsTerminees + stats.actionsTerminees,
        risques: acc.risques + stats.risquesTotal,
        risquesCritiques: acc.risquesCritiques + stats.risquesCritiques,
      };
    },
    { jalons: 0, jalonsTermines: 0, actions: 0, actionsTerminees: 0, risques: 0, risquesCritiques: 0 }
  );

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          <span className="ml-2 text-primary-500">Chargement...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              Axes Strategiques
            </h3>
            <p className="text-sm text-primary-500">
              Configuration des {AXES.length} axes du projet selon les specifications v2.0
            </p>
          </div>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-900">{AXES.length}</div>
            <div className="text-sm text-primary-600">Axes</div>
          </div>
          <div className="bg-info-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-info-700">{axesAvecPoids.length}</div>
            <div className="text-sm text-info-600">Avec poids</div>
          </div>
          <div className="bg-success-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success-700">{totalPoids}%</div>
            <div className="text-sm text-success-600">Total poids</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning-700">{axesSyncCC.length}</div>
            <div className="text-sm text-warning-600">Sync. CC</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flag className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold text-blue-700">{totals.jalons}</span>
            </div>
            <div className="text-sm text-blue-600">Jalons</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-green-700">{totals.actions}</span>
            </div>
            <div className="text-sm text-green-600">Actions</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-700">{totals.risques}</span>
            </div>
            <div className="text-sm text-red-600">Risques</div>
          </div>
        </div>

        {/* Repartition graphique */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary-500" />
            <span className="text-sm font-medium text-primary-700">Repartition des poids</span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden">
            {AXES.filter((axe) => AXE_CONFIG[axe].poids > 0).map((axe) => (
              <div
                key={axe}
                className="h-full"
                style={{
                  width: `${AXE_CONFIG[axe].poids}%`,
                  backgroundColor: AXE_CONFIG[axe].couleur,
                }}
                title={`${AXE_SHORT_LABELS[axe]}: ${AXE_CONFIG[axe].poids}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {AXES.filter((axe) => AXE_CONFIG[axe].poids > 0).map((axe) => (
              <div key={axe} className="flex items-center gap-1 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: AXE_CONFIG[axe].couleur }}
                />
                <span className="text-primary-600">{AXE_CONFIG[axe].code}: {AXE_CONFIG[axe].poids}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Axes list */}
        <div className="space-y-3">
          {AXES.map((axe) => (
            <AxeCard
              key={axe}
              axe={axe}
              config={AXE_CONFIG[axe]}
              stats={axeStats[axe] || {
                jalonsTotal: 0,
                jalonsTermines: 0,
                jalonsEnRetard: 0,
                actionsTotal: 0,
                actionsTerminees: 0,
                actionsEnRetard: 0,
                risquesTotal: 0,
                risquesCritiques: 0,
              }}
              isExpanded={expandedAxe === axe}
              onToggle={() => setExpandedAxe(expandedAxe === axe ? null : axe)}
            />
          ))}
        </div>
      </Card>

      {/* Legende */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Legende
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-primary-500" />
              <span className="font-medium text-primary-700">Poids</span>
            </div>
            <p className="text-primary-600">
              Pourcentage de l'axe dans le calcul de la progression globale du projet.
              Le total doit faire 100%.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-info-500" />
              <span className="font-medium text-primary-700">Sync CC</span>
            </div>
            <p className="text-primary-600">
              Indique si l'axe se synchronise avec la progression du Centre Commercial (batiment pilote).
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Flag className="h-4 w-4 text-info-500" />
              <span className="font-medium text-primary-700">Jalons</span>
            </div>
            <p className="text-primary-600">
              Nombre de jalons associes a cet axe. Les jalons marquent les etapes cles du projet.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="h-4 w-4 text-success-500" />
              <span className="font-medium text-primary-700">Actions</span>
            </div>
            <p className="text-primary-600">
              Nombre d'actions associees a cet axe. Les actions sont les taches a realiser.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
