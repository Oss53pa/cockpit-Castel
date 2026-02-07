import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { useEffect, useState, useRef } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  annotation?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  animationDelay?: number;
}

// Animated counter hook
function useAnimatedValue(target: number, duration: number = 1000) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (startTime.current === null) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(target * easeOutQuart));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return value;
}

export function KPICard({
  title,
  value,
  subtitle,
  annotation,
  icon: Icon,
  trend,
  progress,
  variant = 'default',
  animationDelay = 0,
}: KPICardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Animated progress value
  const animatedProgress = useAnimatedValue(
    isVisible && progress !== undefined ? progress : 0,
    800
  );

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

  const variantColors = {
    default: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
  };

  const variantBg = {
    default: 'bg-primary-50',
    success: 'bg-success-50',
    warning: 'bg-warning-50',
    error: 'bg-error-50',
  };

  const progressBarColors = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };

  const glowClasses = {
    default: '',
    success: 'hover:glow-success',
    warning: 'hover:glow-warning',
    error: 'hover:glow-error',
  };

  const gradientBorder = {
    default: 'hover:border-primary-300',
    success: 'hover:border-success-300',
    warning: 'hover:border-warning-300',
    error: 'hover:border-error-300',
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'opacity-0 translate-y-4',
        isVisible && 'animate-fade-slide-in'
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <Card
        className={cn(
          'overflow-hidden shimmer transition-all duration-300',
          'hover:shadow-lg hover:-translate-y-1',
          'border border-transparent',
          glowClasses[variant],
          gradientBorder[variant]
        )}
        padding="none"
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{title}</p>
            <div
              className={cn(
                'rounded-lg p-2 transition-transform duration-300',
                'group-hover:scale-110 group-hover:rotate-3',
                variantBg[variant]
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-all duration-300',
                  variantColors[variant]
                )}
              />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                'text-2xl font-bold text-primary-900 transition-all',
                isVisible && 'animate-count-up'
              )}
            >
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded transition-all',
                  trend.isPositive
                    ? 'bg-success-100 text-success-700'
                    : 'bg-error-100 text-error-700'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-1 text-xs text-primary-400">{subtitle}</p>
          )}

          {annotation && (
            <p className={cn(
              'mt-0.5 text-[11px] font-medium',
              variant === 'success' ? 'text-success-600' :
              variant === 'warning' ? 'text-warning-600' :
              variant === 'error' ? 'text-error-600' :
              'text-primary-500'
            )}>{annotation}</p>
          )}
        </div>

        {progress !== undefined && (
          <div className="h-1.5 bg-gray-100 relative overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-700 ease-out',
                progressBarColors[variant]
              )}
              style={{ width: `${Math.min(animatedProgress, 100)}%` }}
            />
            {/* Shimmer overlay on progress bar */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                transform: 'translateX(-100%)',
                animation: isVisible
                  ? 'shimmerMove 2s ease-in-out infinite 1s'
                  : 'none',
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
