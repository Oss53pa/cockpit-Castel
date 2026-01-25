/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Copy,
  Trash2,
  Edit,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Plus,
  FileText,
  Heading1,
  List,
  BarChart2,
  Table,
  Image,
  Quote,
  AlertCircle,
  Gauge,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  submenu?: ContextMenuItem[];
  action?: () => void;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({
  isOpen,
  position,
  items,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = position.x;
    let newY = position.y;

    if (rect.right > viewportWidth) {
      newX = viewportWidth - rect.width - 10;
    }
    if (rect.bottom > viewportHeight) {
      newY = viewportHeight - rect.height - 10;
    }

    menu.style.left = `${newX}px`;
    menu.style.top = `${newY}px`;
  }, [isOpen, position]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled || item.submenu) return;
    item.action?.();
    onClose();
  };

  const handleSubmenuEnter = (item: ContextMenuItem) => {
    if (item.submenu) {
      setActiveSubmenu(item.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] bg-white rounded-lg shadow-xl border py-1 animate-fade-in"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {items.map((item) => {
        if (item.divider) {
          return <div key={item.id} className="h-px bg-gray-200 my-1" />;
        }

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => handleSubmenuEnter(item)}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <button
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left',
                'hover:bg-gray-100 transition-colors',
                item.disabled && 'opacity-50 cursor-not-allowed',
                item.danger && 'text-red-600 hover:bg-red-50'
              )}
            >
              {item.icon && (
                <span className="w-4 h-4 flex items-center justify-center">
                  {item.icon}
                </span>
              )}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-gray-400 ml-4">{item.shortcut}</span>
              )}
              {item.submenu && (
                <span className="text-gray-400">
                  <ChevronDown className="h-3 w-3 -rotate-90" />
                </span>
              )}
            </button>

            {/* Submenu */}
            {item.submenu && activeSubmenu === item.id && (
              <div
                className="absolute left-full top-0 min-w-[160px] bg-white rounded-lg shadow-xl border py-1 ml-1"
                style={{
                  left: '100%',
                  top: 0,
                }}
              >
                {item.submenu.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => {
                      subItem.action?.();
                      onClose();
                    }}
                    disabled={subItem.disabled}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left',
                      'hover:bg-gray-100 transition-colors',
                      subItem.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {subItem.icon && (
                      <span className="w-4 h-4 flex items-center justify-center">
                        {subItem.icon}
                      </span>
                    )}
                    <span className="flex-1">{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Hook for managing context menu state
export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [contextData, setContextData] = useState<unknown>(null);

  const open = useCallback((e: React.MouseEvent, data?: unknown) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ x: e.clientX, y: e.clientY });
    setContextData(data);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setContextData(null);
  }, []);

  return {
    isOpen,
    position,
    contextData,
    open,
    close,
  };
}

// Pre-built menu items for blocks
export function getBlockContextMenuItems(
  onEdit: () => void,
  onDuplicate: () => void,
  onDelete: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
  canMoveUp: boolean,
  canMoveDown: boolean
): ContextMenuItem[] {
  return [
    {
      id: 'edit',
      label: 'Modifier',
      icon: <Edit className="h-4 w-4" />,
      shortcut: 'Enter',
      action: onEdit,
    },
    {
      id: 'duplicate',
      label: 'Dupliquer',
      icon: <Copy className="h-4 w-4" />,
      shortcut: 'Ctrl+D',
      action: onDuplicate,
    },
    {
      id: 'divider1',
      label: '',
      divider: true,
    },
    {
      id: 'move-up',
      label: 'Déplacer vers le haut',
      icon: <ChevronUp className="h-4 w-4" />,
      disabled: !canMoveUp,
      action: onMoveUp,
    },
    {
      id: 'move-down',
      label: 'Déplacer vers le bas',
      icon: <ChevronDown className="h-4 w-4" />,
      disabled: !canMoveDown,
      action: onMoveDown,
    },
    {
      id: 'divider2',
      label: '',
      divider: true,
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: <Trash2 className="h-4 w-4" />,
      shortcut: 'Del',
      danger: true,
      action: onDelete,
    },
  ];
}

// Pre-built menu items for sections
export function getSectionContextMenuItems(
  onAddBlock: (type: string, options?: Record<string, unknown>) => void,
  onEdit: () => void,
  onDuplicate: () => void,
  onDelete: () => void,
  onToggleLock: () => void,
  isLocked: boolean
): ContextMenuItem[] {
  return [
    {
      id: 'add-block',
      label: 'Ajouter un bloc',
      icon: <Plus className="h-4 w-4" />,
      submenu: [
        {
          id: 'add-paragraph',
          label: 'Paragraphe',
          icon: <FileText className="h-4 w-4" />,
          action: () => onAddBlock('paragraph'),
        },
        {
          id: 'add-heading',
          label: 'Titre',
          icon: <Heading1 className="h-4 w-4" />,
          action: () => onAddBlock('heading', { level: 2 }),
        },
        {
          id: 'add-list',
          label: 'Liste',
          icon: <List className="h-4 w-4" />,
          action: () => onAddBlock('list', { listType: 'bullet' }),
        },
        {
          id: 'add-quote',
          label: 'Citation',
          icon: <Quote className="h-4 w-4" />,
          action: () => onAddBlock('quote'),
        },
        {
          id: 'add-callout',
          label: 'Callout',
          icon: <AlertCircle className="h-4 w-4" />,
          action: () => onAddBlock('callout', { variant: 'info' }),
        },
        {
          id: 'add-divider',
          label: 'Séparateur',
          icon: <Minus className="h-4 w-4" />,
          action: () => onAddBlock('divider'),
        },
      ],
    },
    {
      id: 'add-data',
      label: 'Ajouter des données',
      icon: <BarChart2 className="h-4 w-4" />,
      submenu: [
        {
          id: 'add-chart',
          label: 'Graphique',
          icon: <BarChart2 className="h-4 w-4" />,
          action: () => onAddBlock('chart'),
        },
        {
          id: 'add-table',
          label: 'Tableau',
          icon: <Table className="h-4 w-4" />,
          action: () => onAddBlock('table'),
        },
        {
          id: 'add-kpi',
          label: 'KPI',
          icon: <Gauge className="h-4 w-4" />,
          action: () => onAddBlock('kpi_card'),
        },
        {
          id: 'add-image',
          label: 'Image',
          icon: <Image className="h-4 w-4" />,
          action: () => onAddBlock('image'),
        },
      ],
    },
    {
      id: 'divider1',
      label: '',
      divider: true,
    },
    {
      id: 'edit',
      label: 'Modifier la section',
      icon: <Edit className="h-4 w-4" />,
      action: onEdit,
    },
    {
      id: 'duplicate',
      label: 'Dupliquer la section',
      icon: <Copy className="h-4 w-4" />,
      action: onDuplicate,
    },
    {
      id: 'toggle-lock',
      label: isLocked ? 'Déverrouiller' : 'Verrouiller',
      icon: isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />,
      action: onToggleLock,
    },
    {
      id: 'divider2',
      label: '',
      divider: true,
    },
    {
      id: 'delete',
      label: 'Supprimer la section',
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      action: onDelete,
    },
  ];
}
