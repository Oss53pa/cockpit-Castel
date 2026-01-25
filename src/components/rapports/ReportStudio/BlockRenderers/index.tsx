import type { ContentBlock } from '@/types/reportStudio';
import { ParagraphBlock } from './ParagraphBlock';
import { HeadingBlock } from './HeadingBlock';
import { ChartBlock } from './ChartBlock';
import { TableBlock } from './TableBlock';
import { CalloutBlock } from './CalloutBlock';
import { ListBlock } from './ListBlock';
import { KPICardBlock } from './KPICardBlock';
import { DividerBlock } from './DividerBlock';
import { ImageBlock } from './ImageBlock';
import { QuoteBlock } from './QuoteBlock';
import { PageBreakBlock } from './PageBreakBlock';

export {
  ParagraphBlock,
  HeadingBlock,
  ChartBlock,
  TableBlock,
  CalloutBlock,
  ListBlock,
  KPICardBlock,
  DividerBlock,
  ImageBlock,
  QuoteBlock,
  PageBreakBlock,
};

interface BlockRendererProps {
  block: ContentBlock;
  sectionId: string;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onEdit?: () => void;
  onRefresh?: () => void;
}

export function BlockRenderer({
  block,
  sectionId: _sectionId,
  isSelected,
  isEditing,
  onSelect,
  onUpdate,
  onEdit,
  onRefresh,
}: BlockRendererProps) {
  // sectionId is required by interface for context but not used directly in rendering
  void _sectionId;
  switch (block.type) {
    case 'paragraph':
      return (
        <ParagraphBlock
          block={block}
          isSelected={isSelected}
          isEditing={isEditing}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'heading':
      return (
        <HeadingBlock
          block={block}
          isSelected={isSelected}
          isEditing={isEditing}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'chart':
      return (
        <ChartBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onEdit={onEdit || (() => {})}
          onRefresh={onRefresh}
        />
      );

    case 'table':
      return (
        <TableBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onEdit={onEdit || (() => {})}
          onRefresh={onRefresh}
          onUpdate={onUpdate}
        />
      );

    case 'callout':
      return (
        <CalloutBlock
          block={block}
          isSelected={isSelected}
          isEditing={isEditing}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'list':
      return (
        <ListBlock
          block={block}
          isSelected={isSelected}
          isEditing={isEditing}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'kpi_card':
      return (
        <KPICardBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onEdit={onEdit || (() => {})}
        />
      );

    case 'divider':
      return (
        <DividerBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'image':
      return (
        <ImageBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onEdit={onEdit || (() => {})}
        />
      );

    case 'quote':
      return (
        <QuoteBlock
          block={block}
          isSelected={isSelected}
          isEditing={isEditing}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'pagebreak':
      return (
        <PageBreakBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      );

    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            Type de bloc non reconnu: {(block as ContentBlock).type}
          </p>
        </div>
      );
  }
}
