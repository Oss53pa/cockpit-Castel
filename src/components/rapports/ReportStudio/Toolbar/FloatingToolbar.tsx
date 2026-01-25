import React from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  BarChart2,
  Table,
  Image,
  List,
  ListOrdered,
  Quote,
  AlertCircle,
  Minus,
  SeparatorHorizontal,
  Gauge,
  Database,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BlockType, CalloutVariant } from '@/types/reportStudio';

interface FloatingToolbarProps {
  isVisible: boolean;
  selectedBlockId: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAddBlock: (type: BlockType, options?: Record<string, unknown>) => void;
  onOpenDataLibrary: () => void;
  onDeleteBlock: () => void;
  onDuplicateBlock: () => void;
  onMoveBlock: (direction: 'up' | 'down') => void;
  onGenerateWithAI: () => void;
}

export function FloatingToolbar({
  isVisible,
  selectedBlockId,
  canMoveUp,
  canMoveDown,
  onAddBlock,
  onOpenDataLibrary,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onGenerateWithAI,
}: FloatingToolbarProps) {
  if (!isVisible) return null;

  const blockTypes: {
    type: BlockType;
    icon: React.ReactNode;
    label: string;
    options?: Record<string, unknown>;
  }[] = [
    { type: 'paragraph', icon: <Type className="h-4 w-4" />, label: 'Paragraphe' },
    {
      type: 'heading',
      icon: <Heading1 className="h-4 w-4" />,
      label: 'Titre 1',
      options: { level: 1 },
    },
    {
      type: 'heading',
      icon: <Heading2 className="h-4 w-4" />,
      label: 'Titre 2',
      options: { level: 2 },
    },
    {
      type: 'heading',
      icon: <Heading3 className="h-4 w-4" />,
      label: 'Titre 3',
      options: { level: 3 },
    },
  ];

  const calloutVariants: { variant: CalloutVariant; label: string; color: string }[] = [
    { variant: 'info', label: 'Information', color: 'bg-blue-500' },
    { variant: 'warning', label: 'Attention', color: 'bg-yellow-500' },
    { variant: 'success', label: 'Succès', color: 'bg-green-500' },
    { variant: 'error', label: 'Erreur', color: 'bg-red-500' },
    { variant: 'tip', label: 'Astuce', color: 'bg-purple-500' },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 bg-white rounded-xl shadow-lg border px-2 py-1.5">
          {/* Text blocks */}
          <div className="flex items-center gap-0.5">
            {blockTypes.map((block, index) => (
              <Tooltip key={`${block.type}-${index}`}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddBlock(block.type, block.options)}
                    className="h-9 w-9 p-0"
                  >
                    {block.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{block.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Data blocks */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddBlock('chart')}
                  className="h-9 w-9 p-0"
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Graphique</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddBlock('table')}
                  className="h-9 w-9 p-0"
                >
                  <Table className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tableau</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddBlock('kpi_card')}
                  className="h-9 w-9 p-0"
                >
                  <Gauge className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Carte KPI</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Media & formatting */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddBlock('image')}
                  className="h-9 w-9 p-0"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Image</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <List className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Liste</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => onAddBlock('list', { listType: 'bullet' })}
                >
                  <List className="h-4 w-4 mr-2" />
                  Liste à puces
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAddBlock('list', { listType: 'numbered' })}
                >
                  <ListOrdered className="h-4 w-4 mr-2" />
                  Liste numérotée
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddBlock('quote')}
                  className="h-9 w-9 p-0"
                >
                  <Quote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Citation</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Encadré</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                {calloutVariants.map((variant) => (
                  <DropdownMenuItem
                    key={variant.variant}
                    onClick={() =>
                      onAddBlock('callout', { variant: variant.variant })
                    }
                  >
                    <span
                      className={cn('w-3 h-3 rounded-full mr-2', variant.color)}
                    />
                    {variant.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddBlock('divider')}
                  className="h-9 w-9 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Séparateur</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddBlock('pagebreak')}
                  className="h-9 w-9 p-0"
                >
                  <SeparatorHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Saut de page</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Library button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenDataLibrary}
                className="h-9 px-3 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Catalogue</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ouvrir le catalogue de données</p>
            </TooltipContent>
          </Tooltip>

          {/* AI Generate */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onGenerateWithAI}
                className="h-9 px-3 gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">IA</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Générer avec l'IA</p>
            </TooltipContent>
          </Tooltip>

          {/* Selection actions */}
          {selectedBlockId && (
            <>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveBlock('up')}
                      disabled={!canMoveUp}
                      className="h-9 w-9 p-0"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Monter</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveBlock('down')}
                      disabled={!canMoveDown}
                      className="h-9 w-9 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Descendre</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDuplicateBlock}
                      className="h-9 w-9 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dupliquer</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDeleteBlock}
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supprimer</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
