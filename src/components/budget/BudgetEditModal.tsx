/**
 * Modal d'édition des lignes budgétaires
 */

import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';
import type { LigneBudgetExploitation } from '@/types/budgetExploitation.types';
import { cn, formatNumber } from '@/lib/utils';

interface BudgetEditModalProps {
  ligne: LigneBudgetExploitation | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, prevu: number, engage: number, consomme: number, note?: string) => Promise<void>;
}

// Formater un nombre en entrée (avec séparateurs de milliers)
function formatInputValue(value: number): string {
  if (value === 0) return '';
  return value.toLocaleString('fr-FR');
}

// Parser une valeur formatée
function parseInputValue(value: string): number {
  const cleaned = value.replace(/\s/g, '').replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

export function BudgetEditModal({ ligne, open, onClose, onSave }: BudgetEditModalProps) {
  const [prevu, setPrevu] = useState('');
  const [engage, setEngage] = useState('');
  const [consomme, setConsomme] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mettre à jour les valeurs quand la ligne change
  useEffect(() => {
    if (ligne) {
      setPrevu(formatInputValue(ligne.montantPrevu));
      setEngage(formatInputValue(ligne.montantEngage));
      setConsomme(formatInputValue(ligne.montantConsomme));
      setNote(ligne.note || '');
      setError(null);
    }
  }, [ligne]);

  if (!open || !ligne) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const prevuVal = parseInputValue(prevu);
      const engageVal = parseInputValue(engage);
      const consommeVal = parseInputValue(consomme);

      // Validation
      if (engageVal > prevuVal) {
        setError('Le montant engagé ne peut pas dépasser le montant prévu');
        setIsSaving(false);
        return;
      }

      if (consommeVal > engageVal) {
        setError('Le montant consommé ne peut pas dépasser le montant engagé');
        setIsSaving(false);
        return;
      }

      await onSave(ligne.id!, prevuVal, engageVal, consommeVal, note || undefined);
      onClose();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrevu(formatInputValue(ligne.montantPrevu));
    setEngage(formatInputValue(ligne.montantEngage));
    setConsomme(formatInputValue(ligne.montantConsomme));
    setNote(ligne.note || '');
    setError(null);
  };

  // Calcul du reste
  const prevuVal = parseInputValue(prevu);
  const consommeVal = parseInputValue(consomme);
  const reste = prevuVal - consommeVal;
  const tauxConso = prevuVal > 0 ? (consommeVal / prevuVal) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Modifier le budget</h2>
              <p className="text-primary-100 text-sm">{ligne.poste}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {ligne.description && (
            <div className="p-3 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-600">{ligne.description}</p>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error-500" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Champs de montant */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Montant Prévu (FCFA)
              </label>
              <Input
                type="text"
                value={prevu}
                onChange={(e) => setPrevu(e.target.value)}
                placeholder="0"
                className="text-right font-mono text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Montant Engagé (FCFA)
              </label>
              <Input
                type="text"
                value={engage}
                onChange={(e) => setEngage(e.target.value)}
                placeholder="0"
                className="text-right font-mono text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Montant Consommé (FCFA)
              </label>
              <Input
                type="text"
                value={consomme}
                onChange={(e) => setConsomme(e.target.value)}
                placeholder="0"
                className="text-right font-mono text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Note (optionnel)
              </label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ajouter une note..."
              />
            </div>
          </div>

          {/* Résumé calculé */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-600 mb-1">Reste à consommer</p>
              <p className={cn(
                'text-lg font-bold',
                reste >= 0 ? 'text-orange-700' : 'text-error-600'
              )}>
                {reste.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 mb-1">Taux de consommation</p>
              <p className="text-lg font-bold text-green-700">
                {tauxConso.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-primary-50 flex justify-between">
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetEditModal;
