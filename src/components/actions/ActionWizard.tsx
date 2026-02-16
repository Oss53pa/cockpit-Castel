// ============================================================================
// FORMULAIRE CRÉATION ACTION - Utilise ActionFormContent (composant unifié)
// ============================================================================

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  useToast,
} from '@/components/ui';
import { useUsers, useJalons } from '@/hooks';
import { createAction } from '@/hooks/useActions';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { ActionFormContent, type ActionFormSaveData } from '@/components/shared/ActionFormContent';
import { type Axe } from '@/types';
import { logger } from '@/lib/logger';

// Préfixes par axe
const AXE_PREFIXES: Record<string, string> = {
  'axe1_rh': 'RH',
  'axe2_commercial': 'COM',
  'axe3_technique': 'TECH',
  'axe4_budget': 'BUD',
  'axe5_marketing': 'MKT',
  'axe6_exploitation': 'EXP',
  'axe7_construction': 'CON',
  'axe8_divers': 'DIV',
};

interface ActionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (actionId: number) => void;
  defaultJalonId?: number;
  defaultAxe?: Axe;
}

export function ActionWizard({
  isOpen,
  onClose,
  onSuccess,
  defaultJalonId,
}: ActionWizardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const users = useUsers();
  const jalons = useJalons();
  const toast = useToast();
  const allActions = useLiveQuery(() => db.actions.toArray()) ?? [];

  // Générer l'ID auto: A-{AXE}-{N°Jalon}.{N°Action}
  const generateActionId = (axe: Axe | null, jalonId: number): string => {
    const prefix = axe ? AXE_PREFIXES[axe] || 'GEN' : 'GEN';
    const linkedJalon = jalons.find(j => j.id === jalonId);
    const jalonActions = allActions.filter(a => a.jalonId === jalonId);
    const numAction = jalonActions.length + 1;

    // Extraire le numéro du jalon (ex: J-RH-1 -> 1)
    const jalonNum = linkedJalon?.id_jalon?.split('-').pop() || '1';

    return `A-${prefix}-${jalonNum}.${numAction}`;
  };

  const handleSave = async (data: ActionFormSaveData) => {
    if (!data.jalonId || !data.titre || !data.date_debut_prevue || !data.date_fin_prevue || !data.responsableId) {
      toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedJalon = jalons.find(j => j.id === data.jalonId);
      // Priorité: axe édité manuellement > axe du jalon sélectionné
      const axeEffectif = data.axe || selectedJalon?.axe || null;

      if (!axeEffectif) {
        toast.error('Erreur', 'Impossible de déterminer l\'axe (sélectionnez un axe ou un jalon)');
        setIsSubmitting(false);
        return;
      }

      const responsable = users.find(u => u.id === data.responsableId);
      const responsableName = responsable ? `${responsable.prenom} ${responsable.nom}` : '';
      const today = new Date().toISOString().split('T')[0];

      // Utiliser la date de début fournie par le formulaire
      const echeanceDate = new Date(data.date_fin_prevue);
      const dateDebutDate = new Date(data.date_debut_prevue);

      // Calculer priorité
      const joursRestants = Math.ceil((echeanceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const priorite = joursRestants <= 7 ? 'haute' : joursRestants <= 30 ? 'moyenne' : 'basse';

      const actionId = await createAction({
        // Identification (auto-calculé)
        id_action: generateActionId(axeEffectif, data.jalonId),
        code_wbs: `WBS-${AXE_PREFIXES[axeEffectif]}-A${String(allActions.length + 1).padStart(3, '0')}`,
        titre: data.titre,
        description: data.titre,

        // Classification (axe hérité du jalon)
        axe: axeEffectif,
        phase: 'execution',
        projectPhase: data.projectPhase || undefined,
        categorie: 'operationnel',
        sous_categorie: null,
        type_action: 'tache',

        // Planning
        date_creation: today,
        date_debut_prevue: data.date_debut_prevue,
        date_fin_prevue: data.date_fin_prevue,
        date_debut_reelle: null,
        date_fin_reelle: null,
        duree_prevue_jours: Math.max(1, Math.ceil((echeanceDate.getTime() - dateDebutDate.getTime()) / (1000 * 60 * 60 * 24))),
        duree_reelle_jours: null,
        date_butoir: null,
        flexibilite: 'standard',

        // Alerts
        alerte_j30: null,
        alerte_j15: null,
        alerte_j7: null,
        alerte_j3: null,

        // RACI
        responsable: responsableName,
        responsableId: data.responsableId,
        approbateur: responsableName,
        consultes: [],
        informes: [],
        delegue: null,

        // Escalade
        escalade_niveau1: responsableName,
        escalade_niveau2: '',
        escalade_niveau3: '',

        // Dependencies
        predecesseurs: [],
        successeurs: [],
        contraintes_externes: null,
        chemin_critique: false,
        jalonId: data.jalonId,

        // Resources
        ressources_humaines: [responsableName],
        charge_homme_jour: null,
        budget_prevu: null,
        budget_engage: null,
        budget_realise: null,
        ligne_budgetaire: null,

        // Livrables
        livrables: data.livrables?.map(l => ({
          id: l.id,
          nom: l.nom,
          description: null,
          statut: l.fait ? 'valide' as const : 'en_attente' as const,
          obligatoire: false,
          date_prevue: null,
          date_livraison: l.fait ? new Date().toISOString().split('T')[0] : null,
          validateur: null,
        })) || [],
        criteres_acceptation: [],
        documents: data.preuves?.map(p => ({
          id: p.id,
          nom: p.nom,
          type: p.type,
          url: p.url || '',
          dateAjout: p.dateAjout,
        })) || [],

        // Suivi
        statut: data.statut || 'a_faire',
        avancement: data.avancement || 0,
        methode_avancement: (data.sousTaches?.length || 0) > 0 ? 'sous_taches' : 'manuel',
        priorite,
        sante: joursRestants < 0 ? 'rouge' : joursRestants < 7 ? 'orange' : 'vert',
        tendance: 'stable',
        derniere_mise_a_jour: today,

        // Sous-tâches
        sous_taches: data.sousTaches?.map(st => ({
          id: st.id,
          libelle: st.libelle,
          responsableId: st.responsableId || null,
          echeance: st.echeance || null,
          fait: st.fait,
          avancement: st.avancement || 0,
        })) || [],

        // Points d'attention et décisions
        points_attention: data.pointsAttention || [],
        decisions_attendues: data.decisionsAttendues || [],

        // Notes
        notes_mise_a_jour: data.notes_mise_a_jour || '',

        // Alertes & reporting
        alertes: [],
        visibilite_reporting: 'flash_hebdo',

        // Commentaires & historique
        commentaires: data.commentaires_externes ? JSON.parse(data.commentaires_externes) : [],
        historique: [{
          id: crypto.randomUUID(),
          date: today,
          auteur: responsableName,
          type: 'creation',
          description: 'Création de l\'action',
        }],

        // Metadata
        tags: [],
        source: 'formulaire_v3',
      });

      toast.success('Action créée', `"${data.titre}" a été ajoutée`);
      onSuccess?.(actionId);
      onClose();
    } catch (error) {
      logger.error('Erreur lors de la création:', error);
      toast.error('Erreur', 'Impossible de créer l\'action');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span>Nouvelle Action</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <ActionFormContent
            users={users}
            jalons={jalons.map(j => ({
              id: j.id!,
              id_jalon: j.id_jalon,
              titre: j.titre,
              axe: j.axe,
              responsableId: j.responsableId,
              date_prevue: j.date_prevue,
            }))}
            actionsDisponibles={allActions.filter(a => a.jalonId !== defaultJalonId)}
            isEditing={true}
            isExternal={false}
            isCreate={true}
            defaultJalonId={defaultJalonId}
            onSave={handleSave}
            onCancel={onClose}
            isSaving={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ActionWizard;
