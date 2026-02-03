/**
 * Module Score de Confiance d'Ouverture
 * Affiche une jauge circulaire avec décomposition des facteurs contributifs
 */

import { useEffect, useState, useRef } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Activity,
  AlertTriangle,
  Users,
  Wallet,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfidenceScore } from '@/hooks/useConfidenceScore';

// Jauge circulaire animée
function CircularGauge({
  score,
  status,
  size = 140,
  isVisible,
}: {
  score: number;
  status: 'vert' | 'jaune' | 'rouge';
  size?: number;
  isVisible: boolean;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    if (isVisible) {
      const duration = 1200;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setAnimatedScore(Math.round(score * easeOutQuart));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [score, isVisible]);

  const colors = {
    vert: { stroke: '#22c55e', glow: '#22c55e33' },
    jaune: { stroke: '#f59e0b', glow: '#f59e0b33' },
    rouge: { stroke: '#ef4444', glow: '#ef444433' },
  };

  const color = colors[status];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-50"
        style={{ background: `radial-gradient(circle, ${color.glow} 0%, transparent 70%)` }}
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
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-100 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color.stroke}66)` }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'text-3xl font-bold',
            status === 'vert' && 'text-green-600',
            status === 'jaune' && 'text-amber-600',
            status === 'rouge' && 'text-red-600'
          )}
        >
          {animatedScore}%
        </span>
        <span className="text-xs text-neutral-500">Confiance</span>
      </div>
    </div>
  );
}

// Barre de facteur
function FactorBar({
  label,
  icon: Icon,
  value,
  weight,
  delay,
  isVisible,
}: {
  label: string;
  icon: typeof Activity;
  value: number;
  weight: number;
  delay: number;
  isVisible: boolean;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => setWidth(value), delay);
      return () => clearTimeout(timeout);
    }
  }, [value, delay, isVisible]);

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-neutral-400" />
          <span className="text-neutral-600">{label}</span>
          <span className="text-neutral-400">({Math.round(weight * 100)}%)</span>
        </div>
        <span className="font-semibold text-neutral-700">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', getBarColor(value))}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function ConfidenceScore() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const data = useConfidenceScore();

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

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8 text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm">Calcul du score...</span>
      </div>
    );
  }

  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
  const trendColor = data.trend === 'up' ? 'text-green-500' : data.trend === 'down' ? 'text-red-500' : 'text-neutral-400';

  const factors = [
    { key: 'velocite', label: 'Vélocité', icon: Activity, ...data.factors.velocite },
    { key: 'jalons', label: 'Jalons', icon: Target, ...data.factors.jalons },
    { key: 'risques', label: 'Risques', icon: AlertTriangle, ...data.factors.risques },
    { key: 'occupation', label: 'Occupation', icon: Users, ...data.factors.occupation },
    { key: 'budget', label: 'Budget', icon: Wallet, ...data.factors.budget },
    { key: 'sync', label: 'Synchronisation', icon: RefreshCw, ...data.factors.sync },
  ];

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Header avec score et tendance */}
      <div className="flex items-start gap-4">
        <CircularGauge
          score={data.score}
          status={data.status}
          isVisible={isVisible}
        />

        <div className="flex-1 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                data.status === 'vert' && 'bg-green-100 text-green-700',
                data.status === 'jaune' && 'bg-amber-100 text-amber-700',
                data.status === 'rouge' && 'bg-red-100 text-red-700'
              )}
            >
              {data.status === 'vert' ? 'Favorable' : data.status === 'jaune' ? 'Vigilance' : 'Critique'}
            </span>
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
          </div>

          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
            <Calendar className="w-4 h-4" />
            <span>
              <strong className="text-neutral-900">{data.daysToOpening}</strong> jours avant ouverture
            </span>
          </div>
          <div className="text-xs text-neutral-400 mt-0.5">
            Soft Opening: {new Date(data.openingDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Facteurs contributifs */}
      <div className="space-y-2.5 pt-2 border-t border-neutral-100">
        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          Facteurs contributifs
        </div>
        {factors.map((factor, index) => (
          <FactorBar
            key={factor.key}
            label={factor.label}
            icon={factor.icon}
            value={factor.value}
            weight={factor.weight}
            delay={100 + index * 80}
            isVisible={isVisible}
          />
        ))}
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-4 pt-2 text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          80+
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          50-79
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          -50
        </span>
      </div>
    </div>
  );
}

export default ConfidenceScore;
