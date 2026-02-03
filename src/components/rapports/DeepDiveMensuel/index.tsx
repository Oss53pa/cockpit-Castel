// ============================================================================
// DEEP DIVE MENSUEL V2 - COMPOSANT PRINCIPAL
// Structure conforme au format COPIL avec 6 sections principales
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  MessageSquare,
  GripVertical,
  Eye,
  Download,
  Loader2,
  Settings,
  FileText,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Card, Button, Input, Badge } from '@/components/ui';
import type {
  DeepDiveMensuelSection,
  DeepDiveMensuelSlide,
  DeepDiveDesignSettings,
  AxeType,
  DecisionArbitrageData,
} from '@/types/deepDive';
import {
  DEEP_DIVE_MENSUEL_SECTIONS,
  toggleSlideInclusion,
  updateSlideComment,
  toggleSectionExpanded,
  countActiveSlides,
} from '@/data/deepDiveMensuelTemplate';
import { useCurrentSite } from '@/hooks';
import { useDeepDiveMensuelData } from './hooks/useDeepDiveMensuelData';

// Import slides
import {
  PageGardeSlide,
  AgendaSlide,
  SyntheseExecutiveSlide,
  MeteoGlobaleSlide,
  FaitsMarquantsSlide,
  TableauBordAxesSlide,
  DetailAxeSlide,
  Top5RisquesSlide,
  RisquesEvolutionSlide,
  RisquesConsolidesSlide,
  DecisionsTableSlide,
  ActionsPrioritairesSlide,
  JalonsM1Slide,
  PlanActionsM1Slide,
  SyntheseCloureSlide,
  GanttSlide,
  CourbeSSlide,
} from './slides';

// ============================================================================
// TYPES
// ============================================================================

interface DeepDiveMensuelProps {
  designSettings: DeepDiveDesignSettings;
  onDesignSettingsChange?: (settings: DeepDiveDesignSettings) => void;
  decisions?: DecisionArbitrageData[];
  onExport?: () => void;
}

// ============================================================================
// SORTABLE SLIDE ITEM
// ============================================================================

interface SortableSlideItemProps {
  slide: DeepDiveMensuelSlide;
  slideNumber: number;
  onToggle: () => void;
  onCommentEdit: (comment: string) => void;
  isEditingComment: boolean;
  onEditCommentToggle: () => void;
}

function SortableSlideItem({
  slide,
  slideNumber,
  onToggle,
  onCommentEdit,
  isEditingComment,
  onEditCommentToggle,
}: SortableSlideItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 rounded-lg border transition-all ${
        slide.included
          ? 'bg-primary-50 border-primary-200'
          : 'bg-gray-50 border-gray-200 opacity-60'
      } ${isDragging ? 'shadow-lg ring-2 ring-primary-400' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
            slide.included ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}
        >
          {slide.included ? slideNumber : '-'}
        </div>

        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span
            className={`text-xs font-medium ${
              slide.included ? 'text-primary-900' : 'text-gray-500'
            }`}
          >
            {slide.numero}
          </span>
          <span
            className={`flex-1 text-xs truncate ${
              slide.included ? 'text-primary-900' : 'text-gray-500'
            }`}
          >
            {slide.titre}
          </span>
          {slide.included ? (
            <CheckCircle className="h-4 w-4 text-success-500 shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
          )}
        </button>

        <button
          onClick={onEditCommentToggle}
          className="p-1 hover:bg-primary-100 rounded"
        >
          <MessageSquare
            className={`h-3 w-3 ${slide.comment ? 'text-primary-600' : 'text-gray-300'}`}
          />
        </button>
      </div>

      {isEditingComment && slide.included && (
        <div className="mt-2 pl-8">
          <Input
            value={slide.comment || ''}
            onChange={(e) => onCommentEdit(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="text-xs"
          />
        </div>
      )}

      {slide.comment && !isEditingComment && slide.included && (
        <div className="mt-1 pl-8">
          <p className="text-xs text-primary-500 italic truncate">
            {slide.comment}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DeepDiveMensuel({
  designSettings,
  onDesignSettingsChange,
  decisions = [],
  onExport,
}: DeepDiveMensuelProps) {
  // State
  const [sections, setSections] = useState<DeepDiveMensuelSection[]>(
    DEEP_DIVE_MENSUEL_SECTIONS
  );
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('preview');
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Data hooks
  const data = useDeepDiveMensuelData();
  const currentSite = useCurrentSite();

  // Nom du site depuis la DB
  const siteName = currentSite?.nom || 'COSMOS ANGRÉ';

  // Afficher un état de chargement si les données ne sont pas prêtes
  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-primary-900">Chargement des données...</p>
          <p className="text-sm text-primary-500 mt-2">
            Récupération des jalons, actions et risques depuis la base de données
          </p>
        </div>
      </div>
    );
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Computed
  const activeSlides = useMemo(() => {
    return sections.flatMap(section =>
      section.slides.filter(slide => slide.included)
    );
  }, [sections]);

  const activeSlideCount = countActiveSlides(sections);

  // Handlers
  const handleToggleSlide = useCallback((slideId: string) => {
    setSections(prev => toggleSlideInclusion(prev, slideId));
  }, []);

  const handleUpdateComment = useCallback((slideId: string, comment: string) => {
    setSections(prev => updateSlideComment(prev, slideId, comment));
  }, []);

  const handleToggleSection = useCallback((sectionId: string) => {
    setSections(prev => toggleSectionExpanded(prev, sectionId));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections(prevSections => {
      // Find which section contains the active slide
      for (const section of prevSections) {
        const oldIndex = section.slides.findIndex(s => s.id === active.id);
        const newIndex = section.slides.findIndex(s => s.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          return prevSections.map(s =>
            s.id === section.id
              ? { ...s, slides: arrayMove(s.slides, oldIndex, newIndex) }
              : s
          );
        }
      }
      return prevSections;
    });
  }, []);

  const navigatePreview = useCallback(
    (direction: 'prev' | 'next') => {
      if (direction === 'prev' && previewSlideIndex > 0) {
        setPreviewSlideIndex(previewSlideIndex - 1);
      } else if (direction === 'next' && previewSlideIndex < activeSlides.length - 1) {
        setPreviewSlideIndex(previewSlideIndex + 1);
      }
    },
    [previewSlideIndex, activeSlides.length]
  );

  // Render slide preview based on type
  const renderSlidePreview = useCallback(
    (slide: DeepDiveMensuelSlide) => {
      const props = {
        designSettings: {
          primaryColor: designSettings.primaryColor,
          accentColor: designSettings.accentColor,
          fontFamily: designSettings.fontFamily,
        },
        periode: data.periode,
      };

      switch (slide.type) {
        case 'page_garde':
          return (
            <PageGardeSlide
              data={{
                projectName: siteName,
                mois: data.periode,
                date: new Date().toLocaleDateString('fr-FR'),
                presentateur: 'Pamela Atokouna, DGA',
              }}
              {...props}
            />
          );

        case 'agenda':
          return <AgendaSlide {...props} />;

        case 'synthese_executive':
          return (
            <SyntheseExecutiveSlide
              data={{
                meteoGlobale: data.meteoGlobale,
                faitsMarquants: data.faitsMarquants,
              }}
              {...props}
            />
          );

        case 'meteo_globale':
          return <MeteoGlobaleSlide data={data.meteoGlobale} {...props} />;

        case 'faits_marquants':
          return <FaitsMarquantsSlide data={data.faitsMarquants} {...props} />;

        case 'tableau_bord_axes':
          return <TableauBordAxesSlide data={data.tableauBordAxes} {...props} />;

        case 'detail_axe':
          if (slide.axe) {
            return (
              <DetailAxeSlide
                data={data.detailsAxes[slide.axe]}
                {...props}
              />
            );
          }
          return null;

        case 'top_risques':
          return <Top5RisquesSlide data={data.top5Risques} {...props} />;

        case 'risques_evolution':
          return <RisquesEvolutionSlide data={data.risquesEvolution} {...props} />;

        case 'risques_consolides':
          return (
            <RisquesConsolidesSlide
              data={{
                top5Risques: data.top5Risques,
                risquesEvolution: data.risquesEvolution,
              }}
              {...props}
            />
          );

        case 'decisions_table':
          return <DecisionsTableSlide data={decisions} {...props} />;

        case 'actions_prioritaires':
          return (
            <ActionsPrioritairesSlide
              data={data.planActionM1.actionsPrioritaires}
              focusStrategique={data.planActionM1.focusStrategique}
              {...props}
            />
          );

        case 'jalons_m1':
          return <JalonsM1Slide data={data.planActionM1.jalonsM1} {...props} />;

        case 'plan_actions_m1':
          return (
            <PlanActionsM1Slide
              data={{
                actionsPrioritaires: data.planActionM1.actionsPrioritaires,
                jalonsM1: data.planActionM1.jalonsM1,
                focusStrategique: data.planActionM1.focusStrategique,
                periode: data.periode,
              }}
              {...props}
            />
          );

        case 'synthese_cloture':
          return (
            <SyntheseCloureSlide
              data={{
                pointsPositifs: data.faitsMarquants.realisations.slice(0, 3).map(f => f.titre),
                pointsVigilance: data.faitsMarquants.attentions.slice(0, 2).map(f => f.titre),
                decisionsJour: [],
                prochainDeepDive: {
                  date: (() => {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    return nextMonth.toISOString().split('T')[0];
                  })(),
                  heure: '09:00',
                },
              }}
              {...props}
            />
          );

        case 'gantt_simplifie':
          return <GanttSlide data={data.gantt} {...props} />;

        case 'courbe_s':
          return <CourbeSSlide data={data.courbeS} {...props} />;

        default:
          return (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">{slide.titre}</p>
                <p className="text-sm">Slide en cours de développement</p>
              </div>
            </div>
          );
      }
    },
    [data, designSettings, decisions]
  );

  const currentSlide = activeSlides[previewSlideIndex];

  return (
    <div className="flex h-full gap-4">
      {/* Left Panel - Configuration */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-lg border shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'config'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Slides ({activeSlideCount})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'config' ? (
            <div className="space-y-4">
              <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                <h3 className="font-semibold text-primary-900 mb-2">
                  Deep Dive Mensuel V2
                </h3>
                <p className="text-sm text-primary-700">
                  Format COPIL avec 6 sections principales
                </p>
                <div className="mt-2 text-xs text-primary-600">
                  {activeSlideCount} slides sélectionnées
                </div>
              </div>

              {/* Sections list for quick toggle */}
              {sections.map(section => (
                <div key={section.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleToggleSection(section.id)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-sm">
                      {section.numero}. {section.titre}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        {section.slides.filter(s => s.included).length}/
                        {section.slides.length}
                      </Badge>
                      {section.expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-4">
                {sections.map(section => (
                  <div key={section.id}>
                    <button
                      onClick={() => handleToggleSection(section.id)}
                      className="w-full flex items-center justify-between p-2 bg-gray-100 rounded-lg mb-2 hover:bg-gray-200 transition-colors"
                    >
                      <span className="font-semibold text-xs text-gray-700">
                        {section.numero}. {section.titre}
                      </span>
                      {section.expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {section.expanded && (
                      <SortableContext
                        items={section.slides.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1 ml-2">
                          {section.slides.map((slide, idx) => {
                            // Calculate slide number among active slides
                            const slideNumber =
                              activeSlides.findIndex(s => s.id === slide.id) + 1;

                            return (
                              <SortableSlideItem
                                key={slide.id}
                                slide={slide}
                                slideNumber={slideNumber > 0 ? slideNumber : 0}
                                onToggle={() => handleToggleSlide(slide.id)}
                                onCommentEdit={comment =>
                                  handleUpdateComment(slide.id, comment)
                                }
                                isEditingComment={editingCommentId === slide.id}
                                onEditCommentToggle={() =>
                                  setEditingCommentId(
                                    editingCommentId === slide.id ? null : slide.id
                                  )
                                }
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    )}
                  </div>
                ))}
              </div>
            </DndContext>
          )}
        </div>

        {/* Export Button */}
        <div className="p-4 border-t bg-gray-50">
          <Button
            onClick={onExport}
            disabled={isExporting || activeSlideCount === 0}
            className="w-full"
            variant="primary"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter PowerPoint
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col bg-gray-100 rounded-lg overflow-hidden">
        {/* Preview Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigatePreview('prev')}
              disabled={previewSlideIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Slide {previewSlideIndex + 1} / {activeSlides.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigatePreview('next')}
              disabled={previewSlideIndex >= activeSlides.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {currentSlide && (
            <div className="text-sm text-gray-600">
              {currentSlide.numero} - {currentSlide.titre}
            </div>
          )}
        </div>

        {/* Preview Content */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
          {activeSlides.length === 0 ? (
            <div className="text-center text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune slide sélectionnée</p>
              <p className="text-sm">
                Sélectionnez des slides dans le panneau de gauche
              </p>
            </div>
          ) : currentSlide ? (
            <div
              className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden"
              style={{ aspectRatio: '16/9' }}
            >
              {renderSlidePreview(currentSlide)}
            </div>
          ) : null}
        </div>

        {/* Preview Footer - Thumbnails */}
        {activeSlides.length > 0 && (
          <div className="p-4 bg-white border-t overflow-x-auto">
            <div className="flex gap-2">
              {activeSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setPreviewSlideIndex(idx)}
                  className={`shrink-0 w-20 h-12 rounded border-2 text-xs flex items-center justify-center transition-all ${
                    idx === previewSlideIndex
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="truncate px-1">{slide.numero}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeepDiveMensuel;
