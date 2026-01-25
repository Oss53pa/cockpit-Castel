import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Team, TeamMember, TeamRole } from '@/types';

export function useTeams() {
  return useLiveQuery(async () => {
    return db.teams.toArray();
  }) ?? [];
}

export function useActiveTeams() {
  return useLiveQuery(async () => {
    return db.teams.where('actif').equals(1).toArray();
  }) ?? [];
}

export function useTeam(id: number | undefined) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    return db.teams.get(id);
  }, [id]);
}

export function useTeamsByResponsable(responsableId: number) {
  return useLiveQuery(async () => {
    return db.teams.where('responsableId').equals(responsableId).toArray();
  }, [responsableId]) ?? [];
}

export async function createTeam(
  team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = new Date().toISOString();
  return db.teams.add({
    ...team,
    createdAt: now,
    updatedAt: now,
  } as Team);
}

export async function updateTeam(
  id: number,
  updates: Partial<Omit<Team, 'id' | 'createdAt'>>
): Promise<void> {
  await db.teams.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTeam(id: number): Promise<void> {
  await db.teams.delete(id);
}

export async function addTeamMember(
  teamId: number,
  userId: number,
  role: TeamRole
): Promise<void> {
  const team = await db.teams.get(teamId);
  if (!team) return;

  const existingMember = team.membres.find((m) => m.userId === userId);
  if (existingMember) return;

  const newMember: TeamMember = {
    userId,
    role,
    dateAjout: new Date().toISOString(),
  };

  await db.teams.update(teamId, {
    membres: [...team.membres, newMember],
    updatedAt: new Date().toISOString(),
  });
}

export async function removeTeamMember(
  teamId: number,
  userId: number
): Promise<void> {
  const team = await db.teams.get(teamId);
  if (!team) return;

  await db.teams.update(teamId, {
    membres: team.membres.filter((m) => m.userId !== userId),
    updatedAt: new Date().toISOString(),
  });
}

export async function updateTeamMemberRole(
  teamId: number,
  userId: number,
  newRole: TeamRole
): Promise<void> {
  const team = await db.teams.get(teamId);
  if (!team) return;

  await db.teams.update(teamId, {
    membres: team.membres.map((m) =>
      m.userId === userId ? { ...m, role: newRole } : m
    ),
    updatedAt: new Date().toISOString(),
  });
}
