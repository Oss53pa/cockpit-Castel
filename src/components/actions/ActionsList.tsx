import { useState } from 'react';
import { Edit, Trash2, Eye, MoreVertical, Plus, Send, ExternalLink } from 'lucide-react';
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
  onEdit,
  onView,
  onSend,
  onShareExternal,
}: {
  action: Action;
  config?: ProjectConfig;
  onEdit: (action: Action) => void;
  onView: (action: Action) => void;
  onSend: (action: Action) => void;
  onShareExternal: (action: Action) => void;
}) {
  const handleDelete = async () => {
    if (action.id && confirm('Supprimer cette action ?')) {
      await deleteAction(action.id);
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
    <TableRow className={isRecentUpdate ? 'bg-green-50' : ''}>
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
              <DropdownMenuItem onClick={() => onEdit(action)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSend(action)}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShareExternal(action)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Partager en externe
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-error-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
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
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedActionForSend, setSelectedActionForSend] = useState<Action | null>(null);
  const [shareExternalModalOpen, setShareExternalModalOpen] = useState(false);
  const [selectedActionForShare, setSelectedActionForShare] = useState<Action | null>(null);

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
    <>
      <div className="rounded-lg border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
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
                onEdit={onEdit}
                onView={onView}
                onSend={handleSend}
                onShareExternal={handleShareExternal}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary-50 rounded-lg text-sm">
        <span className="text-primary-600">
          {actions.length} action{actions.length > 1 ? 's' : ''} au total
        </span>
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
    </>
  );
}
