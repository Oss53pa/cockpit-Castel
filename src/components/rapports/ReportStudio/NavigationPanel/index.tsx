import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  FileText,
  BarChart2,
  Table,
  Image,
  CheckSquare,
  AlertTriangle,
  Target,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SectionItem } from './SectionItem';
import type { Section } from '@/types/reportStudio';

interface NavigationPanelProps {
  sections: Section[];
  selectedSectionId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectSection: (sectionId: string) => void;
  onToggleSectionCollapse: (sectionId: string) => void;
  onToggleSectionLock: (sectionId: string) => void;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddSection: (icon?: string) => void;
  onReorderSections?: (activeId: string, overId: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
  onUpdateSectionTitle?: (sectionId: string, newTitle: string) => void;
}

const sectionTemplates = [
  { icon: 'FileText', label: 'Section texte', description: 'Introduction, conclusion, analyse...' },
  { icon: 'BarChart2', label: 'Section graphiques', description: 'Visualisations de données' },
  { icon: 'Table', label: 'Section tableaux', description: 'Données tabulaires' },
  { icon: 'Gauge', label: 'Section KPIs', description: 'Indicateurs clés' },
  { icon: 'CheckSquare', label: 'Actions & Recommandations', description: 'Plan d\'action' },
  { icon: 'AlertTriangle', label: 'Risques & Alertes', description: 'Points d\'attention' },
  { icon: 'Target', label: 'Objectifs & Perspectives', description: 'Cibles et projections' },
];

const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    FileText: <FileText className="h-4 w-4" />,
    BarChart2: <BarChart2 className="h-4 w-4" />,
    Table: <Table className="h-4 w-4" />,
    Image: <Image className="h-4 w-4" />,
    Gauge: <Gauge className="h-4 w-4" />,
    CheckSquare: <CheckSquare className="h-4 w-4" />,
    AlertTriangle: <AlertTriangle className="h-4 w-4" />,
    Target: <Target className="h-4 w-4" />,
  };
  return icons[iconName] || <FileText className="h-4 w-4" />;
};

export function NavigationPanel({
  sections,
  selectedSectionId,
  isCollapsed,
  onToggleCollapse,
  onSelectSection,
  onToggleSectionCollapse,
  onToggleSectionLock,
  onEditSection,
  onDeleteSection,
  onAddSection,
  onReorderSections,
  onDuplicateSection,
  onUpdateSectionTitle,
}: NavigationPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filterSections = (sections: Section[], query: string): Section[] => {
    if (!query) return sections;

    return sections
      .map((section) => {
        const matchesTitle = section.title.toLowerCase().includes(query.toLowerCase());
        const filteredChildren = filterSections(section.children, query);

        if (matchesTitle || filteredChildren.length > 0) {
          return {
            ...section,
            children: filteredChildren,
            isCollapsed: false,
          };
        }
        return null;
      })
      .filter(Boolean) as Section[];
  };

  const filteredSections = filterSections(sections, searchQuery);
  const sectionIds = filteredSections.map((s) => s.id);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id && onReorderSections) {
      onReorderSections(active.id as string, over.id as string);
    }
  };

  const activeSection = activeId ? filteredSections.find((s) => s.id === activeId) : null;

  if (isCollapsed) {
    return (
      <div className="w-14 h-full bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col items-center py-4 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 transition-colors"
          title="Afficher le panneau"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </Button>
        {/* Mini section indicators */}
        <div className="mt-4 space-y-2">
          {filteredSections.slice(0, 5).map((section) => (
            <div
              key={section.id}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all",
                selectedSectionId === section.id
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
              onClick={() => onSelectSection(section.id)}
              title={section.title}
            >
              {getIconComponent(section.icon || 'FileText')}
            </div>
          ))}
          {filteredSections.length > 5 && (
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
              +{filteredSections.length - 5}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 h-full bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200 flex flex-col shadow-sm">
      {/* Header with gradient */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-sm text-gray-800">Sections</h3>
          <span className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
            {filteredSections.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 transition-colors"
          title="Masquer le panneau"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </Button>
      </div>

      {/* Add section button - At the top */}
      <div className="px-3 py-2.5 bg-gradient-to-b from-white to-gray-50/50 border-b border-gray-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="w-full h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom" className="w-72 p-2">
            <div className="text-xs font-medium text-gray-500 px-2 py-1.5 mb-1">Types de sections</div>
            {sectionTemplates.map((template) => (
              <DropdownMenuItem
                key={template.icon}
                onClick={() => {
                  console.log('DropdownMenuItem clicked:', template.icon);
                  onAddSection(template.icon);
                }}
                className="flex items-start gap-3 py-2.5 px-2 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  template.icon === 'FileText' && "bg-blue-100 text-blue-600",
                  template.icon === 'BarChart2' && "bg-purple-100 text-purple-600",
                  template.icon === 'Table' && "bg-emerald-100 text-emerald-600",
                  template.icon === 'Gauge' && "bg-amber-100 text-amber-600",
                  template.icon === 'CheckSquare' && "bg-green-100 text-green-600",
                  template.icon === 'AlertTriangle' && "bg-red-100 text-red-600",
                  template.icon === 'Target' && "bg-indigo-100 text-indigo-600",
                )}>
                  {getIconComponent(template.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-800">{template.label}</div>
                  <div className="text-xs text-gray-500 truncate">{template.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search with modern styling */}
      <div className="px-3 py-2.5 border-b border-gray-100 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher une section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 rounded-lg focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Sections list with DnD */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {filteredSections.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sectionIds}
                strategy={verticalListSortingStrategy}
              >
                {filteredSections.map((section) => (
                  <SectionItem
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    depth={0}
                    onSelect={() => onSelectSection(section.id)}
                    onToggleCollapse={() => onToggleSectionCollapse(section.id)}
                    onToggleLock={() => onToggleSectionLock(section.id)}
                    onEdit={() => onEditSection(section.id)}
                    onDelete={() => onDeleteSection(section.id)}
                    onDuplicate={onDuplicateSection ? () => onDuplicateSection(section.id) : undefined}
                    onUpdateTitle={onUpdateSectionTitle ? (newTitle) => onUpdateSectionTitle(section.id, newTitle) : undefined}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeSection ? (
                  <div className="bg-white shadow-xl rounded-lg border-2 border-blue-300 px-4 py-3 text-sm font-medium text-gray-700 flex items-center gap-2">
                    {getIconComponent(activeSection.icon || 'FileText')}
                    {activeSection.title}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {searchQuery ? 'Aucune section trouvée' : 'Aucune section'}
              </p>
              <p className="text-xs text-gray-400">
                {searchQuery ? 'Essayez avec d\'autres termes' : 'Cliquez ci-dessous pour commencer'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

    </div>
  );
}
