import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Link,
  Highlighter,
  Type,
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

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  highlight?: string;
}

interface FormattingToolbarProps {
  isVisible: boolean;
  position?: { top: number; left: number };
  formatting?: TextFormatting;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  onFormatChange: (format: Partial<TextFormatting>) => void;
  onHeadingChange?: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onConvertToList?: (type: 'bullet' | 'numbered') => void;
  onAddLink?: () => void;
}

const highlightColors = [
  { color: '#fef08a', label: 'Jaune' },
  { color: '#bbf7d0', label: 'Vert' },
  { color: '#bfdbfe', label: 'Bleu' },
  { color: '#fecaca', label: 'Rouge' },
  { color: '#e9d5ff', label: 'Violet' },
  { color: 'transparent', label: 'Aucun' },
];

export function FormattingToolbar({
  isVisible,
  position,
  formatting = {},
  headingLevel,
  onFormatChange,
  onHeadingChange,
  onConvertToList,
  onAddLink,
}: FormattingToolbarProps) {
  if (!isVisible) return null;

  const toolbarStyle = position
    ? {
        position: 'fixed' as const,
        top: position.top - 50,
        left: position.left,
        transform: 'translateX(-50%)',
      }
    : {};

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="z-50 animate-fade-in"
        style={toolbarStyle}
      >
        <div className="flex items-center gap-0.5 bg-white rounded-lg shadow-lg border px-1.5 py-1">
          {/* Text style */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormatChange({ bold: !formatting.bold })}
                  className={cn(
                    'h-8 w-8 p-0',
                    formatting.bold && 'bg-gray-200'
                  )}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Gras (Ctrl+B)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormatChange({ italic: !formatting.italic })}
                  className={cn(
                    'h-8 w-8 p-0',
                    formatting.italic && 'bg-gray-200'
                  )}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Italique (Ctrl+I)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormatChange({ underline: !formatting.underline })}
                  className={cn(
                    'h-8 w-8 p-0',
                    formatting.underline && 'bg-gray-200'
                  )}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Souligné (Ctrl+U)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormatChange({ strikethrough: !formatting.strikethrough })}
                  className={cn(
                    'h-8 w-8 p-0',
                    formatting.strikethrough && 'bg-gray-200'
                  )}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Barré</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormatChange({ alignment: 'left' })}
                  className={cn(
                    'h-8 w-8 p-0',
                    formatting.alignment === 'left' && 'bg-gray-200'
                  )}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Aligner à gauche</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormatChange({ alignment: 'center' })}
                  className={cn(
                    'h-8 w-8 p-0',
                    formatting.alignment === 'center' && 'bg-gray-200'
                  )}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Centrer</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormatChange({ alignment: 'right' })}
                  className={cn(
                    'h-8 w-8 p-0',
                    formatting.alignment === 'right' && 'bg-gray-200'
                  )}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Aligner à droite</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormatChange({ alignment: 'justify' })}
                  className={cn(
                    'h-8 w-8 p-0',
                    formatting.alignment === 'justify' && 'bg-gray-200'
                  )}
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Justifier</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {onHeadingChange && (
            <>
              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* Headings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
                    <Type className="h-4 w-4" />
                    <span className="text-xs">
                      {headingLevel ? `H${headingLevel}` : 'Texte'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onHeadingChange(1)}>
                    <Heading1 className="h-4 w-4 mr-2" />
                    Titre 1
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onHeadingChange(2)}>
                    <Heading2 className="h-4 w-4 mr-2" />
                    Titre 2
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onHeadingChange(3)}>
                    <Heading3 className="h-4 w-4 mr-2" />
                    Titre 3
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onHeadingChange(4)}>
                    <Heading4 className="h-4 w-4 mr-2" />
                    Titre 4
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Highlight */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Highlighter
                  className="h-4 w-4"
                  style={{
                    color: formatting.highlight && formatting.highlight !== 'transparent'
                      ? formatting.highlight
                      : undefined,
                  }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <div className="flex gap-1 p-1">
                {highlightColors.map((hl) => (
                  <button
                    key={hl.color}
                    onClick={() => onFormatChange({ highlight: hl.color })}
                    className={cn(
                      'w-6 h-6 rounded border-2 transition-transform hover:scale-110',
                      formatting.highlight === hl.color
                        ? 'border-gray-800'
                        : 'border-gray-200',
                      hl.color === 'transparent' && 'bg-white'
                    )}
                    style={{
                      backgroundColor: hl.color !== 'transparent' ? hl.color : undefined,
                    }}
                    title={hl.label}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {onConvertToList && (
            <>
              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* Lists */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConvertToList('bullet')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Liste à puces</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConvertToList('numbered')}
                    className="h-8 w-8 p-0"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Liste numérotée</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {onAddLink && (
            <>
              <div className="w-px h-5 bg-gray-200 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddLink}
                    className="h-8 w-8 p-0"
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Ajouter un lien</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
