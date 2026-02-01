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
import { useUsers, useJalons, createJalon, updateJalon } from '@/hooks';
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
      const responsable = jalon.responsable || '';
      const today = new Date().toISOString().split('T')[0];

      await updateJalon(jalon.id, {
        statut: data.statut,
        preuve_url: data.preuve_url || null,
        date_validation: data.date_validation || null,
        date_derniere_maj: today,
        maj_par: responsable,
        commentaires: data.commentaires_externes ? JSON.parse(data.commentaires_externes) : jalon.commentaires,
      });

      toast.success('Jalon mis à jour', `"${jalon.titre}" a été enregistré`);
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

export default JalonForm;
