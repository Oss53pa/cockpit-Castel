/**
 * Météo par Axe - Cards avec icônes SVG animées
 * Spécifications v2.0 - Section 8.1
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui';
import { useAvancementParAxe } from '@/hooks';
import { AXE_SHORT_LABELS, AXE_CONFIG, type Axe } from '@/types';
import { cn } from '@/lib/utils';
import type { Trend } from '@/lib/calculations';
import { useEffect, useState, useRef } from 'react';
import { METEO_STYLES, type MeteoType } from '@/data/constants';

// SVG Weather Icons - Animated
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('animate-spin-slow', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.2" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('animate-float', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

function StormIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M17.5 17H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path d="M17.5 17H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path
        d="m13 12-2 4h4l-2 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-pulse"
      />
    </svg>
  );
}

// Mapping des icônes SVG animées locales (les styles viennent de METEO_STYLES)
const METEO_ICONS = {
  SOLEIL: SunIcon,
  NUAGEUX: CloudIcon,
  ORAGEUX: StormIcon,
} as const;

// Helper pour obtenir config complète (styles + icône)
function getMeteoConfig(meteo: MeteoType) {
  return {
    ...METEO_STYLES[meteo],
    icon: METEO_ICONS[meteo],
  };
}

// Calculer la météo en fonction de l'écart prévu/réalisé
function calculerMeteo(avancement: number, prevu: number): 'SOLEIL' | 'NUAGEUX' | 'ORAGEUX' {
  const ecart = avancement - prevu;
  if (ecart >= -5) return 'SOLEIL';
  if (ecart >= -15) return 'NUAGEUX';
  return 'ORAGEUX';
}

interface MeteoAxeCardProps {
  axe: Axe;
  avancement: number;
  prevu: number;
  tendance: Trend;
  onClick?: () => void;
  animationDelay?: number;
}

function MeteoAxeCard({
  axe,
  avancement,
  prevu,
  tendance,
  onClick,
  animationDelay = 0,
}: MeteoAxeCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection observer for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), animationDelay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [animationDelay]);

  const meteo = calculerMeteo(avancement, prevu);
  const config = getMeteoConfig(meteo);
  const WeatherIcon = config.icon;

  const TrendIcon =
    tendance === 'up' ? TrendingUp : tendance === 'down' ? TrendingDown : Minus;
  const trendColor =
    tendance === 'up'
      ? 'text-green-500'
      : tendance === 'down'
        ? 'text-red-500'
        : 'text-neutral-400';

  return (
    <div
      ref={cardRef}
      className={cn(
        'opacity-0 translate-y-4',
        isVisible && 'animate-fade-slide-in'
      )}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
    >
      <Card
        padding="sm"
        className={cn(
          'cursor-pointer transition-all duration-300 border-2 shimmer',
          'hover:shadow-lg hover:scale-[1.03] hover:-translate-y-1',
          config.bgColor,
          config.borderColor,
          config.glowClass,
          meteo === 'ORAGEUX' && 'animate-warning-pulse'
        )}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between mb-2">
          <div
            className={cn(
              'transition-transform duration-300',
              isHovered && 'scale-110'
            )}
          >
            <WeatherIcon className={cn('w-8 h-8', config.iconColor)} />
          </div>
          <TrendIcon
            className={cn(
              'w-4 h-4 transition-all duration-300',
              trendColor,
              isHovered && 'scale-125'
            )}
          />
        </div>

        <div className="space-y-1">
          <p className={cn('text-sm font-semibold', config.textColor)}>
            {AXE_SHORT_LABELS[axe]}
          </p>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'text-2xl font-bold text-neutral-900 transition-all duration-300',
                isHovered && 'scale-105'
              )}
            >
              {Math.round(avancement)}%
            </span>
            {prevu > 0 && (
              <span className="text-xs text-neutral-500">
                / {Math.round(prevu)}% prévu
              </span>
            )}
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out',
              config.progressColor
            )}
            style={{
              width: isVisible ? `${Math.min(avancement, 100)}%` : '0%',
              transitionDelay: `${animationDelay + 200}ms`,
            }}
          />
        </div>

        {/* Status badge */}
        <div
          className={cn(
            'mt-2 text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1',
            'bg-white/60 backdrop-blur-sm',
            config.textColor
          )}
        >
          {config.label}
        </div>
      </Card>
    </div>
  );
}

interface MeteoParAxeProps {
  onAxeClick?: (axe: Axe) => void;
}

export function MeteoParAxe({ onAxeClick }: MeteoParAxeProps) {
  const avancements = useAvancementParAxe();

  // Filtrer les axes avec poids > 0 (exclure Construction qui a poids 0)
  const axesAffiches = avancements.filter((item) => {
    const config = AXE_CONFIG[item.axe];
    return config && config.poids > 0;
  });

  // Si pas de données, afficher quand même les 6 axes avec 0%
  const axesAfficher =
    axesAffiches.length > 0
      ? axesAffiches
      : (
          [
            'axe1_rh',
            'axe2_commercial',
            'axe3_technique',
            'axe4_budget',
            'axe5_marketing',
            'axe6_exploitation',
          ] as Axe[]
        ).map((axe) => ({
          axe,
          avancement: 0,
          prevu: 0,
          tendance: 'stable' as const,
        }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">
          Météo par Axe
        </h3>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <SunIcon className="w-4 h-4 text-amber-500" />
            <span>En avance</span>
          </div>
          <div className="flex items-center gap-1">
            <CloudIcon className="w-4 h-4 text-amber-600" />
            <span>Vigilance</span>
          </div>
          <div className="flex items-center gap-1">
            <StormIcon className="w-4 h-4 text-red-500" />
            <span>Critique</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {axesAfficher.map((data, index) => (
          <MeteoAxeCard
            key={data.axe}
            axe={data.axe}
            avancement={data.avancement}
            prevu={data.prevu}
            tendance={data.tendance}
            onClick={() => onAxeClick?.(data.axe)}
            animationDelay={index * 100}
          />
        ))}
      </div>
    </div>
  );
}
