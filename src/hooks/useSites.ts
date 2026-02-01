import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Site } from '@/types/site';
import { useSiteStore } from '@/stores/siteStore';
import { useEffect } from 'react';

export function useSites() {
  const sites = useLiveQuery(async () => {
    return db.sites.filter(site => !!site.actif).toArray();
  }) ?? [];

  const { setSites, currentSite, setCurrentSite } = useSiteStore();

  // Sync sites with store
  useEffect(() => {
    if (sites.length > 0) {
      setSites(sites);
      // Auto-select first site if none selected
      if (!currentSite) {
        setCurrentSite(sites[0]);
      }
    }
  }, [sites, setSites, currentSite, setCurrentSite]);

  return sites;
}

export function useCurrentSite() {
  return useSiteStore((state) => state.currentSite);
}

export function useCurrentSiteId() {
  return useSiteStore((state) => state.currentSiteId);
}

export async function createSite(site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  return db.sites.add({
    ...site,
    createdAt: now,
    updatedAt: now,
  } as Site);
}

export async function updateSite(id: number, updates: Partial<Site>): Promise<void> {
  await db.sites.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteSite(id: number): Promise<void> {
  // Soft delete - just mark as inactive
  await db.sites.update(id, {
    actif: false,
    updatedAt: new Date().toISOString(),
  });
}

export async function getSiteById(id: number): Promise<Site | undefined> {
  return db.sites.get(id);
}

// Initialize default site if none exists
export async function initializeDefaultSite(): Promise<void> {
  console.log('[initializeDefaultSite] Début...');
  try {
    console.log('[initializeDefaultSite] Ouverture DB...');
    await db.open();
    console.log('[initializeDefaultSite] DB ouverte, count sites...');
    const count = await db.sites.count();
    console.log('[initializeDefaultSite] Count:', count);
    if (count === 0) {
      const now = new Date().toISOString();
      console.log('[initializeDefaultSite] Ajout site par défaut...');
      await db.sites.add({
        code: 'COSMOS',
        nom: 'COSMOS ANGRE',
        description: 'Centre commercial Cosmos Angré - Abidjan',
        localisation: 'Abidjan, Côte d\'Ivoire',
        dateOuverture: '2026-11-01',
        surface: 45000,
        couleur: '#18181b',
        actif: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log('[initializeDefaultSite] Site ajouté!');
    }
  } catch (err) {
    console.error('[initializeDefaultSite] Erreur:', err);
  }
}
