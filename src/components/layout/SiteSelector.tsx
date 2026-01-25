import { useState } from 'react';
import { ChevronDown, Building2, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSites, useCurrentSite } from '@/hooks/useSites';
import { useSiteStore } from '@/stores/siteStore';
import type { Site } from '@/types/site';

interface SiteSelectorProps {
  collapsed?: boolean;
  onManageSites?: () => void;
}

export function SiteSelector({ collapsed = false, onManageSites }: SiteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sites = useSites();
  const currentSite = useCurrentSite();
  const setCurrentSite = useSiteStore((state) => state.setCurrentSite);

  const handleSelectSite = (site: Site) => {
    setCurrentSite(site);
    setIsOpen(false);
  };

  if (collapsed) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-primary-100 transition-colors"
          title={currentSite?.nom ?? 'Sélectionner un site'}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: currentSite?.couleur ?? '#18181b' }}
          >
            {currentSite?.code?.charAt(0) ?? 'S'}
          </div>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-full top-0 ml-2 z-50 w-64 bg-white rounded-xl shadow-xl border border-primary-200 py-2">
              <div className="px-3 py-2 text-xs font-semibold text-primary-500 uppercase">
                Sites
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
                  <div className="text-left min-w-0">
                    <p className="font-medium text-primary-900 truncate">{site.nom}</p>
                    <p className="text-xs text-primary-500 truncate">{site.localisation}</p>
                  </div>
                </button>
              ))}
              {onManageSites && (
                <>
                  <div className="border-t border-primary-100 my-2" />
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onManageSites();
                    }}
                    className="w-full px-3 py-2 flex items-center gap-3 text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Gérer les sites</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center gap-3 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors border border-primary-200"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: currentSite?.couleur ?? '#18181b' }}
        >
          {currentSite?.code?.charAt(0) ?? 'S'}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-primary-900 truncate">
            {currentSite?.nom ?? 'Sélectionner un site'}
          </p>
          <p className="text-xs text-primary-500 truncate">
            {currentSite?.localisation ?? ''}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-primary-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-primary-200 py-2">
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
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: site.couleur }}
                >
                  {site.code?.charAt(0)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-primary-900 truncate">{site.nom}</p>
                  <p className="text-xs text-primary-500 truncate">{site.localisation}</p>
                </div>
                {currentSite?.id === site.id && (
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                )}
              </button>
            ))}

            {onManageSites && (
              <>
                <div className="border-t border-primary-100 my-2" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onManageSites();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-100 flex-shrink-0">
                    <Plus className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="font-medium">Ajouter un site</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
