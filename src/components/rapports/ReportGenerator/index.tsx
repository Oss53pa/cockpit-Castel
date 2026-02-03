// ============================================================================
// GENERATEUR DE RAPPORTS AUTOMATIQUE
// Genere tous les types de rapports avec selection de periode
// ============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Download,
  Send,
  Eye,
  Paperclip,
  MessageSquare,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  Link2,
  RefreshCw,
  Settings,
  Zap,
  AlertTriangle,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, Button, Badge, Input, Textarea, Select, SelectOption } from '@/components/ui';
import { ReportPeriodSelector, type ReportPeriod } from '../ReportPeriodSelector';
import {
  type ReportType,
  type GeneratedReport,
  type ReportSection,
  type ReportAttachment,
  type ExportOptions,
  REPORT_TYPE_CONFIG,
  DEFAULT_EXPORT_OPTIONS,
} from '@/types/reports.types';
import { useJalons, useActions, useRisques, useCurrentSite } from '@/hooks';
import { db } from '@/db';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES LOCAUX
// ============================================================================

interface ReportGeneratorProps {
  defaultType?: ReportType;
  onExport?: (report: GeneratedReport, format: 'pdf' | 'html' | 'pptx') => void;
  onSend?: (report: GeneratedReport) => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ReportGenerator({
  defaultType = 'flash_hebdo',
  onExport,
  onSend,
}: ReportGeneratorProps) {
  // State
  const [reportType, setReportType] = useState<ReportType>(defaultType);
  const [period, setPeriod] = useState<ReportPeriod | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);

  // Hooks donnees
  const jalons = useJalons();
  const actions = useActions();
  const risques = useRisques();
  const currentSite = useCurrentSite();

  // Date Soft Opening depuis les données du site
  const softOpeningDate = currentSite?.dateOuverture || '2026-11-15';

  // Config du type de rapport
  const reportConfig = REPORT_TYPE_CONFIG[reportType];

  // Generer le rapport automatiquement
  const generateReport = useCallback(async () => {
    if (!period) return;

    setIsGenerating(true);

    try {
      // Filtrer les donnees selon la periode
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);

      const periodJalons = jalons.filter(j => {
        const date = new Date(j.date_prevue);
        return date >= startDate && date <= endDate;
      });

      const periodActions = actions.filter(a => {
        const date = new Date(a.date_fin_prevue || a.dateFin || '');
        return date >= startDate && date <= endDate;
      });

      const periodRisques = risques.filter(r => r.status !== 'ferme');

      // Calculer la meteo globale
      const totalActions = periodActions.length;
      const actionsTerminees = periodActions.filter(a =>
        a.status === 'termine' || a.status === 'FAIT'
      ).length;
      const actionsEnRetard = periodActions.filter(a =>
        a.status === 'en_retard' || a.status === 'BLOQUE'
      ).length;

      const tauxCompletion = totalActions > 0 ? (actionsTerminees / totalActions) * 100 : 0;
      const tauxRetard = totalActions > 0 ? (actionsEnRetard / totalActions) * 100 : 0;

      let meteoGlobale: 'excellent' | 'bon' | 'attention' | 'alerte' | 'critique' = 'excellent';
      if (tauxRetard > 30) meteoGlobale = 'critique';
      else if (tauxRetard > 20) meteoGlobale = 'alerte';
      else if (tauxRetard > 10) meteoGlobale = 'attention';
      else if (tauxCompletion >= 80) meteoGlobale = 'excellent';
      else meteoGlobale = 'bon';

      // Calculer le compte a rebours depuis les données du site
      const softOpening = new Date(softOpeningDate);
      const today = new Date();
      const joursRestants = Math.ceil((softOpening.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Generer les sections selon le type de rapport
      const sections: ReportSection[] = [];

      // Section Meteo (tous les rapports)
      sections.push({
        id: 'meteo',
        titre: 'Meteo Globale',
        ordre: 1,
        type: 'meteo',
        donnees: {
          meteo: meteoGlobale,
          compteARebours: { jours: joursRestants, evenement: 'Soft Opening' },
        },
        piecesJointes: [],
        visible: true,
      });

      // Section KPIs
      sections.push({
        id: 'kpis',
        titre: 'Indicateurs Cles',
        ordre: 2,
        type: 'kpi',
        donnees: {
          actionsTotal: totalActions,
          actionsTerminees,
          actionsEnRetard,
          jalonsTotal: periodJalons.length,
          jalonsAtteints: periodJalons.filter(j =>
            j.statut === 'ATTEINT' || j.statut === 'atteint'
          ).length,
          risquesActifs: periodRisques.length,
          risquesCritiques: periodRisques.filter(r =>
            r.criticite === 'critique' || r.score >= 15
          ).length,
        },
        piecesJointes: [],
        visible: true,
      });

      // Section Jalons critiques (7 jours)
      const prochains7Jours = new Date();
      prochains7Jours.setDate(prochains7Jours.getDate() + 7);

      const jalonsCritiques = jalons
        .filter(j => {
          const date = new Date(j.date_prevue);
          return date >= today && date <= prochains7Jours;
        })
        .slice(0, 5);

      sections.push({
        id: 'jalons',
        titre: 'Jalons Critiques (7 jours)',
        ordre: 3,
        type: 'jalons',
        donnees: jalonsCritiques.map(j => ({
          id: j.id,
          titre: j.titre,
          date: j.date_prevue,
          responsable: j.responsable || 'Non assigne',
          statut: j.statut,
          axe: j.axe,
        })),
        piecesJointes: [],
        visible: true,
      });

      // Section Actions en retard/bloquees
      const actionsBloquees = periodActions
        .filter(a => a.status === 'bloque' || a.status === 'BLOQUE')
        .slice(0, 5);

      sections.push({
        id: 'actions_bloquees',
        titre: 'Actions Bloquees',
        ordre: 4,
        type: 'actions',
        donnees: actionsBloquees.map(a => ({
          id: a.id,
          titre: a.titre,
          raison: a.commentaire_dernier_update || 'Raison non specifiee',
          responsable: a.responsable || 'Non assigne',
          axe: a.axe,
        })),
        piecesJointes: [],
        visible: true,
      });

      // Section Alertes
      const alertes = await db.alertes
        .filter(a => !a.traitee)
        .limit(5)
        .toArray();

      sections.push({
        id: 'alertes',
        titre: 'Alertes Actives',
        ordre: 5,
        type: 'alertes',
        donnees: alertes.map(a => ({
          id: a.id,
          titre: a.titre,
          message: a.message,
          criticite: a.criticite,
          type: a.type,
        })),
        piecesJointes: [],
        visible: true,
      });

      // Section Risques (pour rapport mensuel et deep dive)
      if (reportType !== 'flash_hebdo') {
        const top5Risques = periodRisques
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 5);

        sections.push({
          id: 'risques',
          titre: 'Top 5 Risques',
          ordre: 6,
          type: 'risques',
          donnees: top5Risques.map(r => ({
            id: r.id,
            titre: r.titre,
            score: r.score,
            probabilite: r.probabilite,
            impact: r.impact,
            axe: r.axe_impacte,
            mitigation: r.strategie_reponse,
          })),
          piecesJointes: [],
          visible: true,
        });
      }

      // Section Budget (pour rapport mensuel et deep dive)
      if (reportType === 'rapport_mensuel' || reportType === 'deep_dive') {
        const budget = await db.budget.toArray();
        const budgetTotal = budget.reduce((sum, b) => sum + (b.montant_prevu || 0), 0);
        const budgetConsomme = budget.reduce((sum, b) => sum + (b.montant_realise || 0), 0);

        sections.push({
          id: 'budget',
          titre: 'Suivi Budgetaire',
          ordre: 7,
          type: 'budget',
          donnees: {
            budgetTotal,
            budgetConsomme,
            pourcentageConsomme: budgetTotal > 0 ? Math.round((budgetConsomme / budgetTotal) * 100) : 0,
            ecart: budgetTotal - budgetConsomme,
          },
          piecesJointes: [],
          visible: true,
        });
      }

      // Creer le rapport
      const report: GeneratedReport = {
        id: `RPT-${Date.now()}`,
        type: reportType,
        titre: `${reportConfig.label} - ${period.displayText}`,
        periode: period,
        dateGeneration: new Date().toISOString(),
        genereePar: 'Systeme',
        statut: 'brouillon',
        sections,
        meteoGlobale,
        compteARebours: { jours: joursRestants, evenement: 'Soft Opening' },
        commentaires: [],
        piecesJointes: [],
        destinataires: reportConfig.destinataires.map(d => ({
          nom: d,
          email: '',
        })),
        exports: [],
      };

      setGeneratedReport(report);

      // Ouvrir toutes les sections
      setExpandedSections(new Set(sections.map(s => s.id)));

    } catch (error) {
      console.error('Erreur generation rapport:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [period, reportType, jalons, actions, risques, reportConfig]);

  // Effet: regenerer quand periode ou type change
  useEffect(() => {
    if (period) {
      generateReport();
    }
  }, [period, reportType, generateReport]);

  // Toggle section
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Mettre a jour commentaire section
  const updateSectionComment = (sectionId: string, comment: string) => {
    if (!generatedReport) return;

    setGeneratedReport({
      ...generatedReport,
      sections: generatedReport.sections.map(s =>
        s.id === sectionId ? { ...s, commentaire: comment } : s
      ),
    });
  };

  // Ajouter piece jointe
  const addAttachment = (sectionId: string, attachment: Omit<ReportAttachment, 'id' | 'dateAjout'>) => {
    if (!generatedReport) return;

    const newAttachment: ReportAttachment = {
      ...attachment,
      id: `ATT-${Date.now()}`,
      dateAjout: new Date().toISOString(),
      section: sectionId,
    };

    setGeneratedReport({
      ...generatedReport,
      sections: generatedReport.sections.map(s =>
        s.id === sectionId
          ? { ...s, piecesJointes: [...s.piecesJointes, newAttachment] }
          : s
      ),
    });
  };

  // Supprimer piece jointe
  const removeAttachment = (sectionId: string, attachmentId: string) => {
    if (!generatedReport) return;

    setGeneratedReport({
      ...generatedReport,
      sections: generatedReport.sections.map(s =>
        s.id === sectionId
          ? { ...s, piecesJointes: s.piecesJointes.filter(a => a.id !== attachmentId) }
          : s
      ),
    });
  };

  // Exporter
  const handleExport = async (format: 'pdf' | 'html' | 'pptx') => {
    if (!generatedReport) return;

    setIsExporting(true);

    try {
      // Appeler le callback d'export
      if (onExport) {
        await onExport(generatedReport, format);
      }

      // Mettre a jour les exports du rapport
      setGeneratedReport({
        ...generatedReport,
        exports: [
          ...generatedReport.exports,
          {
            format,
            dateExport: new Date().toISOString(),
          },
        ],
      });
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Icone meteo
  const getMeteoEmoji = (meteo: string) => {
    switch (meteo) {
      case 'excellent': return '☀️';
      case 'bon': return '🌤️';
      case 'attention': return '⛅';
      case 'alerte': return '🌧️';
      case 'critique': return '⛈️';
      default: return '☀️';
    }
  };

  // Icone type de piece jointe
  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <FileImage className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'lien': return <Link2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Selection type et periode */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-900">Generateur de Rapports</h2>
              <p className="text-sm text-primary-500">Generation automatique selon la periode</p>
            </div>
          </div>

          {generatedReport && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={generateReport}
                disabled={isGenerating}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
                Regenerer
              </Button>
            </div>
          )}
        </div>

        {/* Type de rapport */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(Object.keys(REPORT_TYPE_CONFIG) as ReportType[]).map((type) => {
            const config = REPORT_TYPE_CONFIG[type];
            const isSelected = reportType === type;

            return (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  isSelected
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {type === 'flash_hebdo' && <Zap className="h-5 w-5 text-amber-500" />}
                  {type === 'rapport_mensuel' && <FileText className="h-5 w-5 text-blue-500" />}
                  {type === 'deep_dive' && <Target className="h-5 w-5 text-purple-500" />}
                  {type === 'rapport_sync' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  <span className="font-semibold text-primary-900">{config.label}</span>
                </div>
                <p className="text-xs text-primary-500">{config.frequence}</p>
              </button>
            );
          })}
        </div>

        {/* Selecteur de periode */}
        <ReportPeriodSelector
          value={period}
          onChange={setPeriod}
          compact={false}
        />
      </Card>

      {/* Contenu du rapport genere */}
      {isGenerating && (
        <Card padding="md">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="ml-3 text-primary-600">Generation du rapport...</span>
          </div>
        </Card>
      )}

      {generatedReport && !isGenerating && (
        <>
          {/* Apercu du rapport */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-900">
                  {generatedReport.titre}
                </h3>
                <p className="text-sm text-primary-500">
                  Genere le {new Date(generatedReport.dateGeneration).toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Meteo globale */}
                {generatedReport.meteoGlobale && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <span className="text-2xl">{getMeteoEmoji(generatedReport.meteoGlobale)}</span>
                    <span className="text-sm font-medium capitalize">{generatedReport.meteoGlobale}</span>
                  </div>
                )}

                {/* Compte a rebours */}
                {generatedReport.compteARebours && (
                  <Badge variant="info" className="text-sm">
                    J-{generatedReport.compteARebours.jours} {generatedReport.compteARebours.evenement}
                  </Badge>
                )}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {generatedReport.sections.filter(s => s.visible).map((section) => (
                <div key={section.id} className="border rounded-lg overflow-hidden">
                  {/* Header section */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary-900">{section.titre}</span>
                      {section.piecesJointes.length > 0 && (
                        <Badge variant="secondary" size="sm">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {section.piecesJointes.length}
                        </Badge>
                      )}
                      {section.commentaire && (
                        <Badge variant="info" size="sm">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Commentaire
                        </Badge>
                      )}
                    </div>
                    {expandedSections.has(section.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {/* Contenu section */}
                  {expandedSections.has(section.id) && (
                    <div className="p-4 border-t">
                      {/* Donnees auto-generees */}
                      <SectionContent section={section} />

                      {/* Zone commentaire */}
                      <div className="mt-4 pt-4 border-t">
                        <label className="flex items-center gap-2 text-sm font-medium text-primary-700 mb-2">
                          <MessageSquare className="h-4 w-4" />
                          Commentaire (optionnel)
                        </label>
                        <Textarea
                          value={section.commentaire || ''}
                          onChange={(e) => updateSectionComment(section.id, e.target.value)}
                          placeholder="Ajouter un commentaire pour cette section..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      {/* Pieces jointes */}
                      <div className="mt-4 pt-4 border-t">
                        <label className="flex items-center gap-2 text-sm font-medium text-primary-700 mb-2">
                          <Paperclip className="h-4 w-4" />
                          Pieces jointes
                        </label>

                        {section.piecesJointes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {section.piecesJointes.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg group"
                              >
                                {getAttachmentIcon(attachment.type)}
                                {attachment.url ? (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary-600 hover:underline"
                                  >
                                    {attachment.nom}
                                  </a>
                                ) : (
                                  <span className="text-sm text-primary-700">{attachment.nom}</span>
                                )}
                                <button
                                  onClick={() => removeAttachment(section.id, attachment.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Bouton ajouter piece jointe */}
                        <AttachmentUploader
                          onAdd={(attachment) => addAttachment(section.id, attachment)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Actions export */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Exporter le rapport</h3>

            <div className="flex items-center gap-4">
              {reportConfig.formats.includes('pdf') && (
                <Button
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Telecharger PDF
                </Button>
              )}

              {reportConfig.formats.includes('html') && (
                <Button
                  variant="secondary"
                  onClick={() => handleExport('html')}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir HTML
                </Button>
              )}

              {reportConfig.formats.includes('pptx') && (
                <Button
                  variant="secondary"
                  onClick={() => handleExport('pptx')}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  PowerPoint
                </Button>
              )}

              <div className="flex-1" />

              <Button
                variant="ghost"
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Options
              </Button>

              <Button
                variant="primary"
                onClick={() => onSend?.(generatedReport)}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Envoyer
              </Button>
            </div>

            {/* Options d'export */}
            {showExportOptions && (
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.inclurePiecesJointes}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      inclurePiecesJointes: e.target.checked,
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Inclure pieces jointes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.inclureCommentaires}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      inclureCommentaires: e.target.checked,
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Inclure commentaires</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.tableDesMatieres}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      tableDesMatieres: e.target.checked,
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Table des matieres</span>
                </label>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

// Contenu d'une section selon son type
function SectionContent({ section }: { section: ReportSection }) {
  const data = section.donnees as Record<string, unknown>;

  switch (section.type) {
    case 'meteo':
      return (
        <div className="flex items-center gap-4">
          <div className="text-4xl">{getMeteoEmoji((data.meteo as string) || 'bon')}</div>
          <div>
            <p className="font-semibold capitalize">{data.meteo as string}</p>
            {data.compteARebours && (
              <p className="text-sm text-primary-500">
                J-{(data.compteARebours as { jours: number }).jours} avant{' '}
                {(data.compteARebours as { evenement: string }).evenement}
              </p>
            )}
          </div>
        </div>
      );

    case 'kpi':
      return (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{data.actionsTerminees as number}/{data.actionsTotal as number}</p>
            <p className="text-sm text-blue-600">Actions terminees</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">{data.actionsEnRetard as number}</p>
            <p className="text-sm text-red-600">En retard</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{data.jalonsAtteints as number}/{data.jalonsTotal as number}</p>
            <p className="text-sm text-green-600">Jalons atteints</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-700">{data.risquesCritiques as number}</p>
            <p className="text-sm text-amber-600">Risques critiques</p>
          </div>
        </div>
      );

    case 'jalons':
      const jalonsData = data as { id: number; titre: string; date: string; responsable: string; statut: string }[];
      if (!Array.isArray(jalonsData) || jalonsData.length === 0) {
        return <p className="text-sm text-gray-500 italic">Aucun jalon critique dans les 7 prochains jours</p>;
      }
      return (
        <div className="space-y-2">
          {jalonsData.map((jalon) => (
            <div key={jalon.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="font-medium">{jalon.titre}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">{new Date(jalon.date).toLocaleDateString('fr-FR')}</span>
                <span className="text-gray-500">{jalon.responsable}</span>
                <Badge variant={jalon.statut === 'ATTEINT' ? 'success' : 'warning'} size="sm">
                  {jalon.statut}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      );

    case 'actions':
      const actionsData = data as { id: number; titre: string; raison: string; responsable: string }[];
      if (!Array.isArray(actionsData) || actionsData.length === 0) {
        return <p className="text-sm text-gray-500 italic">Aucune action bloquee</p>;
      }
      return (
        <div className="space-y-2">
          {actionsData.map((action) => (
            <div key={action.id} className="p-3 bg-red-50 rounded border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-900">{action.titre}</span>
              </div>
              <p className="text-sm text-red-700">Raison: {action.raison}</p>
              <p className="text-xs text-red-600 mt-1">Responsable: {action.responsable}</p>
            </div>
          ))}
        </div>
      );

    case 'alertes':
      const alertesData = data as { id: number; titre: string; message: string; criticite: string }[];
      if (!Array.isArray(alertesData) || alertesData.length === 0) {
        return <p className="text-sm text-gray-500 italic">Aucune alerte active</p>;
      }
      return (
        <div className="space-y-2">
          {alertesData.map((alerte) => (
            <div key={alerte.id} className="flex items-center gap-3 p-2 bg-amber-50 rounded">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">{alerte.titre}</p>
                <p className="text-sm text-gray-600">{alerte.message}</p>
              </div>
              <Badge variant={alerte.criticite === 'critique' ? 'danger' : 'warning'} size="sm">
                {alerte.criticite}
              </Badge>
            </div>
          ))}
        </div>
      );

    case 'risques':
      const risquesData = data as { id: number; titre: string; score: number; axe: string; mitigation: string }[];
      if (!Array.isArray(risquesData) || risquesData.length === 0) {
        return <p className="text-sm text-gray-500 italic">Aucun risque actif</p>;
      }
      return (
        <div className="space-y-2">
          {risquesData.map((risque, idx) => (
            <div key={risque.id} className="flex items-center gap-3 p-2 bg-orange-50 rounded">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium">{risque.titre}</p>
                <p className="text-xs text-gray-500">{risque.mitigation || 'Aucune mitigation definie'}</p>
              </div>
              <Badge variant={risque.score >= 15 ? 'danger' : 'warning'}>
                Score: {risque.score}
              </Badge>
            </div>
          ))}
        </div>
      );

    case 'budget':
      return (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-700">
              {((data.budgetTotal as number) / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-blue-600">Budget Total</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">
              {((data.budgetConsomme as number) / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-green-600">Consomme</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-700">{data.pourcentageConsomme as number}%</p>
            <p className="text-sm text-purple-600">Taux consommation</p>
          </div>
        </div>
      );

    default:
      return (
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
  }
}

// Helper pour emoji meteo
function getMeteoEmoji(meteo: string) {
  switch (meteo) {
    case 'excellent': return '☀️';
    case 'bon': return '🌤️';
    case 'attention': return '⛅';
    case 'alerte': return '🌧️';
    case 'critique': return '⛈️';
    default: return '☀️';
  }
}

// Composant upload piece jointe
function AttachmentUploader({
  onAdd,
}: {
  onAdd: (attachment: Omit<ReportAttachment, 'id' | 'dateAjout'>) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'image' | 'document' | 'excel' | 'pdf' | 'lien'>('lien');
  const [nom, setNom] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (!nom) return;

    onAdd({
      nom,
      type,
      url: url || undefined,
    });

    setNom('');
    setUrl('');
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une piece jointe
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <Select
        value={type}
        onChange={(e) => setType(e.target.value as typeof type)}
        className="w-28"
      >
        <SelectOption value="lien">Lien</SelectOption>
        <SelectOption value="document">Document</SelectOption>
        <SelectOption value="image">Image</SelectOption>
        <SelectOption value="excel">Excel</SelectOption>
        <SelectOption value="pdf">PDF</SelectOption>
      </Select>

      <Input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Nom..."
        className="flex-1"
      />

      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL..."
        className="flex-1"
      />

      <Button size="sm" onClick={handleAdd}>
        <Check className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default ReportGenerator;
