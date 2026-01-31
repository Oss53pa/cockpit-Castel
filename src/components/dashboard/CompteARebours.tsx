/**
 * Compte à rebours vers le Soft Opening
 * Spécifications v2.0 - Section 8.1
 * Design Premium avec animations
 */

import { Rocket, Calendar, Clock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';
import { useMemo, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CompteAReboursProps {
  dateOuverture?: string; // Format YYYY-MM-DD
}

// Animated digit component for countdown
function AnimatedDigit({ value, label }: { value: number; label: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [value, displayValue]);

  return (
    <div className="text-center">
      <div
        className={cn(
          'text-3xl font-bold transition-all duration-300',
          isAnimating && 'scale-90 opacity-50'
        )}
      >
        {displayValue}
      </div>
      <p className="text-xs text-white/70 uppercase tracking-wider">{label}</p>
    </div>
  );
}

// Circular progress indicator
function CircularCountdown({
  progress,
  size = 120,
  isUrgent,
}: {
  progress: number;
  size?: number;
  isUrgent: boolean;
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedProgress(progress), 300);
    return () => clearTimeout(timeout);
  }, [progress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            'p-3 bg-white/20 rounded-full backdrop-blur-sm',
            isUrgent && 'animate-alert-pulse'
          )}
        >
          <Rocket className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
}

export function CompteARebours({ dateOuverture = '2026-11-15' }: CompteAReboursProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for entrance animation
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

  const { joursRestants, moisRestants, semainesRestants, dateFormatee, isUrgent, isPasse, progress } =
    useMemo(() => {
      const opening = new Date(dateOuverture);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      opening.setHours(0, 0, 0, 0);

      const diffTime = opening.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      // Calculate progress (assuming 2 years total = 730 days)
      const totalDays = 730;
      const elapsed = totalDays - diffDays;
      const progressPercent = Math.max(0, Math.min(100, (elapsed / totalDays) * 100));

      return {
        joursRestants: diffDays,
        moisRestants: diffMonths,
        semainesRestants: diffWeeks,
        dateFormatee: opening.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        isUrgent: diffDays <= 90,
        isPasse: diffDays < 0,
        progress: progressPercent,
      };
    }, [dateOuverture]);

  const gradientClass = isPasse
    ? 'from-green-600 via-emerald-600 to-teal-600'
    : isUrgent
      ? 'from-red-600 via-orange-600 to-amber-600'
      : 'from-primary-700 via-primary-600 to-indigo-600';

  return (
    <div
      ref={containerRef}
      className={cn(
        'opacity-0 translate-y-4',
        isVisible && 'animate-fade-slide-in'
      )}
    >
      <Card
        padding="none"
        className={cn(
          'overflow-hidden relative',
          `bg-gradient-to-r ${gradientClass}`,
          'shadow-xl'
        )}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 3) * 30}%`,
                animationDelay: `${i * 0.5}s`,
                opacity: 0.1,
              }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          ))}
        </div>

        <div className="p-6 text-white relative z-10">
          <div className="flex items-center justify-between">
            {/* Left: Circular countdown */}
            <div className="flex items-center gap-6">
              <CircularCountdown
                progress={progress}
                isUrgent={isUrgent}
              />
              <div>
                <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">
                  {isPasse ? 'Ouverture effectuée' : 'Soft Opening dans'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'text-5xl font-bold tracking-tight transition-all duration-500',
                      isVisible && 'animate-count-up'
                    )}
                  >
                    {isPasse ? '0' : Math.abs(joursRestants)}
                  </span>
                  <span className="text-xl font-medium text-white/90">
                    jour{Math.abs(joursRestants) > 1 ? 's' : ''}
                  </span>
                </div>
                {isUrgent && !isPasse && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    Phase critique
                  </div>
                )}
              </div>
            </div>

            {/* Center: Additional metrics */}
            <div className="hidden md:flex items-center gap-8 px-8 border-l border-r border-white/20">
              <AnimatedDigit value={Math.abs(semainesRestants)} label="Semaines" />
              <AnimatedDigit value={Math.abs(moisRestants)} label="Mois" />
            </div>

            {/* Right: Date */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 text-white/80 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Date prévue</span>
                </div>
                <p className="text-lg font-semibold">{dateFormatee}</p>
                <p className="text-xs text-white/60 mt-1">
                  {progress.toFixed(0)}% du temps écoulé
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {!isPasse && (
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                <span>Lancement projet</span>
                <span className="flex items-center gap-1">
                  <Rocket className="w-3 h-3" />
                  Soft Opening
                </span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: isVisible ? `${progress}%` : '0%',
                    transitionDelay: '300ms',
                  }}
                />
                {/* Milestone markers */}
                {[25, 50, 75].map((milestone) => (
                  <div
                    key={milestone}
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-full bg-white/30"
                    style={{ left: `${milestone}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1 text-xs text-white/50">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
