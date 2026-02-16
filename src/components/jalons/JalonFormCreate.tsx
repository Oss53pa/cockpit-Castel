// ============================================================================
// FORMULAIRE CRÉATION JALON - Utilise JalonFormContent (composant unifié)
// ============================================================================

import { useState } from 'react';
import { Target } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  useToast,
} from '@/components/ui';
import { useUsers, useJalons, createJalon } from '@/hooks';
import { JalonFormContent, type JalonFormSaveData } from '@/components/shared/JalonFormContent';
import { type Jalon, type Axe } from '@/types';
import { logger } from '@/lib/logger';

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

interface JalonFormCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JalonFormCreate({ open, onClose, onSuccess }: JalonFormCreateProps) {
  const users = useUsers();
  const jalons = useJalons();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Générer l'ID du jalon basé sur l'axe
  const generateJalonId = (axe: Axe): string => {
    const prefix = AXE_PREFIXES[axe] || 'GEN';
    const axeJalons = jalons.filter(j => j.axe === axe);
    return `J-${prefix}-${axeJalons.length + 1}`;
  };

  const handleSave = async (data: JalonFormSaveData) => {
    if (!data.titre || !data.date_prevue || !data.axe) {
      toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const responsable = users.find(u => u.id === data.responsableId);
      const responsableName = responsable ? `${responsable.prenom} ${responsable.nom}` : data.responsable || '';
      const today = new Date().toISOString().split('T')[0];

      const jalonIdGenerated = generateJalonId(data.axe);
      await createJalon({
        id_jalon: jalonIdGenerated,
        code_wbs: jalonIdGenerated,
        titre: data.titre,
        description: data.description || '',
        axe: data.axe,
        projectPhase: data.projectPhase || undefined,
        date_debut_prevue: data.date_debut_prevue || undefined,
        date_prevue: data.date_prevue,
        responsable: responsableName,
        responsableId: data.responsableId,
        categorie: 'validation',
        type_jalon: 'managerial',
        niveau_importance: data.niveau_importance || 'standard',
        date_reelle: null,
        heure_cible: null,
        fuseau_horaire: 'Africa/Abidjan',
        date_butoir_absolue: null,
        flexibilite: 'standard',
        alerte_j30: '',
        alerte_j15: '',
        alerte_j7: '',
        statut: data.statut || 'a_venir',
        avancement_prealables: 0,
        confiance_atteinte: 50,
        tendance: 'stable',
        date_derniere_maj: today,
        maj_par: responsableName,
        validateur: responsableName,
        validateurId: data.responsableId,
        contributeurs: [],
        parties_prenantes: [],
        escalade_niveau1: responsableName,
        escalade_niveau2: '',
        escalade_niveau3: '',
        livrables: [],
        risques: [],
        documents: [],
        prerequis_jalons: [],
        commentaires: data.commentaires_externes ? JSON.parse(data.commentaires_externes) : [],
        historique: [{
          id: crypto.randomUUID(),
          date: today,
          auteur: responsableName,
          type: 'creation',
          description: 'Création du jalon',
        }],
        tags: [],
        visibilite_reporting: 'tous_niveaux',
        source: 'form',
        notes_mise_a_jour: data.notes_mise_a_jour || '',
        date_validation: data.date_validation || null,
      } as Omit<Jalon, 'id'>);

      toast.success('Jalon créé', `"${data.titre}" a été enregistré`);
      onSuccess();
      onClose();
    } catch (error) {
      logger.error('Erreur:', error);
      toast.error('Erreur', 'Impossible de créer le jalon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span>Nouveau jalon</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <JalonFormContent
            isEditing={true}
            isExternal={false}
            isCreate={true}
            onSave={handleSave}
            onCancel={onClose}
            isSaving={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default JalonFormCreate;
