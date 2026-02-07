import { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from '@/components/ui';
import type { PropagationRetard } from '@/types';
import { appliquerPropagationRetard } from '@/hooks';

interface PropagationRetardModalProps {
  open: boolean;
  onClose: () => void;
  propagation: PropagationRetard | null;
  onApplied?: () => void;
}

export function PropagationRetardModal({
  open,
  onClose,
  propagation,
  onApplied,
}: PropagationRetardModalProps) {
  const [isApplying, setIsApplying] = useState(false);

  if (!propagation) return null;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await appliquerPropagationRetard(propagation);
      onApplied?.();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la propagation:', error);
      alert('Erreur lors de la propagation du retard');
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <DialogTitle>Propagation de retard</DialogTitle>
              <DialogDescription>
                Un retard a été détecté sur une action technique liée
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Source du retard */}
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Action source</p>
                <p className="text-sm text-orange-700 mt-1">
                  {propagation.action_source_titre}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="destructive">
                    Retard: {propagation.retard_jours} jour(s)
                  </Badge>
                  <span className="text-xs text-orange-600">
                    ID: {propagation.action_source_id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions impactées */}
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Actions de mobilisation impactées ({propagation.actions_impactees.length})
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {propagation.actions_impactees.map((action) => (
                <div
                  key={action.id}
                  className="p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 text-sm">
                        {action.titre}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">ID: {action.id}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      +{action.decalage_jours}j
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-neutral-500">Nouvelles dates:</span>
                    <span className="font-medium text-neutral-700">
                      {formatDate(action.nouvelle_date_debut)}
                    </span>
                    <ArrowRight className="w-3 h-3 text-neutral-400" />
                    <span className="font-medium text-neutral-700">
                      {formatDate(action.nouvelle_date_fin)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message d'avertissement */}
          <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-primary-600 mt-0.5" />
            <p className="text-sm text-blue-800">
              En appliquant cette propagation, les dates de début et de fin des actions
              de mobilisation listées ci-dessus seront automatiquement décalées de{' '}
              <strong>{propagation.retard_jours} jour(s)</strong>. Cette action est
              irréversible.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isApplying}>
            <XCircle className="w-4 h-4 mr-2" />
            Ignorer
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isApplying ? (
              'Application...'
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Appliquer le décalage
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
