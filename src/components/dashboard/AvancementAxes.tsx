/**
 * Avancement par Axe - Barres de progression animées
 * Design Premium avec animations
 */

import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useAvancementParAxe } from '@/hooks';
import { AXE_LABELS, type Axe } from '@/types';
import type { Trend } from '@/lib/calculations';
import { useEffect, useState, useRef } from 'react';

const trendIcons: Record<Trend, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors: Record<Trend, string> = {
  up: 'text-success-500',
  down: 'text-error-500',
  stable: 'text-primary-400',
};

interface AxeProgressProps {
  axe: Axe;
  avancement: number;
  prevu: number;
  tendance: Trend;
  actionsTotal: number;
  actionsTerminees: number;
  delay: number;
  isVisible: boolean;
}

function AxeProgress({
  axe,
  avancement,
  prevu,
  tendance,
  actionsTotal,
  actionsTerminees,
  delay,
  isVisible,
}: AxeProgressProps) {
  const [animatedAvancement, setAnimatedAvancement] = useState(0);
  const [animatedPrevu, setAnimatedPrevu] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const TrendIcon = trendIcons[tendance];
  const ecart = avancement - prevu;

  useEffect(() => {
    if (isVisible) {
      const timeout1 = setTimeout(() => setAnimatedPrevu(prevu), delay);
      const timeout2 = setTimeout(() => setAnimatedAvancement(avancement), delay + 100);
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }
  }, [avancement, prevu, delay, isVisible]);

  return (
    <div
      className={cn(
        'space-y-2 p-3 rounded-lg transition-all duration-300',
        'hover:bg-primary-50/50',
        isHovered && 'shadow-sm'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-sm font-medium text-primary-700 transition-colors',
            isHovered && 'text-primary-900'
          )}
        >
          {AXE_LABELS[axe]}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full transition-all',
              ecart >= 0
                ? 'bg-success-100 text-success-700'
                : 'bg-error-100 text-error-700'
            )}
          >
            {ecart >= 0 ? '+' : ''}
            {Math.round(ecart)}%
          </span>
          <TrendIcon
            className={cn(
              'h-4 w-4 transition-transform',
              trendColors[tendance],
              isHovered && 'scale-125'
            )}
          />
        </div>
      </div>

      {/* Double progress bar: Prévu vs Réalisé */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary-400 w-14">Prévu</span>
          <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-300 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(animatedPrevu, 100)}%` }}
            />
          </div>
          <span className="text-xs text-primary-500 w-10 text-right">
            {Math.round(prevu)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary-400 w-14">Réalisé</span>
          <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden relative">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                avancement >= prevu ? 'bg-success-500' : 'bg-warning-500'
              )}
              style={{ width: `${Math.min(animatedAvancement, 100)}%` }}
            />
            {/* Shimmer effect */}
            {isHovered && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: 'shimmerMove 1.5s ease-in-out infinite',
                }}
              />
            )}
          </div>
          <span className="text-xs font-medium text-primary-700 w-10 text-right">
            {Math.round(avancement)}%
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-primary-400">
        <span>
          {actionsTerminees}/{actionsTotal} actions terminées
        </span>
        <ChevronRight
          className={cn(
            'w-4 h-4 transition-all duration-300',
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
          )}
        />
      </div>
    </div>
  );
}

export function AvancementAxes() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const avancements = useAvancementParAxe();

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

  return (
    <div
      ref={containerRef}
      className={cn(
        'opacity-0 translate-y-4',
        isVisible && 'animate-fade-slide-in'
      )}
    >
      <Card padding="md" className="shimmer">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary-900">
            Avancement par axe
          </h3>
          <div className="flex items-center gap-4 text-xs text-primary-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-primary-300 rounded-full" />
              <span>Prévu</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-success-500 rounded-full" />
              <span>Réalisé</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {avancements.map((item, index) => (
            <AxeProgress
              key={item.axe}
              axe={item.axe}
              avancement={item.avancement}
              prevu={item.prevu}
              tendance={item.tendance}
              actionsTotal={item.actionsTotal}
              actionsTerminees={item.actionsTerminees}
              delay={index * 100}
              isVisible={isVisible}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
