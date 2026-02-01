/**
 * Score de Santé Global du Projet
 * Widget avec jauge circulaire animée et décomposition des facteurs
 * UNIFIÉ avec useProph3tHealth pour cohérence
 */

import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, FileText, Shield } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { useProph3tHealth } from '@/hooks';

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
    if (s >= 70) return { stroke: '#22c55e', text: 'text-green-500', bg: 'from-green-500/20' };
    if (s >= 40) return { stroke: '#f59e0b', text: 'text-amber-500', bg: 'from-amber-500/20' };
    return { stroke: '#ef4444', text: 'text-red-500', bg: 'from-red-500/20' };
  };

  const colors = getScoreColor(animatedScore);

  const getScoreLabel = (s: number) => {
    if (s >= 70) return 'Bon';
    if (s >= 40) return 'Attention';
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
  label,
  score,
  icon,
  delay,
  isVisible,
}: {
  label: string;
  score: number;
  icon: React.ReactNode;
  delay: number;
  isVisible: boolean;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => setWidth(score), delay);
      return () => clearTimeout(timeout);
    }
  }, [score, delay, isVisible]);

  const getBarColor = (s: number) => {
    if (s >= 70) return 'bg-green-500';
    if (s >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">{icon}</span>
          <span className="text-neutral-700 font-medium">{label}</span>
        </div>
        <span className="text-neutral-900 font-semibold">{Math.round(score)}</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            getBarColor(score)
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

  if (!health) {
    return (
      <Card padding="md" className="animate-pulse">
        <div className="h-64 bg-neutral-100 rounded" />
      </Card>
    );
  }

  const factors = [
    { label: 'Planning', score: health.planningScore, icon: <Clock className="w-4 h-4" /> },
    { label: 'Budget', score: health.budgetScore, icon: <FileText className="w-4 h-4" /> },
    { label: 'Risques', score: health.riskScore, icon: <Shield className="w-4 h-4" /> },
    { label: 'Alertes', score: health.alertScore, icon: <AlertTriangle className="w-4 h-4" /> },
  ];

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
            <h3 className="text-lg font-semibold text-neutral-900">
              Score de Santé
            </h3>
            <p className="text-xs text-neutral-500">Indicateur global du projet</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Circular gauge */}
          <div className="flex-shrink-0">
            <CircularGauge score={health.score} isVisible={isVisible} />
          </div>

          {/* Factor breakdown */}
          <div className="flex-1 w-full space-y-3">
            {factors.map((factor, index) => (
              <FactorBar
                key={factor.label}
                label={factor.label}
                score={factor.score}
                icon={factor.icon}
                delay={200 + index * 100}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>

        {/* EVM Indicators */}
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className={cn(
                'text-xl font-bold',
                health.spi >= 1 ? 'text-green-600' : health.spi >= 0.9 ? 'text-amber-600' : 'text-red-600'
              )}>
                {health.spi.toFixed(2)}
              </div>
              <div className="text-xs text-neutral-500">SPI (Planning)</div>
            </div>
            <div className="text-center">
              <div className={cn(
                'text-xl font-bold',
                health.cpi >= 1 ? 'text-green-600' : health.cpi >= 0.9 ? 'text-amber-600' : 'text-red-600'
              )}>
                {health.cpi.toFixed(2)}
              </div>
              <div className="text-xs text-neutral-500">CPI (Budget)</div>
            </div>
          </div>
        </div>

        {/* Issues */}
        {health.issues.length > 0 && (
          <div className="mt-4 p-3 bg-error-50 rounded-lg">
            <div className="text-xs font-semibold text-error-700 mb-1">Points d'attention:</div>
            <ul className="text-xs text-error-600 space-y-0.5">
              {health.issues.slice(0, 3).map((issue, i) => (
                <li key={i}>• {issue}</li>
              ))}
              {health.issues.length > 3 && (
                <li className="text-error-500">+{health.issues.length - 3} autres...</li>
              )}
            </ul>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Bon (70+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Attention (40-69)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Critique (-40)
          </span>
        </div>
      </Card>
    </div>
  );
}
