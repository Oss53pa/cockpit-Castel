import { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Eye, MoreVertical, Plus, Send, ExternalLink, X } from 'lucide-react';
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
  StatusBadge,
  PriorityBadge,
  Button,
  Progress,
  UserAvatar,
  Checkbox,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
} from '@/components/ui';
import { useActions, useUser, useJalon, useProjectConfig, deleteAction } from '@/hooks';
import { formatDate } from '@/lib/utils';
import {
  AXE_SHORT_LABELS,
  PHASE_REFERENCE_LABELS,
  PROJECT_PHASE_LABELS,
  type PhaseReference,
} from '@/types';
import { detectPhaseForDate, resolveActionEcheance, computeDateFromPhase, computeEcheance } from '@/lib/dateCalculations';
import { detectPhaseForAction, calculateDureeEstimee } from '@/lib/phaseAutoDetect';
import type { ProjectConfig } from '@/components/settings/ProjectSettings';
import { SendReminderModal, ShareExternalModal, ModificationCell } from '@/components/shared';
import type { Action, ActionFilters } from '@/types';
import { Flag } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ActionsListProps {
  filters: ActionFilters;
  onEdit: (action: Action) => void;
  onView: (action: Action) => void;
  onAdd: () => void;
}

function ActionResponsable({ responsableId }: { responsableId: number }) {
  const user = useUser(responsableId);

  if (!user) return <span className="text-primary-400">-</span>;

  return (
    <div className="flex items-center gap-2">
      <UserAvatar name={`${user.prenom} ${user.nom}`} size="sm" />
      <span className="text-sm">{user.prenom} {user.nom}</span>
    </div>
  );
}

function ActionPhase({ action }: { action: Action }) {
  if (!action.projectPhase) return <span className="text-primary-400">-</span>;
  return (
    <Badge variant="secondary" className="text-xs">
      {PROJECT_PHASE_LABELS[action.projectPhase] || '-'}
    </Badge>
  );
}

function ActionJalonRef({ action, config }: { action: Action; config?: ProjectConfig }) {
  const jalon = useJalon(action.jalonId ?? undefined);
  let phaseRef = (action as Action & { jalon_reference?: PhaseReference }).jalon_reference;

  // Fallback 1: keyword-based detection from title + axe
  if (!phaseRef) {
    phaseRef = detectPhaseForAction({ titre: action.titre, axe: action.axe }) ?? undefined;
  }

  // Fallback 2: detect phase from the action's start date
  if (!phaseRef && config && action.date_debut_prevue) {
    phaseRef = detectPhaseForDate(config, action.date_debut_prevue);
  }

  // Show linked jalon title if available
  if (action.jalonId && jalon) {
    return (
      <div className="flex items-center gap-1.5 max-w-[150px]">
        <Flag className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
        <span className="text-sm truncate" title={jalon.titre}>{jalon.titre}</span>
      </div>
    );
  }

  // Otherwise show the phase reference label
  if (phaseRef) {
    return (
      <div className="flex items-center gap-1.5 max-w-[180px]">
        <Flag className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        <span className="text-sm truncate" title={PHASE_REFERENCE_LABELS[phaseRef]}>
          {PHASE_REFERENCE_LABELS[phaseRef]}
        </span>
      </div>
    );
  }

  return <span className="text-primary-400">-</span>;
}

function ActionRow({
  action,
  config,
  selected,
  onToggle,
  onEdit,
  onView,
  onSend,
  onShareExternal,
}: {
  action: Action;
  config?: ProjectConfig;
  selected: boolean;
  onToggle: (id: number) => void;
  onEdit: (action: Action) => void;
  onView: (action: Action) => void;
  onSend: (action: Action) => void;
  onShareExternal: (action: Action) => void;
}) {
  const { canEdit, canDelete } = usePermissions();

  const handleDelete = async () => {
    if (action.id && confirm('Supprimer cette action ?')) {
      try {
        await deleteAction(action.id);
      } catch (error) {
        logger.error('Erreur suppression action:', error);
        alert('Erreur lors de la suppression de l\'action');
      }
    }
  };

  // Compute échéance with fallback from project config
  const actionWithRefs = action as Action & {
    jalon_reference?: PhaseReference;
    delai_declenchement?: number;
    derniere_mise_a_jour_externe?: string;
  };
  let echeance: string | null = null;
  if (config) {
    // First try with stored data
    echeance = resolveActionEcheance(config, {
      date_fin_prevue: action.date_fin_prevue || undefined,
      date_debut_prevue: action.date_debut_prevue || undefined,
      jalon_reference: actionWithRefs.jalon_reference,
      delai_declenchement: actionWithRefs.delai_declenchement,
      duree_prevue_jours: action.duree_prevue_jours || undefined,
    });
    // Fallback: use auto-detected phase + default délai -30 + auto duration
    if (!echeance) {
      const detectedPhase = detectPhaseForAction({ titre: action.titre, axe: action.axe });
      if (detectedPhase) {
        const delai = actionWithRefs.delai_declenchement ?? -30;
        const duree = action.duree_prevue_jours || calculateDureeEstimee({ titre: action.titre });
        const dateDebut = computeDateFromPhase(config, detectedPhase, delai);
        echeance = computeEcheance(dateDebut, duree);
      }
    }
  }
  if (!echeance) {
    echeance = action.date_fin_prevue || null;
  }

  // Check if there was an external update
  const hasExternalUpdate = !!actionWithRefs.derniere_mise_a_jour_externe;
  const externalUpdateDate = hasExternalUpdate ? new Date(actionWithRefs.derniere_mise_a_jour_externe!) : null;
  const isRecentUpdate = externalUpdateDate && (Date.now() - externalUpdateDate.getTime()) < 24 * 60 * 60 * 1000; // Last 24h

  return (
    <TableRow className={cn(isRecentUpdate ? 'bg-green-50' : '', selected && 'bg-primary-50')}>
      {canDelete && (
        <TableCell className="w-10">
          <Checkbox
            checked={selected}
            onCheckedChange={() => action.id && onToggle(action.id)}
          />
        </TableCell>
      )}
      <TableCell className="font-medium max-w-[200px]">
        <div className="flex items-center gap-2">
          <span className="truncate">{action.titre}</span>
          {hasExternalUpdate && (
            <span
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                isRecentUpdate
                  ? "bg-green-100 text-green-700 animate-pulse"
                  : "bg-gray-100 text-gray-600"
              )}
              title={`Dernière mise à jour externe: ${externalUpdateDate?.toLocaleString('fr-FR')}`}
            >
              <ExternalLink className="h-3 w-3" />
              {isRecentUpdate ? 'MAJ reçue' : 'MAJ ext.'}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <ActionPhase action={action} />
      </TableCell>
      <TableCell>
        <ActionJalonRef action={action} config={config} />
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {AXE_SHORT_LABELS[action.axe] || action.axe || '-'}
        </Badge>
      </TableCell>
      <TableCell>
        <StatusBadge status={action.statut} />
      </TableCell>
      <TableCell>
        <PriorityBadge priority={action.priorite} />
      </TableCell>
      <TableCell>
        <ActionResponsable responsableId={action.responsableId} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={action.avancement} size="sm" className="w-20" />
          <span className="text-xs text-primary-500">{action.avancement}%</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-primary-500">
        {formatDate(echeance)}
      </TableCell>
      <TableCell>
        <ModificationCell entiteType="action" entiteId={action.id!} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onSend(action)}
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
              <DropdownMenuItem onClick={() => onView(action)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(action)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onSend(action)}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShareExternal(action)}>
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

export function ActionsList({ filters, onEdit, onView, onAdd }: ActionsListProps) {
  const actions = useActions(filters);
  const projectConfig = useProjectConfig();
  const { canDelete } = usePermissions();
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedActionForSend, setSelectedActionForSend] = useState<Action | null>(null);
  const [shareExternalModalOpen, setShareExternalModalOpen] = useState(false);
  const [selectedActionForShare, setSelectedActionForShare] = useState<Action | null>(null);
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
      const visibleIds = actions.map(a => a.id!).filter(Boolean);
      if (prev.size === visibleIds.length) return new Set();
      return new Set(visibleIds);
    });
  }, [actions]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} action${selectedIds.size > 1 ? 's' : ''} ?`)) return;
    try {
      for (const id of selectedIds) {
        await deleteAction(id);
      }
    } catch (error) {
      logger.error('Erreur suppression en lot:', error);
      alert('Erreur lors de la suppression en lot');
    }
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleSend = (action: Action) => {
    setSelectedActionForSend(action);
    setSendModalOpen(true);
  };

  const handleCloseSendModal = () => {
    setSendModalOpen(false);
    setSelectedActionForSend(null);
  };

  const handleShareExternal = (action: Action) => {
    setSelectedActionForShare(action);
    setShareExternalModalOpen(true);
  };

  const handleCloseShareExternalModal = () => {
    setShareExternalModalOpen(false);
    setSelectedActionForShare(null);
  };

  if (actions.length === 0) {
    return (
      <EmptyState
        icon={<Plus className="h-12 w-12" />}
        title="Aucune action"
        description="Commencez par ajouter une action au plan"
        action={
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle action
          </Button>
        }
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
                    checked={actions.length > 0 && selectedIds.size === actions.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Titre</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Jalon</TableHead>
              <TableHead>Axe</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Avancement</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="w-12 text-center" title="Modifications récentes">Modif</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                config={projectConfig}
                selected={selectedIds.has(action.id!)}
                onToggle={toggleSelect}
                onEdit={onEdit}
                onView={onView}
                onSend={handleSend}
                onShareExternal={handleShareExternal}
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
          {actions.length} action{actions.length > 1 ? 's' : ''} au total
        </span>
        <div className="flex items-center gap-4">
          <span className="text-success-600">
            {actions.filter(a => a.statut === 'termine').length} terminées
          </span>
          <span className="text-warning-600">
            {actions.filter(a => a.statut === 'en_cours').length} en cours
          </span>
          <span className="text-error-600">
            {actions.filter(a => a.statut === 'bloque').length} bloquées
          </span>
        </div>
      </div>

      {/* Send Reminder Modal */}
      {selectedActionForSend && (
        <SendReminderModal
          isOpen={sendModalOpen}
          onClose={handleCloseSendModal}
          entityType="action"
          entityId={selectedActionForSend.id!}
          entity={selectedActionForSend}
          defaultRecipientId={selectedActionForSend.responsableId}
        />
      )}

      {/* Share External Modal */}
      {selectedActionForShare && (
        <ShareExternalModal
          isOpen={shareExternalModalOpen}
          onClose={handleCloseShareExternalModal}
          entityType="action"
          entity={selectedActionForShare}
        />
      )}
    </div>
  );
}
