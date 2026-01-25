/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table,
  BarChart2,
  Image,
  Gauge,
  AlertTriangle,
  Info,
  AlertCircle,
  Lightbulb,
  Minus,
  SplitSquareVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  keywords?: string[];
  action: () => void;
}

interface SlashCommandMenuProps {
  isOpen: boolean;
  position: { top: number; left: number };
  filter: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  commands: SlashCommand[];
}

const defaultCommands: Omit<SlashCommand, 'action'>[] = [
  // Texte
  {
    id: 'paragraph',
    label: 'Paragraphe',
    description: 'Bloc de texte simple',
    icon: <FileText className="h-4 w-4" />,
    category: 'Texte',
    keywords: ['text', 'paragraph', 'texte'],
  },
  {
    id: 'heading1',
    label: 'Titre 1',
    description: 'Grand titre de section',
    icon: <Heading1 className="h-4 w-4" />,
    category: 'Texte',
    keywords: ['h1', 'heading', 'titre', 'title'],
  },
  {
    id: 'heading2',
    label: 'Titre 2',
    description: 'Titre de sous-section',
    icon: <Heading2 className="h-4 w-4" />,
    category: 'Texte',
    keywords: ['h2', 'heading', 'titre', 'subtitle'],
  },
  {
    id: 'heading3',
    label: 'Titre 3',
    description: 'Petit titre',
    icon: <Heading3 className="h-4 w-4" />,
    category: 'Texte',
    keywords: ['h3', 'heading', 'titre'],
  },
  {
    id: 'quote',
    label: 'Citation',
    description: 'Bloc de citation',
    icon: <Quote className="h-4 w-4" />,
    category: 'Texte',
    keywords: ['quote', 'citation', 'blockquote'],
  },

  // Listes
  {
    id: 'bullet-list',
    label: 'Liste à puces',
    description: 'Liste non ordonnée',
    icon: <List className="h-4 w-4" />,
    category: 'Listes',
    keywords: ['list', 'bullet', 'ul', 'puces'],
  },
  {
    id: 'numbered-list',
    label: 'Liste numérotée',
    description: 'Liste ordonnée',
    icon: <ListOrdered className="h-4 w-4" />,
    category: 'Listes',
    keywords: ['list', 'numbered', 'ol', 'ordered'],
  },
  {
    id: 'checklist',
    label: 'Liste de tâches',
    description: 'Liste avec cases à cocher',
    icon: <CheckSquare className="h-4 w-4" />,
    category: 'Listes',
    keywords: ['todo', 'task', 'checklist', 'checkbox'],
  },

  // Callouts
  {
    id: 'callout-info',
    label: 'Info',
    description: 'Bloc d\'information',
    icon: <Info className="h-4 w-4 text-primary-500" />,
    category: 'Callouts',
    keywords: ['callout', 'info', 'note', 'information'],
  },
  {
    id: 'callout-warning',
    label: 'Avertissement',
    description: 'Bloc d\'avertissement',
    icon: <AlertTriangle className="h-4 w-4 text-primary-500" />,
    category: 'Callouts',
    keywords: ['callout', 'warning', 'attention', 'avertissement'],
  },
  {
    id: 'callout-error',
    label: 'Erreur',
    description: 'Bloc d\'erreur',
    icon: <AlertCircle className="h-4 w-4 text-primary-500" />,
    category: 'Callouts',
    keywords: ['callout', 'error', 'danger', 'erreur'],
  },
  {
    id: 'callout-success',
    label: 'Succès',
    description: 'Bloc de succès',
    icon: <CheckSquare className="h-4 w-4 text-primary-500" />,
    category: 'Callouts',
    keywords: ['callout', 'success', 'succès', 'réussite'],
  },
  {
    id: 'callout-tip',
    label: 'Astuce',
    description: 'Bloc d\'astuce',
    icon: <Lightbulb className="h-4 w-4 text-primary-500" />,
    category: 'Callouts',
    keywords: ['callout', 'tip', 'astuce', 'conseil'],
  },

  // Données
  {
    id: 'chart',
    label: 'Graphique',
    description: 'Insérer un graphique',
    icon: <BarChart2 className="h-4 w-4" />,
    category: 'Données',
    keywords: ['chart', 'graph', 'graphique', 'visualization'],
  },
  {
    id: 'table',
    label: 'Tableau',
    description: 'Insérer un tableau',
    icon: <Table className="h-4 w-4" />,
    category: 'Données',
    keywords: ['table', 'tableau', 'data', 'données'],
  },
  {
    id: 'kpi',
    label: 'KPI',
    description: 'Indicateur clé',
    icon: <Gauge className="h-4 w-4" />,
    category: 'Données',
    keywords: ['kpi', 'metric', 'indicateur', 'card'],
  },

  // Médias
  {
    id: 'image',
    label: 'Image',
    description: 'Insérer une image',
    icon: <Image className="h-4 w-4" />,
    category: 'Médias',
    keywords: ['image', 'photo', 'picture', 'img'],
  },

  // Mise en page
  {
    id: 'divider',
    label: 'Séparateur',
    description: 'Ligne de séparation',
    icon: <Minus className="h-4 w-4" />,
    category: 'Mise en page',
    keywords: ['divider', 'separator', 'hr', 'ligne'],
  },
  {
    id: 'pagebreak',
    label: 'Saut de page',
    description: 'Insérer un saut de page',
    icon: <SplitSquareVertical className="h-4 w-4" />,
    category: 'Mise en page',
    keywords: ['pagebreak', 'page', 'saut', 'break'],
  },
];

export function getDefaultSlashCommands(): Omit<SlashCommand, 'action'>[] {
  return defaultCommands;
}

export function SlashCommandMenu({
  isOpen,
  position,
  filter,
  onSelect,
  onClose,
  commands,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) => {
    const searchLower = filter.toLowerCase();
    if (!searchLower) return true;

    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description.toLowerCase().includes(searchLower) ||
      cmd.category.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, SlashCommand[]>);

  // Flatten for keyboard navigation
  const flatCommands = Object.values(groupedCommands).flat();

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            onSelect(flatCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, flatCommands, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || flatCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border w-72 animate-fade-in"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="px-3 py-2 border-b">
        <span className="text-xs text-gray-500 font-medium">
          {filter ? `Recherche: "${filter}"` : 'Commandes'}
        </span>
      </div>
      <ScrollArea className="max-h-80">
        <div className="p-1">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {category}
              </div>
              {cmds.map((cmd) => {
                const globalIndex = flatCommands.findIndex((c) => c.id === cmd.id);
                const isSelected = globalIndex === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => onSelect(cmd)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors',
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-md',
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      )}
                    >
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{cmd.label}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {cmd.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="px-3 py-2 border-t bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>↑↓ Naviguer</span>
          <span>↵ Sélectionner</span>
          <span>Esc Fermer</span>
        </div>
      </div>
    </div>
  );
}

// Hook to manage slash commands in a text input
export function useSlashCommands(
  onInsertBlock: (type: string, options?: Record<string, unknown>) => void
) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [filter, setFilter] = useState('');
  const [slashStartIndex, setSlashStartIndex] = useState(-1);

  const handleTextChange = useCallback(
    (text: string, cursorPosition: number, inputElement: HTMLElement) => {
      // Find the last "/" before cursor
      const textBeforeCursor = text.substring(0, cursorPosition);
      const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

      if (lastSlashIndex !== -1) {
        const textAfterSlash = textBeforeCursor.substring(lastSlashIndex + 1);

        // Check if there's no space after the slash (command is being typed)
        if (!textAfterSlash.includes(' ') && !textAfterSlash.includes('\n')) {
          if (!isOpen) {
            // Calculate position based on input element
            const rect = inputElement.getBoundingClientRect();
            setPosition({
              top: rect.bottom + 4,
              left: rect.left,
            });
            setSlashStartIndex(lastSlashIndex);
          }
          setFilter(textAfterSlash);
          setIsOpen(true);
          return;
        }
      }

      // Close menu if no valid slash command
      if (isOpen) {
        setIsOpen(false);
        setFilter('');
        setSlashStartIndex(-1);
      }
    },
    [isOpen]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setFilter('');
    setSlashStartIndex(-1);
  }, []);

  const commands: SlashCommand[] = defaultCommands.map((cmd) => ({
    ...cmd,
    action: () => {
      switch (cmd.id) {
        case 'paragraph':
          onInsertBlock('paragraph');
          break;
        case 'heading1':
          onInsertBlock('heading', { level: 1 });
          break;
        case 'heading2':
          onInsertBlock('heading', { level: 2 });
          break;
        case 'heading3':
          onInsertBlock('heading', { level: 3 });
          break;
        case 'quote':
          onInsertBlock('quote');
          break;
        case 'bullet-list':
          onInsertBlock('list', { listType: 'bullet' });
          break;
        case 'numbered-list':
          onInsertBlock('list', { listType: 'numbered' });
          break;
        case 'checklist':
          onInsertBlock('list', { listType: 'checklist' });
          break;
        case 'callout-info':
          onInsertBlock('callout', { variant: 'info' });
          break;
        case 'callout-warning':
          onInsertBlock('callout', { variant: 'warning' });
          break;
        case 'callout-error':
          onInsertBlock('callout', { variant: 'error' });
          break;
        case 'callout-success':
          onInsertBlock('callout', { variant: 'success' });
          break;
        case 'callout-tip':
          onInsertBlock('callout', { variant: 'tip' });
          break;
        case 'chart':
          onInsertBlock('chart');
          break;
        case 'table':
          onInsertBlock('table');
          break;
        case 'kpi':
          onInsertBlock('kpi_card');
          break;
        case 'image':
          onInsertBlock('image');
          break;
        case 'divider':
          onInsertBlock('divider');
          break;
        case 'pagebreak':
          onInsertBlock('pagebreak');
          break;
      }
      close();
    },
  }));

  return {
    isOpen,
    position,
    filter,
    commands,
    slashStartIndex,
    handleTextChange,
    close,
  };
}
