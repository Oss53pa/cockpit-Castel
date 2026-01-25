import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { User, UserRole } from '@/types';

export function useUsers() {
  return useLiveQuery(async () => {
    return db.users.toArray();
  }) ?? [];
}

export function useUser(id: number | undefined) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    return db.users.get(id);
  }, [id]);
}

export function useUsersByRole(role: UserRole) {
  return useLiveQuery(async () => {
    return db.users.where('role').equals(role).toArray();
  }, [role]) ?? [];
}

export async function createUser(
  user: Omit<User, 'id' | 'createdAt'>
): Promise<number> {
  return db.users.add({
    ...user,
    createdAt: new Date().toISOString(),
  } as User);
}

export async function updateUser(
  id: number,
  updates: Partial<User>
): Promise<void> {
  await db.users.update(id, updates);
}

export async function deleteUser(id: number): Promise<void> {
  await db.users.delete(id);
}

export function getUserFullName(user: User): string {
  return `${user.prenom} ${user.nom}`;
}
