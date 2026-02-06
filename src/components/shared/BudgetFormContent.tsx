// ============================================================================
// CONTENU FORMULAIRE BUDGET - Composant réutilisable (interne + externe)
// ============================================================================

import { useState } from 'react';
import {
  Wallet,
  Save,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Badge,
} from '@/components/ui';
import type { LigneBudgetExploitation } from '@/types/budgetExploitation.types';

// ============================================================================
// TYPES
// ============================================================================

export interface BudgetFormSaveData {
  montantEngage: number;
  montantConsomme: number;
  note?: string;
  commentaires_externes?: string;
  statut?: string; // Pour compatibilité avec handleSave générique
}

interface BudgetFormContentProps {
  ligne: LigneBudgetExploitation;
  isEditing: boolean;
  isExternal?: boolean;
  onSave: (data: BudgetFormSaveData) => void;
  isSaving?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(montant) + ' FCFA';
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function BudgetFormContent({
  ligne,
  isEditing,
  isExternal = false,
  onSave,
  isSaving = false,
}: BudgetFormContentProps) {
  const [montantEngage, setMontantEngage] = useState(ligne.montantEngage);
  const [montantConsomme, setMontantConsomme] = useState(ligne.montantConsomme);
  const [note, setNote] = useState(ligne.note || '');
  const [commentaires, setCommentaires] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (montantEngage < 0) {
      newErrors.engage = 'Le montant engagé ne peut pas être négatif';
    }
    if (montantConsomme < 0) {
      newErrors.consomme = 'Le montant consommé ne peut pas être négatif';
    }
    if (montantConsomme > montantEngage) {
      newErrors.consomme = 'Le montant consommé ne peut pas dépasser le montant engagé';
    }
    if (montantEngage > ligne.montantPrevu) {
      newErrors.engage = 'Le montant engagé ne peut pas dépasser le montant prévu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      montantEngage,
      montantConsomme,
      note: note || undefined,
      commentaires_externes: commentaires || undefined,
    });
  };

  const tauxEngage = ligne.montantPrevu > 0 ? ((montantEngage / ligne.montantPrevu) * 100).toFixed(1) : '0.0';
  const tauxConsomme = ligne.montantPrevu > 0 ? ((montantConsomme / ligne.montantPrevu) * 100).toFixed(1) : '0.0';
  const disponible = ligne.montantPrevu - montantConsomme;

  return (
    <div className="space-y-6">
      {/* Info lecture seule */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-amber-900">{ligne.poste}</h3>
          <Badge className="bg-amber-100 text-amber-700 text-xs">{ligne.categorie}</Badge>
        </div>
        {ligne.description && (
          <p className="text-sm text-amber-700 mb-3">{ligne.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-amber-100">
            <span className="text-xs text-gray-500 block">Montant Prévu</span>
            <span className="font-bold text-gray-900">{formatMontant(ligne.montantPrevu)}</span>
          </div>
          <div className="bg-white rounded-lg p-3 border border-amber-100">
            <span className="text-xs text-gray-500 block">Disponible</span>
            <span className={`font-bold ${disponible >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMontant(disponible)}
            </span>
          </div>
        </div>
      </div>

      {/* Champs éditables */}
      {isEditing && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="montantEngage">Montant Engagé (FCFA)</Label>
              <Input
                id="montantEngage"
                type="number"
                value={montantEngage}
                onChange={(e) => setMontantEngage(Number(e.target.value))}
                min={0}
                step={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{tauxEngage}% du prévu</p>
              {errors.engage && (
                <p className="text-xs text-red-600 mt-1">{errors.engage}</p>
              )}
            </div>
            <div>
              <Label htmlFor="montantConsomme">Montant Consommé (FCFA)</Label>
              <Input
                id="montantConsomme"
                type="number"
                value={montantConsomme}
                onChange={(e) => setMontantConsomme(Number(e.target.value))}
                min={0}
                step={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{tauxConsomme}% du prévu</p>
              {errors.consomme && (
                <p className="text-xs text-red-600 mt-1">{errors.consomme}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="note">Note / Commentaire</Label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Précisions sur les montants, justification des écarts..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {isExternal && (
            <div>
              <Label htmlFor="commentaires">Commentaires pour l'équipe projet</Label>
              <textarea
                id="commentaires"
                value={commentaires}
                onChange={(e) => setCommentaires(e.target.value)}
                rows={2}
                placeholder="Message pour l'équipe projet..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les montants
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
