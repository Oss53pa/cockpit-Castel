import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Site } from '@/types/site';

interface SiteState {
  currentSiteId: number | null;
  currentSite: Site | null;
  sites: Site[];
  setCurrentSite: (site: Site) => void;
  setCurrentSiteById: (id: number) => void;
  setSites: (sites: Site[]) => void;
  addSite: (site: Site) => void;
  updateSite: (site: Site) => void;
  removeSite: (id: number) => void;
}

export const useSiteStore = create<SiteState>()(
  persist(
    (set, get) => ({
      currentSiteId: null,
      currentSite: null,
      sites: [],

      setCurrentSite: (site: Site) => {
        set({ currentSite: site, currentSiteId: site.id ?? null });
      },

      setCurrentSiteById: (id: number) => {
        const site = get().sites.find((s) => s.id === id);
        if (site) {
          set({ currentSite: site, currentSiteId: id });
        }
      },

      setSites: (sites: Site[]) => {
        set({ sites });
        // Si pas de site courant, sélectionner le premier
        const current = get().currentSite;
        if (!current && sites.length > 0) {
          set({ currentSite: sites[0], currentSiteId: sites[0].id ?? null });
        }
      },

      addSite: (site: Site) => {
        set((state) => ({ sites: [...state.sites, site] }));
      },

      updateSite: (site: Site) => {
        set((state) => ({
          sites: state.sites.map((s) => (s.id === site.id ? site : s)),
          currentSite: state.currentSite?.id === site.id ? site : state.currentSite,
        }));
      },

      removeSite: (id: number) => {
        set((state) => {
          const newSites = state.sites.filter((s) => s.id !== id);
          const newCurrent = state.currentSite?.id === id
            ? newSites[0] ?? null
            : state.currentSite;
          return {
            sites: newSites,
            currentSite: newCurrent,
            currentSiteId: newCurrent?.id ?? null,
          };
        });
      },
    }),
    {
      name: 'cockpit-site',
    }
  )
);
