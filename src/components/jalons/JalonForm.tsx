// ============================================================================
// FORMULAIRE JALON v4.0 - Utilise JalonFormContent (composant unifié)
// ============================================================================

import { useEffect, useState } from 'react';
import { Target, X, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Badge,
  useToast,
} from '@/components/ui';
import { useUsers, useJalons, createJalon, updateJalon, usePermissions } from '@/hooks';
import { JalonFormContent, type JalonFormSaveData } from '@/components/shared/JalonFormContent';
import { JalonFormCreate } from './JalonFormCreate';
import {
  AXES,
  AXE_LABELS,
  type Jalon,
  type Axe,
} from '@/types';

// Préfixes ID
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

interface JalonFormProps {
  jalon?: Jalon;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JalonForm({ jalon, open, onClose, onSuccess }: JalonFormProps) {
  const users = useUsers();
  const jalons = useJalons();
  const toast = useToast();
  const { canEdit } = usePermissions();
  const isEditing = !!jalon;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si on crée un nouveau jalon, utiliser le formulaire de création
  if (!isEditing) {
    return (
      <JalonFormCreate
        open={open}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  // Sauvegarde pour modification
  const handleSave = async (data: JalonFormSaveData) => {
    if (!jalon?.id) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      await updateJalon(jalon.id, {
        // Champs principaux (édition interne)
        ...(data.titre && { titre: data.titre }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date_debut_prevue !== undefined && { date_debut_prevue: data.date_debut_prevue || null }),
        ...(data.date_prevue && { date_prevue: data.date_prevue }),
        ...(data.responsable && { responsable: data.responsable }),
        ...(data.axe && { axe: data.axe }),
        ...(data.projectPhase !== undefined && { projectPhase: data.projectPhase }),
        ...(data.niveau_importance && { niveau_importance: data.niveau_importance }),
        // Statut et validation
        statut: data.statut,
        date_validation: data.date_validation || null,
        // Métadonnées
        date_derniere_maj: today,
        maj_par: data.responsable || jalon.responsable || '',
        commentaires: data.commentaires_externes ? JSON.parse(data.commentaires_externes) : jalon.commentaires,
      });

      toast.success('Jalon mis à jour', `"${data.titre || jalon.titre}" a été enregistré`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur', 'Impossible de sauvegarder le jalon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <span>Modifier le jalon</span>
              {jalon?.id_jalon && (
                <Badge variant="outline" className="ml-2 font-mono text-xs">
                  {jalon.id_jalon}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <JalonFormContent
            jalon={jalon}
            isEditing={canEdit}
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

export default JalonForm;
