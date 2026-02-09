import { useState } from 'react';
import { Flag, Edit, Trash2, Eye, MoreVertical, Send, ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
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
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
} from '@/components/ui';
import { useJalons, useActionsByJalon, useProjectConfig, deleteJalon } from '@/hooks';
import { formatDate, getDaysUntil } from '@/lib/utils';
import {
  AXE_SHORT_LABELS,
  JALON_STATUS_LABELS,
  PROJECT_PHASE_LABELS,
  type Jalon,
  type JalonStatus,
  type JalonFilters,
  type PhaseReference,
} from '@/types';
import { detectPhaseForDate, resolveJalonEcheance, computeDateFromPhase } from '@/lib/dateCalculations';
import { detectPhaseForJalon } from '@/lib/phaseAutoDetect';
import type { ProjectConfig } from '@/components/settings/ProjectSettings';
import { SendReminderModal, ShareExternalModal, ModificationCell } from '@/components/shared';

const statusConfig: Record<JalonStatus, { color: string; bgColor: string; icon: typeof Flag }> = {
  a_venir: { color: 'text-primary-600', bgColor: 'bg-primary-100', icon: Flag },
  en_approche: { color: 'text-warning-600', bgColor: 'bg-warning-100', icon: Flag },
  en_danger: { color: 'text-error-600', bgColor: 'bg-error-100', icon: AlertTriangle },
  atteint: { color: 'text-success-600', bgColor: 'bg-success-100', icon: CheckCircle2 },
  depasse: { color: 'text-white', bgColor: 'bg-primary-800', icon: AlertTriangle },
  annule: { color: 'text-gray-500', bgColor: 'bg-gray-100', icon: Flag },
};

interface JalonsListProps {
  filters: JalonFilters;
  onEdit: (jalon: Jalon) => void;
  onView: (jalon: Jalon) => void;
}

type SortField = 'titre' | 'axe' | 'status' | 'datePrevue' | 'avancement';
type SortOrder = 'asc' | 'desc';

function JalonActionsCount({ jalonId }: { jalonId?: number }) {
  const actions = useActionsByJalon(jalonId);
  const terminees = actions.filter(a => a.statut === 'termine').length;

  if (actions.length === 0) {
    return <span className="text-primary-400 text-sm">-</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <span className="font-medium text-primary-700">{terminees}</span>
      <span className="text-primary-400">/</span>
      <span className="text-primary-600">{actions.length}</span>
    </div>
  );
}

function JalonRow({
  jalon,
  projectConfig,
  onEdit,
  onView,
  onSend,
  onShareExternal,
}: {
  jalon: Jalon;
  projectConfig?: ProjectConfig;
  onEdit: () => void;
  onView: () => void;
  onSend: () => void;
  onShareExternal: () => void;
}) {
  const config = statusConfig[jalon.statut] || statusConfig.a_venir;
  const Icon = config.icon;

  // Resolve phase reference: stored > keyword detection > date detection
  const jalonWithRefs = jalon as Jalon & {
    jalon_reference?: PhaseReference;
    delai_declenchement?: number;
  };
  let phaseRef = jalonWithRefs.jalon_reference;
  if (!phaseRef) {
    phaseRef = detectPhaseForJalon({ titre: jalon.titre, axe: jalon.axe }) ?? undefined;
  }
  if (!phaseRef && projectConfig && jalon.date_prevue) {
    phaseRef = detectPhaseForDate(projectConfig, jalon.date_prevue);
  }

  // Resolve échéance: stored data > auto-detected phase + default délai > date_prevue
  let echeance: string | null = null;
  if (projectConfig) {
    // First try with stored jalon_reference + delai
    echeance = resolveJalonEcheance(projectConfig, {
      date_prevue: jalon.date_prevue || undefined,
      jalon_reference: jalonWithRefs.jalon_reference,
      delai_declenchement: jalonWithRefs.delai_declenchement,
    });
    // Fallback: use auto-detected phase + default délai -30
    if (!echeance && phaseRef) {
      const storedDelai = jalonWithRefs.delai_declenchement ?? -30;
      echeance = computeDateFromPhase(projectConfig, phaseRef, storedDelai);
    }
  }
  if (!echeance) {
    echeance = jalon.date_prevue || null;
  }
  const daysUntil = getDaysUntil(echeance);

  const { canEdit, canDelete } = usePermissions();

  const handleDelete = async () => {
    if (jalon.id && confirm('Supprimer ce jalon ?')) {
      try {
        await deleteJalon(jalon.id);
      } catch (error) {
        console.error('Erreur suppression jalon:', error);
        alert('Erreur lors de la suppression du jalon');
      }
    }
  };

  return (
    <TableRow className="hover:bg-primary-50/50">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg p-2', config.bgColor)}>
            <Icon className={cn('h-4 w-4', config.color)} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-primary-900 truncate max-w-[250px]">{jalon.titre}</p>
            {jalon.id_jalon && (
              <p className="text-xs text-primary-400 font-mono">{jalon.id_jalon}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {jalon.projectPhase ? (
          <Badge variant="secondary" className="text-xs">
            {PROJECT_PHASE_LABELS[jalon.projectPhase] || jalon.projectPhase}
          </Badge>
        ) : (
          <span className="text-primary-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {AXE_SHORT_LABELS[jalon.axe] || jalon.axe || '-'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={cn(config.bgColor, config.color, 'text-xs')}>
          {JALON_STATUS_LABELS[jalon.statut] || 'À venir'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-sm">{formatDate(echeance)}</span>
          {echeance && jalon.statut !== 'atteint' && jalon.statut !== 'annule' && (
            <Badge
              variant={daysUntil < 0 ? 'error' : daysUntil <= 7 ? 'warning' : daysUntil <= 30 ? 'info' : 'secondary'}
              className="text-[10px]"
            >
              {daysUntil < 0 ? `+${Math.abs(daysUntil)}j` : `J-${daysUntil}`}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <JalonActionsCount jalonId={jalon.id} />
      </TableCell>
      <TableCell>
        {jalon.responsable ? (
          <span className="text-sm text-primary-700">{jalon.responsable}</span>
        ) : (
          <span className="text-sm text-primary-400">-</span>
        )}
      </TableCell>
      <TableCell>
        <ModificationCell entiteType="jalon" entiteId={jalon.id!} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSend}
            className="text-primary-500 hover:text-primary-700"
            title="Envoyer rappel"
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
                Voir détails
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onSend}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer rappel
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

export function JalonsList({ filters, onEdit, onView }: JalonsListProps) {
  const jalons = useJalons(filters);
  const projectConfig = useProjectConfig();
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedJalonForSend, setSelectedJalonForSend] = useState<Jalon | null>(null);
  const [shareExternalModalOpen, setShareExternalModalOpen] = useState(false);
  const [selectedJalonForShare, setSelectedJalonForShare] = useState<Jalon | null>(null);
  const [sortField, setSortField] = useState<SortField>('datePrevue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSend = (jalon: Jalon) => {
    setSelectedJalonForSend(jalon);
    setSendModalOpen(true);
  };

  const handleCloseSendModal = () => {
    setSendModalOpen(false);
    setSelectedJalonForSend(null);
  };

  const handleShareExternal = (jalon: Jalon) => {
    setSelectedJalonForShare(jalon);
    setShareExternalModalOpen(true);
  };

  const handleCloseShareExternalModal = () => {
    setShareExternalModalOpen(false);
    setSelectedJalonForShare(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedJalons = [...jalons].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'titre':
        comparison = a.titre.localeCompare(b.titre);
        break;
      case 'axe':
        comparison = a.axe.localeCompare(b.axe);
        break;
      case 'status':
        comparison = a.statut.localeCompare(b.statut);
        break;
      case 'datePrevue':
        comparison = new Date(a.date_prevue || 0).getTime() - new Date(b.date_prevue || 0).getTime();
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  if (jalons.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="h-12 w-12" />}
        title="Aucun jalon"
        description="Aucun jalon ne correspond à vos critères"
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 rounded-lg border bg-white overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary-50/50">
              <TableHead
                className="cursor-pointer hover:bg-primary-100/50"
                onClick={() => handleSort('titre')}
              >
                <div className="flex items-center">
                  Jalon <SortIcon field="titre" />
                </div>
              </TableHead>
              <TableHead>Phase</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-primary-100/50"
                onClick={() => handleSort('axe')}
              >
                <div className="flex items-center">
                  Axe <SortIcon field="axe" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-primary-100/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Statut <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-primary-100/50"
                onClick={() => handleSort('datePrevue')}
              >
                <div className="flex items-center">
                  Échéance <SortIcon field="datePrevue" />
                </div>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead className="w-12 text-center" title="Modifications récentes">Modif</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedJalons.map((jalon) => (
              <JalonRow
                key={jalon.id}
                jalon={jalon}
                projectConfig={projectConfig}
                onEdit={() => onEdit(jalon)}
                onView={() => onView(jalon)}
                onSend={() => handleSend(jalon)}
                onShareExternal={() => handleShareExternal(jalon)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary footer - fixé en bas */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-primary-50 rounded-lg text-sm mt-2">
        <span className="text-primary-600">
          {jalons.length} jalon{jalons.length > 1 ? 's' : ''} au total
        </span>
        <div className="flex items-center gap-4">
          <span className="text-success-600">
            {jalons.filter(j => j.statut === 'atteint').length} atteints
          </span>
          <span className="text-warning-600">
            {jalons.filter(j => j.statut === 'en_approche').length} en approche
          </span>
          <span className="text-error-600">
            {jalons.filter(j => j.statut === 'en_danger' || j.statut === 'depasse').length} en danger
          </span>
        </div>
      </div>

      {/* Send Reminder Modal */}
      {selectedJalonForSend && (
        <SendReminderModal
          isOpen={sendModalOpen}
          onClose={handleCloseSendModal}
          entityType="jalon"
          entityId={selectedJalonForSend.id!}
          entity={selectedJalonForSend}
        />
      )}

      {/* Share External Modal */}
      {selectedJalonForShare && (
        <ShareExternalModal
          isOpen={shareExternalModalOpen}
          onClose={handleCloseShareExternalModal}
          entityType="jalon"
          entity={selectedJalonForShare}
        />
      )}
    </div>
  );
}
