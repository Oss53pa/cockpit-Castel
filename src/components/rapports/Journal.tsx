/**
 * Journal des Rapports
 * Historique et archivage de TOUS les rapports générés (Studio + DeepDive)
 */

import { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Trash2,
  Eye,
  Search,
  Archive,
  Send,
  Mail,
  Clock,
  MoreVertical,
  Presentation,
  Globe,
  User,
  Users,
  BarChart2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  SelectOption,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUsers } from '@/hooks';
import type { DeepDive } from '@/types/deepDive';
import type { StudioReport } from '@/types/reportStudio';
import { REPORT_TYPE_LABELS } from '@/types/reportStudio';

// Type unifié pour le dialog d'envoi
interface SendReportDialogProps {
  open: boolean;
  onClose: () => void;
  report: { titre: string; periode?: string } | null;
  onSend: (recipients: string[], format: string, message: string) => Promise<void>;
}

// Composant Dialog d'envoi
function SendReportDialog({ open, onClose, report, onSend }: SendReportDialogProps) {
  const { users } = useUsers();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [customEmails, setCustomEmails] = useState('');
  const [format, setFormat] = useState<'pdf' | 'pptx' | 'html'>('pdf');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const recipients: string[] = [];

    // Ajouter les emails des utilisateurs sélectionnés
    selectedUsers.forEach(userId => {
      const user = users.find(u => u.id === userId);
      if (user?.email) recipients.push(user.email);
    });

    // Ajouter les emails personnalisés
    if (customEmails.trim()) {
      const emails = customEmails.split(',').map(e => e.trim()).filter(e => e);
      recipients.push(...emails);
    }

    if (recipients.length === 0) {
      alert('Veuillez sélectionner au moins un destinataire');
      return;
    }

    setSending(true);
    try {
      await onSend(recipients, format, message);
      onClose();
    } catch (error) {
      console.error('Erreur envoi:', error);
      alert('Erreur lors de l\'envoi du rapport');
    } finally {
      setSending(false);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary-600" />
            Envoyer le rapport
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rapport sélectionné */}
          <div className="p-3 bg-primary-50 rounded-lg">
            <p className="font-medium text-primary-900">{report.titre}</p>
            {report.periode && (
              <p className="text-sm text-primary-600">{report.periode}</p>
            )}
          </div>

          {/* Sélection des destinataires */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Destinataires de l'équipe
            </label>
            <div className="border rounded-lg max-h-40 overflow-y-auto">
              {users.filter(u => u.email).map(user => (
                <label
                  key={user.id}
                  className={cn(
                    'flex items-center gap-3 p-2 cursor-pointer hover:bg-primary-50 border-b last:border-b-0',
                    selectedUsers.includes(user.id!) && 'bg-primary-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id!)}
                    onChange={() => toggleUser(user.id!)}
                    className="h-4 w-4 rounded border-primary-300 text-primary-600"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{user.nom}</span>
                    <span className="text-xs text-primary-500 ml-2">{user.email}</span>
                  </div>
                  <Badge variant="default" className="text-xs">{user.role}</Badge>
                </label>
              ))}
            </div>
          </div>

          {/* Emails personnalisés */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              <Mail className="inline h-4 w-4 mr-1" />
              Emails supplémentaires
            </label>
            <Input
              placeholder="email1@example.com, email2@example.com"
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
            />
            <p className="text-xs text-primary-500 mt-1">Séparez les adresses par des virgules</p>
          </div>

          {/* Format d'export */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Format du rapport
            </label>
            <div className="flex gap-2">
              {[
                { value: 'pdf', label: 'PDF', icon: FileText },
                { value: 'pptx', label: 'PowerPoint', icon: Presentation },
                { value: 'html', label: 'HTML', icon: Globe },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value as 'pdf' | 'pptx' | 'html')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all',
                    format === value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-primary-200 hover:border-primary-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message personnalisé */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ajoutez un message personnalisé..."
              className="w-full h-20 px-3 py-2 border border-primary-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Clock className="h-4 w-4 mr-1 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Envoyer ({selectedUsers.length + (customEmails.trim() ? customEmails.split(',').length : 0)} dest.)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Types pour les filtres
type FilterStatus = 'all' | 'draft' | 'sent' | 'archived' | 'published';
type FilterType = 'all' | 'deep_dive' | 'studio' | 'RAPPORT_FLASH' | 'RAPPORT_MENSUEL' | 'RAPPORT_BUDGET' | 'RAPPORT_RISQUES';

// Type unifié pour tous les rapports
interface UnifiedReport {
  id: number;
  source: 'studio' | 'deepdive';
  titre: string;
  type: string;
  typeLabel: string;
  periode?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  sharedWith?: string[];
  tags?: string[];
  // Référence originale
  originalReport: StudioReport | DeepDive;
}

interface JournalProps {
  onOpenDeepDive?: (id: number) => void;
  onOpenReport?: (id: number) => void;
}

export function Journal({ onOpenDeepDive, onOpenReport }: JournalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedReport, setSelectedReport] = useState<UnifiedReport | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Charger les DeepDives depuis la DB
  const deepDives = useLiveQuery(() => db.deepDives.orderBy('createdAt').reverse().toArray()) || [];

  // Charger les rapports Studio depuis la DB
  const studioReports = useLiveQuery(() => db.reports.orderBy('createdAt').reverse().toArray()) || [];

  // Combiner et unifier tous les rapports
  const allReports = useMemo((): UnifiedReport[] => {
    const unified: UnifiedReport[] = [];

    // Ajouter les rapports Studio
    studioReports.forEach(report => {
      if (!report.id) return;
      unified.push({
        id: report.id,
        source: 'studio',
        titre: report.title,
        type: report.type,
        typeLabel: REPORT_TYPE_LABELS[report.type] || report.type,
        periode: report.periodLabel,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        createdBy: report.author,
        tags: report.tags,
        originalReport: report,
      });
    });

    // Ajouter les DeepDives
    deepDives.forEach(dd => {
      if (!dd.id) return;
      unified.push({
        id: dd.id,
        source: 'deepdive',
        titre: dd.titre,
        type: 'deep_dive',
        typeLabel: 'Deep Dive',
        periode: dd.periode,
        status: dd.status,
        createdAt: dd.createdAt,
        updatedAt: dd.updatedAt,
        createdBy: dd.createdBy,
        sharedWith: dd.sharedWith,
        tags: dd.tags,
        originalReport: dd,
      });
    });

    // Trier par date de création décroissante
    return unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [studioReports, deepDives]);

  // Filtrer les rapports
  const filteredReports = useMemo(() => {
    return allReports.filter(report => {
      // Filtre de recherche
      if (searchTerm && !report.titre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtre par statut
      if (filterStatus !== 'all') {
        if (filterStatus === 'sent' && !report.sharedWith?.length) return false;
        if (filterStatus === 'archived' && report.status !== 'archived') return false;
        if (filterStatus === 'draft' && report.status !== 'draft') return false;
        if (filterStatus === 'published' && report.status !== 'published') return false;
      }

      // Filtre par type
      if (filterType !== 'all') {
        if (filterType === 'studio' && report.source !== 'studio') return false;
        if (filterType === 'deep_dive' && report.source !== 'deepdive') return false;
        if (filterType !== 'studio' && filterType !== 'deep_dive' && report.type !== filterType) return false;
      }

      return true;
    });
  }, [allReports, searchTerm, filterStatus, filterType]);

  // Archiver un rapport
  const handleArchive = async (report: UnifiedReport) => {
    if (report.source === 'deepdive') {
      await db.deepDives.update(report.id, {
        status: 'archived',
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.reports.update(report.id, {
        status: 'archived',
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Supprimer un rapport
  const handleDelete = async (report: UnifiedReport) => {
    if (confirm(`Supprimer définitivement "${report.titre}" ?`)) {
      if (report.source === 'deepdive') {
        await db.deepDives.delete(report.id);
      } else {
        await db.reports.delete(report.id);
      }
    }
  };

  // Envoyer un rapport
  const handleSendReport = async (recipients: string[], format: string, message: string) => {
    if (!selectedReport) return;

    console.log('Envoi rapport:', {
      report: selectedReport.titre,
      recipients,
      format,
      message,
    });

    // Mettre à jour le rapport avec les infos d'envoi
    if (selectedReport.source === 'deepdive') {
      const dd = selectedReport.originalReport as DeepDive;
      await db.deepDives.update(selectedReport.id, {
        sharedWith: [...(dd.sharedWith || []), ...recipients],
        lastSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.reports.update(selectedReport.id, {
        status: 'published',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    alert(`Rapport envoyé à ${recipients.length} destinataire(s) au format ${format.toUpperCase()}`);
  };

  // Télécharger un rapport
  const handleDownload = async (report: UnifiedReport, format: 'pdf' | 'pptx' | 'html') => {
    alert(`Téléchargement ${format.toUpperCase()} de "${report.titre}" - Fonctionnalité en cours d'intégration`);
  };

  // Ouvrir un rapport
  const handleOpen = (report: UnifiedReport) => {
    if (report.source === 'deepdive') {
      onOpenDeepDive?.(report.id);
    } else {
      onOpenReport?.(report.id);
    }
  };

  const getStatusBadge = (report: UnifiedReport) => {
    switch (report.status) {
      case 'archived':
        return <Badge variant="default">Archivé</Badge>;
      case 'published':
        return <Badge variant="success">Publié</Badge>;
      case 'finalized':
      case 'presented':
        return <Badge variant="success">Finalisé</Badge>;
      case 'review':
        return <Badge variant="warning">En revue</Badge>;
      default:
        if (report.sharedWith?.length) {
          return <Badge variant="success">Envoyé</Badge>;
        }
        return <Badge variant="warning">Brouillon</Badge>;
    }
  };

  const getTypeIcon = (report: UnifiedReport) => {
    if (report.source === 'deepdive') {
      return <Presentation className="h-6 w-6 text-purple-600" />;
    }
    switch (report.type) {
      case 'RAPPORT_FLASH':
        return <Zap className="h-6 w-6 text-blue-600" />;
      case 'RAPPORT_BUDGET':
        return <BarChart2 className="h-6 w-6 text-green-600" />;
      case 'RAPPORT_RISQUES':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      default:
        return <FileText className="h-6 w-6 text-primary-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deep_dive: 'Deep Dive',
      flash: 'Flash Hebdo',
      mensuel: 'Mensuel',
      budget: 'Budget',
      risques: 'Risques',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Journal des Rapports</h2>
          <p className="text-sm text-primary-600">
            Historique et archivage de tous les rapports générés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">{filteredReports.length} rapport(s)</Badge>
        </div>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
              <Input
                placeholder="Rechercher un rapport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtre statut */}
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="w-40"
          >
            <SelectOption value="all">Tous les statuts</SelectOption>
            <SelectOption value="draft">Brouillons</SelectOption>
            <SelectOption value="sent">Envoyés</SelectOption>
            <SelectOption value="archived">Archivés</SelectOption>
          </Select>

          {/* Filtre type */}
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="w-48"
          >
            <SelectOption value="all">Tous les types</SelectOption>
            <SelectOption value="studio">Rapports Studio</SelectOption>
            <SelectOption value="deep_dive">Deep Dive</SelectOption>
            <SelectOption value="RAPPORT_FLASH">Flash Hebdo</SelectOption>
            <SelectOption value="RAPPORT_MENSUEL">Mensuel</SelectOption>
            <SelectOption value="RAPPORT_BUDGET">Budget</SelectOption>
            <SelectOption value="RAPPORT_RISQUES">Risques</SelectOption>
          </Select>
        </div>
      </Card>

      {/* Liste des rapports */}
      {filteredReports.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-primary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-primary-900 mb-2">Aucun rapport trouvé</h3>
          <p className="text-primary-600">
            {searchTerm || filterStatus !== 'all'
              ? 'Modifiez vos critères de recherche'
              : 'Les rapports générés apparaîtront ici'
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Icône type */}
                  <div className="p-3 bg-primary-100 rounded-lg">
                    {getTypeIcon(report)}
                  </div>

                  {/* Infos rapport */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-primary-900 truncate">
                        {report.titre}
                      </h3>
                      <Badge variant="info" className="text-xs">{report.typeLabel}</Badge>
                      {getStatusBadge(report)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-primary-600 flex-wrap">
                      {report.periode && (
                        <span className="flex items-center gap-1 font-medium text-primary-700">
                          <Calendar className="h-4 w-4" />
                          {report.periode}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Créé le {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      {report.createdBy && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {report.createdBy}
                        </span>
                      )}
                      {report.sharedWith?.length ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Mail className="h-4 w-4" />
                          {report.sharedWith.length} destinataire(s)
                        </span>
                      ) : null}
                    </div>

                    {/* Tags */}
                    {report.tags?.length && (
                      <div className="flex items-center gap-1 mt-2">
                        {report.tags.map((tag, i) => (
                          <Badge key={i} variant="default" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowSendDialog(true);
                    }}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Envoyer
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpen(report)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDownload(report, 'pdf')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(report, 'pptx')}>
                        <Presentation className="h-4 w-4 mr-2" />
                        Télécharger PPTX
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(report, 'html')}>
                        <Globe className="h-4 w-4 mr-2" />
                        Télécharger HTML
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleArchive(report)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archiver
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(report)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog d'envoi */}
      <SendReportDialog
        open={showSendDialog}
        onClose={() => {
          setShowSendDialog(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onSend={handleSendReport}
      />
    </div>
  );
}

export default Journal;
