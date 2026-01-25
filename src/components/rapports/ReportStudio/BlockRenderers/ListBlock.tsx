import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ListBlock as ListBlockType, ListItem } from '@/types/reportStudio';
import { v4 as uuidv4 } from 'uuid';

interface ListBlockProps {
  block: ListBlockType;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ListBlockType>) => void;
}

export function ListBlock({
  block,
  isSelected,
  isEditing,
  onSelect,
  onUpdate,
}: ListBlockProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    if (editingItemId) {
      const input = inputRefs.current.get(editingItemId);
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [editingItemId]);

  const handleItemChange = (itemId: string, content: string) => {
    const updateItems = (items: ListItem[]): ListItem[] => {
      return items.map((item) => {
        if (item.id === itemId) {
          return { ...item, content };
        }
        if (item.children) {
          return { ...item, children: updateItems(item.children) };
        }
        return item;
      });
    };
    onUpdate({ items: updateItems(block.items) });
  };

  const handleAddItem = (afterItemId?: string) => {
    const newItem: ListItem = { id: uuidv4(), content: '' };

    if (!afterItemId) {
      onUpdate({ items: [...block.items, newItem] });
      setEditingItemId(newItem.id);
      return;
    }

    const insertAfter = (items: ListItem[]): ListItem[] => {
      const result: ListItem[] = [];
      for (const item of items) {
        result.push(item);
        if (item.id === afterItemId) {
          result.push(newItem);
        }
        if (item.children) {
          item.children = insertAfter(item.children);
        }
      }
      return result;
    };

    onUpdate({ items: insertAfter(block.items) });
    setEditingItemId(newItem.id);
  };

  const handleDeleteItem = (itemId: string) => {
    const filterItems = (items: ListItem[]): ListItem[] => {
      return items
        .filter((item) => item.id !== itemId)
        .map((item) => ({
          ...item,
          children: item.children ? filterItems(item.children) : undefined,
        }));
    };
    onUpdate({ items: filterItems(block.items) });
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem(itemId);
    }
    if (e.key === 'Backspace') {
      const item = block.items.find((i) => i.id === itemId);
      if (item && !item.content) {
        e.preventDefault();
        handleDeleteItem(itemId);
      }
    }
    if (e.key === 'Escape') {
      setEditingItemId(null);
    }
  };

  const renderListItem = (item: ListItem, index: number, level: number = 0) => {
    const isCurrentlyEditing = editingItemId === item.id;

    return (
      <li key={item.id} className={cn('group', level > 0 && 'ml-6')}>
        <div className="flex items-start gap-2">
          {isSelected && isEditing && (
            <span className="flex-shrink-0 mt-1.5 text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4" />
            </span>
          )}
          <div className="flex-1 flex items-start gap-2">
            <span className="flex-shrink-0 mt-1.5 text-gray-400">
              {block.listType === 'numbered' ? `${index + 1}.` : '•'}
            </span>
            {isSelected && isEditing ? (
              <input
                ref={(el) => {
                  if (el) inputRefs.current.set(item.id, el);
                }}
                type="text"
                value={item.content}
                onChange={(e) => handleItemChange(item.id, e.target.value)}
                onFocus={() => setEditingItemId(item.id)}
                onBlur={() => setEditingItemId(null)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                className={cn(
                  'flex-1 px-2 py-1 text-sm bg-transparent border rounded focus:outline-none',
                  isCurrentlyEditing
                    ? 'border-blue-300 bg-white'
                    : 'border-transparent hover:border-gray-200'
                )}
                placeholder="Saisissez un élément..."
              />
            ) : (
              <span className="flex-1 text-sm text-gray-700 py-1">
                {item.content || <span className="text-gray-400 italic">Élément vide</span>}
              </span>
            )}
            {isSelected && isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {item.children && item.children.length > 0 && (
          <ul className="mt-1">
            {item.children.map((child, childIndex) =>
              renderListItem(child, childIndex, level + 1)
            )}
          </ul>
        )}
      </li>
    );
  };

  const ListTag = block.listType === 'numbered' ? 'ol' : 'ul';

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg transition-all cursor-pointer',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/30'
          : 'hover:bg-gray-50'
      )}
      onClick={onSelect}
    >
      {block.items.length > 0 ? (
        <ListTag className="space-y-1">
          {block.items.map((item, index) => renderListItem(item, index))}
        </ListTag>
      ) : (
        <p className="text-gray-400 italic text-sm">Liste vide</p>
      )}

      {isSelected && isEditing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleAddItem();
          }}
          className="mt-2 h-8 text-xs text-gray-500 hover:text-gray-700"
        >
          <Plus className="h-3 w-3 mr-1" />
          Ajouter un élément
        </Button>
      )}
    </div>
  );
}
