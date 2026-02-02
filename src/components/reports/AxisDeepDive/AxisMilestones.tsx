/**
 * AxisMilestones - Liste complète des jalons d'un axe avec statut réel
 */

import { useMemo } from 'react';
import {
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Jalon } from '@/types';
import { JALON_STATUS_LABELS } from '@/types';

interface AxisMilestonesProps {
  jalons: Jalon[];
  axeColor: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  atteint: { label: 'Atteint', color: 'text-success-600', bgColor: 'bg-success-100', icon: CheckCircle },
  a_venir: { label: 'À venir', color: 'text-primary-600', bgColor: 'bg-primary-100', icon: Calendar },
  en_approche: { label: 'En approche', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: Clock },
  en_danger: { label: 'En danger', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertTriangle },
  depasse: { label: 'Dépassé', color: 'text-error-600', bgColor: 'bg-error-100', icon: AlertTriangle },
  annule: { label: 'Annulé', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Target },
};

export function AxisMilestones({ jalons, axeColor }: AxisMilestonesProps) {
  const today = new Date().toISOString().split('T')[0];

  // Statistiques
  const stats = useMemo(() => {
    const atteints = jalons.filter(j => j.statut === 'atteint').length;
    const enRetard = jalons.filter(j =>
      j.statut !== 'atteint' && j.date_prevue && j.date_prevue < today
    ).length;
    const aVenir = jalons.filter(j =>
      j.statut !== 'atteint' && j.date_prevue && j.date_prevue >= today
    ).length;

    return { atteints, enRetard, aVenir, total: jalons.length };
  }, [jalons, today]);

  // Jalons triés par date
  const sortedJalons = useMemo(() => {
    return [...jalons].sort((a, b) => {
      const dateA = a.date_prevue || '9999-12-31';
      const dateB = b.date_prevue || '9999-12-31';
      return dateA.localeCompare(dateB);
    });
  }, [jalons]);

  // Calcul du statut réel basé sur la date
  const getActualStatus = (jalon: Jalon): string => {
    if (jalon.statut === 'atteint') return 'atteint';
    if (jalon.statut === 'annule') return 'annule';
    if (!jalon.date_prevue) return 'a_venir';

    const datePrevue = new Date(jalon.date_prevue);
    const todayDate = new Date();
    const daysUntil = Math.ceil((datePrevue.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'depasse';
    if (daysUntil <= 7) return 'en_danger';
    if (daysUntil <= 30) return 'en_approche';
    return 'a_venir';
  };

  // Calcul des jours restants/retard
  const getDaysInfo = (jalon: Jalon): { days: number; label: string; color: string } => {
    if (!jalon.date_prevue) return { days: 0, label: '-', color: 'text-gray-500' };

    const datePrevue = new Date(jalon.date_prevue);
    const todayDate = new Date();
    const days = Math.ceil((datePrevue.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (jalon.statut === 'atteint') {
      return { days: 0, label: 'Atteint', color: 'text-success-600' };
    }

    if (days < 0) {
      return { days: Math.abs(days), label: `${Math.abs(days)}j de retard`, color: 'text-error-600' };
    }
    if (days === 0) {
      return { days: 0, label: "Aujourd'hui", color: 'text-warning-600' };
    }
    if (days <= 7) {
      return { days, label: `J-${days}`, color: 'text-warning-600' };
    }
    return { days, label: `J-${days}`, color: 'text-primary-600' };
  };

  if (jalons.length === 0) {
    return (
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5" style={{ color: axeColor }} />
          <h3 className="text-lg font-semibold text-primary-900">Jalons</h3>
        </div>
        <p className="text-gray-500 text-center py-8">Aucun jalon pour cet axe</p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      {/* Header avec stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" style={{ color: axeColor }} />
          <h3 className="text-lg font-semibold text-primary-900">
            Jalons ({stats.total})
          </h3>
        </div>
        <div className="flex gap-2">
          <Badge variant="success">{stats.atteints} atteints</Badge>
          {stats.enRetard > 0 && (
            <Badge variant="error">{stats.enRetard} en retard</Badge>
          )}
          <Badge variant="secondary">{stats.aVenir} à venir</Badge>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-success-500"
            style={{ width: `${(stats.atteints / stats.total) * 100}%` }}
          />
          <div
            className="h-full bg-error-500"
            style={{ width: `${(stats.enRetard / stats.total) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {((stats.atteints / stats.total) * 100).toFixed(0)}% des jalons atteints
        </p>
      </div>

      {/* Table des jalons */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Jalon</TableHead>
              <TableHead className="w-32">Date prévue</TableHead>
              <TableHead className="w-28">Statut</TableHead>
              <TableHead className="w-28">Échéance</TableHead>
              <TableHead className="w-24 text-right">Avancement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedJalons.map((jalon, index) => {
              const actualStatus = getActualStatus(jalon);
              const config = statusConfig[actualStatus] || statusConfig.a_venir;
              const StatusIcon = config.icon;
              const daysInfo = getDaysInfo(jalon);

              return (
                <TableRow key={jalon.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-gray-500">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{jalon.titre}</p>
                        {jalon.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {jalon.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {jalon.date_prevue
                        ? new Date(jalon.date_prevue).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      config.bgColor,
                      config.color
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-sm font-medium', daysInfo.color)}>
                      {daysInfo.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            (jalon.avancement || 0) >= 100 ? 'bg-success-500' :
                            (jalon.avancement || 0) >= 50 ? 'bg-warning-500' :
                            'bg-error-500'
                          )}
                          style={{ width: `${jalon.avancement || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {jalon.avancement || 0}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export default AxisMilestones;
