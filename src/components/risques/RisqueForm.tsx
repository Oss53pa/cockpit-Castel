// ============================================================================
// FORMULAIRE RISQUE v3.0 - Utilise RisqueFormContent (composant unifié)
// ============================================================================

import { useState } from 'react';
import { Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  useToast,
} from '@/components/ui';
import { updateRisque } from '@/hooks';
import { RisqueFormContent, type RisqueFormSaveData } from '@/components/shared/RisqueFormContent';
import { type Risque } from '@/types';

interface RisqueFormProps {
  risque?: Risque;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RisqueForm({ risque, open, onClose, onSuccess }: RisqueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Si pas de risque, on ne peut pas éditer (utiliser RisqueFormCreate pour créer)
  if (!risque) {
    return null;
  }

  const handleSave = async (data: RisqueFormSaveData) => {
    if (!risque?.id) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      await updateRisque(risque.id, {
        // Champs principaux (édition interne)
        ...(data.titre && { titre: data.titre }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.categorie && { categorie: data.categorie }),
        ...(data.proprietaire && { proprietaire: data.proprietaire }),
        // Évaluation
        statut: data.statut,
        probabilite: data.probabilite,
        impact: data.impact,
        score: data.score,
        // Plan de mitigation
        ...(data.plan_mitigation !== undefined && { plan_mitigation: data.plan_mitigation }),
        // Métadonnées
        date_derniere_evaluation: today,
      });

      toast.success('Risque mis à jour', `"${data.titre || risque.titre}" a été enregistré`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur', 'Impossible de sauvegarder le risque');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <span>Modifier le risque</span>
              {risque?.id_risque && (
                <Badge variant="outline" className="ml-2 font-mono text-xs">
                  {risque.id_risque}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <RisqueFormContent
            risque={risque}
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

export default RisqueForm;
