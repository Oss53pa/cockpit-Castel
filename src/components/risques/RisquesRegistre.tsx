import { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, MoreVertical, Eye, Shield, Send, ExternalLink, X } from 'lucide-react';
import { usePermissions } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  CriticiteBadge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
} from '@/components/ui';
import { useRisques, useUser, deleteRisque, getRisqueCriticiteColor } from '@/hooks';
import { RISQUE_CATEGORY_LABELS, getRisqueStatusLabel, type Risque, type RisqueFilters } from '@/types';
import { SEUILS_RISQUES } from '@/data/constants';
import { SendReminderModal, ShareExternalModal, ModificationCell } from '@/components/shared';
import { logger } from '@/lib/logger';

interface RisquesRegistreProps {
  filters: RisqueFilters;
  onEdit: (risque: Risque) => void;
  onView: (risque: Risque) => void;
}

function RisqueRow({
  risque,
  selected,
  onToggle,
  onEdit,
  onView,
  onSend,
  onShareExternal,
}: {
  risque: Risque;
  selected: boolean;
  onToggle: (id: number) => void;
  onEdit: () => void;
  onView: () => void;
  onSend: () => void;
  onShareExternal: () => void;
}) {
  const user = useUser(risque.responsableId);
  const { canEdit, canDelete } = usePermissions();

  const handleDelete = async () => {
    if (risque.id && confirm('Supprimer ce risque ?')) {
      try {
        await deleteRisque(risque.id);
      } catch (error) {
        logger.error('Erreur suppression risque:', error);
        alert('Erreur lors de la suppression du risque');
      }
    }
  };

  return (
    <TableRow className={cn(selected && 'bg-primary-50')}>
      {canDelete && (
        <TableCell className="w-10">
          <Checkbox
            checked={selected}
            onCheckedChange={() => risque.id && onToggle(risque.id)}
          />
        </TableCell>
      )}
      <TableCell>
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold',
            getRisqueCriticiteColor(risque.score)
          )}
        >
          {risque.score}
        </div>
      </TableCell>
      <TableCell className="font-medium max-w-[200px]">
        <p className="truncate">{risque.titre}</p>
        <p className="text-xs text-primary-400 truncate">{risque.description}</p>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {RISQUE_CATEGORY_LABELS[risque.categorie]}
        </Badge>
      </TableCell>
      <TableCell className="text-center">{risque.probabilite}</TableCell>
      <TableCell className="text-center">{risque.impact}</TableCell>
      <TableCell>
        <CriticiteBadge score={risque.score} />
      </TableCell>
      <TableCell>
        <Badge
          variant={
            risque.status === 'open'
              ? 'warning'
              : risque.status === 'mitigated'
              ? 'info'
              : risque.status === 'closed'
              ? 'success'
              : 'error'
          }
        >
          {getRisqueStatusLabel(risque.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-primary-500">
        {user ? `${user.prenom} ${user.nom}` : '-'}
      </TableCell>
      <TableCell>
        <ModificationCell entiteType="risque" entiteId={risque.id!} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSend}
            className="text-primary-600 hover:text-primary-800 hover:bg-primary-100"
            title="Envoyer"
          >
            <Send className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onSend}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShareExternal}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Partager en externe
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-error-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function RisquesRegistre({ filters, onEdit, onView }: RisquesRegistreProps) {
  const risques = useRisques(filters);
  const { canDelete } = usePermissions();
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedRisqueForSend, setSelectedRisqueForSend] = useState<Risque | null>(null);
  const [shareExternalModalOpen, setShareExternalModalOpen] = useState(false);
  const [selectedRisqueForShare, setSelectedRisqueForShare] = useState<Risque | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const visibleIds = risques.map(r => r.id!).filter(Boolean);
      if (prev.size === visibleIds.length) return new Set();
      return new Set(visibleIds);
    });
  }, [risques]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} risque${selectedIds.size > 1 ? 's' : ''} ?`)) return;
    try {
      for (const id of selectedIds) {
        await deleteRisque(id);
      }
    } catch (error) {
      logger.error('Erreur suppression en lot:', error);
      alert('Erreur lors de la suppression en lot');
    }
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleSend = (risque: Risque) => {
    setSelectedRisqueForSend(risque);
    setSendModalOpen(true);
  };

  const handleCloseSendModal = () => {
    setSendModalOpen(false);
    setSelectedRisqueForSend(null);
  };

  const handleShareExternal = (risque: Risque) => {
    setSelectedRisqueForShare(risque);
    setShareExternalModalOpen(true);
  };

  const handleCloseShareExternalModal = () => {
    setShareExternalModalOpen(false);
    setSelectedRisqueForShare(null);
  };

  if (risques.length === 0) {
    return (
      <EmptyState
        icon={<Shield className="h-12 w-12" />}
        title="Aucun risque"
        description="Aucun risque identifié pour le moment"
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 rounded-lg border bg-white overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={risques.length > 0 && selectedIds.size === risques.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-16">Score</TableHead>
              <TableHead>Risque</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-center">Prob.</TableHead>
              <TableHead className="text-center">Impact</TableHead>
              <TableHead>Criticité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead className="w-12 text-center" title="Modifications récentes">Modif</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {risques.map((risque) => (
              <RisqueRow
                key={risque.id}
                risque={risque}
                selected={selectedIds.has(risque.id!)}
                onToggle={toggleSelect}
                onEdit={() => onEdit(risque)}
                onView={() => onView(risque)}
                onSend={() => handleSend(risque)}
                onShareExternal={() => handleShareExternal(risque)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bulk selection bar */}
      {canDelete && selectedIds.size > 0 && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-sm mt-2">
          <span className="text-primary-700 font-medium">
            {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X className="h-4 w-4 mr-1" />
              Annuler
            </Button>
            <Button
              size="sm"
              className="bg-error-600 text-white hover:bg-error-700"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* Summary footer - fixé en bas */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-primary-50 rounded-lg text-sm mt-2">
        <span className="text-primary-600">
          {risques.length} risque{risques.length > 1 ? 's' : ''} au total
        </span>
        <div className="flex items-center gap-4">
          <span className="text-error-600">
            {risques.filter(r => r.score >= SEUILS_RISQUES.critique).length} critiques
          </span>
          <span className="text-warning-600">
            {risques.filter(r => r.score >= SEUILS_RISQUES.majeur && r.score < SEUILS_RISQUES.critique).length} majeurs
          </span>
          <span className="text-success-600">
            {risques.filter(r => r.status === 'closed' || r.status === 'mitigated').length} traités
          </span>
        </div>
      </div>

      {/* Send Reminder Modal */}
      {selectedRisqueForSend && (
        <SendReminderModal
          isOpen={sendModalOpen}
          onClose={handleCloseSendModal}
          entityType="risque"
          entityId={selectedRisqueForSend.id!}
          entity={selectedRisqueForSend}
          defaultRecipientId={selectedRisqueForSend.responsableId}
        />
      )}

      {/* Share External Modal */}
      {selectedRisqueForShare && (
        <ShareExternalModal
          isOpen={shareExternalModalOpen}
          onClose={handleCloseShareExternalModal}
          entityType="risque"
          entity={selectedRisqueForShare}
        />
      )}
    </div>
  );
}
