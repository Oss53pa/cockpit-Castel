import { useState, useRef } from 'react';
import { List, LayoutGrid, Columns, GanttChart, CalendarDays, Network, Plus, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '@/stores';
import { Button, Tooltip } from '@/components/ui';
import { excelService } from '@/services/excelService';
import { useActions, createAction, updateAction } from '@/hooks';
import {
  ActionsList,
  ActionsCards,
  ActionsKanban,
  ActionsGantt,
  ActionsCalendar,
  ActionsPert,
  ActionForm,
  ActionFiltersBar,
} from '@/components/actions';
import type { Action, ActionViewMode } from '@/types';

const viewModes: { id: ActionViewMode; label: string; icon: typeof List }[] = [
  { id: 'list', label: 'Liste', icon: List },
  { id: 'cards', label: 'Cartes', icon: LayoutGrid },
  { id: 'kanban', label: 'Kanban', icon: Columns },
  { id: 'gantt', label: 'Gantt', icon: GanttChart },
  { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
  { id: 'pert', label: 'PERT', icon: Network },
];

export function ActionsPage() {
  const { actionsViewMode, setActionsViewMode, actionFilters } = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | undefined>();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actions = useActions(actionFilters);

  const handleEdit = (action: Action) => {
    setSelectedAction(action);
    setFormOpen(true);
  };

  const handleView = (action: Action) => {
    setSelectedAction(action);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedAction(undefined);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedAction(undefined);
  };

  // === EXCEL IMPORT/EXPORT ===
  const handleExportExcel = () => {
    excelService.exportActions(actions);
  };

  const handleDownloadTemplate = () => {
    excelService.downloadTemplate('actions');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await excelService.importActions(file);

      if (result.errors.length > 0) {
        const errorMessages = result.errors.map(err => `Ligne ${err.row}: ${err.message}`).join('\n');
        alert(`Erreurs d'import:\n${errorMessages}`);
      }

      for (const actionData of result.data) {
        const existingAction = actions.find(a => a.id_action === actionData.id_action);

        if (existingAction && existingAction.id) {
          await updateAction(existingAction.id, actionData);
        } else {
          await createAction(actionData as Parameters<typeof createAction>[0]);
        }
      }

      if (result.data.length > 0) {
        alert(`Import réussi: ${result.data.length} action(s) importée(s)`);
      }
    } catch (error) {
      console.error('Erreur import Excel:', error);
      alert('Erreur lors de l\'import du fichier Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderContent = () => {
    switch (actionsViewMode) {
      case 'list':
        return (
          <ActionsList
            filters={actionFilters}
            onEdit={handleEdit}
            onView={handleView}
            onAdd={handleAdd}
          />
        );
      case 'cards':
        return (
          <ActionsCards
            filters={actionFilters}
            onEdit={handleEdit}
            onView={handleView}
            onAdd={handleAdd}
          />
        );
      case 'kanban':
        return (
          <ActionsKanban
            filters={actionFilters}
            onEdit={handleEdit}
            onView={handleView}
            onAdd={handleAdd}
          />
        );
      case 'gantt':
        return (
          <ActionsGantt
            filters={actionFilters}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
      case 'calendar':
        return (
          <ActionsCalendar
            filters={actionFilters}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
      case 'pert':
        return (
          <ActionsPert
            filters={actionFilters}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Plan d'actions</h2>
          <p className="text-sm text-primary-500">
            Gérez les actions du projet Cosmos Angré
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Boutons Excel Import/Export */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          <Tooltip content="Importer depuis Excel">
            <Button variant="outline" onClick={handleImportClick} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Import...' : 'Importer'}
            </Button>
          </Tooltip>
          <Tooltip content="Exporter vers Excel">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </Tooltip>
          <Tooltip content="Télécharger le modèle Excel">
            <Button variant="ghost" onClick={handleDownloadTemplate}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Template
            </Button>
          </Tooltip>

          {/* View mode selector */}
          <div className="flex rounded-lg border bg-primary-50 p-1">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Tooltip key={mode.id} content={mode.label}>
                  <Button
                    variant={actionsViewMode === mode.id ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActionsViewMode(mode.id)}
                    className="px-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only">{mode.label}</span>
                  </Button>
                </Tooltip>
              );
            })}
          </div>

          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle action
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ActionFiltersBar />

      {/* Content based on view mode */}
      {renderContent()}

      {/* Action Form Modal */}
      <ActionForm
        action={selectedAction}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={() => {}}
      />
    </div>
  );
}
