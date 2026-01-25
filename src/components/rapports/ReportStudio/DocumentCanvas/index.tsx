import React, { useRef, useState, useCallback } from 'react';
import { Eye, Edit, ZoomIn, ZoomOut, Grid, FileText, Columns2, StretchVertical, Maximize2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SectionRenderer } from './SectionRenderer';
import { SlashCommandMenu, useSlashCommands } from '../SlashCommandMenu';
import type { SlashCommand } from '../SlashCommandMenu';
import type { Section, ContentBlock, ReportDesignSettings } from '@/types/reportStudio';

export type ViewMode = 'single' | 'double' | 'continuous';

interface DocumentCanvasProps {
  sections: Section[];
  selectedSectionId: string | null;
  selectedBlockId: string | null;
  isEditing: boolean;
  mode: 'edit' | 'preview';
  zoomLevel: number;
  showGrid: boolean;
  showComments: boolean;
  designSettings: ReportDesignSettings;
  onSelectSection: (sectionId: string) => void;
  onSelectBlock: (sectionId: string, blockId: string) => void;
  onUpdateBlock: (sectionId: string, blockId: string, updates: Partial<ContentBlock>) => void;
  onEditBlock: (sectionId: string, block: ContentBlock) => void;
  onDeleteBlock: (sectionId: string, blockId: string) => void;
  onDuplicateBlock: (sectionId: string, blockId: string) => void;
  onMoveBlock: (sectionId: string, blockId: string, direction: 'up' | 'down') => void;
  onAddBlock: (sectionId: string, type: string, index?: number, options?: Record<string, unknown>) => void;
  onEditSection?: (sectionId: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onToggleSectionLock?: (sectionId: string) => void;
  onSetMode: (mode: 'edit' | 'preview') => void;
  onSetZoom: (zoom: number) => void;
  onToggleGrid: () => void;
  viewMode?: ViewMode;
  onSetViewMode?: (mode: ViewMode) => void;
}

export function DocumentCanvas({
  sections,
  selectedSectionId,
  selectedBlockId,
  isEditing: _isEditing,
  mode,
  zoomLevel,
  showGrid,
  showComments,
  designSettings,
  onSelectSection,
  onSelectBlock,
  onUpdateBlock,
  onEditBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onAddBlock,
  onEditSection,
  onDuplicateSection,
  onDeleteSection,
  onToggleSectionLock,
  onSetMode,
  onSetZoom,
  onToggleGrid,
  viewMode = 'single',
  onSetViewMode,
}: DocumentCanvasProps) {
  // isEditing is provided by parent but mode is used instead for edit state
  void _isEditing;

  const canvasRef = useRef<HTMLDivElement>(null);

  // Slash command menu state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');

  // Handle slash command insertion
  const handleSlashInsert = useCallback(
    (type: string, options?: Record<string, unknown>) => {
      if (selectedSectionId) {
        onAddBlock(selectedSectionId, type, undefined, options);
      }
      setSlashMenuOpen(false);
      setSlashFilter('');
    },
    [selectedSectionId, onAddBlock]
  );

  // Initialize slash commands with handlers
  const {
    commands,
  } = useSlashCommands(handleSlashInsert);

  // Handle slash command selection
  const handleSlashSelect = useCallback((command: SlashCommand) => {
    command.action();
  }, []);

  // Close slash menu
  const handleCloseSlashMenu = useCallback(() => {
    setSlashMenuOpen(false);
    setSlashFilter('');
  }, []);

  // Calculate document dimensions based on page settings
  const getPageDimensions = () => {
    const { format, orientation } = designSettings.page;
    const dimensions = {
      A4: { width: 210, height: 297 },
      Letter: { width: 216, height: 279 },
      A3: { width: 297, height: 420 },
    };

    const dim = dimensions[format];
    return orientation === 'landscape'
      ? { width: dim.height, height: dim.width }
      : dim;
  };

  const pageDimensions = getPageDimensions();
  const scale = zoomLevel / 100;

  // Convert mm to pixels (assuming 96 DPI)
  const mmToPx = (mm: number) => (mm / 25.4) * 96;

  const documentWidth = mmToPx(pageDimensions.width) * scale;
  const documentMinHeight = mmToPx(pageDimensions.height) * scale;

  const getMarginPx = () => {
    const marginSizes = {
      normal: 25,
      narrow: 12,
      wide: 38,
    };
    return mmToPx(marginSizes[designSettings.page.margins]) * scale;
  };

  const marginPx = getMarginPx();

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-100 via-gray-100 to-slate-50 overflow-hidden">
      {/* Modern Toolbar - Compact Design */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center justify-center px-2 py-1.5 bg-white border-b border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-0.5 p-0.5 bg-gray-50/80 rounded-lg">
            {/* Mode toggle - Compact */}
            <div className="flex items-center bg-white rounded border border-gray-200/60">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetMode('edit')}
                    className={cn(
                      "h-7 w-7 p-0 rounded-l rounded-r-none",
                      mode === 'edit' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Édition</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetMode('preview')}
                    className={cn(
                      "h-7 w-7 p-0 rounded-r rounded-l-none border-l border-gray-200/60",
                      mode === 'preview' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Aperçu</TooltipContent>
              </Tooltip>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200/60 mx-0.5" />

            {/* Page format - Compact badge */}
            <div className="hidden lg:flex items-center gap-1 h-7 px-2 bg-white rounded border border-gray-200/60 text-[10px]">
              <FileText className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-gray-600">{designSettings.page.format}</span>
              <span className="text-gray-400 uppercase">{designSettings.page.orientation === 'landscape' ? 'PAY' : 'POR'}</span>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200/60 mx-0.5" />

            {/* View mode selector - Compact icon group */}
            {onSetViewMode && (
              <div className="flex items-center bg-white rounded border border-gray-200/60">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetViewMode('single')}
                      className={cn(
                        "h-7 w-7 p-0 rounded-l rounded-r-none",
                        viewMode === 'single' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                      )}
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>Page simple</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetViewMode('double')}
                      className={cn(
                        "h-7 w-7 p-0 rounded-none border-x border-gray-200/60",
                        viewMode === 'double' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                      )}
                    >
                      <Columns2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>Double page</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetViewMode('continuous')}
                      className={cn(
                        "h-7 w-7 p-0 rounded-r rounded-l-none",
                        viewMode === 'continuous' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                      )}
                    >
                      <StretchVertical className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>Vue continue</TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Grid toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleGrid}
                  className={cn(
                    "h-7 w-7 p-0 rounded border",
                    showGrid ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400 border-gray-200/60 hover:text-gray-600'
                  )}
                >
                  <Grid className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>Grille</TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200/60 mx-0.5" />

            {/* Zoom controls - Compact */}
            <div className="flex items-center bg-white rounded border border-gray-200/60">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetZoom(Math.max(50, zoomLevel - 10))}
                    className="h-7 w-7 p-0 rounded-l rounded-r-none text-gray-400 hover:text-gray-600"
                    disabled={zoomLevel <= 50}
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Zoom -</TooltipContent>
              </Tooltip>

              <button
                onClick={() => onSetZoom(100)}
                className="h-7 px-1.5 text-[10px] font-semibold text-gray-600 hover:text-primary-600 tabular-nums border-x border-gray-200/60 min-w-[36px]"
              >
                {zoomLevel}%
              </button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetZoom(Math.min(200, zoomLevel + 10))}
                    className="h-7 w-7 p-0 rounded-r rounded-l-none text-gray-400 hover:text-gray-600"
                    disabled={zoomLevel >= 200}
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Zoom +</TooltipContent>
              </Tooltip>
            </div>

            {/* Quick zoom actions */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetZoom(100)}
                  className="h-7 w-7 p-0 rounded bg-white text-gray-400 hover:text-gray-600 border border-gray-200/60"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>100%</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetZoom(85)}
                  className="h-7 w-7 p-0 rounded bg-white text-gray-400 hover:text-gray-600 border border-gray-200/60"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>Ajuster</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      {/* Canvas area with improved styling */}
      <ScrollArea className="flex-1">
        <div
          ref={canvasRef}
          className={cn(
            'min-h-full py-10 px-8',
            viewMode === 'double' ? 'flex justify-center gap-10' : 'flex justify-center',
            viewMode === 'continuous' && 'flex-col items-center gap-8',
            showGrid && 'bg-[linear-gradient(to_right,rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:24px_24px]'
          )}
        >
          {viewMode === 'double' ? (
            // Double page view - Book-style spread
            <div className="flex gap-1 relative">
              {/* Book spine shadow */}
              <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-r from-gray-300/40 via-gray-400/30 to-gray-300/40 z-10 pointer-events-none" />

              {/* Left page */}
              <div className="relative group">
                <div
                  className="absolute -bottom-1 -left-1 h-2 bg-gray-300/50 rounded-bl-sm blur-sm"
                  style={{ width: documentWidth * 0.7 - 8 }}
                />
                <div
                  className="relative bg-white rounded-l-sm transition-all duration-300"
                  style={{
                    width: documentWidth * 0.7,
                    minHeight: documentMinHeight,
                    fontFamily: designSettings.typography.bodyFont,
                    fontSize: `${designSettings.typography.baseFontSize * scale * 0.7}px`,
                    boxShadow: '-4px 4px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div style={{ padding: marginPx * 0.7 }}>
                    {sections.length > 0 ? (
                      sections.slice(0, Math.ceil(sections.length / 2)).map((section) => (
                        <SectionRenderer
                          key={section.id}
                          section={section}
                          isSelected={selectedSectionId === section.id}
                          selectedBlockId={selectedBlockId}
                          isEditing={mode === 'edit'}
                          showComments={showComments}
                          onSelectSection={() => onSelectSection(section.id)}
                          onSelectBlock={(blockId) => onSelectBlock(section.id, blockId)}
                          onUpdateBlock={(blockId, updates) =>
                            onUpdateBlock(section.id, blockId, updates)
                          }
                          onEditBlock={(block) => onEditBlock(section.id, block)}
                          onDeleteBlock={(blockId) => onDeleteBlock(section.id, blockId)}
                          onDuplicateBlock={(blockId) => onDuplicateBlock(section.id, blockId)}
                          onEditSection={onEditSection ? () => onEditSection(section.id) : undefined}
                          onDuplicateSection={onDuplicateSection ? () => onDuplicateSection(section.id) : undefined}
                          onDeleteSection={onDeleteSection ? () => onDeleteSection(section.id) : undefined}
                          onToggleSectionLock={onToggleSectionLock ? () => onToggleSectionLock(section.id) : undefined}
                          onMoveBlock={(blockId, direction) =>
                            onMoveBlock(section.id, blockId, direction)
                          }
                          onAddBlock={(type, index) => onAddBlock(section.id, type, index)}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                        <div className="w-14 h-14 mb-4 rounded-xl bg-gray-100 flex items-center justify-center">
                          <FileText className="h-7 w-7 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Page 1</p>
                      </div>
                    )}
                  </div>
                  {/* Page number */}
                  <div className="absolute bottom-4 left-6 text-xs text-gray-400">1</div>
                </div>
              </div>

              {/* Right page */}
              <div className="relative group">
                <div
                  className="absolute -bottom-1 -right-1 h-2 bg-gray-300/50 rounded-br-sm blur-sm"
                  style={{ width: documentWidth * 0.7 - 8 }}
                />
                <div
                  className="relative bg-white rounded-r-sm transition-all duration-300"
                  style={{
                    width: documentWidth * 0.7,
                    minHeight: documentMinHeight,
                    fontFamily: designSettings.typography.bodyFont,
                    fontSize: `${designSettings.typography.baseFontSize * scale * 0.7}px`,
                    boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div style={{ padding: marginPx * 0.7 }}>
                    {sections.length > 1 ? (
                      sections.slice(Math.ceil(sections.length / 2)).map((section) => (
                        <SectionRenderer
                          key={section.id}
                          section={section}
                          isSelected={selectedSectionId === section.id}
                          selectedBlockId={selectedBlockId}
                          isEditing={mode === 'edit'}
                          showComments={showComments}
                          onSelectSection={() => onSelectSection(section.id)}
                          onSelectBlock={(blockId) => onSelectBlock(section.id, blockId)}
                          onUpdateBlock={(blockId, updates) =>
                            onUpdateBlock(section.id, blockId, updates)
                          }
                          onEditBlock={(block) => onEditBlock(section.id, block)}
                          onDeleteBlock={(blockId) => onDeleteBlock(section.id, blockId)}
                          onDuplicateBlock={(blockId) => onDuplicateBlock(section.id, blockId)}
                          onEditSection={onEditSection ? () => onEditSection(section.id) : undefined}
                          onDuplicateSection={onDuplicateSection ? () => onDuplicateSection(section.id) : undefined}
                          onDeleteSection={onDeleteSection ? () => onDeleteSection(section.id) : undefined}
                          onToggleSectionLock={onToggleSectionLock ? () => onToggleSectionLock(section.id) : undefined}
                          onMoveBlock={(blockId, direction) =>
                            onMoveBlock(section.id, blockId, direction)
                          }
                          onAddBlock={(type, index) => onAddBlock(section.id, type, index)}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                        <div className="w-14 h-14 mb-4 rounded-xl bg-gray-100 flex items-center justify-center">
                          <FileText className="h-7 w-7 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Page 2</p>
                      </div>
                    )}
                  </div>
                  {/* Page number */}
                  <div className="absolute bottom-4 right-6 text-xs text-gray-400">2</div>
                </div>
              </div>
            </div>
          ) : viewMode === 'continuous' ? (
            // Continuous view - all content flowing without fixed page height
            <div className="relative">
              {/* Paper shadow */}
              <div
                className="absolute -bottom-1 left-1 right-1 h-2 bg-gray-300/50 rounded-b-sm blur-sm"
                style={{ width: documentWidth - 8 }}
              />

              <div
                className="relative bg-white rounded-sm transition-all duration-300"
                style={{
                  width: documentWidth,
                  fontFamily: designSettings.typography.bodyFont,
                  fontSize: `${designSettings.typography.baseFontSize * scale}px`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* Document header */}
                {designSettings.header?.enabled && (
                  <div
                    className="border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 bg-white z-10"
                    style={{ backgroundColor: designSettings.colors?.primary ? `${designSettings.colors.primary}08` : '#f9fafb' }}
                  >
                    <div className="text-xs text-gray-500 font-medium">
                      {designSettings.header?.leftText || 'Cockpit - Rapport'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Vue continue
                    </div>
                  </div>
                )}

                <div style={{ padding: marginPx }}>
                  {sections.length > 0 ? (
                    sections.map((section) => (
                      <SectionRenderer
                        key={section.id}
                        section={section}
                        isSelected={selectedSectionId === section.id}
                        selectedBlockId={selectedBlockId}
                        isEditing={mode === 'edit'}
                        showComments={showComments}
                        onSelectSection={() => onSelectSection(section.id)}
                        onSelectBlock={(blockId) => onSelectBlock(section.id, blockId)}
                        onUpdateBlock={(blockId, updates) =>
                          onUpdateBlock(section.id, blockId, updates)
                        }
                        onEditBlock={(block) => onEditBlock(section.id, block)}
                        onDeleteBlock={(blockId) => onDeleteBlock(section.id, blockId)}
                        onDuplicateBlock={(blockId) => onDuplicateBlock(section.id, blockId)}
                        onEditSection={onEditSection ? () => onEditSection(section.id) : undefined}
                        onDuplicateSection={onDuplicateSection ? () => onDuplicateSection(section.id) : undefined}
                        onDeleteSection={onDeleteSection ? () => onDeleteSection(section.id) : undefined}
                        onToggleSectionLock={onToggleSectionLock ? () => onToggleSectionLock(section.id) : undefined}
                        onMoveBlock={(blockId, direction) =>
                          onMoveBlock(section.id, blockId, direction)
                        }
                        onAddBlock={(type, index) => onAddBlock(section.id, type, index)}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                      <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-primary-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Document vide
                      </h3>
                      <p className="text-sm text-gray-500 max-w-sm">
                        Ajoutez des sections depuis le panneau de navigation pour
                        commencer à créer votre rapport.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Single page view (default) - Premium paper design
            <div className="relative group">
              {/* Paper shadow layers for depth effect */}
              <div
                className="absolute -bottom-1 left-1 right-1 h-2 bg-gray-300/50 rounded-b-sm blur-sm"
                style={{ width: documentWidth - 8 }}
              />
              <div
                className="absolute -bottom-0.5 left-0.5 right-0.5 h-1 bg-gray-200/70 rounded-b-sm"
                style={{ width: documentWidth - 4 }}
              />

              {/* Main document */}
              <div
                className="relative bg-white rounded-sm transition-all duration-300"
                style={{
                  width: documentWidth,
                  minHeight: documentMinHeight,
                  fontFamily: designSettings.typography.bodyFont,
                  fontSize: `${designSettings.typography.baseFontSize * scale}px`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* Optional document header */}
                {designSettings.header?.enabled && (
                  <div
                    className="border-b border-gray-100 px-8 py-3 flex items-center justify-between"
                    style={{ backgroundColor: designSettings.colors?.primary ? `${designSettings.colors.primary}08` : '#f9fafb' }}
                  >
                    <div className="text-xs text-gray-500 font-medium">
                      {designSettings.header?.leftText || 'Cockpit - Rapport'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {designSettings.header?.showDate !== false && new Date().toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                {/* Document content */}
                <div style={{ padding: marginPx }}>
                  {sections.length > 0 ? (
                    sections.map((section) => (
                      <SectionRenderer
                        key={section.id}
                        section={section}
                        isSelected={selectedSectionId === section.id}
                        selectedBlockId={selectedBlockId}
                        isEditing={mode === 'edit'}
                        showComments={showComments}
                        onSelectSection={() => onSelectSection(section.id)}
                        onSelectBlock={(blockId) => onSelectBlock(section.id, blockId)}
                        onUpdateBlock={(blockId, updates) =>
                          onUpdateBlock(section.id, blockId, updates)
                        }
                        onEditBlock={(block) => onEditBlock(section.id, block)}
                        onDeleteBlock={(blockId) => onDeleteBlock(section.id, blockId)}
                        onDuplicateBlock={(blockId) => onDuplicateBlock(section.id, blockId)}
                        onEditSection={onEditSection ? () => onEditSection(section.id) : undefined}
                        onDuplicateSection={onDuplicateSection ? () => onDuplicateSection(section.id) : undefined}
                        onDeleteSection={onDeleteSection ? () => onDeleteSection(section.id) : undefined}
                        onToggleSectionLock={onToggleSectionLock ? () => onToggleSectionLock(section.id) : undefined}
                        onMoveBlock={(blockId, direction) =>
                          onMoveBlock(section.id, blockId, direction)
                        }
                        onAddBlock={(type, index) => onAddBlock(section.id, type, index)}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                      <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-primary-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Document vide
                      </h3>
                      <p className="text-sm text-gray-500 max-w-sm mb-6">
                        Ajoutez des sections depuis le panneau de navigation pour
                        commencer à créer votre rapport.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-400">
                        <span className="px-2 py-1 bg-gray-100 rounded">Tapez / pour les commandes</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">Clic droit pour le menu</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional document footer */}
                {designSettings.footer?.enabled && (
                  <div
                    className="border-t border-gray-100 px-8 py-3 flex items-center justify-between mt-auto"
                    style={{ backgroundColor: '#fafafa' }}
                  >
                    <div className="text-xs text-gray-400">
                      {designSettings.footer?.leftText || 'Confidentiel'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {designSettings.footer?.showPageNumbers !== false && 'Page 1'}
                    </div>
                  </div>
                )}
              </div>

              {/* Page number indicator */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Page 1 / 1
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Slash Command Menu */}
      <SlashCommandMenu
        isOpen={slashMenuOpen}
        position={slashMenuPosition}
        filter={slashFilter}
        commands={commands}
        onSelect={handleSlashSelect}
        onClose={handleCloseSlashMenu}
      />
    </div>
  );
}
