import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { PerformanceSidebar } from './PerformanceSidebar';
import { PerformanceHeader } from './PerformanceHeader';

export function PerformanceLayout() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <div className="h-screen bg-violet-50 overflow-hidden">
      <PerformanceSidebar />

      <div
        className={cn(
          'h-screen flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <PerformanceHeader onToggleSidebar={toggleSidebar} />

        <main className="flex-1 min-h-0 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
