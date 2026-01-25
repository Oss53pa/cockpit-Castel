import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  StudioReport,
  ContentTree,
  Section,
  ContentBlock,
  ReportStatus,
  AITabType,
  AIMessage,
  Insight,
  Recommendation,
  ReportDesignSettings,
  ReportComment,
  ReportActivity,
  ChartBlock,
  TableBlock,
  ParagraphBlock,
  HeadingBlock,
  CalloutBlock,
  ListBlock,
  KPICardBlock,
  DividerBlock,
  ImageBlock,
  QuoteBlock,
} from '@/types/reportStudio';

// Défini ici pour éviter les problèmes de dépendance circulaire
const DEFAULT_CONTENT_TREE: ContentTree = {
  sections: [],
};

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface ReportStudioState {
  // Rapport actif
  report: StudioReport | null;
  content: ContentTree;

  // État de l'éditeur
  editor: {
    selectedSectionId: string | null;
    selectedBlockId: string | null;
    isEditing: boolean;
    isDragging: boolean;
    zoomLevel: number;
    showGrid: boolean;
    showComments: boolean;
    mode: 'edit' | 'preview';
  };

  // Panneau IA
  aiPanel: {
    isOpen: boolean;
    activeTab: AITabType;
    isLoading: boolean;
    chatMessages: AIMessage[];
  };

  // Insights et recommandations
  insights: Insight[];
  recommendations: Recommendation[];

  // Commentaires
  comments: ReportComment[];

  // Activité
  activities: ReportActivity[];

  // UI
  ui: {
    isSaving: boolean;
    isGenerating: boolean;
    isPublishing: boolean;
    isExporting: boolean;
    hasUnsavedChanges: boolean;
    lastSavedAt: string | null;
    sidebarCollapsed: boolean;
    aiPanelCollapsed: boolean;
  };

  // Historique (Undo/Redo)
  history: {
    past: ContentTree[];
    future: ContentTree[];
    maxHistorySize: number;
  };

  // Modales
  modals: {
    export: boolean;
    chartEditor: boolean;
    tableEditor: boolean;
    designSettings: boolean;
    dataLibrary: boolean;
    sectionEditor: boolean;
    imageUpload: boolean;
    versionHistory: boolean;
  };

  // Bloc en cours d'édition pour les modales
  editingBlock: ContentBlock | null;
  editingSectionId: string | null;

  // ============================================================================
  // ACTIONS - REPORT
  // ============================================================================

  initReport: (report: StudioReport) => void;
  updateReport: (updates: Partial<StudioReport>) => void;
  setReportStatus: (status: ReportStatus) => void;
  clearReport: () => void;

  // ============================================================================
  // ACTIONS - SECTIONS
  // ============================================================================

  addSection: (section: Omit<Section, 'id'>, parentId?: string) => string;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  deleteSection: (sectionId: string) => void;
  moveSection: (sectionId: string, newIndex: number, newParentId?: string) => void;
  reorderSections: (activeId: string, overId: string) => void;
  duplicateSection: (sectionId: string) => string | null;
  toggleSectionCollapse: (sectionId: string) => void;
  toggleSectionLock: (sectionId: string) => void;
  selectSection: (sectionId: string | null) => void;

  // ============================================================================
  // ACTIONS - BLOCKS
  // ============================================================================

  addBlock: (sectionId: string, block: Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt'>, index?: number) => string;
  updateBlock: (sectionId: string, blockId: string, updates: Partial<ContentBlock>) => void;
  deleteBlock: (sectionId: string, blockId: string) => void;
  moveBlock: (sourceSectionId: string, blockId: string, targetSectionId: string, targetIndex: number) => void;
  duplicateBlock: (sectionId: string, blockId: string) => string;
  selectBlock: (blockId: string | null) => void;

  // ============================================================================
  // ACTIONS - BLOCK CREATION HELPERS
  // ============================================================================

  createParagraphBlock: (sectionId: string, content?: string) => string;
  createHeadingBlock: (sectionId: string, content: string, level: 1 | 2 | 3 | 4 | 5 | 6) => string;
  createChartBlock: (sectionId: string, chartData: Partial<ChartBlock>) => string;
  createTableBlock: (sectionId: string, tableData: Partial<TableBlock>) => string;
  createCalloutBlock: (sectionId: string, variant: CalloutBlock['variant'], content: string, title?: string) => string;
  createListBlock: (sectionId: string, listType: 'bullet' | 'numbered', items: string[]) => string;
  createKPICardBlock: (sectionId: string, kpiData: Partial<KPICardBlock>) => string;
  createDividerBlock: (sectionId: string, style?: 'solid' | 'dashed' | 'dotted') => string;
  createImageBlock: (sectionId: string, src: string, alt: string, caption?: string) => string;
  createQuoteBlock: (sectionId: string, content: string, author?: string, source?: string) => string;
  createPageBreakBlock: (sectionId: string) => string;

  // ============================================================================
  // ACTIONS - EDITOR
  // ============================================================================

  setEditorMode: (mode: 'edit' | 'preview') => void;
  setZoomLevel: (level: number) => void;
  toggleGrid: () => void;
  toggleComments: () => void;
  setIsDragging: (isDragging: boolean) => void;

  // ============================================================================
  // ACTIONS - AI PANEL
  // ============================================================================

  toggleAIPanel: () => void;
  setAIPanelTab: (tab: AITabType) => void;
  addChatMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  setAILoading: (isLoading: boolean) => void;
  setInsights: (insights: Insight[]) => void;
  setRecommendations: (recommendations: Recommendation[]) => void;

  // ============================================================================
  // ACTIONS - COMMENTS
  // ============================================================================

  addComment: (comment: Omit<ReportComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  resolveComment: (commentId: number, resolvedBy: string) => void;
  deleteComment: (commentId: number) => void;

  // ============================================================================
  // ACTIONS - ACTIVITY
  // ============================================================================

  addActivity: (activity: Omit<ReportActivity, 'id' | 'createdAt'>) => void;

  // ============================================================================
  // ACTIONS - UI
  // ============================================================================

  setSaving: (isSaving: boolean) => void;
  setGenerating: (isGenerating: boolean) => void;
  setPublishing: (isPublishing: boolean) => void;
  setExporting: (isExporting: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setLastSavedAt: (date: string | null) => void;
  toggleSidebar: () => void;
  toggleAIPanelCollapse: () => void;

  // ============================================================================
  // ACTIONS - MODALS
  // ============================================================================

  openModal: (modal: keyof ReportStudioState['modals']) => void;
  closeModal: (modal: keyof ReportStudioState['modals']) => void;
  closeAllModals: () => void;
  setEditingBlock: (block: ContentBlock | null, sectionId?: string | null) => void;

  // ============================================================================
  // ACTIONS - DESIGN
  // ============================================================================

  updateDesignSettings: (settings: Partial<ReportDesignSettings>) => void;

  // ============================================================================
  // ACTIONS - HISTORY (UNDO/REDO)
  // ============================================================================

  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  clearHistory: () => void;
  restoreVersion: (version: ContentTree) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const findSectionById = (sections: Section[], id: string): Section | null => {
  for (const section of sections) {
    if (section.id === id) return section;
    const found = findSectionById(section.children, id);
    if (found) return found;
  }
  return null;
};

const updateSectionInTree = (
  sections: Section[],
  sectionId: string,
  updater: (section: Section) => Section
): Section[] => {
  return sections.map((section) => {
    if (section.id === sectionId) {
      return updater(section);
    }
    return {
      ...section,
      children: updateSectionInTree(section.children, sectionId, updater),
    };
  });
};

const deleteSectionFromTree = (sections: Section[], sectionId: string): Section[] => {
  return sections
    .filter((section) => section.id !== sectionId)
    .map((section) => ({
      ...section,
      children: deleteSectionFromTree(section.children, sectionId),
    }));
};

const now = () => new Date().toISOString();

// ============================================================================
// STORE
// ============================================================================

export const useReportStudioStore = create<ReportStudioState>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // INITIAL STATE
      // ========================================================================

      report: null,
      content: DEFAULT_CONTENT_TREE,

      editor: {
        selectedSectionId: null,
        selectedBlockId: null,
        isEditing: false,
        isDragging: false,
        zoomLevel: 100,
        showGrid: false,
        showComments: true,
        mode: 'edit',
      },

      aiPanel: {
        isOpen: true,
        activeTab: 'resume',
        isLoading: false,
        chatMessages: [],
      },

      insights: [],
      recommendations: [],
      comments: [],
      activities: [],

      ui: {
        isSaving: false,
        isGenerating: false,
        isPublishing: false,
        isExporting: false,
        hasUnsavedChanges: false,
        lastSavedAt: null,
        sidebarCollapsed: false,
        aiPanelCollapsed: false,
      },

      history: {
        past: [],
        future: [],
        maxHistorySize: 50,
      },

      modals: {
        export: false,
        chartEditor: false,
        tableEditor: false,
        designSettings: false,
        dataLibrary: false,
        sectionEditor: false,
        imageUpload: false,
        versionHistory: false,
      },

      editingBlock: null,
      editingSectionId: null,

      // ========================================================================
      // REPORT ACTIONS
      // ========================================================================

      initReport: (report) => {
        set({
          report,
          content: report.contentTree || DEFAULT_CONTENT_TREE,
          editor: {
            selectedSectionId: null,
            selectedBlockId: null,
            isEditing: false,
            isDragging: false,
            zoomLevel: 100,
            showGrid: false,
            showComments: true,
            mode: 'edit',
          },
          ui: {
            ...get().ui,
            hasUnsavedChanges: false,
            lastSavedAt: null,
          },
          history: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        });
      },

      updateReport: (updates) => {
        set((state) => ({
          report: state.report ? { ...state.report, ...updates, updatedAt: now() } : null,
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));
      },

      setReportStatus: (status) => {
        set((state) => ({
          report: state.report ? { ...state.report, status, updatedAt: now() } : null,
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));
      },

      clearReport: () => {
        set({
          report: null,
          content: DEFAULT_CONTENT_TREE,
          editor: {
            selectedSectionId: null,
            selectedBlockId: null,
            isEditing: false,
            isDragging: false,
            zoomLevel: 100,
            showGrid: false,
            showComments: true,
            mode: 'edit',
          },
          history: { past: [], future: [], maxHistorySize: 50 },
        });
      },

      // ========================================================================
      // SECTION ACTIONS
      // ========================================================================

      addSection: (sectionData, parentId) => {
        const id = uuidv4();
        const newSection: Section = {
          ...sectionData,
          id,
          children: sectionData.children || [],
          blocks: sectionData.blocks || [],
        };

        get().saveToHistory();

        set((state) => {
          if (parentId) {
            return {
              content: {
                sections: updateSectionInTree(state.content.sections, parentId, (parent) => ({
                  ...parent,
                  children: [...parent.children, newSection],
                })),
              },
              ui: { ...state.ui, hasUnsavedChanges: true },
            };
          }
          return {
            content: {
              sections: [...state.content.sections, newSection],
            },
            ui: { ...state.ui, hasUnsavedChanges: true },
          };
        });

        return id;
      },

      updateSection: (sectionId, updates) => {
        get().saveToHistory();
        set((state) => ({
          content: {
            sections: updateSectionInTree(state.content.sections, sectionId, (section) => ({
              ...section,
              ...updates,
            })),
          },
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));
      },

      deleteSection: (sectionId) => {
        get().saveToHistory();
        set((state) => ({
          content: {
            sections: deleteSectionFromTree(state.content.sections, sectionId),
          },
          editor: {
            ...state.editor,
            selectedSectionId: state.editor.selectedSectionId === sectionId ? null : state.editor.selectedSectionId,
          },
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));
      },

      moveSection: (sectionId, newIndex, newParentId) => {
        get().saveToHistory();
        set((state) => {
          // Remove section from current location
          let sectionToMove: Section | null = null;
          const sectionsWithoutMoved = deleteSectionFromTree(state.content.sections, sectionId);

          // Find the section to move
          sectionToMove = findSectionById(state.content.sections, sectionId);

          if (!sectionToMove) return state;

          // Insert at new location
          if (newParentId) {
            return {
              content: {
                sections: updateSectionInTree(sectionsWithoutMoved, newParentId, (parent) => {
                  const newChildren = [...parent.children];
                  newChildren.splice(newIndex, 0, sectionToMove!);
                  return { ...parent, children: newChildren };
                }),
              },
              ui: { ...state.ui, hasUnsavedChanges: true },
            };
          }

          const newSections = [...sectionsWithoutMoved];
          newSections.splice(newIndex, 0, sectionToMove);
          return {
            content: { sections: newSections },
            ui: { ...state.ui, hasUnsavedChanges: true },
          };
        });
      },

      reorderSections: (activeId, overId) => {
        get().saveToHistory();
        set((state) => {
          const sections = [...state.content.sections];
          const activeIndex = sections.findIndex((s) => s.id === activeId);
          const overIndex = sections.findIndex((s) => s.id === overId);

          if (activeIndex === -1 || overIndex === -1) return state;

          // Swap the sections
          const [movedSection] = sections.splice(activeIndex, 1);
          sections.splice(overIndex, 0, movedSection);

          return {
            content: { sections },
            ui: { ...state.ui, hasUnsavedChanges: true },
          };
        });
      },

      duplicateSection: (sectionId) => {
        const state = get();
        const section = findSectionById(state.content.sections, sectionId);
        if (!section) return null;

        const duplicateWithNewIds = (sec: Section): Section => ({
          ...sec,
          id: uuidv4(),
          title: `${sec.title} (copie)`,
          blocks: sec.blocks.map((block) => ({
            ...block,
            id: uuidv4(),
            createdAt: now(),
            updatedAt: now(),
          })),
          children: sec.children.map(duplicateWithNewIds),
        });

        const newSection = duplicateWithNewIds(section);

        get().saveToHistory();
        set((state) => {
          const sectionIndex = state.content.sections.findIndex((s) => s.id === sectionId);
          const newSections = [...state.content.sections];
          newSections.splice(sectionIndex + 1, 0, newSection);

          return {
            content: { sections: newSections },
            ui: { ...state.ui, hasUnsavedChanges: true },
          };
        });

        return newSection.id;
      },

      toggleSectionCollapse: (sectionId) => {
        set((state) => ({
          content: {
            sections: updateSectionInTree(state.content.sections, sectionId, (section) => ({
              ...section,
              isCollapsed: !section.isCollapsed,
            })),
          },
        }));
      },

      toggleSectionLock: (sectionId) => {
        get().saveToHistory();
        set((state) => ({
          content: {
            sections: updateSectionInTree(state.content.sections, sectionId, (section) => ({
              ...section,
              isLocked: !section.isLocked,
            })),
          },
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));
      },

      selectSection: (sectionId) => {
        set((state) => ({
          editor: {
            ...state.editor,
            selectedSectionId: sectionId,
            selectedBlockId: null,
          },
        }));
      },

      // ========================================================================
      // BLOCK ACTIONS
      // ========================================================================

      addBlock: (sectionId, blockData, index) => {
        const id = uuidv4();
        const timestamp = now();
        const newBlock: ContentBlock = {
          ...blockData,
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
        } as ContentBlock;

        get().saveToHistory();

        set((state) => ({
          content: {
            sections: updateSectionInTree(state.content.sections, sectionId, (section) => {
              const newBlocks = [...section.blocks];
              if (index !== undefined) {
                newBlocks.splice(index, 0, newBlock);
              } else {
                newBlocks.push(newBlock);
              }
              return { ...section, blocks: newBlocks, status: 'edited' as const };
            }),
          },
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));

        return id;
      },

      updateBlock: (sectionId, blockId, updates) => {
        get().saveToHistory();
        set((state) => ({
          content: {
            sections: updateSectionInTree(state.content.sections, sectionId, (section) => ({
              ...section,
              blocks: section.blocks.map((block) =>
                block.id === blockId
                  ? { ...block, ...updates, updatedAt: now() }
                  : block
              ) as ContentBlock[],
              status: 'edited' as const,
            })),
          },
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));
      },

      deleteBlock: (sectionId, blockId) => {
        get().saveToHistory();
        set((state) => ({
          content: {
            sections: updateSectionInTree(state.content.sections, sectionId, (section) => ({
              ...section,
              blocks: section.blocks.filter((block) => block.id !== blockId),
            })),
          },
          editor: {
            ...state.editor,
            selectedBlockId: state.editor.selectedBlockId === blockId ? null : state.editor.selectedBlockId,
          },
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));
      },

      moveBlock: (sourceSectionId, blockId, targetSectionId, targetIndex) => {
        get().saveToHistory();
        set((state) => {
          const sourceSection = findSectionById(state.content.sections, sourceSectionId);
          if (!sourceSection) return state;

          const blockToMove = sourceSection.blocks.find((b) => b.id === blockId);
          if (!blockToMove) return state;

          // Remove from source
          let newSections = updateSectionInTree(state.content.sections, sourceSectionId, (section) => ({
            ...section,
            blocks: section.blocks.filter((b) => b.id !== blockId),
          }));

          // Add to target
          newSections = updateSectionInTree(newSections, targetSectionId, (section) => {
            const newBlocks = [...section.blocks];
            newBlocks.splice(targetIndex, 0, blockToMove);
            return { ...section, blocks: newBlocks };
          });

          return {
            content: { sections: newSections },
            ui: { ...state.ui, hasUnsavedChanges: true },
          };
        });
      },

      duplicateBlock: (sectionId, blockId) => {
        const state = get();
        const section = findSectionById(state.content.sections, sectionId);
        if (!section) return '';

        const blockToDuplicate = section.blocks.find((b) => b.id === blockId);
        if (!blockToDuplicate) return '';

        const blockIndex = section.blocks.findIndex((b) => b.id === blockId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...blockWithoutMeta } = blockToDuplicate;

        return get().addBlock(sectionId, blockWithoutMeta as Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt'>, blockIndex + 1);
      },

      selectBlock: (blockId) => {
        set((state) => ({
          editor: {
            ...state.editor,
            selectedBlockId: blockId,
          },
        }));
      },

      // ========================================================================
      // BLOCK CREATION HELPERS
      // ========================================================================

      createParagraphBlock: (sectionId, content = '') => {
        return get().addBlock(sectionId, {
          type: 'paragraph',
          content,
          formatting: { alignment: 'left' },
        } as Omit<ParagraphBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createHeadingBlock: (sectionId, content, level) => {
        return get().addBlock(sectionId, {
          type: 'heading',
          content,
          level,
        } as Omit<HeadingBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createChartBlock: (sectionId, chartData) => {
        return get().addBlock(sectionId, {
          type: 'chart',
          chartType: chartData.chartType || 'bar',
          title: chartData.title || 'Nouveau graphique',
          subtitle: chartData.subtitle,
          data: chartData.data || { labels: [], datasets: [] },
          config: chartData.config || { showLegend: true, legendPosition: 'top' },
          sourceTemplateId: chartData.sourceTemplateId,
        } as Omit<ChartBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createTableBlock: (sectionId, tableData) => {
        return get().addBlock(sectionId, {
          type: 'table',
          title: tableData.title,
          headers: tableData.headers || [],
          rows: tableData.rows || [],
          config: tableData.config || { striped: true, bordered: true },
          sourceTemplateId: tableData.sourceTemplateId,
        } as Omit<TableBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createCalloutBlock: (sectionId, variant, content, title) => {
        return get().addBlock(sectionId, {
          type: 'callout',
          variant,
          content,
          title,
        } as Omit<CalloutBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createListBlock: (sectionId, listType, items) => {
        return get().addBlock(sectionId, {
          type: 'list',
          listType,
          items: items.map((content) => ({ id: uuidv4(), content })),
        } as Omit<ListBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createKPICardBlock: (sectionId, kpiData) => {
        return get().addBlock(sectionId, {
          type: 'kpi_card',
          label: kpiData.label || 'KPI',
          value: kpiData.value || 0,
          unit: kpiData.unit,
          format: kpiData.format || 'number',
          variation: kpiData.variation,
          sparklineData: kpiData.sparklineData,
          targetValue: kpiData.targetValue,
          thresholds: kpiData.thresholds,
        } as Omit<KPICardBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createDividerBlock: (sectionId, style = 'solid') => {
        return get().addBlock(sectionId, {
          type: 'divider',
          style,
        } as Omit<DividerBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createImageBlock: (sectionId, src, alt, caption) => {
        return get().addBlock(sectionId, {
          type: 'image',
          src,
          alt,
          caption,
          alignment: 'center',
        } as Omit<ImageBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createQuoteBlock: (sectionId, content, author, source) => {
        return get().addBlock(sectionId, {
          type: 'quote',
          content,
          author,
          source,
        } as Omit<QuoteBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      createPageBreakBlock: (sectionId) => {
        return get().addBlock(sectionId, {
          type: 'pagebreak',
        } as Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt'>);
      },

      // ========================================================================
      // EDITOR ACTIONS
      // ========================================================================

      setEditorMode: (mode) => {
        set((state) => ({
          editor: { ...state.editor, mode },
        }));
      },

      setZoomLevel: (level) => {
        set((state) => ({
          editor: { ...state.editor, zoomLevel: Math.min(200, Math.max(50, level)) },
        }));
      },

      toggleGrid: () => {
        set((state) => ({
          editor: { ...state.editor, showGrid: !state.editor.showGrid },
        }));
      },

      toggleComments: () => {
        set((state) => ({
          editor: { ...state.editor, showComments: !state.editor.showComments },
        }));
      },

      setIsDragging: (isDragging) => {
        set((state) => ({
          editor: { ...state.editor, isDragging },
        }));
      },

      // ========================================================================
      // AI PANEL ACTIONS
      // ========================================================================

      toggleAIPanel: () => {
        set((state) => ({
          aiPanel: { ...state.aiPanel, isOpen: !state.aiPanel.isOpen },
        }));
      },

      setAIPanelTab: (tab) => {
        set((state) => ({
          aiPanel: { ...state.aiPanel, activeTab: tab },
        }));
      },

      addChatMessage: (message) => {
        set((state) => ({
          aiPanel: {
            ...state.aiPanel,
            chatMessages: [
              ...state.aiPanel.chatMessages,
              { ...message, id: uuidv4(), timestamp: now() },
            ],
          },
        }));
      },

      clearChat: () => {
        set((state) => ({
          aiPanel: { ...state.aiPanel, chatMessages: [] },
        }));
      },

      setAILoading: (isLoading) => {
        set((state) => ({
          aiPanel: { ...state.aiPanel, isLoading },
        }));
      },

      setInsights: (insights) => {
        set({ insights });
      },

      setRecommendations: (recommendations) => {
        set({ recommendations });
      },

      // ========================================================================
      // COMMENTS ACTIONS
      // ========================================================================

      addComment: (comment) => {
        set((state) => ({
          comments: [
            ...state.comments,
            {
              ...comment,
              id: Date.now(),
              createdAt: now(),
              updatedAt: now(),
            },
          ],
        }));
      },

      resolveComment: (commentId, resolvedBy) => {
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId
              ? { ...c, isResolved: true, resolvedAt: now(), resolvedBy, updatedAt: now() }
              : c
          ),
        }));
      },

      deleteComment: (commentId) => {
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== commentId),
        }));
      },

      // ========================================================================
      // ACTIVITY ACTIONS
      // ========================================================================

      addActivity: (activity) => {
        set((state) => ({
          activities: [
            { ...activity, id: Date.now(), createdAt: now() },
            ...state.activities,
          ].slice(0, 100), // Keep last 100 activities
        }));
      },

      // ========================================================================
      // UI ACTIONS
      // ========================================================================

      setSaving: (isSaving) => {
        set((state) => ({
          ui: { ...state.ui, isSaving },
        }));
      },

      setGenerating: (isGenerating) => {
        set((state) => ({
          ui: { ...state.ui, isGenerating },
        }));
      },

      setPublishing: (isPublishing) => {
        set((state) => ({
          ui: { ...state.ui, isPublishing },
        }));
      },

      setExporting: (isExporting) => {
        set((state) => ({
          ui: { ...state.ui, isExporting },
        }));
      },

      setHasUnsavedChanges: (hasChanges) => {
        set((state) => ({
          ui: { ...state.ui, hasUnsavedChanges: hasChanges },
        }));
      },

      setLastSavedAt: (date) => {
        set((state) => ({
          ui: { ...state.ui, lastSavedAt: date, hasUnsavedChanges: false },
        }));
      },

      toggleSidebar: () => {
        set((state) => ({
          ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
        }));
      },

      toggleAIPanelCollapse: () => {
        set((state) => ({
          ui: { ...state.ui, aiPanelCollapsed: !state.ui.aiPanelCollapsed },
        }));
      },

      // ========================================================================
      // MODAL ACTIONS
      // ========================================================================

      openModal: (modal) => {
        set((state) => ({
          modals: { ...state.modals, [modal]: true },
        }));
      },

      closeModal: (modal) => {
        set((state) => ({
          modals: { ...state.modals, [modal]: false },
          editingBlock: modal === 'chartEditor' || modal === 'tableEditor' ? null : state.editingBlock,
          editingSectionId: modal === 'chartEditor' || modal === 'tableEditor' ? null : state.editingSectionId,
        }));
      },

      closeAllModals: () => {
        set(() => ({
          modals: {
            export: false,
            chartEditor: false,
            tableEditor: false,
            designSettings: false,
            dataLibrary: false,
            sectionEditor: false,
            imageUpload: false,
            versionHistory: false,
          },
          editingBlock: null,
          editingSectionId: null,
        }));
      },

      setEditingBlock: (block, sectionId = null) => {
        set({
          editingBlock: block,
          editingSectionId: sectionId,
        });
      },

      // ========================================================================
      // DESIGN ACTIONS
      // ========================================================================

      updateDesignSettings: (settings) => {
        get().saveToHistory();
        set((state) => ({
          report: state.report
            ? {
                ...state.report,
                designSettings: {
                  ...state.report.designSettings,
                  ...settings,
                  page: { ...state.report.designSettings.page, ...settings.page },
                  typography: { ...state.report.designSettings.typography, ...settings.typography },
                  colors: { ...state.report.designSettings.colors, ...settings.colors },
                  branding: { ...state.report.designSettings.branding, ...settings.branding },
                  coverPage: { ...state.report.designSettings.coverPage, ...settings.coverPage },
                  tableOfContents: { ...state.report.designSettings.tableOfContents, ...settings.tableOfContents },
                },
                updatedAt: now(),
              }
            : null,
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));
      },

      // ========================================================================
      // HISTORY ACTIONS (UNDO/REDO)
      // ========================================================================

      undo: () => {
        set((state) => {
          if (state.history.past.length === 0) return state;

          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);

          return {
            content: previous,
            history: {
              ...state.history,
              past: newPast,
              future: [state.content, ...state.history.future],
            },
            ui: { ...state.ui, hasUnsavedChanges: true },
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.history.future.length === 0) return state;

          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);

          return {
            content: next,
            history: {
              ...state.history,
              past: [...state.history.past, state.content],
              future: newFuture,
            },
            ui: { ...state.ui, hasUnsavedChanges: true },
          };
        });
      },

      saveToHistory: () => {
        set((state) => ({
          history: {
            ...state.history,
            past: [...state.history.past, state.content].slice(-state.history.maxHistorySize),
            future: [],
          },
        }));
      },

      clearHistory: () => {
        set((state) => ({
          history: { ...state.history, past: [], future: [] },
        }));
      },

      restoreVersion: (version) => {
        set((state) => ({
          content: version,
          history: {
            ...state.history,
            past: [...state.history.past, state.content],
            future: [],
          },
          ui: { ...state.ui, hasUnsavedChanges: true },
        }));
      },
    }),
    {
      name: 'cockpit-report-studio-store',
      partialize: (state) => ({
        ui: {
          sidebarCollapsed: state.ui.sidebarCollapsed,
          aiPanelCollapsed: state.ui.aiPanelCollapsed,
        },
        editor: {
          zoomLevel: state.editor.zoomLevel,
          showGrid: state.editor.showGrid,
          showComments: state.editor.showComments,
        },
      }),
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectCurrentSection = (state: ReportStudioState): Section | null => {
  if (!state.editor.selectedSectionId) return null;
  return findSectionById(state.content.sections, state.editor.selectedSectionId);
};

export const selectCurrentBlock = (state: ReportStudioState): ContentBlock | null => {
  if (!state.editor.selectedBlockId || !state.editor.selectedSectionId) return null;
  const section = findSectionById(state.content.sections, state.editor.selectedSectionId);
  if (!section) return null;
  return section.blocks.find((b) => b.id === state.editor.selectedBlockId) || null;
};

export const selectSectionComments = (state: ReportStudioState, sectionId: string): ReportComment[] => {
  return state.comments.filter((c) => c.sectionId === sectionId);
};

export const selectBlockComments = (state: ReportStudioState, blockId: string): ReportComment[] => {
  return state.comments.filter((c) => c.blockId === blockId);
};

export const selectCanUndo = (state: ReportStudioState): boolean => {
  return state.history.past.length > 0;
};

export const selectCanRedo = (state: ReportStudioState): boolean => {
  return state.history.future.length > 0;
};
