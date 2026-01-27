import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { ProjectConfig } from '@/components/settings/ProjectSettings';

const DEFAULT_CONFIG: ProjectConfig = {
  dateDebutConstruction: '2025-06',
  dateDebutMobilisation: '2026-01',
  dateSoftOpening: '2026-10',
  dateFinMobilisation: '2027-03',
};

export function useProjectConfig(): ProjectConfig | undefined {
  return useLiveQuery(async () => {
    const stored = await db.secureConfigs.where('key').equals('projectConfig').first();
    if (stored) {
      try {
        return JSON.parse(stored.value) as ProjectConfig;
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  }, []);
}
