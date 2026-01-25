import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { HeadingBlock as HeadingBlockType } from '@/types/reportStudio';

interface HeadingBlockProps {
  block: HeadingBlockType;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<HeadingBlockType>) => void;
}

const headingStyles = {
  1: 'text-3xl font-bold text-gray-900',
  2: 'text-2xl font-bold text-gray-900',
  3: 'text-xl font-semibold text-gray-800',
  4: 'text-lg font-semibold text-gray-800',
  5: 'text-base font-semibold text-gray-700',
  6: 'text-sm font-semibold text-gray-700 uppercase tracking-wide',
};

export function HeadingBlock({
  block,
  isSelected,
  isEditing,
  onSelect,
  onUpdate,
}: HeadingBlockProps) {
  const [localContent, setLocalContent] = useState(block.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  useEffect(() => {
    if (isSelected && isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isSelected, isEditing]);

  const handleBlur = () => {
    if (localContent !== block.content) {
      onUpdate({ content: localContent });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setLocalContent(block.content);
      inputRef.current?.blur();
    }
  };

  const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;

  if (isSelected && isEditing) {
    return (
      <div
        className={cn(
          'relative rounded-lg transition-all',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2'
        )}
        onClick={onSelect}
      >
        <input
          ref={inputRef}
          type="text"
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full p-2 bg-white border-0 focus:outline-none',
            headingStyles[block.level]
          )}
          placeholder={`Titre niveau ${block.level}`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50'
      )}
      onClick={onSelect}
    >
      {block.content ? (
        <HeadingTag className={headingStyles[block.level]}>
          {block.content}
        </HeadingTag>
      ) : (
        <p className={cn('text-gray-400 italic', headingStyles[block.level])}>
          Titre niveau {block.level}
        </p>
      )}
    </div>
  );
}
