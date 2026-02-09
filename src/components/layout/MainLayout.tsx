import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationPanel } from './NotificationPanel';

export function MainLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="h-screen bg-primary-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div
        className={cn(
          'h-screen flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header />

        <main className="flex-1 min-h-0 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel />
    </div>
  );
}
