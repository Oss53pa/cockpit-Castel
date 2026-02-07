/**
 * Modal d'édition des lignes budgétaires
 */

import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, AlertTriangle, Send, ExternalLink, Link, Plus, Trash2 } from 'lucide-react';
import { Button, Input, MoneyInput } from '@/components/ui';
import { SendReminderModal, ShareExternalModal } from '@/components/shared';
import type { LigneBudgetExploitation, LienJustification } from '@/types/budgetExploitation.types';
import { cn } from '@/lib/utils';

interface BudgetEditModalProps {
  ligne: LigneBudgetExploitation | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, prevu: number, engage: number, consomme: number, note?: string, commentaire?: string, liensJustification?: LienJustification[]) => Promise<void>;
}

export function BudgetEditModal({ ligne, open, onClose, onSave }: BudgetEditModalProps) {
  const [prevu, setPrevu] = useState(0);
  const [engage, setEngage] = useState(0);
  const [consomme, setConsomme] = useState(0);
  const [note, setNote] = useState('');
  const [liens, setLiens] = useState<LienJustification[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // State pour le formulaire d'ajout de lien
  const [showAddLien, setShowAddLien] = useState(false);
  const [newLienTitre, setNewLienTitre] = useState('');
  const [newLienUrl, setNewLienUrl] = useState('');

  // Mettre à jour les valeurs quand la ligne change
  useEffect(() => {
    if (ligne) {
      setPrevu(ligne.montantPrevu || 0);
      setEngage(ligne.montantEngage || 0);
      setConsomme(ligne.montantConsomme || 0);
      setNote(ligne.note || '');
      setLiens(ligne.liensJustification || []);
      setError(null);
      setShowAddLien(false);
      setNewLienTitre('');
      setNewLienUrl('');
    }
  }, [ligne]);

  if (!open || !ligne) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validation
      if (prevu < 0 || engage < 0 || consomme < 0) {
        setError('Les montants ne peuvent pas être négatifs');
        setIsSaving(false);
        return;
      }

      if (engage > prevu) {
        setError('Le montant engagé ne peut pas dépasser le montant prévu');
        setIsSaving(false);
        return;
      }

      if (consomme > engage) {
        setError('Le montant consommé ne peut pas dépasser le montant engagé');
        setIsSaving(false);
        return;
      }

      await onSave(ligne.id!, prevu, engage, consomme, note || undefined, note || undefined, liens.length > 0 ? liens : undefined);
      onClose();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrevu(ligne.montantPrevu || 0);
    setEngage(ligne.montantEngage || 0);
    setConsomme(ligne.montantConsomme || 0);
    setNote(ligne.note || '');
    setLiens(ligne.liensJustification || []);
    setError(null);
    setShowAddLien(false);
  };

  const handleAddLien = () => {
    if (!newLienTitre.trim() || !newLienUrl.trim()) return;
    try {
      new URL(newLienUrl);
    } catch {
      setError('URL invalide');
      return;
    }
    setLiens([...liens, {
      id: crypto.randomUUID(),
      titre: newLienTitre.trim(),
      url: newLienUrl.trim(),
      dateAjout: new Date().toISOString(),
    }]);
    setNewLienTitre('');
    setNewLienUrl('');
    setShowAddLien(false);
    setError(null);
  };

  const handleRemoveLien = (id: string) => {
    setLiens(liens.filter(l => l.id !== id));
  };

  // Calcul du reste
  const reste = prevu - consomme;
  const tauxConso = prevu > 0 ? (consomme / prevu) * 100 : 0;

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
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
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
                Montant Prévu
              </label>
              <MoneyInput
                value={prevu}
                onChange={setPrevu}
                className="text-right font-mono text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Montant Engagé
              </label>
              <MoneyInput
                value={engage}
                onChange={setEngage}
                className="text-right font-mono text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Montant Consommé
              </label>
              <MoneyInput
                value={consomme}
                onChange={setConsomme}
                className="text-right font-mono text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Commentaire (optionnel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={3}
                className="w-full text-sm border border-primary-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>
          </div>

          {/* Liens de justification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-primary-700">
                <Link className="h-4 w-4" />
                Liens de justification
              </label>
              {!showAddLien && (
                <button
                  type="button"
                  onClick={() => setShowAddLien(true)}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter un lien
                </button>
              )}
            </div>

            {/* Liste des liens existants */}
            {liens.length > 0 && (
              <div className="space-y-2">
                {liens.map((lien) => (
                  <div key={lien.id} className="flex items-center gap-2 p-2 bg-primary-50 rounded-lg group">
                    <Link className="h-3.5 w-3.5 text-primary-400 flex-shrink-0" />
                    <a
                      href={lien.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-700 hover:text-primary-900 hover:underline truncate flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {lien.titre}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveLien(lien.id)}
                      className="p-1 text-primary-400 hover:text-error-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {liens.length === 0 && !showAddLien && (
              <p className="text-xs text-primary-400 italic">Aucun lien de justification</p>
            )}

            {/* Formulaire d'ajout de lien */}
            {showAddLien && (
              <div className="p-3 border border-primary-200 rounded-lg space-y-2 bg-primary-50/50">
                <Input
                  type="text"
                  value={newLienTitre}
                  onChange={(e) => setNewLienTitre(e.target.value)}
                  placeholder="Titre du lien"
                />
                <Input
                  type="url"
                  value={newLienUrl}
                  onChange={(e) => setNewLienUrl(e.target.value)}
                  placeholder="https://..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowAddLien(false); setNewLienTitre(''); setNewLienUrl(''); setError(null); }}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleAddLien}
                    disabled={!newLienTitre.trim() || !newLienUrl.trim()}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            )}
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
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSendModalOpen(true)}
              title="Envoyer une relance"
            >
              <Send className="h-4 w-4 mr-2" />
              Relancer
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShareModalOpen(true)}
              title="Partager en externe"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
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

      {/* Send Reminder Modal */}
      {sendModalOpen && ligne && (
        <SendReminderModal
          isOpen={sendModalOpen}
          onClose={() => setSendModalOpen(false)}
          entityType="budget"
          entityId={ligne.id!}
          entity={{
            titre: ligne.poste,
            description: ligne.description,
            categorie: ligne.categorie,
            poste: ligne.poste,
            montantPrevu: ligne.montantPrevu,
            montantEngage: ligne.montantEngage,
            montantConsomme: ligne.montantConsomme,
          }}
        />
      )}

      {/* Share External Modal */}
      {shareModalOpen && ligne && (
        <ShareExternalModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          entityType="budget"
          entity={ligne}
        />
      )}
    </div>
  );
}

export default BudgetEditModal;
