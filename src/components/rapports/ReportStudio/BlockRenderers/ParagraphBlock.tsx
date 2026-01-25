import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ParagraphBlock as ParagraphBlockType } from '@/types/reportStudio';
import { FormattingToolbar, type TextFormatting } from '../Toolbar/FormattingToolbar';

interface ParagraphBlockProps {
  block: ParagraphBlockType;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ParagraphBlockType>) => void;
}

export function ParagraphBlock({
  block,
  isSelected,
  isEditing,
  onSelect,
  onUpdate,
}: ParagraphBlockProps) {
  const [localContent, setLocalContent] = useState(block.content);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  useEffect(() => {
    if (isSelected && isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Position toolbar above the block
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setToolbarPosition({
          top: rect.top,
          left: rect.left + rect.width / 2,
        });
      }
    }
  }, [isSelected, isEditing]);

  const handleBlur = () => {
    if (localContent !== block.content) {
      onUpdate({ content: localContent });
    }
  };

  const handleFormatChange = useCallback((format: Partial<TextFormatting>) => {
    onUpdate({
      formatting: {
        ...block.formatting,
        ...format,
      },
    });
  }, [block.formatting, onUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalContent(block.content);
      textareaRef.current?.blur();
    }
    // Keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleFormatChange({ bold: !block.formatting?.bold });
          break;
        case 'i':
          e.preventDefault();
          handleFormatChange({ italic: !block.formatting?.italic });
          break;
        case 'u':
          e.preventDefault();
          handleFormatChange({ underline: !block.formatting?.underline });
          break;
      }
    }
  };

  const getTextAlignment = () => {
    switch (block.formatting?.alignment) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'justify':
        return 'text-justify';
      default:
        return 'text-left';
    }
  };

  const getTextStyles = () => {
    const styles: React.CSSProperties = {};
    if (block.formatting?.color) {
      styles.color = block.formatting.color;
    }
    if (block.formatting?.fontSize) {
      styles.fontSize = `${block.formatting.fontSize}px`;
    }
    return styles;
  };

  if (isSelected && isEditing) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'relative rounded-lg transition-all',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2'
        )}
        onClick={onSelect}
      >
        <FormattingToolbar
          isVisible={true}
          position={toolbarPosition}
          formatting={{
            bold: block.formatting?.bold,
            italic: block.formatting?.italic,
            underline: block.formatting?.underline,
            strikethrough: block.formatting?.strikethrough,
            alignment: block.formatting?.alignment,
            highlight: block.formatting?.highlight,
          }}
          onFormatChange={handleFormatChange}
        />
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full min-h-[80px] p-3 bg-white border-0 resize-none focus:outline-none',
            'text-gray-700 leading-relaxed',
            getTextAlignment(),
            block.formatting?.bold && 'font-bold',
            block.formatting?.italic && 'italic',
            block.formatting?.underline && 'underline',
            block.formatting?.strikethrough && 'line-through'
          )}
          style={{
            ...getTextStyles(),
            backgroundColor: block.formatting?.highlight && block.formatting.highlight !== 'transparent'
              ? block.formatting.highlight
              : undefined,
          }}
          placeholder="Saisissez votre texte..."
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50'
      )}
      onClick={onSelect}
    >
      {block.content ? (
        <p
          className={cn(
            'text-gray-700 leading-relaxed whitespace-pre-wrap',
            getTextAlignment(),
            block.formatting?.bold && 'font-bold',
            block.formatting?.italic && 'italic',
            block.formatting?.underline && 'underline',
            block.formatting?.strikethrough && 'line-through'
          )}
          style={{
            ...getTextStyles(),
            backgroundColor: block.formatting?.highlight && block.formatting.highlight !== 'transparent'
              ? block.formatting.highlight
              : undefined,
          }}
        >
          {block.content}
        </p>
      ) : (
        <p className="text-gray-400 italic">Cliquez pour ajouter du texte...</p>
      )}
    </div>
  );
}
