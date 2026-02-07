/**
 * AxisActions - Liste complète des actions d'un axe avec vélocité
 */

import { useMemo, useState } from 'react';
import {
  ListTodo,
  CheckCircle,
  Clock,
  AlertTriangle,
  Pause,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { Card, Badge, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SEUILS_SANTE_AXE } from '@/data/constants';
import type { Action, User as UserType } from '@/types';
import { ACTION_STATUS_LABELS, ACTION_PRIORITE_LABELS } from '@/types';

interface AxisActionsProps {
  actions: Action[];
  users: UserType[];
  axeColor: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  termine: { label: 'Terminé', color: 'text-success-600', bgColor: 'bg-success-100', icon: CheckCircle },
  en_cours: { label: 'En cours', color: 'text-primary-600', bgColor: 'bg-primary-100', icon: Clock },
  a_faire: { label: 'À faire', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: ListTodo },
  bloque: { label: 'Bloqué', color: 'text-error-600', bgColor: 'bg-error-100', icon: AlertTriangle },
  en_attente: { label: 'En attente', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: Pause },
  en_validation: { label: 'En validation', color: 'text-info-600', bgColor: 'bg-info-100', icon: CheckCircle },
  a_planifier: { label: 'À planifier', color: 'text-gray-500', bgColor: 'bg-gray-50', icon: ListTodo },
  planifie: { label: 'Planifié', color: 'text-primary-500', bgColor: 'bg-primary-50', icon: Clock },
  annule: { label: 'Annulé', color: 'text-gray-400', bgColor: 'bg-gray-50', icon: Minus },
  reporte: { label: 'Reporté', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
};

const priorityConfig: Record<string, { color: string; bgColor: string }> = {
  critique: { color: 'text-error-700', bgColor: 'bg-error-100' },
  haute: { color: 'text-orange-700', bgColor: 'bg-orange-100' },
  normale: { color: 'text-primary-700', bgColor: 'bg-primary-100' },
  basse: { color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

type FilterType = 'all' | 'en_retard' | 'en_cours' | 'termine' | 'bloque';

export function AxisActions({ actions, users, axeColor }: AxisActionsProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  // Statistiques
  const stats = useMemo(() => {
    const terminees = actions.filter(a => a.statut === 'termine').length;
    const enCours = actions.filter(a => a.statut === 'en_cours').length;
    const enRetard = actions.filter(a =>
      a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
    ).length;
    const bloquees = actions.filter(a => a.statut === 'bloque').length;

    // Vélocité moyenne
    const actionsAvecVelocite = actions.filter(a =>
      a.avancement !== undefined && a.date_debut && a.date_fin_prevue
    );

    let velociteMoyenne = 0;
    if (actionsAvecVelocite.length > 0) {
      const velocites = actionsAvecVelocite.map(a => {
        const dateDebut = new Date(a.date_debut!);
        const dateFin = new Date(a.date_fin_prevue!);
        const todayDate = new Date();

        const dureeTotal = (dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24);
        const joursEcoules = Math.max(0, (todayDate.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));

        if (dureeTotal <= 0) return 100;
        const avancementAttendu = Math.min(100, (joursEcoules / dureeTotal) * 100);
        if (avancementAttendu === 0) return 100;

        return ((a.avancement || 0) / avancementAttendu) * 100;
      });
      velociteMoyenne = velocites.reduce((sum, v) => sum + v, 0) / velocites.length;
    }

    return {
      total: actions.length,
      terminees,
      enCours,
      enRetard,
      bloquees,
      velociteMoyenne,
    };
  }, [actions, today]);

  // Filtrage et tri
  const filteredActions = useMemo(() => {
    let filtered = [...actions];

    switch (filter) {
      case 'en_retard':
        filtered = filtered.filter(a =>
          a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
        );
        break;
      case 'en_cours':
        filtered = filtered.filter(a => a.statut === 'en_cours');
        break;
      case 'termine':
        filtered = filtered.filter(a => a.statut === 'termine');
        break;
      case 'bloque':
        filtered = filtered.filter(a => a.statut === 'bloque');
        break;
    }

    // Tri par priorité puis par date
    return filtered.sort((a, b) => {
      const priorityOrder = { critique: 0, haute: 1, normale: 2, basse: 3 };
      const pA = priorityOrder[a.priorite as keyof typeof priorityOrder] ?? 2;
      const pB = priorityOrder[b.priorite as keyof typeof priorityOrder] ?? 2;
      if (pA !== pB) return pA - pB;
      return (a.date_fin_prevue || '').localeCompare(b.date_fin_prevue || '');
    });
  }, [actions, filter, today]);

  // Calcul vélocité par action
  const getVelocity = (action: Action): { value: number; label: string; trend: 'up' | 'down' | 'stable' } => {
    if (!action.date_debut || !action.date_fin_prevue) {
      return { value: 100, label: '-', trend: 'stable' };
    }

    const dateDebut = new Date(action.date_debut);
    const dateFin = new Date(action.date_fin_prevue);
    const todayDate = new Date();

    const dureeTotal = (dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24);
    const joursEcoules = Math.max(0, (todayDate.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));

    if (dureeTotal <= 0) return { value: 100, label: '100%', trend: 'stable' };

    const avancementAttendu = Math.min(100, (joursEcoules / dureeTotal) * 100);
    if (avancementAttendu === 0) return { value: 100, label: '100%', trend: 'stable' };

    const velocite = ((action.avancement || 0) / avancementAttendu) * 100;
    const ecartJours = Math.round((velocite - 100) * dureeTotal / 100);

    let label = `${velocite.toFixed(0)}%`;
    if (ecartJours !== 0) {
      label += ` (${ecartJours > 0 ? '+' : ''}${ecartJours}j)`;
    }

    return {
      value: velocite,
      label,
      trend: velocite >= SEUILS_SANTE_AXE.velocite.up ? 'up' : velocite >= SEUILS_SANTE_AXE.velocite.stable ? 'stable' : 'down',
    };
  };

  // Trouver le responsable
  const getResponsable = (responsableId?: number): string => {
    if (!responsableId) return '-';
    const user = users.find(u => u.id === responsableId);
    return user ? `${user.prenom} ${user.nom}` : '-';
  };

  return (
    <Card padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" style={{ color: axeColor }} />
          <h3 className="text-lg font-semibold text-primary-900">
            Actions ({stats.total})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-2">
          <Badge variant="success">{stats.terminees} terminées</Badge>
          <Badge variant="primary">{stats.enCours} en cours</Badge>
          {stats.enRetard > 0 && (
            <Badge variant="error">{stats.enRetard} en retard</Badge>
          )}
          {stats.bloquees > 0 && (
            <Badge variant="warning">{stats.bloquees} bloquées</Badge>
          )}
        </div>
      </div>

      {/* Vélocité moyenne */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {stats.velociteMoyenne >= 100 ? (
            <TrendingUp className="h-5 w-5 text-success-500" />
          ) : stats.velociteMoyenne >= 80 ? (
            <Minus className="h-5 w-5 text-warning-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-error-500" />
          )}
          <span className="text-sm font-medium text-gray-700">Vélocité moyenne:</span>
          <span className={cn(
            'text-lg font-bold',
            stats.velociteMoyenne >= 100 ? 'text-success-600' :
            stats.velociteMoyenne >= 80 ? 'text-warning-600' :
            'text-error-600'
          )}>
            {stats.velociteMoyenne.toFixed(0)}%
          </span>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-gray-500">
          {stats.velociteMoyenne >= 100 ? 'En avance sur le planning' :
           stats.velociteMoyenne >= 80 ? 'Proche du planning' :
           'En retard sur le planning'}
        </div>
      </div>

      {expanded && (
        <>
          {/* Filtres */}
          <div className="flex gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-400 mt-2" />
            {(['all', 'en_retard', 'en_cours', 'termine', 'bloque'] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Toutes' :
                 f === 'en_retard' ? `En retard (${stats.enRetard})` :
                 f === 'en_cours' ? `En cours (${stats.enCours})` :
                 f === 'termine' ? `Terminées (${stats.terminees})` :
                 `Bloquées (${stats.bloquees})`}
              </Button>
            ))}
          </div>

          {/* Table des actions */}
          {filteredActions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune action pour ce filtre</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead className="w-32">Responsable</TableHead>
                    <TableHead className="w-24">Priorité</TableHead>
                    <TableHead className="w-28">Échéance</TableHead>
                    <TableHead className="w-24">Statut</TableHead>
                    <TableHead className="w-24">Avancement</TableHead>
                    <TableHead className="w-28">Vélocité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.map((action) => {
                    const config = statusConfig[action.statut] || statusConfig.a_faire;
                    const StatusIcon = config.icon;
                    const velocity = getVelocity(action);
                    const priority = priorityConfig[action.priorite || 'normale'];
                    const isOverdue = action.statut !== 'termine' &&
                      action.date_fin_prevue && action.date_fin_prevue < today;

                    const VelocityIcon = velocity.trend === 'up' ? TrendingUp :
                      velocity.trend === 'down' ? TrendingDown : Minus;

                    return (
                      <TableRow key={action.id} className={cn(
                        'hover:bg-gray-50',
                        isOverdue && 'bg-error-50'
                      )}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{action.titre}</p>
                            {action.description && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {action.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-gray-400" />
                            {getResponsable(action.responsableId)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(priority.bgColor, priority.color, 'text-xs')}>
                            {ACTION_PRIORITE_LABELS[action.priorite as keyof typeof ACTION_PRIORITE_LABELS] || action.priorite}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'text-sm',
                            isOverdue ? 'text-error-600 font-medium' : 'text-gray-600'
                          )}>
                            {action.date_fin_prevue
                              ? new Date(action.date_fin_prevue).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                })
                              : '-'}
                          </span>
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
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  (action.avancement || 0) >= 100 ? 'bg-success-500' :
                                  (action.avancement || 0) >= 50 ? 'bg-primary-500' :
                                  'bg-warning-500'
                                )}
                                style={{ width: `${action.avancement || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {action.avancement || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            'flex items-center gap-1 text-sm font-medium',
                            velocity.trend === 'up' ? 'text-success-600' :
                            velocity.trend === 'down' ? 'text-error-600' :
                            'text-warning-600'
                          )}>
                            <VelocityIcon className="h-4 w-4" />
                            {velocity.label}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default AxisActions;
