import React, { useState, useRef, useEffect } from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalloutBlock as CalloutBlockType, CalloutVariant } from '@/types/reportStudio';
import { CALLOUT_VARIANT_COLORS } from '@/types/reportStudio';

interface CalloutBlockProps {
  block: CalloutBlockType;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CalloutBlockType>) => void;
}

const variantIcons: Record<CalloutVariant, React.ReactNode> = {
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  tip: <Lightbulb className="h-5 w-5" />,
};

export function CalloutBlock({
  block,
  isSelected,
  isEditing,
  onSelect,
  onUpdate,
}: CalloutBlockProps) {
  const [localContent, setLocalContent] = useState(block.content);
  const [localTitle, setLocalTitle] = useState(block.title || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colors = CALLOUT_VARIANT_COLORS[block.variant];

  useEffect(() => {
    setLocalContent(block.content);
    setLocalTitle(block.title || '');
  }, [block.content, block.title]);

  useEffect(() => {
    if (isSelected && isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSelected, isEditing]);

  const handleBlur = () => {
    if (localContent !== block.content || localTitle !== block.title) {
      onUpdate({ content: localContent, title: localTitle || undefined });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalContent(block.content);
      setLocalTitle(block.title || '');
      textareaRef.current?.blur();
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border-l-4 p-4 transition-all cursor-pointer',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={{
        backgroundColor: colors.bg,
        borderLeftColor: colors.border,
      }}
      onClick={onSelect}
    >
      <div className="flex gap-3">
        <div style={{ color: colors.border }} className="flex-shrink-0 mt-0.5">
          {variantIcons[block.variant]}
        </div>
        <div className="flex-1 min-w-0">
          {isSelected && isEditing ? (
            <>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleBlur}
                className="w-full mb-2 px-2 py-1 text-sm font-semibold bg-white/50 border border-transparent rounded focus:border-gray-300 focus:outline-none"
                style={{ color: colors.text }}
                placeholder="Titre (optionnel)"
              />
              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[60px] px-2 py-1 text-sm bg-white/50 border border-transparent rounded resize-none focus:border-gray-300 focus:outline-none"
                style={{ color: colors.text }}
                placeholder="Contenu de l'encadré..."
              />
            </>
          ) : (
            <>
              {block.title && (
                <h5
                  className="font-semibold text-sm mb-1"
                  style={{ color: colors.text }}
                >
                  {block.title}
                </h5>
              )}
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: colors.text }}
              >
                {block.content || 'Cliquez pour ajouter du contenu...'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
