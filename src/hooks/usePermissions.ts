/**
 * Hook RBAC — Contrôle d'accès par rôle
 *
 * Rôles :
 *   admin   → tout (CRUD + paramètres + utilisateurs)
 *   manager → créer, modifier, supprimer actions/jalons/risques/budget
 *   viewer  → lecture seule (aucune modification)
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { useAppStore } from '@/stores/appStore';
import type { UserRole } from '@/types';

export interface Permissions {
  role: UserRole;
  /** Peut créer des entités (actions, jalons, risques, budget) */
  canCreate: boolean;
  /** Peut modifier des entités */
  canEdit: boolean;
  /** Peut supprimer des entités */
  canDelete: boolean;
  /** Peut gérer les utilisateurs et paramètres */
  canAdmin: boolean;
  /** Peut exporter / générer des rapports */
  canExport: boolean;
  /** Peut importer / reseed la base */
  canImport: boolean;
  /** Nom complet de l'utilisateur courant */
  userName: string;
  /** ID de l'utilisateur courant */
  userId: number | null;
  /** Données chargées */
  isLoaded: boolean;
}

const VIEWER_PERMISSIONS: Permissions = {
  role: 'viewer',
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canAdmin: false,
  canExport: true,
  canImport: false,
  userName: '',
  userId: null,
  isLoaded: false,
};

export function usePermissions(): Permissions {
  const currentUserId = useAppStore((s) => s.currentUserId);

  const user = useLiveQuery(async () => {
    if (!currentUserId) return undefined;
    return db.users.get(currentUserId);
  }, [currentUserId]);

  if (!user) {
    return { ...VIEWER_PERMISSIONS, userId: currentUserId, isLoaded: false };
  }

  const role: UserRole = user.role || 'viewer';
  const userName = `${user.prenom || ''} ${user.nom || ''}`.trim();

  switch (role) {
    case 'admin':
      return {
        role,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canAdmin: true,
        canExport: true,
        canImport: true,
        userName,
        userId: currentUserId,
        isLoaded: true,
      };
    case 'manager':
      return {
        role,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canAdmin: false,
        canExport: true,
        canImport: false,
        userName,
        userId: currentUserId,
        isLoaded: true,
      };
    case 'viewer':
    default:
      return {
        role: 'viewer',
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canAdmin: false,
        canExport: true,
        canImport: false,
        userName,
        userId: currentUserId,
        isLoaded: true,
      };
  }
}
