import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Wifi,
  WifiOff,
  Menu,
  Brain,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useAlertesNonLues, useProph3tHealth, useSites, useCurrentSite } from '@/hooks';
import { useSiteStore } from '@/stores/siteStore';
import { Button, UserAvatar } from '@/components/ui';
import { Proph3tConfigModal } from '@/components/proph3t';
import type { Site } from '@/types/site';

const pageTitles: Record<string, string> = {
  '/': 'Tableau de bord',
  '/actions': 'Plan d\'actions',
  '/jalons': 'Jalons',
  '/budget': 'Budget',
  '/risques': 'Risques',
  '/alertes': 'Alertes',
  '/rapports': 'Rapports',
  '/settings': 'Paramètres',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline, toggleNotificationsPanel, toggleSidebar } = useAppStore();
  const alertesNonLues = useAlertesNonLues();
  const proph3tHealth = useProph3tHealth();
  const [showProph3tConfig, setShowProph3tConfig] = useState(false);
  const [showSiteSelector, setShowSiteSelector] = useState(false);

  const sites = useSites();
  const currentSite = useCurrentSite();
  const setCurrentSite = useSiteStore((state) => state.setCurrentSite);

  const pageTitle = pageTitles[location.pathname] ?? 'Cockpit';

  const handleSelectSite = (site: Site) => {
    setCurrentSite(site);
    setShowSiteSelector(false);
  };

  const healthColors = {
    vert: 'bg-success-500',
    jaune: 'bg-warning-500',
    rouge: 'bg-error-500',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-primary-200 bg-white px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="text-xl font-semibold text-primary-900">{pageTitle}</h1>

        {/* Site Selector */}
        {sites.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowSiteSelector(!showSiteSelector)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors"
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: currentSite?.couleur ?? '#18181b' }}
              >
                {currentSite?.code?.charAt(0) ?? 'S'}
              </div>
              <span className="text-sm font-medium text-primary-700 hidden sm:inline">
                {currentSite?.nom ?? 'Site'}
              </span>
              <ChevronDown className={cn(
                'h-4 w-4 text-primary-500 transition-transform',
                showSiteSelector && 'rotate-180'
              )} />
            </button>

            {showSiteSelector && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSiteSelector(false)}
                />
                <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white rounded-xl shadow-xl border border-primary-200 py-2">
                  <div className="px-3 py-2 text-xs font-semibold text-primary-500 uppercase">
                    Vos sites
                  </div>
                  {sites.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => handleSelectSite(site)}
                      className={cn(
                        'w-full px-3 py-2 flex items-center gap-3 hover:bg-primary-50 transition-colors',
                        currentSite?.id === site.id && 'bg-primary-100'
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: site.couleur }}
                      >
                        {site.code?.charAt(0)}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-medium text-primary-900 truncate">{site.nom}</p>
                        <p className="text-xs text-primary-500 truncate">{site.localisation}</p>
                      </div>
                      {currentSite?.id === site.id && (
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-primary-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowSiteSelector(false);
                        navigate('/settings?tab=sites');
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      Gérer les sites...
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center section - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-primary-200 bg-primary-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Online/Offline indicator */}
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            isOnline
              ? 'bg-success-100 text-success-700'
              : 'bg-error-100 text-error-700'
          )}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span className="hidden sm:inline">En ligne</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span className="hidden sm:inline">Hors ligne</span>
            </>
          )}
        </div>

        {/* PROPH3T Status */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowProph3tConfig(true)}
          className="hidden sm:flex items-center gap-1.5 px-2 hover:bg-primary-100"
          title="Configuration PROPH3T IA"
        >
          <Brain className="h-4 w-4 text-primary-600" />
          {proph3tHealth && (
            <div className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-full', healthColors[proph3tHealth.status])} />
              <span className="text-xs font-medium text-primary-700">{proph3tHealth.score}</span>
            </div>
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleNotificationsPanel}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {alertesNonLues > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
              {alertesNonLues > 9 ? '9+' : alertesNonLues}
            </span>
          )}
        </Button>

        {/* User avatar */}
        <UserAvatar name="Chef de Projet" size="sm" />
      </div>

      {/* PROPH3T Config Modal */}
      <Proph3tConfigModal
        isOpen={showProph3tConfig}
        onClose={() => setShowProph3tConfig(false)}
      />
    </header>
  );
}
