import React, { useState, useCallback } from 'react';
import {
  Lock,
  MessageSquare,
  Sparkles,
  MoreHorizontal,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BlockRenderer } from '../BlockRenderers';
import {
  ContextMenu,
  useContextMenu,
  getBlockContextMenuItems,
  getSectionContextMenuItems,
} from '../ContextMenu';
import type { Section, ContentBlock, SectionStatus } from '@/types/reportStudio';

interface SectionRendererProps {
  section: Section;
  isSelected: boolean;
  selectedBlockId: string | null;
  isEditing: boolean;
  showComments: boolean;
  onSelectSection: () => void;
  onSelectBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updates: Partial<ContentBlock>) => void;
  onEditBlock: (block: ContentBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onAddBlock: (type: string, index?: number, options?: Record<string, unknown>) => void;
  onEditSection?: () => void;
  onDuplicateSection?: () => void;
  onDeleteSection?: () => void;
  onToggleSectionLock?: () => void;
  depth?: number;
}

const statusBadgeColors: Record<SectionStatus, string> = {
  generated: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-700 border-indigo-200',
  edited: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200',
  manual: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 border-gray-200',
};

const statusLabels: Record<SectionStatus, string> = {
  generated: 'IA',
  edited: 'Modifié',
  manual: 'Manuel',
};

export function SectionRenderer({
  section,
  isSelected,
  selectedBlockId,
  isEditing,
  showComments,
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
  depth = 0,
}: SectionRendererProps) {
  const hasBlocks = section.blocks && section.blocks.length > 0;
  const headingLevel = Math.min(section.level, 6);
  const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;

  // Context menu state for section
  const sectionContextMenu = useContextMenu();
  // Context menu state for blocks
  const [blockContextMenu, setBlockContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    blockId: string | null;
    blockIndex: number;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    blockId: null,
    blockIndex: -1,
  });

  const handleSectionContextMenu = useCallback((e: React.MouseEvent) => {
    sectionContextMenu.open(e);
  }, [sectionContextMenu]);

  const handleBlockContextMenu = useCallback((e: React.MouseEvent, blockId: string, blockIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setBlockContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      blockId,
      blockIndex,
    });
  }, []);

  const closeBlockContextMenu = useCallback(() => {
    setBlockContextMenu((prev) => ({ ...prev, isOpen: false, blockId: null }));
  }, []);

  const headingSizes = {
    1: 'text-2xl tracking-tight',
    2: 'text-xl tracking-tight',
    3: 'text-lg tracking-tight',
    4: 'text-base',
    5: 'text-sm',
    6: 'text-sm',
  };

  // Get section context menu items
  const sectionMenuItems = getSectionContextMenuItems(
    (type, options) => onAddBlock(type, undefined, options),
    onEditSection || (() => {}),
    onDuplicateSection || (() => {}),
    onDeleteSection || (() => {}),
    onToggleSectionLock || (() => {}),
    section.isLocked
  );

  // Get block context menu items
  const getBlockMenuItems = (blockId: string, blockIndex: number) => {
    const block = section.blocks.find((b) => b.id === blockId);
    if (!block) return [];

    return getBlockContextMenuItems(
      () => onEditBlock(block),
      () => onDuplicateBlock(blockId),
      () => onDeleteBlock(blockId),
      () => onMoveBlock(blockId, 'up'),
      () => onMoveBlock(blockId, 'down'),
      blockIndex > 0,
      blockIndex < section.blocks.length - 1
    );
  };

  return (
    <div
      className={cn(
        'relative mb-8 transition-all duration-200',
        depth > 0 && 'ml-6 pl-4 border-l-2 border-gradient-to-b from-blue-200 to-indigo-100'
      )}
    >
      {/* Section Header */}
      <div
        className={cn(
          'group flex items-start gap-3 mb-4 p-4 rounded-xl cursor-pointer transition-all duration-200',
          isSelected
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm'
            : 'hover:bg-gray-50/80 border border-transparent hover:border-gray-200'
        )}
        onClick={onSelectSection}
        onContextMenu={handleSectionContextMenu}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <HeadingTag
              className={cn(
                'font-bold text-gray-900',
                headingSizes[headingLevel as keyof typeof headingSizes]
              )}
            >
              {section.title}
            </HeadingTag>

            {/* Status badge */}
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                statusBadgeColors[section.status]
              )}
            >
              {section.status === 'generated' && (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {statusLabels[section.status]}
            </span>

            {/* Lock icon */}
            {section.isLocked && (
              <Lock className="h-4 w-4 text-gray-400" />
            )}

            {/* Comments indicator */}
            {showComments && section.metadata?.hasComments && (
              <span className="flex items-center text-blue-600">
                <MessageSquare className="h-4 w-4" />
              </span>
            )}

            {/* AI confidence */}
            {section.metadata?.aiConfidence !== undefined && (
              <span className="text-xs text-gray-500">
                {section.metadata.aiConfidence}% confiance
              </span>
            )}
          </div>
        </div>

        {/* Section actions */}
        {isSelected && !section.isLocked && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddBlock('paragraph')}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un bloc
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {}}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer la section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Blocks */}
      {hasBlocks ? (
        <div className="space-y-5">
          {section.blocks.map((block, index) => (
            <div
              key={block.id}
              className="relative group"
              onContextMenu={(e) => handleBlockContextMenu(e, block.id, index)}
            >
              {/* Block actions overlay - Modern floating toolbar */}
              {selectedBlockId === block.id && !section.isLocked && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveBlock(block.id, 'up');
                      }}
                      disabled={index === 0}
                      title="Déplacer vers le haut"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveBlock(block.id, 'down');
                      }}
                      disabled={index === section.blocks.length - 1}
                      title="Déplacer vers le bas"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <div className="h-px bg-gray-200 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateBlock(block.id);
                      }}
                      title="Dupliquer"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBlock(block.id);
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <BlockRenderer
                block={block}
                sectionId={section.id}
                isSelected={selectedBlockId === block.id}
                isEditing={isEditing && selectedBlockId === block.id}
                onSelect={() => onSelectBlock(block.id)}
                onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                onEdit={() => onEditBlock(block)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            'p-10 border-2 border-dashed rounded-xl text-center transition-all duration-200',
            isSelected
              ? 'border-blue-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/30'
              : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/20'
          )}
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center">
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-sm mb-1">
            Cette section est vide
          </p>
          <p className="text-gray-400 text-xs mb-4">
            Ajoutez du contenu pour commencer
          </p>
          {!section.isLocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddBlock('paragraph');
              }}
              className="bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un bloc
            </Button>
          )}
        </div>
      )}

      {/* Add block button at the end - Modern floating style */}
      {hasBlocks && isSelected && !section.isLocked && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddBlock('paragraph');
            }}
            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full px-4 transition-all group"
          >
            <Plus className="h-4 w-4 mr-1.5 group-hover:rotate-90 transition-transform duration-200" />
            Ajouter un bloc
          </Button>
        </div>
      )}

      {/* Child sections */}
      {section.children && section.children.length > 0 && (
        <div className="mt-6">
          {section.children.map((child) => (
            <SectionRenderer
              key={child.id}
              section={child}
              isSelected={false}
              selectedBlockId={selectedBlockId}
              isEditing={isEditing}
              showComments={showComments}
              onSelectSection={() => {}}
              onSelectBlock={onSelectBlock}
              onUpdateBlock={onUpdateBlock}
              onEditBlock={onEditBlock}
              onDeleteBlock={onDeleteBlock}
              onDuplicateBlock={onDuplicateBlock}
              onMoveBlock={onMoveBlock}
              onAddBlock={onAddBlock}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Section Context Menu */}
      <ContextMenu
        isOpen={sectionContextMenu.isOpen}
        position={sectionContextMenu.position}
        items={sectionMenuItems}
        onClose={sectionContextMenu.close}
      />

      {/* Block Context Menu */}
      {blockContextMenu.blockId && (
        <ContextMenu
          isOpen={blockContextMenu.isOpen}
          position={blockContextMenu.position}
          items={getBlockMenuItems(blockContextMenu.blockId, blockContextMenu.blockIndex)}
          onClose={closeBlockContextMenu}
        />
      )}
    </div>
  );
}
