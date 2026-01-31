/**
 * Dashboard Skeleton Loader
 * Displays animated skeleton placeholders during data loading
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-primary-200/50 rounded animate-skeleton-pulse',
        className
      )}
    />
  );
}

function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-primary-100">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-16" />
      <div className="mt-4">
        <Skeleton className="h-1.5 w-full" />
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Project Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
            <div>
              <Skeleton className="h-7 w-48 bg-white/10 mb-2" />
              <Skeleton className="h-4 w-32 bg-white/10" />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-4 w-28 bg-white/10" />
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-4 w-20 bg-white/10" />
          </div>
        </div>

        {/* Center: Progress */}
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full bg-white/10" />
          <div>
            <Skeleton className="h-3 w-24 bg-white/10 mb-2" />
            <Skeleton className="h-10 w-16 bg-white/10 mb-2" />
            <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Right: Metrics */}
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center px-4 py-2 bg-white/5 rounded-lg">
              <Skeleton className="h-8 w-12 bg-white/10 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MeteoCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-primary-100">
      <div className="flex items-start justify-between mb-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
  );
}

function CompteAReboursSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-xl bg-white/20" />
          <div>
            <Skeleton className="h-4 w-28 bg-white/20 mb-2" />
            <Skeleton className="h-12 w-24 bg-white/20" />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 px-6">
          {[1, 2].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-12 bg-white/20 mx-auto mb-1" />
              <Skeleton className="h-3 w-14 bg-white/20" />
            </div>
          ))}
        </div>
        <div className="text-right">
          <Skeleton className="h-4 w-24 bg-white/20 mb-2" />
          <Skeleton className="h-5 w-32 bg-white/20" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/20">
        <Skeleton className="h-2 w-full rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function JalonsCritiquesSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-primary-100">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-40 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-2 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AvancementAxesSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-primary-100">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-10 rounded" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarWidgetSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-primary-100">
      <Skeleton className="h-5 w-28 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-slide-in">
      {/* View Toggle Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-16 w-48 rounded-xl" />
        <Skeleton className="h-16 w-48 rounded-xl" />
      </div>

      {/* Header Skeleton */}
      <HeaderSkeleton />

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>

      {/* Compte à rebours Skeleton */}
      <CompteAReboursSkeleton />

      {/* Météo par Axe Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MeteoCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Jalons Critiques Skeleton */}
      <JalonsCritiquesSkeleton />

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AvancementAxesSkeleton />
          <JalonsCritiquesSkeleton />
        </div>
        <div className="space-y-6">
          <SidebarWidgetSkeleton />
          <SidebarWidgetSkeleton />
          <SidebarWidgetSkeleton />
        </div>
      </div>
    </div>
  );
}

export { Skeleton, KPICardSkeleton, HeaderSkeleton, MeteoCardSkeleton };
