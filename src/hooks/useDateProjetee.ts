import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function useDateProjetee(jalonId: number) {
  return useLiveQuery(async () => {
    const jalon = await db.jalons.get(jalonId);
    if (!jalon) return null;

    const prerequisIds = jalon.actions_prerequises || [];
    const allActions = prerequisIds.length > 0
      ? await db.actions.toArray()
      : [];
    const prerequisActions = allActions.filter(a => prerequisIds.includes(a.id_action));

    const now = new Date();
    let terminees = 0;
    let enCours = 0;
    let enRetard = 0;

    for (const action of prerequisActions) {
      if (action.statut === 'termine') {
        terminees++;
      } else {
        const dateFinMs = new Date(action.date_fin_prevue).getTime();
        if (dateFinMs < now.getTime()) {
          enRetard++;
        } else {
          enCours++;
        }
      }
    }

    const datePrevue = jalon.date_prevue;
    const dateProjetee = jalon.date_projetee || datePrevue;
    const glissement = dateProjetee && datePrevue
      ? Math.max(0, Math.round((new Date(dateProjetee).getTime() - new Date(datePrevue).getTime()) / MS_PER_DAY))
      : 0;

    // Count actions impacted by this jalon (linked via jalonId)
    const actionsImpactees = allActions.filter(a => a.jalonId === jalonId && a.statut !== 'termine').length;

    return {
      date_prevue: datePrevue,
      date_projetee: dateProjetee,
      glissement_jours: glissement,
      prerequis: {
        total: prerequisActions.length,
        terminees,
        enCours,
        enRetard,
      },
      actionsImpactees,
    };
  }, [jalonId]);
}
