// ============================================================================
// FORMULAIRE ACTION v3.0 - Utilise ActionFormContent (composant unifié)
// ============================================================================

import { useState } from 'react';
import { Target, Edit3, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  useToast,
} from '@/components/ui';
import { useUsers, useJalons } from '@/hooks';
import { updateAction } from '@/hooks/useActions';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { ActionFormContent, type ActionFormSaveData } from '@/components/shared/ActionFormContent';
import { type Action } from '@/types';

interface ActionFormProps {
  action?: Action;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActionForm({ action, open, onClose, onSuccess }: ActionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const users = useUsers();
  const jalons = useJalons();
  const allActions = useLiveQuery(() => db.actions.toArray()) ?? [];
  const toast = useToast();

  // Si pas d'action, on ne peut pas éditer (utiliser ActionWizard pour créer)
  if (!action) {
    return null;
  }

  const handleSave = async (data: ActionFormSaveData) => {
    if (!action?.id) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Trouver le nom du responsable si changé
      let responsableNom: string | undefined;
      if (data.responsableId !== undefined) {
        const user = users.find(u => u.id === data.responsableId);
        responsableNom = user ? `${user.prenom} ${user.nom}` : undefined;
      }

      await updateAction(action.id, {
        // Champs principaux (si modifiés)
        ...(data.titre && { titre: data.titre }),
        ...(data.jalonId !== undefined && { jalonId: data.jalonId }),
        ...(data.responsableId !== undefined && {
          responsableId: data.responsableId,
          responsable: responsableNom,
        }),
        ...(data.date_fin_prevue !== undefined && { date_fin_prevue: data.date_fin_prevue }),
        ...(data.projectPhase !== undefined && { projectPhase: data.projectPhase }),
        // Statut et avancement
        statut: data.statut,
        avancement: data.avancement,
        sous_taches: data.sousTaches,
        livrables: data.livrables?.map(l => ({
          id: l.id,
          nom: l.nom,
          description: null,
          statut: l.fait ? 'valide' as const : 'en_attente' as const,
          obligatoire: false,
          date_prevue: null,
          date_livraison: l.fait ? new Date().toISOString().split('T')[0] : null,
          validateur: null,
        })),
        points_attention: data.pointsAttention,
        decisions_attendues: data.decisionsAttendues,
        documents: data.preuves?.map(p => ({
          id: p.id,
          nom: p.nom,
          type: p.type,
          url: p.url || '',
          dateAjout: p.dateAjout,
        })),
        derniere_mise_a_jour: today,
      });

      toast.success('Action mise à jour', `"${data.titre || action.titre}" a été enregistrée`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur', 'Impossible de sauvegarder l\'action');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <span>Modifier l'action</span>
              {action?.id_action && (
                <Badge variant="outline" className="ml-2 font-mono text-xs">
                  {action.id_action}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <ActionFormContent
            action={action}
            users={users}
            jalons={jalons}
            actionsDisponibles={allActions.filter(a => a.id !== action.id)}
            isEditing={true}
            isExternal={false}
            onSave={handleSave}
            onCancel={onClose}
            isSaving={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ActionForm;
