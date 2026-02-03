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

  // Sync sites with store - TOUJOURS synchroniser avec la DB
  useEffect(() => {
    if (sites.length > 0) {
      setSites(sites);

      // Trouver le site correspondant dans la DB
      const currentSiteId = currentSite?.id;
      const freshSite = currentSiteId
        ? sites.find(s => s.id === currentSiteId)
        : null;

      if (freshSite) {
        // Vérifier si les données ont changé avant de mettre à jour (évite boucle infinie)
        const hasChanged =
          freshSite.surface !== currentSite?.surface ||
          freshSite.nombreBatiments !== currentSite?.nombreBatiments ||
          freshSite.dateOuverture !== currentSite?.dateOuverture ||
          freshSite.dateInauguration !== currentSite?.dateInauguration ||
          freshSite.nom !== currentSite?.nom ||
          freshSite.updatedAt !== currentSite?.updatedAt;

        if (hasChanged) {
          setCurrentSite(freshSite);
        }
      } else if (!currentSite) {
        // Aucun site sélectionné: prendre le premier
        setCurrentSite(sites[0]);
      } else {
        // Le site sélectionné n'existe plus, prendre le premier
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
  try {
    await db.open();
    // Vérifier par code, pas juste par count (évite les doublons)
    const existingSite = await db.sites.where('code').equals('COSMOS').first();
    if (!existingSite) {
      const now = new Date().toISOString();
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
    }
  } catch (err) {
    console.error('[initializeDefaultSite] Erreur:', err);
  }
}

/**
 * Nettoyer les sites en double (garder le premier créé)
 * Un site est considéré en double s'il a le même code
 */
export async function cleanupDuplicateSites(): Promise<number> {
  const allSites = await db.sites.toArray();
  const seenCodes = new Map<string, number>(); // code -> id du site à garder
  const toDelete: number[] = [];

  // Trier par date de création (plus ancien d'abord)
  allSites.sort((a, b) =>
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  for (const site of allSites) {
    if (seenCodes.has(site.code)) {
      // C'est un doublon - marquer pour suppression (soft delete)
      if (site.id) toDelete.push(site.id);
    } else {
      seenCodes.set(site.code, site.id!);
    }
  }

  // Soft delete les doublons
  for (const id of toDelete) {
    await db.sites.update(id, { actif: false });
  }

  return toDelete.length;
}
