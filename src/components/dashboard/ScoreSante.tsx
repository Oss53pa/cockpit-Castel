/**
 * Score de Santé Global du Projet
 * Widget avec jauge circulaire animée et décomposition des facteurs
 */

import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { useProph3tHealth } from '@/hooks/useProph3t';

interface ScoreFactor {
  label: string;
  score: number;
  weight: number;
  trend: 'up' | 'down' | 'stable';
  icon: typeof Activity;
}

// Animated circular gauge
function CircularGauge({
  score,
  size = 160,
  isVisible,
}: {
  score: number;
  size?: number;
  isVisible: boolean;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    if (isVisible) {
      const duration = 1500;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setAnimatedScore(Math.round(score * easeOutQuart));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [score, isVisible]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: '#22c55e', text: 'text-green-500', bg: 'from-green-500/20' };
    if (s >= 60) return { stroke: '#f59e0b', text: 'text-amber-500', bg: 'from-amber-500/20' };
    if (s >= 40) return { stroke: '#f97316', text: 'text-orange-500', bg: 'from-orange-500/20' };
    return { stroke: '#ef4444', text: 'text-red-500', bg: 'from-red-500/20' };
  };

  const colors = getScoreColor(animatedScore);

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Bon';
    if (s >= 40) return 'Modéré';
    return 'Critique';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Gradient background glow */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-2xl opacity-50 transition-all duration-1000',
          `bg-gradient-radial ${colors.bg} to-transparent`
        )}
        style={{
          background: `radial-gradient(circle, ${colors.stroke}33 0%, transparent 70%)`,
        }}
      />

      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-100 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${colors.stroke}66)`,
          }}
        />
        {/* Score segments markers */}
        {[25, 50, 75].map((segment) => {
          const angle = (segment / 100) * 360 - 90;
          const x1 = size / 2 + (radius - 5) * Math.cos((angle * Math.PI) / 180);
          const y1 = size / 2 + (radius - 5) * Math.sin((angle * Math.PI) / 180);
          const x2 = size / 2 + (radius + 5) * Math.cos((angle * Math.PI) / 180);
          const y2 = size / 2 + (radius + 5) * Math.sin((angle * Math.PI) / 180);
          return (
            <line
              key={segment}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#d1d5db"
              strokeWidth={2}
            />
          );
        })}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'text-4xl font-bold transition-all duration-300',
            colors.text
          )}
        >
          {animatedScore}
        </span>
        <span className="text-sm text-neutral-500 font-medium">
          {getScoreLabel(animatedScore)}
        </span>
      </div>
    </div>
  );
}

// Factor bar component
function FactorBar({
  factor,
  delay,
  isVisible,
}: {
  factor: ScoreFactor;
  delay: number;
  isVisible: boolean;
}) {
  const [width, setWidth] = useState(0);
  const TrendIcon =
    factor.trend === 'up'
      ? TrendingUp
      : factor.trend === 'down'
        ? TrendingDown
        : Minus;

  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => setWidth(factor.score), delay);
      return () => clearTimeout(timeout);
    }
  }, [factor.score, delay, isVisible]);

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <factor.icon className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-700 font-medium">{factor.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-900 font-semibold">{Math.round(factor.score)}</span>
          <TrendIcon
            className={cn(
              'w-3 h-3',
              factor.trend === 'up'
                ? 'text-green-500'
                : factor.trend === 'down'
                  ? 'text-red-500'
                  : 'text-neutral-400'
            )}
          />
        </div>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            getBarColor(factor.score)
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreSante() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Utiliser le même hook que partout ailleurs pour cohérence
  const health = useProph3tHealth();

  // Intersection observer
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

  // Facteurs depuis le hook unifié — 6 facteurs, mêmes poids que le calcul du score global
  const factors: ScoreFactor[] = health ? [
    {
      label: 'Avancement',
      score: health.planningScore,
      weight: 25,
      trend: health.planningScore >= 50 ? 'up' : health.planningScore < 20 ? 'down' : 'stable',
      icon: Activity,
    },
    {
      label: 'Jalons',
      score: health.riskScore,
      weight: 20,
      trend: health.riskScore >= 50 ? 'up' : health.riskScore < 30 ? 'down' : 'stable',
      icon: health.riskScore >= 50 ? CheckCircle : AlertTriangle,
    },
    {
      label: 'Budget',
      score: health.budgetScore,
      weight: 15,
      trend: health.cpi >= 1 ? 'up' : 'down',
      icon: health.budgetScore > health.planningScore + 20 ? AlertTriangle : CheckCircle,
    },
    {
      label: 'Occupation',
      score: health.alertScore,
      weight: 15,
      trend: health.alertScore >= 70 ? 'up' : health.alertScore < 50 ? 'down' : 'stable',
      icon: health.alertScore >= 70 ? CheckCircle : Clock,
    },
    {
      label: 'Vélocité',
      score: health.velocityScore,
      weight: 15,
      trend: health.velocityScore >= 50 ? 'up' : health.velocityScore < 20 ? 'down' : 'stable',
      icon: TrendingUp,
    },
    {
      label: 'Sync',
      score: health.syncScore,
      weight: 10,
      trend: health.syncScore >= 60 ? 'up' : health.syncScore < 40 ? 'down' : 'stable',
      icon: RefreshCw,
    },
  ] : [];

  // Score global depuis le hook unifié
  const overallScore = health?.score ?? 0;

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
          <div className="p-2 bg-primary-100 rounded-lg">
            <Activity className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
              Score de Santé
            </h3>
            <p className="text-xs text-neutral-500">Indicateur global du projet</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Circular gauge */}
          <div className="flex-shrink-0">
            <CircularGauge score={overallScore} isVisible={isVisible} />
          </div>

          {/* Factor breakdown */}
          <div className="flex-1 w-full">
            <p className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider mb-2">
              Décomposition
            </p>
            <div className="space-y-2.5">
              {factors.map((factor, index) => (
                <FactorBar
                  key={factor.label}
                  factor={factor}
                  delay={200 + index * 100}
                  isVisible={isVisible}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom summary — poids */}
        <div className="mt-4 pt-3 border-t border-neutral-100">
          <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
            Avancement (25%) · Jalons (20%) · Budget (15%) · Occupation (15%) · Vélocité (15%) · Sync (10%)
          </p>
        </div>
      </Card>
    </div>
  );
}
