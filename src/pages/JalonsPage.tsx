import { useState, useRef } from 'react';
import { List, LayoutGrid, Columns, GanttChart, Network, Plus, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '@/stores';
import { Button, Select, SelectOption, Tooltip, useToast } from '@/components/ui';
import { excelService } from '@/services/excelService';
import { useJalons, createJalon, updateJalon, usePermissions } from '@/hooks';
import {
  JalonsList,
  JalonsCards,
  JalonsKanban,
  JalonsGantt,
  JalonsPert,
  JalonForm,
} from '@/components/jalons';
import { AXES, AXE_LABELS, JALON_STATUSES, JALON_STATUS_LABELS, BUILDING_CODES, BUILDING_CODE_LABELS, PROJECT_PHASES, PROJECT_PHASE_LABELS, type Jalon } from '@/types';

type ViewMode = 'list' | 'cards' | 'kanban' | 'gantt' | 'pert';

const viewModes: { id: ViewMode; label: string; icon: typeof List }[] = [
  { id: 'list', label: 'Liste', icon: List },
  { id: 'cards', label: 'Cartes', icon: LayoutGrid },
  { id: 'kanban', label: 'Kanban', icon: Columns },
  { id: 'gantt', label: 'Gantt', icon: GanttChart },
  { id: 'pert', label: 'PERT', icon: Network },
];

export function JalonsPage() {
  const { jalonFilters, setJalonFilters } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedJalon, setSelectedJalon] = useState<Jalon | undefined>();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jalons = useJalons(jalonFilters);
  const toast = useToast();
  const { canCreate, canEdit, canImport } = usePermissions();

  const handleEdit = (jalon: Jalon) => {
    setSelectedJalon(jalon);
    setFormOpen(true);
  };

  const handleView = (jalon: Jalon) => {
    setSelectedJalon(jalon);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedJalon(undefined);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedJalon(undefined);
  };

  // === EXCEL IMPORT/EXPORT ===
  const handleExportExcel = () => {
    excelService.exportJalons(jalons);
  };

  const handleDownloadTemplate = () => {
    excelService.downloadTemplate('jalons');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await excelService.importJalons(file);

      if (result.errors.length > 0) {
        const errorMessages = result.errors.map(err => `Ligne ${err.row}: ${err.message}`).join('\n');
        alert(`Erreurs d'import:\n${errorMessages}`);
      }

      // Importer les données valides
      for (const jalonData of result.data) {
        // Vérifier si le jalon existe déjà (par id_jalon)
        const existingJalon = jalons.find(j => j.id_jalon === jalonData.id_jalon);

        if (existingJalon && existingJalon.id) {
          await updateJalon(existingJalon.id, jalonData);
        } else {
          await createJalon(jalonData as Parameters<typeof createJalon>[0]);
        }
      }

      if (result.data.length > 0) {
        toast.success(`Import réussi: ${result.data.length} jalon(s) importé(s)`);
      }
    } catch (error) {
      console.error('Erreur import Excel:', error);
      toast.error('Erreur lors de l\'import du fichier Excel');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <JalonsList
            filters={jalonFilters}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
      case 'cards':
        return (
          <JalonsCards
            filters={jalonFilters}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
      case 'kanban':
        return (
          <JalonsKanban
            filters={jalonFilters}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
      case 'gantt':
        return (
          <JalonsGantt
            filters={jalonFilters}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
      case 'pert':
        return (
          <JalonsPert
            filters={jalonFilters}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Jalons</h2>
          <p className="text-sm text-primary-500">
            Suivez les étapes clés du projet
          </p>
        </div>

        {/* Boutons Excel Import/Export */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          {canImport && (
            <Tooltip content="Importer depuis Excel">
              <Button variant="outline" onClick={handleImportClick} disabled={importing}>
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Import...' : 'Importer'}
              </Button>
            </Tooltip>
          )}
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
          {canCreate && (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau jalon
            </Button>
          )}
        </div>
      </div>

      {/* Filters and view toggle */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border flex-shrink-0 mt-4">
        <Select
          value={jalonFilters.axe ?? ''}
          onChange={(e) =>
            setJalonFilters({
              axe: e.target.value
                ? (e.target.value as typeof jalonFilters.axe)
                : undefined,
            })
          }
          className="w-40"
        >
          <SelectOption value="">Tous les axes</SelectOption>
          {AXES.map((axe) => (
            <SelectOption key={axe} value={axe}>
              {AXE_LABELS[axe]}
            </SelectOption>
          ))}
        </Select>

        <Select
          value={jalonFilters.status ?? ''}
          onChange={(e) =>
            setJalonFilters({
              status: e.target.value
                ? (e.target.value as typeof jalonFilters.status)
                : undefined,
            })
          }
          className="w-36"
        >
          <SelectOption value="">Tous statuts</SelectOption>
          {JALON_STATUSES.map((status) => (
            <SelectOption key={status} value={status}>
              {JALON_STATUS_LABELS[status]}
            </SelectOption>
          ))}
        </Select>

        <Select
          value={jalonFilters.buildingCode ?? ''}
          onChange={(e) =>
            setJalonFilters({
              buildingCode: e.target.value
                ? (e.target.value as typeof jalonFilters.buildingCode)
                : undefined,
            })
          }
          className="w-44"
        >
          <SelectOption value="">Tous bâtiments</SelectOption>
          {BUILDING_CODES.map((code) => (
            <SelectOption key={code} value={code}>
              {BUILDING_CODE_LABELS[code]}
            </SelectOption>
          ))}
        </Select>

        <Select
          value={jalonFilters.projectPhase ?? ''}
          onChange={(e) =>
            setJalonFilters({
              projectPhase: e.target.value
                ? (e.target.value as typeof jalonFilters.projectPhase)
                : undefined,
            })
          }
          className="w-52"
        >
          <SelectOption value="">Toutes phases</SelectOption>
          {PROJECT_PHASES.map((phase) => (
            <SelectOption key={phase} value={phase}>
              {PROJECT_PHASE_LABELS[phase]}
            </SelectOption>
          ))}
        </Select>

        <div className="flex-1" />

        {/* View mode selector */}
        <div className="flex rounded-lg border bg-primary-50 p-1">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Tooltip key={mode.id} content={mode.label}>
                <Button
                  variant={viewMode === mode.id ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode.id)}
                  className="px-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{mode.label}</span>
                </Button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Content - flex-1 prend l'espace restant, le scroll est géré dans chaque vue */}
      <div className="flex-1 min-h-0 mt-4">
        {renderContent()}
      </div>

      {/* Formulaire v2.0 (création et édition) */}
      <JalonForm
        jalon={selectedJalon}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={() => {}}
      />
    </div>
  );
}
