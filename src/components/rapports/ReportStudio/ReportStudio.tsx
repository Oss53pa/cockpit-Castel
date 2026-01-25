import React, { useEffect, useCallback, useState } from 'react';
import {
  Save,
  Download,
  Palette,
  Eye,
  Undo2,
  Redo2,
  MoreHorizontal,
  Clock,
  CheckCircle,
  Send,
  Archive,
  Loader2,
  ArrowLeft,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useReportStudioStore, selectCanUndo, selectCanRedo } from '@/stores/reportStudioStore';
import { NavigationPanel } from './NavigationPanel';
import { DocumentCanvas, type ViewMode } from './DocumentCanvas';
import { AIPanel } from './AIPanel';
import { FloatingToolbar } from './Toolbar/FloatingToolbar';
import { ExportModal, DataLibraryModal, DesignSettingsModal, VersionHistoryModal } from './Modals';
import type {
  StudioReport,
  BlockType,
  ChartTemplate,
  TableTemplate,
  ExportOptions,
  CalloutVariant,
} from '@/types/reportStudio';
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  DEFAULT_DESIGN_SETTINGS,
} from '@/types/reportStudio';
import {
  useReport,
  saveReportContent,
  updateReportStatus,
  exportReport,
} from '@/hooks/useReports';

interface ReportStudioProps {
  reportId: number;
  onClose?: () => void;
}

export function ReportStudio({
  reportId,
  onClose,
}: ReportStudioProps) {
  const report = useReport(reportId);
  const store = useReportStudioStore();
  const canUndo = useReportStudioStore(selectCanUndo);
  const canRedo = useReportStudioStore(selectCanRedo);
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  // Initialize report in store when loaded
  useEffect(() => {
    if (report) {
      store.initReport(report);
    }
    return () => {
      store.clearReport();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              store.redo();
            } else {
              store.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            store.redo();
            break;
        }
      }
      if (e.key === 'Delete' && store.editor.selectedBlockId) {
        e.preventDefault();
        if (store.editingSectionId) {
          store.deleteBlock(store.editingSectionId, store.editor.selectedBlockId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.editor.selectedBlockId, store.editingSectionId]);

  // Auto-save
  useEffect(() => {
    if (!store.ui.hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.ui.hasUnsavedChanges, store.content]);

  const handleSave = useCallback(async () => {
    if (!store.report || !store.report.id) return;

    store.setSaving(true);
    try {
      await saveReportContent(store.report.id, store.content);
      store.setLastSavedAt(new Date().toISOString());
      store.addActivity({
        reportId: store.report.id,
        type: 'edited',
        description: 'Rapport sauvegardé',
        userId: 1,
        userName: 'Utilisateur',
      });
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      store.setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.report, store.content]);

  const handleExport = useCallback(async (options: ExportOptions) => {
    if (!store.report) return;

    store.setExporting(true);
    try {
      const reportToExport: StudioReport = {
        ...store.report,
        contentTree: store.content,
      };
      await exportReport(reportToExport, options);
      store.addActivity({
        reportId: store.report.id!,
        type: 'exported',
        description: `Rapport exporté en ${options.format.toUpperCase()}`,
        userId: 1,
        userName: 'Utilisateur',
      });
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      store.setExporting(false);
      store.closeModal('export');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.report, store.content]);

  const handleAddSection = useCallback((icon?: string) => {
    console.log('handleAddSection called with icon:', icon);
    try {
      const newSectionId = store.addSection({
        type: 'section',
        title: 'Nouvelle section',
        icon: icon || 'FileText',
        level: 1,
        blocks: [],
        children: [],
        status: 'manual',
        isLocked: false,
      });
      console.log('Section created with id:', newSectionId);
      store.selectSection(newSectionId);
    } catch (error) {
      console.error('Error adding section:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddBlock = useCallback((
    sectionId: string,
    type: BlockType,
    options?: Record<string, unknown>
  ) => {
    switch (type) {
      case 'paragraph':
        store.createParagraphBlock(sectionId);
        break;
      case 'heading':
        store.createHeadingBlock(sectionId, '', (options?.level as 1 | 2 | 3 | 4 | 5 | 6) || 2);
        break;
      case 'chart':
        store.createChartBlock(sectionId, {});
        break;
      case 'table':
        store.createTableBlock(sectionId, {});
        break;
      case 'callout':
        store.createCalloutBlock(sectionId, (options?.variant as CalloutVariant) || 'info', '');
        break;
      case 'list':
        store.createListBlock(sectionId, (options?.listType as 'bullet' | 'numbered') || 'bullet', ['']);
        break;
      case 'kpi_card':
        store.createKPICardBlock(sectionId, { label: 'Nouveau KPI', value: 0 });
        break;
      case 'divider':
        store.createDividerBlock(sectionId);
        break;
      case 'image':
        store.createImageBlock(sectionId, '', 'Image');
        break;
      case 'quote':
        store.createQuoteBlock(sectionId, '');
        break;
      case 'pagebreak':
        store.createPageBreakBlock(sectionId);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInsertChart = useCallback((template: ChartTemplate) => {
    if (!store.editor.selectedSectionId) return;

    store.createChartBlock(store.editor.selectedSectionId, {
      chartType: template.chartType,
      title: template.config.title,
      subtitle: template.config.subtitle,
      data: template.data,
      config: {
        showLegend: template.config.legend?.show,
        legendPosition: template.config.legend?.position,
        xAxisLabel: template.config.xAxis?.label,
        yAxisLabel: template.config.yAxis?.label,
        showGrid: template.config.showGrid,
        colors: template.config.colors,
      },
      sourceTemplateId: template.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.editor.selectedSectionId]);

  const handleInsertTable = useCallback((template: TableTemplate) => {
    if (!store.editor.selectedSectionId) return;

    store.createTableBlock(store.editor.selectedSectionId, {
      title: template.name,
      headers: template.headers,
      rows: template.rows,
      config: template.config,
      sourceTemplateId: template.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.editor.selectedSectionId]);

  const handleMoveBlock = useCallback((sectionId: string, blockId: string, direction: 'up' | 'down') => {
    const section = store.content.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const blockIndex = section.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= section.blocks.length) return;

    store.moveBlock(sectionId, blockId, sectionId, newIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.content.sections]);

  if (!store.report) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux rapports
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {store.report.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${REPORT_STATUS_COLORS[store.report.status]}20`,
                  color: REPORT_STATUS_COLORS[store.report.status],
                }}
              >
                {REPORT_STATUS_LABELS[store.report.status]}
              </Badge>
              {store.ui.lastSavedAt && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Sauvegardé à {new Date(store.ui.lastSavedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {store.ui.hasUnsavedChanges && (
                <span className="text-xs text-yellow-600">
                  Modifications non sauvegardées
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => store.undo()}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
              title="Annuler (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => store.redo()}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
              title="Rétablir (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Design settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => store.openModal('designSettings')}
          >
            <Palette className="h-4 w-4 mr-2" />
            Design
          </Button>

          {/* Save */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={store.ui.isSaving || !store.ui.hasUnsavedChanges}
          >
            {store.ui.isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => store.openModal('export')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>

          {/* Version History */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.openModal('versionHistory')}
            className="h-8 w-8 p-0"
            title="Historique des versions"
          >
            <History className="h-4 w-4" />
          </Button>

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => store.openModal('versionHistory')}>
                <History className="h-4 w-4 mr-2" />
                Historique des versions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => store.setReportStatus('review')}>
                <Eye className="h-4 w-4 mr-2" />
                Soumettre pour revue
              </DropdownMenuItem>
              {store.report.status === 'review' && (
                <DropdownMenuItem onClick={() => store.setReportStatus('approved')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </DropdownMenuItem>
              )}
              {store.report.status === 'approved' && (
                <DropdownMenuItem onClick={() => {
                  if (store.report?.id) {
                    updateReportStatus(store.report.id, 'published');
                  }
                }}>
                  <Send className="h-4 w-4 mr-2" />
                  Publier
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => store.setReportStatus('archived')}>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation panel */}
        <NavigationPanel
          sections={store.content.sections}
          selectedSectionId={store.editor.selectedSectionId}
          isCollapsed={store.ui.sidebarCollapsed}
          onToggleCollapse={() => store.toggleSidebar()}
          onSelectSection={(id) => store.selectSection(id)}
          onToggleSectionCollapse={(id) => store.toggleSectionCollapse(id)}
          onToggleSectionLock={(id) => store.toggleSectionLock(id)}
          onEditSection={(id) => {
            store.selectSection(id);
            store.openModal('sectionEditor');
          }}
          onDeleteSection={(id) => store.deleteSection(id)}
          onAddSection={handleAddSection}
          onReorderSections={(activeId, overId) => store.reorderSections(activeId, overId)}
          onDuplicateSection={(id) => store.duplicateSection(id)}
          onUpdateSectionTitle={(id, newTitle) => store.updateSection(id, { title: newTitle })}
        />

        {/* Document canvas */}
        <DocumentCanvas
          sections={store.content.sections}
          selectedSectionId={store.editor.selectedSectionId}
          selectedBlockId={store.editor.selectedBlockId}
          isEditing={store.editor.isEditing}
          mode={store.editor.mode}
          zoomLevel={store.editor.zoomLevel}
          showGrid={store.editor.showGrid}
          showComments={store.editor.showComments}
          designSettings={store.report.designSettings || DEFAULT_DESIGN_SETTINGS}
          onSelectSection={(id) => store.selectSection(id)}
          onSelectBlock={(sectionId, blockId) => {
            store.selectSection(sectionId);
            store.selectBlock(blockId);
            store.setEditingBlock(null, sectionId);
          }}
          onUpdateBlock={(sectionId, blockId, updates) =>
            store.updateBlock(sectionId, blockId, updates)
          }
          onEditBlock={(sectionId, block) => {
            store.setEditingBlock(block, sectionId);
            if (block.type === 'chart') {
              store.openModal('chartEditor');
            } else if (block.type === 'table') {
              store.openModal('tableEditor');
            }
          }}
          onDeleteBlock={(sectionId, blockId) =>
            store.deleteBlock(sectionId, blockId)
          }
          onDuplicateBlock={(sectionId, blockId) =>
            store.duplicateBlock(sectionId, blockId)
          }
          onMoveBlock={handleMoveBlock}
          onAddBlock={(sectionId, type) =>
            handleAddBlock(sectionId, type as BlockType)
          }
          onSetMode={(mode) => store.setEditorMode(mode)}
          onSetZoom={(zoom) => store.setZoomLevel(zoom)}
          onToggleGrid={() => store.toggleGrid()}
          viewMode={viewMode}
          onSetViewMode={setViewMode}
        />

        {/* AI Panel */}
        <AIPanel
          isOpen={store.aiPanel.isOpen}
          activeTab={store.aiPanel.activeTab}
          isLoading={store.aiPanel.isLoading}
          chatMessages={store.aiPanel.chatMessages}
          insights={store.insights}
          recommendations={store.recommendations}
          comments={store.comments}
          activities={store.activities}
          onToggle={() => store.toggleAIPanel()}
          onSetTab={(tab) => store.setAIPanelTab(tab)}
          onSendMessage={(message) => {
            store.addChatMessage({ role: 'user', content: message });
            // Simulate AI response
            store.setAILoading(true);
            setTimeout(() => {
              store.addChatMessage({
                role: 'assistant',
                content: `Je comprends votre question concernant "${message}". Voici mon analyse basée sur les données du rapport...`,
              });
              store.setAILoading(false);
            }, 1500);
          }}
          onResolveComment={(commentId) =>
            store.resolveComment(commentId, 'Utilisateur')
          }
        />
      </div>

      {/* Floating toolbar */}
      <FloatingToolbar
        isVisible={store.editor.mode === 'edit' && !!store.editor.selectedSectionId}
        selectedBlockId={store.editor.selectedBlockId}
        canMoveUp={false}
        canMoveDown={false}
        onAddBlock={(type, options) => {
          if (store.editor.selectedSectionId) {
            handleAddBlock(store.editor.selectedSectionId, type, options);
          }
        }}
        onOpenDataLibrary={() => store.openModal('dataLibrary')}
        onDeleteBlock={() => {
          if (store.editor.selectedBlockId && store.editingSectionId) {
            store.deleteBlock(store.editingSectionId, store.editor.selectedBlockId);
          }
        }}
        onDuplicateBlock={() => {
          if (store.editor.selectedBlockId && store.editingSectionId) {
            store.duplicateBlock(store.editingSectionId, store.editor.selectedBlockId);
          }
        }}
        onMoveBlock={(direction) => {
          if (store.editor.selectedBlockId && store.editingSectionId) {
            handleMoveBlock(store.editingSectionId, store.editor.selectedBlockId, direction);
          }
        }}
        onGenerateWithAI={() => {
          store.setAIPanelTab('chat');
          if (!store.aiPanel.isOpen) {
            store.toggleAIPanel();
          }
        }}
      />

      {/* Modals */}
      <ExportModal
        isOpen={store.modals.export}
        isExporting={store.ui.isExporting}
        reportTitle={store.report.title}
        onClose={() => store.closeModal('export')}
        onExport={handleExport}
      />

      <DataLibraryModal
        isOpen={store.modals.dataLibrary}
        reportType={store.report.type}
        onClose={() => store.closeModal('dataLibrary')}
        onInsertChart={handleInsertChart}
        onInsertTable={handleInsertTable}
      />

      <DesignSettingsModal
        isOpen={store.modals.designSettings}
        settings={store.report.designSettings || DEFAULT_DESIGN_SETTINGS}
        onClose={() => store.closeModal('designSettings')}
        onSave={(settings) => store.updateDesignSettings(settings)}
      />

      <VersionHistoryModal
        isOpen={store.modals.versionHistory}
        onClose={() => store.closeModal('versionHistory')}
        currentContent={store.content}
        pastVersions={store.history.past}
        futureVersions={store.history.future}
        onRestoreVersion={(version) => store.restoreVersion(version)}
      />
    </div>
  );
}
