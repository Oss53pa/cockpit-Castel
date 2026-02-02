import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { BudgetItem, BudgetCategory, Axe, EVMIndicators } from '@/types';

export function useBudget() {
  return useLiveQuery(async () => {
    return db.budget.toArray();
  }) ?? [];
}

export function useBudgetByCategory(categorie: BudgetCategory) {
  return useLiveQuery(async () => {
    return db.budget.where('categorie').equals(categorie).toArray();
  }, [categorie]) ?? [];
}

export function useBudgetByAxe(axe: Axe) {
  return useLiveQuery(async () => {
    return db.budget.where('axe').equals(axe).toArray();
  }, [axe]) ?? [];
}

export function useBudgetSynthese() {
  return useLiveQuery(async () => {
    const items = await db.budget.toArray();

    // Identifier les IDs des lignes parentes qui ont des enfants
    const parentIdsWithChildren = new Set<number>();
    items.forEach(item => {
      if (item.parentId) {
        parentIdsWithChildren.add(item.parentId);
      }
    });

    // Ne compter que les lignes "feuilles" (sans enfants) ou les enfants
    // Exclure les parents qui ont des enfants pour éviter le double-comptage
    const totals = items.reduce(
      (acc, item) => {
        // Si c'est un parent avec des enfants, ne pas compter (les enfants seront comptés)
        if (item.id && parentIdsWithChildren.has(item.id)) {
          return acc;
        }
        return {
          prevu: acc.prevu + item.montantPrevu,
          engage: acc.engage + item.montantEngage,
          realise: acc.realise + item.montantRealise,
        };
      },
      { prevu: 0, engage: 0, realise: 0 }
    );

    return {
      ...totals,
      ecartEngagement: totals.prevu - totals.engage,
      ecartRealisation: totals.prevu - totals.realise,
      tauxEngagement: totals.prevu > 0 ? (totals.engage / totals.prevu) * 100 : 0,
      tauxRealisation: totals.prevu > 0 ? (totals.realise / totals.prevu) * 100 : 0,
    };
  }) ?? {
    prevu: 0,
    engage: 0,
    realise: 0,
    ecartEngagement: 0,
    ecartRealisation: 0,
    tauxEngagement: 0,
    tauxRealisation: 0,
  };
}

export function useBudgetParCategorie() {
  return useLiveQuery(async () => {
    const items = await db.budget.toArray();

    const byCategory = items.reduce((acc, item) => {
      if (!acc[item.categorie]) {
        acc[item.categorie] = { prevu: 0, engage: 0, realise: 0 };
      }
      acc[item.categorie].prevu += item.montantPrevu;
      acc[item.categorie].engage += item.montantEngage;
      acc[item.categorie].realise += item.montantRealise;
      return acc;
    }, {} as Record<string, { prevu: number; engage: number; realise: number }>);

    return byCategory;
  }) ?? {};
}

export function useBudgetParAxe() {
  return useLiveQuery(async () => {
    const items = await db.budget.toArray();

    const byAxe = items.reduce((acc, item) => {
      if (!acc[item.axe]) {
        acc[item.axe] = { prevu: 0, engage: 0, realise: 0 };
      }
      acc[item.axe].prevu += item.montantPrevu;
      acc[item.axe].engage += item.montantEngage;
      acc[item.axe].realise += item.montantRealise;
      return acc;
    }, {} as Record<string, { prevu: number; engage: number; realise: number }>);

    return byAxe;
  }) ?? {};
}

export async function createBudgetItem(
  item: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = new Date().toISOString();
  return db.budget.add({
    ...item,
    createdAt: now,
    updatedAt: now,
  } as BudgetItem);
}

export async function updateBudgetItem(
  id: number,
  updates: Partial<BudgetItem>
): Promise<void> {
  await db.budget.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBudgetItem(id: number): Promise<void> {
  // Also delete all child items
  const children = await db.budget.filter(item => item.parentId === id).toArray();
  for (const child of children) {
    await db.budget.delete(child.id!);
  }
  await db.budget.delete(id);
}

// ============================================================================
// SUPPORT HIÉRARCHIQUE - Sous-lignes budgétaires
// ============================================================================

export interface BudgetItemWithChildren extends BudgetItem {
  children: BudgetItem[];
  calculatedPrevu: number;
  calculatedEngage: number;
  calculatedRealise: number;
}

/**
 * Hook pour récupérer le budget organisé en hiérarchie (parent/enfants)
 */
export function useBudgetHierarchical() {
  return useLiveQuery(async () => {
    const items = await db.budget.toArray();

    // Séparer les lignes principales (parentId null/undefined) des sous-lignes
    const rootItems = items.filter(item => !item.parentId);
    const childItems = items.filter(item => item.parentId);

    // Organiser en arbre
    const hierarchy: BudgetItemWithChildren[] = rootItems.map(parent => {
      const children = childItems.filter(child => child.parentId === parent.id);

      // Si des enfants existent, calculer les totaux à partir des enfants
      // Sinon utiliser les valeurs du parent
      const hasChildren = children.length > 0;
      const calculatedPrevu = hasChildren
        ? children.reduce((sum, c) => sum + c.montantPrevu, 0)
        : parent.montantPrevu;
      const calculatedEngage = hasChildren
        ? children.reduce((sum, c) => sum + c.montantEngage, 0)
        : parent.montantEngage;
      const calculatedRealise = hasChildren
        ? children.reduce((sum, c) => sum + c.montantRealise, 0)
        : parent.montantRealise;

      return {
        ...parent,
        children,
        calculatedPrevu,
        calculatedEngage,
        calculatedRealise,
      };
    });

    return hierarchy;
  }) ?? [];
}

/**
 * Créer une sous-ligne budgétaire liée à une ligne parente
 */
export async function createSubBudgetItem(
  parentId: number,
  item: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt' | 'parentId' | 'categorie' | 'axe'>
): Promise<number> {
  const parent = await db.budget.get(parentId);
  if (!parent) throw new Error('Parent budget item not found');

  const now = new Date().toISOString();
  return db.budget.add({
    ...item,
    parentId,
    categorie: parent.categorie,
    axe: parent.axe,
    projectPhase: parent.projectPhase,
    createdAt: now,
    updatedAt: now,
  } as BudgetItem);
}

/**
 * Récupérer les sous-lignes d'une ligne budgétaire
 */
export function useSubBudgetItems(parentId: number | undefined) {
  return useLiveQuery(async () => {
    if (!parentId) return [];
    return db.budget.filter(item => item.parentId === parentId).toArray();
  }, [parentId]) ?? [];
}

/**
 * Réinitialiser les montants engagés et réalisés à 0
 * À utiliser quand le budget n'est pas encore validé
 */
export async function resetBudgetEngagements(): Promise<number> {
  const items = await db.budget.toArray();
  const now = new Date().toISOString();
  let updated = 0;

  for (const item of items) {
    if (item.montantEngage !== 0 || item.montantRealise !== 0) {
      await db.budget.update(item.id!, {
        montantEngage: 0,
        montantRealise: 0,
        updatedAt: now,
      });
      updated++;
    }
  }

  return updated;
}

// EVM (Earned Value Management) Calculations
export function calculateEVM(
  budgetItems: BudgetItem[],
  actions: { avancement: number; dateFin: string }[],
  asOfDate: Date = new Date()
): EVMIndicators {
  const BAC = budgetItems.reduce((sum, item) => sum + item.montantPrevu, 0);
  const AC = budgetItems.reduce((sum, item) => sum + item.montantRealise, 0);

  // Calculate planned progress based on schedule
  const today = asOfDate.getTime();
  const projectStart = new Date('2024-01-01').getTime(); // Adjust based on project
  const projectEnd = new Date('2026-11-30').getTime(); // Cosmos Angré opening

  const totalDuration = projectEnd - projectStart;
  const elapsed = Math.min(today - projectStart, totalDuration);
  const scheduledProgress = elapsed / totalDuration;

  // Planned Value (what should have been done by now)
  const PV = BAC * scheduledProgress;

  // Earned Value (what has actually been done based on action progress)
  const avgProgress =
    actions.length > 0
      ? actions.reduce((sum, a) => sum + a.avancement, 0) / actions.length / 100
      : 0;
  const EV = BAC * avgProgress;

  // Performance Indices
  const SPI = PV > 0 ? EV / PV : 0; // Schedule Performance Index
  const CPI = AC > 0 ? EV / AC : 0; // Cost Performance Index

  // Variances
  const SV = EV - PV; // Schedule Variance
  const CV = EV - AC; // Cost Variance

  // Forecasts
  const EAC = CPI > 0 ? BAC / CPI : BAC; // Estimate at Completion
  const ETC = EAC - AC; // Estimate to Complete
  const VAC = BAC - EAC; // Variance at Completion

  return { PV, EV, AC, BAC, SPI, CPI, SV, CV, EAC, ETC, VAC };
}

export function useEVMIndicators() {
  return useLiveQuery(async () => {
    const budgetItems = await db.budget.toArray();
    const actions = await db.actions.toArray();

    return calculateEVM(
      budgetItems,
      actions.map((a) => ({ avancement: a.avancement, dateFin: a.date_fin_prevue }))
    );
  }) ?? {
    PV: 0,
    EV: 0,
    AC: 0,
    BAC: 0,
    SPI: 0,
    CPI: 0,
    SV: 0,
    CV: 0,
    EAC: 0,
    ETC: 0,
    VAC: 0,
  };
}
