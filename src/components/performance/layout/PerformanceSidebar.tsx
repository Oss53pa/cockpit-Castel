import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

function NavItem({ to, icon, label, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-violet-100',
          isActive
            ? 'bg-violet-700 text-white hover:bg-violet-600'
            : 'text-violet-600 hover:text-violet-900',
          collapsed && 'justify-center px-2'
        )
      }
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

const navItems = [
  { to: '/performance', icon: <TrendingUp className="h-5 w-5" />, label: 'Tableau de bord' },
];

export function PerformanceSidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-violet-200 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-violet-200 px-4">
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center w-full')}>
          <TrendingUp className="h-8 w-8 text-violet-700" />
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-display text-2xl text-violet-900">Performance</span>
              <span className="text-[10px] text-violet-500 uppercase tracking-wider">Suivi & Analyse</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        {/* Retour Accueil Cockpit */}
        <NavLink
          to="/"
          title={sidebarCollapsed ? 'Accueil Cockpit' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-violet-600 hover:bg-violet-100 hover:text-violet-900',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <Home className="h-5 w-5" />
          {!sidebarCollapsed && <span>Accueil Cockpit</span>}
        </NavLink>

        <div className="my-2 border-t border-violet-100" />

        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-violet-200 p-3">
        {/* Logout button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Déconnexion' : undefined}
          className={cn(
            'w-full text-red-600 hover:text-red-700 hover:bg-red-50',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4" />
          {!sidebarCollapsed && <span className="ml-2">Déconnexion</span>}
        </Button>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn('mt-2 w-full', sidebarCollapsed && 'justify-center')}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Réduire</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
