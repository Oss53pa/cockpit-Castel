import React, { useState } from 'react';
import { Edit2, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TableBlock as TableBlockType, TableHeader } from '@/types/reportStudio';

interface TableBlockProps {
  block: TableBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
  onUpdate: (updates: Partial<TableBlockType>) => void;
}

export function TableBlock({
  block,
  isSelected,
  onSelect,
  onEdit,
  onRefresh,
  onUpdate,
}: TableBlockProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(
    block.config.sortBy
      ? { key: block.config.sortBy, direction: block.config.sortDirection || 'asc' }
      : null
  );

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    onUpdate({
      config: {
        ...block.config,
        sortBy: key,
        sortDirection: direction,
      },
    });
  };

  const formatCellValue = (value: unknown, format?: TableHeader['format']): string => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return typeof value === 'number' ? formatCurrency(value) : String(value);
      case 'percent':
        return typeof value === 'number' ? `${value.toFixed(1)}%` : String(value);
      case 'number':
        return typeof value === 'number'
          ? value.toLocaleString('fr-FR')
          : String(value);
      case 'date':
        if (typeof value === 'string' && value !== '-') {
          try {
            return new Date(value).toLocaleDateString('fr-FR');
          } catch {
            return value;
          }
        }
        return String(value);
      default:
        return String(value);
    }
  };

  const sortedRows = React.useMemo(() => {
    if (!sortConfig) return block.rows;

    return [...block.rows].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr, 'fr');
      }
      return bStr.localeCompare(aStr, 'fr');
    });
  }, [block.rows, sortConfig]);

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div
      className={cn(
        'relative bg-white rounded-lg border transition-all cursor-pointer overflow-hidden',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-300'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      {(block.title || isSelected) && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div>
            {block.title && (
              <h4 className="text-base font-semibold text-gray-900">{block.title}</h4>
            )}
          </div>
          {isSelected && (
            <div className="flex items-center gap-1">
              {onRefresh && block.sourceTemplateId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  className="h-8 w-8 p-0"
                  title="Actualiser les données"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-8 w-8 p-0"
                title="Modifier le tableau"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div>
        <table className="w-full table-fixed">
          <thead>
            <tr
              className={cn(
                'border-b',
                block.config.bordered ? 'bg-gray-100' : 'bg-gray-50'
              )}
            >
              {block.headers.map((header) => (
                <th
                  key={header.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider',
                    getAlignmentClass(header.align),
                    header.sortable !== false && 'cursor-pointer hover:bg-gray-200 select-none',
                    block.config.compact && 'px-2 py-2'
                  )}
                  style={header.width ? { width: header.width } : undefined}
                  onClick={(e) => {
                    if (header.sortable !== false) {
                      e.stopPropagation();
                      handleSort(header.key);
                    }
                  }}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      header.align === 'center' && 'justify-center',
                      header.align === 'right' && 'justify-end'
                    )}
                  >
                    <span className="truncate">{header.label}</span>
                    {header.sortable !== false && getSortIcon(header.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'border-b last:border-b-0 transition-colors',
                  block.config.striped && rowIndex % 2 === 1 && 'bg-gray-50',
                  'hover:bg-blue-50/50'
                )}
              >
                {block.headers.map((header) => {
                  const cellValue = formatCellValue(row[header.key], header.format);
                  const rawValue = String(row[header.key] ?? '');
                  const needsTooltip = rawValue.length > 20;

                  return (
                    <td
                      key={header.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-700',
                        getAlignmentClass(header.align),
                        block.config.bordered && 'border-r last:border-r-0',
                        block.config.compact && 'px-2 py-2 text-xs'
                      )}
                    >
                      {needsTooltip ? (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate cursor-default">{cellValue}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-sm">{rawValue}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="block truncate">{cellValue}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {block.config.showTotals && (
            <tfoot>
              <tr className="bg-gray-100 font-semibold border-t-2">
                {block.headers.map((header, index) => (
                  <td
                    key={header.key}
                    className={cn(
                      'px-4 py-3 text-sm text-gray-900',
                      getAlignmentClass(header.align),
                      block.config.compact && 'px-2 py-2 text-xs'
                    )}
                  >
                    {index === 0
                      ? 'Total'
                      : header.format === 'number' || header.format === 'currency'
                      ? formatCellValue(
                          block.rows.reduce((sum, row) => {
                            const val = row[header.key];
                            return sum + (typeof val === 'number' ? val : 0);
                          }, 0),
                          header.format
                        )
                      : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Row count */}
      <div className="px-4 py-2 text-xs text-gray-500 border-t bg-gray-50">
        {block.rows.length} ligne{block.rows.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}
