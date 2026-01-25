/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-900 text-primary-50',
        secondary: 'border-transparent bg-primary-100 text-primary-900',
        outline: 'border-primary-300 text-primary-700',
        success: 'border-transparent bg-success-100 text-success-700',
        warning: 'border-transparent bg-warning-100 text-warning-700',
        error: 'border-transparent bg-error-100 text-error-700',
        info: 'border-transparent bg-info-100 text-info-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Status Badge Presets
export function StatusBadge({
  status,
  className,
}: {
  status: 'todo' | 'in_progress' | 'done' | 'blocked' | string;
  className?: string;
}) {
  const variants: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    todo: { variant: 'secondary', label: 'À faire' },
    in_progress: { variant: 'info', label: 'En cours' },
    done: { variant: 'success', label: 'Terminé' },
    blocked: { variant: 'error', label: 'Bloqué' },
  };

  const { variant, label } = variants[status] || { variant: 'secondary', label: status || 'Inconnu' };
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}) {
  const variants: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    // English values
    low: { variant: 'secondary', label: 'Basse' },
    medium: { variant: 'info', label: 'Moyenne' },
    high: { variant: 'warning', label: 'Haute' },
    critical: { variant: 'error', label: 'Critique' },
    // French values
    basse: { variant: 'secondary', label: 'Basse' },
    moyenne: { variant: 'info', label: 'Moyenne' },
    haute: { variant: 'warning', label: 'Haute' },
    critique: { variant: 'error', label: 'Critique' },
  };

  const { variant, label } = variants[priority] || { variant: 'secondary', label: priority || 'Inconnue' };
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

export function CriticiteBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  let variant: BadgeProps['variant'];
  let label: string;

  if (score >= 12) {
    variant = 'error';
    label = 'Critique';
  } else if (score >= 9) {
    variant = 'warning';
    label = 'Majeur';
  } else if (score >= 5) {
    variant = 'info';
    label = 'Modéré';
  } else {
    variant = 'secondary';
    label = 'Faible';
  }

  return <Badge variant={variant} className={className}>{label} ({score})</Badge>;
}

export { Badge, badgeVariants };
