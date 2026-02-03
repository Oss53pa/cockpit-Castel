import { useState } from 'react';
import { Edit, Trash2, MoreVertical, Eye, Shield, Send, ExternalLink } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
} from '@/components/ui';
import { useRisques, useUser, deleteRisque, getRisqueCriticiteColor } from '@/hooks';
import { RISQUE_CATEGORY_LABELS, getRisqueStatusLabel, type Risque, type RisqueFilters } from '@/types';
import { SendReminderModal, ShareExternalModal, ModificationCell } from '@/components/shared';

interface RisquesRegistreProps {
  filters: RisqueFilters;
  onEdit: (risque: Risque) => void;
  onView: (risque: Risque) => void;
}

function RisqueRow({
  risque,
  onEdit,
  onView,
  onSend,
  onShareExternal,
}: {
  risque: Risque;
  onEdit: () => void;
  onView: () => void;
  onSend: () => void;
  onShareExternal: () => void;
}) {
  const user = useUser(risque.responsableId);

  const handleDelete = async () => {
    if (risque.id && confirm('Supprimer ce risque ?')) {
      await deleteRisque(risque.id);
    }
  };

  return (
    <TableRow>
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
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSend}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShareExternal}>
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

export function RisquesRegistre({ filters, onEdit, onView }: RisquesRegistreProps) {
  const risques = useRisques(filters);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedRisqueForSend, setSelectedRisqueForSend] = useState<Risque | null>(null);
  const [shareExternalModalOpen, setShareExternalModalOpen] = useState(false);
  const [selectedRisqueForShare, setSelectedRisqueForShare] = useState<Risque | null>(null);

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
    <>
      <div className="rounded-lg border bg-white overflow-auto max-h-[70vh]">
        <Table>
          <TableHeader>
            <TableRow>
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
                onEdit={() => onEdit(risque)}
                onView={() => onView(risque)}
                onSend={() => handleSend(risque)}
                onShareExternal={() => handleShareExternal(risque)}
              />
            ))}
          </TableBody>
        </Table>
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
    </>
  );
}
