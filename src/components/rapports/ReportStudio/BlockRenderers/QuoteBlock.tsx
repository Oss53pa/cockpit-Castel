import React, { useState, useRef, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuoteBlock as QuoteBlockType } from '@/types/reportStudio';

interface QuoteBlockProps {
  block: QuoteBlockType;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<QuoteBlockType>) => void;
}

export function QuoteBlock({
  block,
  isSelected,
  isEditing,
  onSelect,
  onUpdate,
}: QuoteBlockProps) {
  const [localContent, setLocalContent] = useState(block.content);
  const [localAuthor, setLocalAuthor] = useState(block.author || '');
  const [localSource, setLocalSource] = useState(block.source || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalContent(block.content);
    setLocalAuthor(block.author || '');
    setLocalSource(block.source || '');
  }, [block.content, block.author, block.source]);

  useEffect(() => {
    if (isSelected && isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSelected, isEditing]);

  const handleBlur = () => {
    if (
      localContent !== block.content ||
      localAuthor !== block.author ||
      localSource !== block.source
    ) {
      onUpdate({
        content: localContent,
        author: localAuthor || undefined,
        source: localSource || undefined,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalContent(block.content);
      setLocalAuthor(block.author || '');
      setLocalSource(block.source || '');
      textareaRef.current?.blur();
    }
  };

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg transition-all cursor-pointer',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/30'
          : 'hover:bg-gray-50'
      )}
      onClick={onSelect}
    >
      <blockquote className="relative pl-6 border-l-4 border-gray-300">
        {/* Quote icon */}
        <Quote className="absolute -left-3 -top-2 h-6 w-6 text-gray-300 bg-white" />

        {isSelected && isEditing ? (
          <div className="space-y-3">
            {/* Content */}
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full min-h-[80px] px-2 py-1 text-lg italic text-gray-700 bg-white/50 border border-transparent rounded resize-none focus:border-gray-300 focus:outline-none"
              placeholder="Saisissez la citation..."
            />

            {/* Author & Source */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Auteur</label>
                <input
                  type="text"
                  value={localAuthor}
                  onChange={(e) => setLocalAuthor(e.target.value)}
                  onBlur={handleBlur}
                  className="w-full px-2 py-1 text-sm bg-white/50 border border-transparent rounded focus:border-gray-300 focus:outline-none"
                  placeholder="Nom de l'auteur"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Source</label>
                <input
                  type="text"
                  value={localSource}
                  onChange={(e) => setLocalSource(e.target.value)}
                  onBlur={handleBlur}
                  className="w-full px-2 py-1 text-sm bg-white/50 border border-transparent rounded focus:border-gray-300 focus:outline-none"
                  placeholder="Source (livre, article...)"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-lg italic text-gray-700 leading-relaxed">
              {block.content || (
                <span className="text-gray-400">Cliquez pour ajouter une citation...</span>
              )}
            </p>
            {(block.author || block.source) && (
              <footer className="mt-3 text-sm text-gray-500">
                {block.author && (
                  <cite className="not-italic font-medium">— {block.author}</cite>
                )}
                {block.source && (
                  <span className="text-gray-400">
                    {block.author && ', '}
                    {block.source}
                  </span>
                )}
              </footer>
            )}
          </>
        )}
      </blockquote>
    </div>
  );
}
