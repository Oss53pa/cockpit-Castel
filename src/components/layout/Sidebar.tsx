import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Flag,
  Wallet,
  AlertTriangle,
  Bell,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  LogOut,
  Building2,
  Layers,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';
import { FirebaseSyncIndicator } from '@/components/shared/FirebaseSyncIndicator';

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
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-primary-100',
          isActive
            ? 'bg-primary-900 text-primary-50 hover:bg-primary-800'
            : 'text-primary-600 hover:text-primary-900',
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
  { to: '/', icon: <Home className="h-5 w-5" />, label: 'Accueil' },
  { to: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Tableau de bord' },
  { to: '/axes', icon: <Layers className="h-5 w-5" />, label: 'Axes' },
  { to: '/jalons', icon: <Flag className="h-5 w-5" />, label: 'Jalons' },
  { to: '/actions', icon: <ClipboardList className="h-5 w-5" />, label: 'Plan d\'actions' },
  { to: '/synchronisation', icon: <GitBranch className="h-5 w-5" />, label: 'Synchronisation' },
  { to: '/budget', icon: <Wallet className="h-5 w-5" />, label: 'Budget' },
  { to: '/risques', icon: <AlertTriangle className="h-5 w-5" />, label: 'Risques' },
  { to: '/alertes', icon: <Bell className="h-5 w-5" />, label: 'Alertes' },
  { to: '/rapports', icon: <FileText className="h-5 w-5" />, label: 'Rapports' },
];

export function Sidebar() {
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
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-primary-200 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-primary-200 px-4">
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center w-full')}>
          <Building2 className="h-8 w-8 text-primary-900" />
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-display text-2xl text-primary-900">Cockpit</span>
              <span className="text-[10px] text-primary-500 uppercase tracking-wider">Project Management</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
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
      <div className="absolute bottom-0 left-0 right-0 border-t border-primary-200 p-3">
        {/* Firebase Sync Indicator */}
        {!sidebarCollapsed && (
          <div className="mb-3">
            <FirebaseSyncIndicator />
          </div>
        )}

        <NavItem
          to="/settings"
          icon={<Settings className="h-5 w-5" />}
          label="Paramètres"
          collapsed={sidebarCollapsed}
        />

        {/* Logout button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            'mt-2 w-full text-red-600 hover:text-red-700 hover:bg-red-50',
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
