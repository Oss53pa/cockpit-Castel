/**
 * Vue Axe - Affichage détaillé d'un axe avec jalons et actions imbriquées
 * Spécifications v2.0 - Section 8.2
 */

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Flag,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Plus,
  ChevronDown,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
} from 'lucide-react';
import { Card, Badge, Button, Progress } from '@/components/ui';
import { useJalons, useActions, useUsers } from '@/hooks';
import { cn } from '@/lib/utils';
import { AXE_LABELS, AXE_SHORT_LABELS, AXE_CONFIG, type Axe } from '@/types';

// Configuration météo
const METEO_CONFIG = {
  SOLEIL: { icon: Sun, emoji: '☀️', color: 'text-green-500' },
  NUAGEUX: { icon: Cloud, emoji: '🌤️', color: 'text-amber-500' },
  ORAGEUX: { icon: CloudRain, emoji: '⛈️', color: 'text-red-500' },
};

// Configuration statuts
const ACTION_STATUT_CONFIG = {
  termine: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Fait' },
  en_cours: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'En cours' },
  non_demarre: { icon: Circle, color: 'text-neutral-400', bg: 'bg-neutral-100', label: 'À faire' },
  en_retard: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'En retard' },
  bloque: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Bloqué' },
};

function calculerMeteoJalon(avancement: number, datePrevue: string): 'SOLEIL' | 'NUAGEUX' | 'ORAGEUX' {
  const today = new Date();
  const date = new Date(datePrevue);
  const joursRestants = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Si terminé
  if (avancement >= 100) return 'SOLEIL';

  // Si en retard
  if (joursRestants < 0) return 'ORAGEUX';

  // Si proche de la deadline et avancement faible
  if (joursRestants <= 14 && avancement < 70) return 'ORAGEUX';
  if (joursRestants <= 30 && avancement < 50) return 'NUAGEUX';

  return 'SOLEIL';
}

interface JalonCardProps {
  jalon: {
    id: number;
    id_jalon: string;
    titre: string;
    date_prevue: string;
    avancement_prealables: number;
    statut: string;
    responsable?: string;
  };
  actions: Array<{
    id: number;
    id_action: string;
    titre: string;
    avancement: number;
    statut: string;
    responsable?: string;
  }>;
  users: Array<{ id: number; nom: string; prenom: string }>;
  onAddAction?: () => void;
}

function JalonCard({ jalon, actions, users, onAddAction }: JalonCardProps) {
  const [expanded, setExpanded] = useState(true);

  const avancement = jalon.avancement_prealables || 0;
  const meteo = calculerMeteoJalon(avancement, jalon.date_prevue);
  const meteoConfig = METEO_CONFIG[meteo];
  const responsable = users.find((u) => String(u.id) === String(jalon.responsable));
  const isTermine = avancement >= 100;

  return (
    <Card padding="none" className={cn('overflow-hidden border-2', isTermine ? 'border-green-200 bg-green-50/30' : 'border-neutral-200')}>
      {/* Header du jalon */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          )}
          <Flag className="w-5 h-5 text-primary-600" />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-neutral-500">{jalon.id_jalon}</span>
              <span className="text-neutral-300">:</span>
              <span className="font-semibold text-neutral-900">{jalon.titre}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(jalon.date_prevue).toLocaleDateString('fr-FR')}
              </span>
              {responsable && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {responsable.prenom} {responsable.nom}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-2xl">{meteoConfig.emoji}</span>
          <div className="text-right">
            <span className={cn('text-xl font-bold', isTermine ? 'text-green-600' : 'text-neutral-900')}>
              {Math.round(avancement)}%
            </span>
            {isTermine && <CheckCircle className="inline-block w-5 h-5 ml-2 text-green-500" />}
          </div>
        </div>
      </button>

      {/* Contenu (actions) */}
      {expanded && (
        <div className="border-t border-neutral-200 p-4 space-y-2">
          {actions.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">Aucune action pour ce jalon</p>
          ) : (
            actions.map((action) => {
              const actionStatut = ACTION_STATUT_CONFIG[action.statut as keyof typeof ACTION_STATUT_CONFIG] || ACTION_STATUT_CONFIG.non_demarre;
              const ActionIcon = actionStatut.icon;
              const actionResponsable = users.find((u) => String(u.id) === String(action.responsable));

              return (
                <div
                  key={action.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    action.statut === 'termine' ? 'bg-green-50 border-green-200' : 'bg-white border-neutral-200'
                  )}
                >
                  {/* Code action */}
                  <span className="font-mono text-xs text-neutral-500 w-24 flex-shrink-0">
                    {action.id_action}
                  </span>

                  {/* Titre */}
                  <span className={cn(
                    'flex-1 text-sm',
                    action.statut === 'termine' ? 'text-neutral-500 line-through' : 'text-neutral-700'
                  )}>
                    {action.titre}
                  </span>

                  {/* Progress bar */}
                  <div className="w-24 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          action.avancement >= 100 ? 'bg-green-500' :
                          action.avancement >= 50 ? 'bg-blue-500' : 'bg-neutral-400'
                        )}
                        style={{ width: `${Math.min(action.avancement, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-neutral-600 w-8 text-right">
                      {action.avancement}%
                    </span>
                  </div>

                  {/* Statut */}
                  <Badge
                    variant="outline"
                    className={cn('text-xs', actionStatut.bg, actionStatut.color, 'border-0')}
                  >
                    <ActionIcon className="w-3 h-3 mr-1" />
                    {actionStatut.label}
                  </Badge>
                </div>
              );
            })
          )}

          {/* Bouton ajouter action */}
          {onAddAction && (
            <button
              onClick={onAddAction}
              className="w-full p-2 border-2 border-dashed border-neutral-300 rounded-lg text-sm text-neutral-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Ajouter une action
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

interface VueAxeProps {
  axe: Axe;
  onBack?: () => void;
  onAddJalon?: () => void;
  onAddAction?: (jalonId: number) => void;
}

export function VueAxe({ axe, onBack, onAddJalon, onAddAction }: VueAxeProps) {
  const allJalons = useJalons();
  const allActions = useActions();
  const users = useUsers();

  // Filtrer les jalons et actions pour cet axe
  const jalonsAxe = useMemo(() => {
    return allJalons
      .filter((j) => j.axe === axe)
      .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime());
  }, [allJalons, axe]);

  const actionsParJalon = useMemo(() => {
    const map: Record<number, typeof allActions> = {};
    jalonsAxe.forEach((j) => {
      map[j.id!] = allActions.filter((a) => a.jalonId === j.id);
    });
    return map;
  }, [jalonsAxe, allActions]);

  // Calculs globaux
  const avancementGlobal = useMemo(() => {
    if (jalonsAxe.length === 0) return 0;
    const total = jalonsAxe.reduce((sum, j) => sum + (j.avancement_prealables || 0), 0);
    return Math.round(total / jalonsAxe.length);
  }, [jalonsAxe]);

  const meteoGlobal = calculerMeteoJalon(avancementGlobal, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
  const meteoConfig = METEO_CONFIG[meteoGlobal];
  const axeConfig = AXE_CONFIG[axe];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">{AXE_LABELS[axe]}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {jalonsAxe.length} jalon{jalonsAxe.length > 1 ? 's' : ''} · {Object.values(actionsParJalon).flat().length} actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{meteoConfig.emoji}</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-neutral-900">{avancementGlobal}%</p>
              <p className="text-xs text-neutral-500">global</p>
            </div>
          </div>
          {onAddJalon && (
            <Button variant="primary" onClick={onAddJalon}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau jalon
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar global */}
      <Card padding="md" className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary-700">Avancement global de l'axe</span>
          <span className="text-lg font-bold text-primary-900">{avancementGlobal}%</span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
            style={{ width: `${avancementGlobal}%` }}
          />
        </div>
      </Card>

      {/* Liste des jalons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Jalons</h3>
        </div>

        {jalonsAxe.length === 0 ? (
          <Card padding="lg" className="text-center">
            <Flag className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500">Aucun jalon pour cet axe</p>
            {onAddJalon && (
              <Button variant="primary" className="mt-4" onClick={onAddJalon}>
                <Plus className="w-4 h-4 mr-2" />
                Créer le premier jalon
              </Button>
            )}
          </Card>
        ) : (
          jalonsAxe.map((jalon) => (
            <JalonCard
              key={jalon.id}
              jalon={{
                id: jalon.id!,
                id_jalon: jalon.id_jalon || `J-${jalon.id}`,
                titre: jalon.titre,
                date_prevue: jalon.date_prevue,
                avancement_prealables: jalon.avancement_prealables || 0,
                statut: jalon.statut,
                responsable: jalon.responsable,
              }}
              actions={(actionsParJalon[jalon.id!] || []).map((a) => ({
                id: a.id!,
                id_action: a.id_action,
                titre: a.titre,
                avancement: a.avancement,
                statut: a.statut,
                responsable: a.responsable,
              }))}
              users={users}
              onAddAction={onAddAction ? () => onAddAction(jalon.id!) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
