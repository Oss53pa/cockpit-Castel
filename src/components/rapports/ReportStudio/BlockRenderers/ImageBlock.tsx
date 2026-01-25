import React, { useState } from 'react';
import { Image as ImageIcon, Edit2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ImageBlock as ImageBlockType } from '@/types/reportStudio';

interface ImageBlockProps {
  block: ImageBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageBlockType>) => void;
  onEdit: () => void;
}

export function ImageBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onEdit,
}: ImageBlockProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const getAlignmentClass = () => {
    switch (block.alignment) {
      case 'left':
        return 'justify-start';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-center';
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
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
      {/* Alignment controls */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white rounded-lg shadow-sm border p-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ alignment: 'left' });
            }}
            className={cn(
              'p-1.5 rounded transition-colors',
              block.alignment === 'left'
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            )}
            title="Aligner à gauche"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ alignment: 'center' });
            }}
            className={cn(
              'p-1.5 rounded transition-colors',
              block.alignment === 'center' || !block.alignment
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            )}
            title="Centrer"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ alignment: 'right' });
            }}
            className={cn(
              'p-1.5 rounded transition-colors',
              block.alignment === 'right'
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            )}
            title="Aligner à droite"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-8 w-8 p-0"
            title="Modifier l'image"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Image container */}
      <div className={cn('flex', getAlignmentClass())}>
        {block.src ? (
          <figure className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {hasError ? (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg text-gray-500">
                <ImageIcon className="h-12 w-12 mb-2" />
                <p className="text-sm">Impossible de charger l'image</p>
                <p className="text-xs mt-1 text-gray-400">{block.src}</p>
              </div>
            ) : (
              <img
                src={block.src}
                alt={block.alt}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  maxWidth: block.width ? `${block.width}px` : '100%',
                  height: block.height ? `${block.height}px` : 'auto',
                }}
                className={cn(
                  'rounded-lg shadow-sm',
                  isLoading && 'opacity-0'
                )}
              />
            )}
            {block.caption && (
              <figcaption className="mt-2 text-sm text-gray-500 text-center italic">
                {block.caption}
              </figcaption>
            )}
          </figure>
        ) : (
          <div
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">Cliquez pour ajouter une image</p>
          </div>
        )}
      </div>
    </div>
  );
}
