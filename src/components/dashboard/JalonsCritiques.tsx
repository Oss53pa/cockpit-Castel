/**
 * Jalons Critiques - Prochains 30 jours
 * Spécifications v2.0 - Section 8.1
 * Design Premium avec animations
 */

import { Flag, AlertCircle, Clock, CheckCircle, Circle, Calendar, User, ChevronRight } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { useJalons, useUsers } from '@/hooks';
import { useMemo, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AXE_SHORT_LABELS, type Axe } from '@/types';

type JalonStatut = 'en_retard' | 'a_risque' | 'en_cours' | 'a_valider' | 'a_venir';

interface JalonCritique {
  id: number;
  code: string;
  titre: string;
  datePrevue: string;
  avancement: number;
  statut: JalonStatut;
  responsable: string;
  axe: Axe;
  joursRestants: number;
}

const STATUT_CONFIG: Record<
  JalonStatut,
  { icon: typeof AlertCircle; color: string; bg: string; label: string; pulseClass?: string }
> = {
  en_retard: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    label: 'En retard',
    pulseClass: 'animate-alert-pulse',
  },
  a_risque: {
    icon: Clock,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    label: 'À risque',
    pulseClass: 'animate-warning-pulse',
  },
  en_cours: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    label: 'En cours',
  },
  a_valider: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
    label: 'À valider',
  },
  a_venir: {
    icon: Circle,
    color: 'text-neutral-500',
    bg: 'bg-neutral-100',
    label: 'À venir',
  },
};

function getJalonStatut(jalon: {
  statut: string;
  avancement_prealables?: number;
  date_prevue: string;
}): JalonStatut {
  const today = new Date();
  const datePrevue = new Date(jalon.date_prevue);
  const joursRestants = Math.ceil(
    (datePrevue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const avancement = jalon.avancement_prealables || 0;

  // Déjà en retard
  if (joursRestants < 0 && avancement < 100) return 'en_retard';

  // À valider (100% atteint)
  if (avancement >= 100 || jalon.statut === 'a_valider') return 'a_valider';

  // À risque (moins de 7 jours et avancement < 80%)
  if (joursRestants <= 7 && avancement < 80) return 'a_risque';

  // En cours
  if (avancement > 0) return 'en_cours';

  return 'a_venir';
}

// Animated progress bar component
function AnimatedProgressBar({
  value,
  delay = 0,
}: {
  value: number;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setWidth(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  const colorClass =
    value >= 100
      ? 'bg-green-500'
      : value >= 75
        ? 'bg-blue-500'
        : value >= 50
          ? 'bg-amber-500'
          : 'bg-neutral-400';

  return (
    <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out',
          colorClass
        )}
        style={{ width: `${Math.min(width, 100)}%` }}
      />
    </div>
  );
}

// Individual row component with animation
function JalonRow({
  jalon,
  index,
}: {
  jalon: JalonCritique;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timeout);
  }, [index]);

  const statutConfig = STATUT_CONFIG[jalon.statut];
  const StatusIcon = statutConfig.icon;

  return (
    <tr
      ref={rowRef}
      className={cn(
        'transition-all duration-300',
        'hover:bg-primary-50/50',
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
        isHovered && 'shadow-sm'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Statut */}
      <td className="py-3 px-2">
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
            statutConfig.bg,
            statutConfig.color,
            statutConfig.pulseClass
          )}
        >
          <StatusIcon className="w-3 h-3" />
          {statutConfig.label}
        </div>
      </td>

      {/* Code */}
      <td className="py-3 px-2">
        <span className="text-sm font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
          {jalon.code}
        </span>
      </td>

      {/* Titre */}
      <td className="py-3 px-2">
        <p
          className={cn(
            'text-sm font-medium text-neutral-900 max-w-[200px] truncate transition-all',
            isHovered && 'text-primary-700'
          )}
        >
          {jalon.titre}
        </p>
        <p className="text-xs text-neutral-500">{AXE_SHORT_LABELS[jalon.axe]}</p>
      </td>

      {/* Date */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-3 h-3 text-neutral-400" />
          <span
            className={cn(
              jalon.joursRestants < 0
                ? 'text-red-600 font-medium'
                : jalon.joursRestants <= 7
                  ? 'text-orange-600'
                  : 'text-neutral-600'
            )}
          >
            {new Date(jalon.datePrevue).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
            })}
          </span>
        </div>
        <p
          className={cn(
            'text-xs',
            jalon.joursRestants < 0
              ? 'text-red-500 font-medium'
              : 'text-neutral-400'
          )}
        >
          {jalon.joursRestants < 0
            ? `${Math.abs(jalon.joursRestants)}j de retard`
            : jalon.joursRestants === 0
              ? "Aujourd'hui"
              : `J-${jalon.joursRestants}`}
        </p>
      </td>

      {/* Avancement */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-2">
          <AnimatedProgressBar value={jalon.avancement} delay={index * 50 + 200} />
          <span className="text-sm font-medium text-neutral-700 w-10">
            {Math.round(jalon.avancement)}%
          </span>
        </div>
      </td>

      {/* Responsable */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-3 h-3 text-primary-600" />
          </div>
          <span className="truncate max-w-[100px]">{jalon.responsable}</span>
        </div>
      </td>

      {/* Action */}
      <td className="py-3 px-2">
        <button
          className={cn(
            'p-1.5 rounded-full transition-all',
            'hover:bg-primary-100 hover:text-primary-600',
            'text-neutral-400',
            isHovered && 'opacity-100'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

export function JalonsCritiques() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const jalons = useJalons();
  const users = useUsers();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const jalonsCritiques = useMemo<JalonCritique[]>(() => {
    const today = new Date();
    const dans30Jours = new Date();
    dans30Jours.setDate(dans30Jours.getDate() + 30);

    return jalons
      .filter((jalon) => {
        const datePrevue = new Date(jalon.date_prevue);
        // Inclure les jalons des 30 prochains jours OU en retard (passés mais non terminés)
        const avancement = jalon.avancement_prealables || 0;
        const estEnRetard = datePrevue < today && avancement < 100;
        const estDans30Jours = datePrevue >= today && datePrevue <= dans30Jours;
        return estEnRetard || estDans30Jours;
      })
      .map((jalon) => {
        const datePrevue = new Date(jalon.date_prevue);
        const joursRestants = Math.ceil(
          (datePrevue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const responsable = users.find((u) => u.id === jalon.responsable);

        return {
          id: jalon.id!,
          code: jalon.id_jalon || `J-${jalon.id}`,
          titre: jalon.titre,
          datePrevue: jalon.date_prevue,
          avancement: jalon.avancement_prealables || 0,
          statut: getJalonStatut(jalon),
          responsable: responsable
            ? `${responsable.prenom} ${responsable.nom}`
            : jalon.responsable || 'Non assigné',
          axe: jalon.axe as Axe,
          joursRestants,
        };
      })
      .sort((a, b) => {
        // Trier par priorité de statut puis par date
        const priorite = {
          en_retard: 0,
          a_risque: 1,
          en_cours: 2,
          a_valider: 3,
          a_venir: 4,
        };
        if (priorite[a.statut] !== priorite[b.statut]) {
          return priorite[a.statut] - priorite[b.statut];
        }
        return (
          new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime()
        );
      })
      .slice(0, 10); // Limiter à 10 jalons
  }, [jalons, users]);

  // Count by status for badges
  const statusCounts = useMemo(() => {
    return jalonsCritiques.reduce(
      (acc, j) => {
        acc[j.statut] = (acc[j.statut] || 0) + 1;
        return acc;
      },
      {} as Record<JalonStatut, number>
    );
  }, [jalonsCritiques]);

  if (jalonsCritiques.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'opacity-0 translate-y-4',
          isVisible && 'animate-fade-slide-in'
        )}
      >
        <Card padding="md" className="shimmer">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-neutral-900">
              Jalons Critiques
            </h3>
            <Badge variant="secondary">30 jours</Badge>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <CheckCircle className="w-12 h-12 mb-3 text-green-300" />
            <p className="text-neutral-500">
              Aucun jalon critique dans les 30 prochains jours
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'opacity-0 translate-y-4',
        isVisible && 'animate-fade-slide-in'
      )}
    >
      <Card padding="md" className="shimmer overflow-hidden">
        {/* Header with status summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Flag className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Jalons Critiques
              </h3>
              <p className="text-xs text-neutral-500">Prochains 30 jours</p>
            </div>
          </div>

          {/* Status badges summary */}
          <div className="flex items-center gap-2">
            {statusCounts.en_retard > 0 && (
              <Badge
                variant="error"
                className="animate-alert-pulse"
              >
                {statusCounts.en_retard} en retard
              </Badge>
            )}
            {statusCounts.a_risque > 0 && (
              <Badge variant="warning">
                {statusCounts.a_risque} à risque
              </Badge>
            )}
            {statusCounts.a_valider > 0 && (
              <Badge variant="success">
                {statusCounts.a_valider} à valider
              </Badge>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-2 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left py-2 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="text-left py-2 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Jalon
                </th>
                <th className="text-left py-2 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-2 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Avancement
                </th>
                <th className="text-left py-2 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {jalonsCritiques.map((jalon, index) => (
                <JalonRow key={jalon.id} jalon={jalon} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
