import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import {
  Card,
  Button,
  Badge,
  Select,
  SelectOption,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { useAlertes, markAlerteLue, markAlerteTraitee, markAllAlertesLues } from '@/hooks';
import { formatDateRelative } from '@/lib/utils';
import {
  ALERTE_TYPES,
  ALERTE_TYPE_LABELS,
  CRITICITES,
  CRITICITE_LABELS,
  type Alerte,
  type Criticite,
} from '@/types';

const criticiteColors: Record<Criticite, string> = {
  low: 'bg-primary-100 text-primary-700',
  medium: 'bg-info-100 text-info-700',
  high: 'bg-warning-100 text-warning-700',
  critical: 'bg-error-100 text-error-700',
};

function AlerteCard({
  alerte,
  onMarkRead,
  onMarkDone,
}: {
  alerte: Alerte;
  onMarkRead: () => void;
  onMarkDone: () => void;
}) {
  return (
    <Card
      className={cn('card-hover', !alerte.lu && 'border-l-4 border-l-info-500')}
      padding="md"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'mt-1 h-3 w-3 rounded-full shrink-0',
            alerte.criticite === 'critical' && 'bg-error-500',
            alerte.criticite === 'high' && 'bg-warning-500',
            alerte.criticite === 'medium' && 'bg-info-500',
            alerte.criticite === 'low' && 'bg-primary-400'
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-primary-900">{alerte.titre}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={criticiteColors[alerte.criticite]}>
                  {CRITICITE_LABELS[alerte.criticite]}
                </Badge>
                <Badge variant="secondary">
                  {ALERTE_TYPE_LABELS[alerte.type]}
                </Badge>
              </div>
            </div>

            <span className="text-xs text-primary-400 shrink-0">
              {formatDateRelative(alerte.createdAt)}
            </span>
          </div>

          <p className="text-sm text-primary-600 mt-2">{alerte.message}</p>

          <div className="flex items-center gap-2 mt-4">
            {!alerte.lu && (
              <Button variant="ghost" size="sm" onClick={onMarkRead}>
                <Check className="h-4 w-4 mr-1" />
                Marquer lu
              </Button>
            )}
            {!alerte.traitee && (
              <Button variant="secondary" size="sm" onClick={onMarkDone}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Traiter
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AlertesPage() {
  const { alerteFilters, setAlerteFilters } = useAppStore();
  const [activeTab, setActiveTab] = useState<'active' | 'treated'>('active');

  const alertes = useAlertes({
    ...alerteFilters,
    traitee: activeTab === 'treated',
  });

  const handleMarkRead = async (id: number) => {
    await markAlerteLue(id);
  };

  const handleMarkDone = async (id: number) => {
    await markAlerteTraitee(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAlertesLues();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Alertes</h2>
          <p className="text-sm text-primary-500">
            Notifications et alertes du projet
          </p>
        </div>

        {alertes.some((a) => !a.lu) && activeTab === 'active' && (
          <Button variant="secondary" onClick={handleMarkAllRead}>
            <Check className="h-4 w-4 mr-2" />
            Tout marquer lu
          </Button>
        )}
      </div>

      {/* Tabs and filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'treated')}>
          <TabsList>
            <TabsTrigger value="active">Actives</TabsTrigger>
            <TabsTrigger value="treated">Traitées</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1" />

        <Select
          value={alerteFilters.type ?? ''}
          onChange={(e) =>
            setAlerteFilters({
              type: e.target.value
                ? (e.target.value as typeof alerteFilters.type)
                : undefined,
            })
          }
          className="w-44"
        >
          <SelectOption value="">Tous les types</SelectOption>
          {ALERTE_TYPES.map((type) => (
            <SelectOption key={type} value={type}>
              {ALERTE_TYPE_LABELS[type]}
            </SelectOption>
          ))}
        </Select>

        <Select
          value={alerteFilters.criticite ?? ''}
          onChange={(e) =>
            setAlerteFilters({
              criticite: e.target.value
                ? (e.target.value as typeof alerteFilters.criticite)
                : undefined,
            })
          }
          className="w-36"
        >
          <SelectOption value="">Toutes criticités</SelectOption>
          {CRITICITES.map((crit) => (
            <SelectOption key={crit} value={crit}>
              {CRITICITE_LABELS[crit]}
            </SelectOption>
          ))}
        </Select>
      </div>

      {/* Content */}
      {alertes.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title={activeTab === 'active' ? 'Aucune alerte active' : 'Aucune alerte traitée'}
          description={
            activeTab === 'active'
              ? 'Tout va bien pour le moment'
              : 'Les alertes traitées apparaîtront ici'
          }
        />
      ) : (
        <div className="space-y-3">
          {alertes.map((alerte) => (
            <AlerteCard
              key={alerte.id}
              alerte={alerte}
              onMarkRead={() => alerte.id && handleMarkRead(alerte.id)}
              onMarkDone={() => alerte.id && handleMarkDone(alerte.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
