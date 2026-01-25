import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight,
  ChevronDown,
  Lock,
  Unlock,
  MoreHorizontal,
  Trash2,
  Edit2,
  Copy,
  GripVertical,
  FileText,
  BarChart2,
  Table,
  Image,
  List,
  Quote,
  AlertCircle,
  Gauge,
  CheckSquare,
  AlertTriangle,
  Target,
  MessageSquare,
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
import type { Section, SectionStatus } from '@/types/reportStudio';

interface SectionItemProps {
  section: Section;
  isSelected: boolean;
  depth?: number;
  onSelect: () => void;
  onToggleCollapse: () => void;
  onToggleLock: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onUpdateTitle?: (newTitle: string) => void;
}

const statusColors: Record<SectionStatus, string> = {
  generated: 'bg-blue-500',
  edited: 'bg-yellow-500',
  manual: 'bg-gray-400',
};

const statusLabels: Record<SectionStatus, string> = {
  generated: 'Généré par IA',
  edited: 'Modifié',
  manual: 'Manuel',
};

const getIconForSection = (icon?: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    FileText: <FileText className="h-4 w-4" />,
    BarChart2: <BarChart2 className="h-4 w-4" />,
    Table: <Table className="h-4 w-4" />,
    Image: <Image className="h-4 w-4" />,
    List: <List className="h-4 w-4" />,
    Quote: <Quote className="h-4 w-4" />,
    AlertCircle: <AlertCircle className="h-4 w-4" />,
    Gauge: <Gauge className="h-4 w-4" />,
    CheckSquare: <CheckSquare className="h-4 w-4" />,
    AlertTriangle: <AlertTriangle className="h-4 w-4" />,
    Target: <Target className="h-4 w-4" />,
  };
  return iconMap[icon || ''] || <FileText className="h-4 w-4" />;
};

export function SectionItem({
  section,
  isSelected,
  depth = 0,
  onSelect,
  onToggleCollapse,
  onToggleLock,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateTitle,
}: SectionItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(section.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = section.children && section.children.length > 0;
  const hasBlocks = section.blocks && section.blocks.length > 0;
  const hasComments = section.metadata?.hasComments;
  const completionStatus = section.metadata?.completionStatus;
  const aiConfidence = section.metadata?.aiConfidence;

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  // Update editedTitle when section.title changes
  useEffect(() => {
    setEditedTitle(section.title);
  }, [section.title]);

  const handleStartEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== section.title && onUpdateTitle) {
      onUpdateTitle(editedTitle.trim());
    } else {
      setEditedTitle(section.title);
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditing = () => {
    setEditedTitle(section.title);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          isSelected
            ? 'bg-blue-100 text-blue-900'
            : 'hover:bg-gray-100 text-gray-700',
          section.isLocked && 'opacity-75',
          isDragging && 'bg-blue-50 shadow-lg'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={onSelect}
      >
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3" />
        </span>

        {/* Collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            {section.isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Section icon */}
        <span
          className={cn(
            'flex-shrink-0',
            isSelected ? 'text-blue-700' : 'text-gray-500'
          )}
        >
          {getIconForSection(section.icon)}
        </span>

        {/* Title */}
        {isEditingTitle ? (
          <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveTitle}
              className="flex-1 text-sm font-medium bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ) : (
          <span
            className="flex-1 truncate text-sm font-medium cursor-text"
            onDoubleClick={handleStartEditing}
            title="Double-cliquez pour modifier"
          >
            {section.title}
          </span>
        )}

        {/* Completion status indicator */}
        {completionStatus && (
          <span
            className={cn(
              'flex-shrink-0 w-1.5 h-1.5 rounded-full',
              completionStatus === 'complete' && 'bg-green-500',
              completionStatus === 'draft' && 'bg-yellow-500',
              completionStatus === 'needs_review' && 'bg-red-500'
            )}
            title={completionStatus}
          />
        )}

        {/* Comments indicator */}
        {hasComments && (
          <MessageSquare className="flex-shrink-0 h-3 w-3 text-primary-400" />
        )}

        {/* AI Confidence */}
        {aiConfidence !== undefined && aiConfidence < 80 && (
          <span
            className="flex-shrink-0 text-[10px] text-orange-500 font-medium"
            title={`Confiance IA: ${aiConfidence}%`}
          >
            {aiConfidence}%
          </span>
        )}

        {/* Status indicator */}
        <span
          className={cn(
            'flex-shrink-0 w-2 h-2 rounded-full',
            statusColors[section.status]
          )}
          title={statusLabels[section.status]}
        />

        {/* Lock indicator */}
        {section.isLocked && (
          <Lock className="flex-shrink-0 h-3 w-3 text-gray-400" />
        )}

        {/* Block count */}
        {hasBlocks && (
          <span className="flex-shrink-0 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {section.blocks.length}
          </span>
        )}

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onToggleLock}>
              {section.isLocked ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Déverrouiller
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Verrouiller
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
