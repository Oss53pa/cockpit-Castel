/**
 * Compte à rebours vers le Soft Opening
 * Spécifications v2.0 - Section 8.1
 * Design Premium avec animations
 */

import { Rocket, Calendar, Clock } from 'lucide-react';
import { Card } from '@/components/ui';
import { useMemo, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PROJET_CONFIG, SEUILS_UI } from '@/data/constants';

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
          'text-2xl font-bold transition-all duration-300',
          isAnimating && 'scale-90 opacity-50'
        )}
      >
        {displayValue}
      </div>
      <p className="text-[10px] text-white/70 uppercase tracking-wider">{label}</p>
    </div>
  );
}

// Circular progress indicator
function CircularCountdown({
  progress,
  size = 70,
  isUrgent,
}: {
  progress: number;
  size?: number;
  isUrgent: boolean;
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedProgress(progress), 300);
    return () => clearTimeout(timeout);
  }, [progress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
        />
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
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            'p-2 bg-white/20 rounded-full',
            isUrgent && 'animate-alert-pulse'
          )}
        >
          <Rocket className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function CompteARebours({ dateOuverture = PROJET_CONFIG.jalonsClés.softOpening }: CompteAReboursProps) {
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

      // Calculate progress from project start to end
      const projectStart = new Date(PROJET_CONFIG.dateDebut);
      const projectEnd = new Date(PROJET_CONFIG.dateFin);
      const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
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
        isUrgent: diffDays <= SEUILS_UI.compteARebours.attention,
        isPasse: diffDays < 0,
        progress: progressPercent,
      };
    }, [dateOuverture]);

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
        className="overflow-hidden bg-neutral-700 shadow-lg rounded-xl"
      >
        <div className="px-5 py-3 text-white">
          <div className="flex items-center justify-between">
            {/* Left: Circular countdown */}
            <div className="flex items-center gap-4">
              <CircularCountdown
                progress={progress}
                isUrgent={isUrgent}
              />
              <div>
                <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mb-0.5">
                  {isPasse ? 'Ouverture effectuée' : 'Soft Opening dans'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'text-3xl font-bold tracking-tight transition-all duration-500',
                      isVisible && 'animate-count-up'
                    )}
                  >
                    {isPasse ? '0' : Math.abs(joursRestants)}
                  </span>
                  <span className="text-base font-medium text-white/90">
                    jour{Math.abs(joursRestants) > 1 ? 's' : ''}
                  </span>
                </div>
                {isUrgent && !isPasse && (
                  <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    Phase critique
                  </div>
                )}
              </div>
            </div>

            {/* Center: Additional metrics */}
            <div className="hidden md:flex items-center gap-6 px-6 border-l border-r border-white/20">
              <AnimatedDigit value={Math.abs(semainesRestants)} label="Semaines" />
              <AnimatedDigit value={Math.abs(moisRestants)} label="Mois" />
            </div>

            {/* Right: Date */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-neutral-400 mb-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Date prévue</span>
              </div>
              <p className="text-base font-semibold">{dateFormatee}</p>
              <p className="text-xs text-neutral-400">
                {progress.toFixed(0)}% du temps écoulé
              </p>
            </div>
          </div>

          {/* Progress bar - compact */}
          {!isPasse && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                <span>Lancement</span>
                <span className="flex items-center gap-1">
                  <Rocket className="w-3 h-3" />
                  Soft Opening
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: isVisible ? `${progress}%` : '0%',
                    transitionDelay: '300ms',
                  }}
                />
                {[25, 50, 75].map((milestone) => (
                  <div
                    key={milestone}
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-full bg-white/30"
                    style={{ left: `${milestone}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
