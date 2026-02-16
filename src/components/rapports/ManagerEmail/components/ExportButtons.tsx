// ============================================================================
// COMPOSANT - Boutons d'Export PDF et Excel
// ============================================================================

import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import type { Action, Jalon } from '@/types';
import { AXE_LABELS } from '../hooks/useMonthlyReport';
import { logger } from '@/lib/logger';

interface ExportButtonsProps {
  periodeLabel: string;
  projectName: string;
  actionsduMois: Action[];
  jalonsduMois: Jalon[];
  actionsByAxe: Record<string, Action[]>;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export function ExportButtons({
  periodeLabel,
  projectName,
  actionsduMois,
  jalonsduMois,
  actionsByAxe,
}: ExportButtonsProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);

    try {
      // Import dynamique de jsPDF
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Titre
      doc.setFontSize(18);
      doc.setTextColor(24, 24, 27);
      doc.text('RAPPORT MENSUEL DÉTAILLÉ', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text(periodeLabel, pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(113, 113, 122);
      doc.text(`Projet : ${projectName}`, pageWidth / 2, 36, { align: 'center' });

      let yPosition = 50;

      // Récapitulatif
      doc.setFontSize(12);
      doc.setTextColor(24, 24, 27);
      doc.text('RÉCAPITULATIF', 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Actions du mois : ${actionsduMois.length}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Jalons du mois : ${jalonsduMois.length}`, 14, yPosition);
      yPosition += 12;

      // Tableau des actions par axe
      Object.entries(actionsByAxe).forEach(([axe, actions]) => {
        if (actions.length === 0) return;

        const axeLabel = AXE_LABELS[axe] || axe;

        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(24, 24, 27);
        doc.text(`${axeLabel} (${actions.length} actions)`, 14, yPosition);
        yPosition += 6;

        // Tableau des actions
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Action', 'Responsable', 'Fin prévue', 'Avancement']],
          body: actions.map((a) => [
            a.titre.substring(0, 40) + (a.titre.length > 40 ? '...' : ''),
            a.responsable || 'N/A',
            formatDate(a.date_fin_prevue),
            `${a.avancement || 0}%`,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      });

      // Tableau des jalons
      if (jalonsduMois.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(24, 24, 27);
        doc.text(`JALONS DU MOIS (${jalonsduMois.length})`, 14, yPosition);
        yPosition += 6;

        (doc as any).autoTable({
          startY: yPosition,
          head: [['Jalon', 'Axe', 'Responsable', 'Date', 'Statut']],
          body: jalonsduMois.map((j) => [
            j.titre.substring(0, 30) + (j.titre.length > 30 ? '...' : ''),
            AXE_LABELS[j.axe]?.replace(/^AXE \d+ - /, '') || j.axe,
            j.responsable || 'N/A',
            formatDate(j.date_prevue),
            j.statut || 'À venir',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [147, 51, 234], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
        });
      }

      // Pied de page
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170);
        doc.text(
          `COCKPIT Project Management - ${periodeLabel} - Page ${i}/${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Télécharger
      const fileName = `rapport-mensuel-${periodeLabel.toLowerCase().replace(' ', '-')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      logger.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);

    try {
      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

      // Feuille Récapitulatif
      const summaryData = [
        ['RAPPORT MENSUEL DÉTAILLÉ'],
        [periodeLabel],
        ['Projet', projectName],
        [''],
        ['RÉCAPITULATIF'],
        ['Actions du mois', actionsduMois.length],
        ['Jalons du mois', jalonsduMois.length],
        ['Actions en retard', actionsduMois.filter(a => {
          const today = new Date();
          return a.date_fin_prevue && new Date(a.date_fin_prevue) < today && (a.avancement || 0) < 100;
        }).length],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Récapitulatif');

      // Feuille Actions
      const actionsHeaders = ['Code', 'Titre', 'Axe', 'Responsable', 'Date début', 'Date fin', 'Avancement', 'Statut'];
      const actionsData = actionsduMois.map((a) => [
        a.code || '',
        a.titre,
        AXE_LABELS[a.axe]?.replace(/^AXE \d+ - /, '') || a.axe,
        a.responsable || '',
        formatDate(a.date_debut),
        formatDate(a.date_fin_prevue),
        `${a.avancement || 0}%`,
        a.statut || '',
      ]);
      const actionsSheet = XLSX.utils.aoa_to_sheet([actionsHeaders, ...actionsData]);
      XLSX.utils.book_append_sheet(workbook, actionsSheet, 'Actions');

      // Feuille Jalons
      const jalonsHeaders = ['Code', 'Titre', 'Axe', 'Responsable', 'Date prévue', 'Statut'];
      const jalonsData = jalonsduMois.map((j) => [
        j.code || '',
        j.titre,
        AXE_LABELS[j.axe]?.replace(/^AXE \d+ - /, '') || j.axe,
        j.responsable || '',
        formatDate(j.date_prevue),
        j.statut || '',
      ]);
      const jalonsSheet = XLSX.utils.aoa_to_sheet([jalonsHeaders, ...jalonsData]);
      XLSX.utils.book_append_sheet(workbook, jalonsSheet, 'Jalons');

      // Feuilles par axe
      Object.entries(actionsByAxe).forEach(([axe, actions]) => {
        if (actions.length === 0) return;

        const axeLabel = AXE_LABELS[axe]?.replace(/^AXE \d+ - /, '') || axe;
        const axeData = actions.map((a) => [
          a.code || '',
          a.titre,
          a.responsable || '',
          formatDate(a.date_debut),
          formatDate(a.date_fin_prevue),
          `${a.avancement || 0}%`,
          a.statut || '',
        ]);
        const axeSheet = XLSX.utils.aoa_to_sheet([
          ['Code', 'Titre', 'Responsable', 'Date début', 'Date fin', 'Avancement', 'Statut'],
          ...axeData,
        ]);
        XLSX.utils.book_append_sheet(workbook, axeSheet, axeLabel.substring(0, 31));
      });

      // Télécharger
      const fileName = `rapport-mensuel-${periodeLabel.toLowerCase().replace(' ', '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      logger.error('Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel. Veuillez réessayer.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Bouton PDF */}
      <button
        onClick={handleExportPdf}
        disabled={isExportingPdf}
        className="
          inline-flex items-center gap-2 px-4 py-2.5
          bg-red-50 text-red-700 border border-red-200
          rounded-lg font-medium text-sm
          hover:bg-red-100 hover:border-red-300
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isExportingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        PDF
      </button>

      {/* Bouton Excel */}
      <button
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        className="
          inline-flex items-center gap-2 px-4 py-2.5
          bg-green-50 text-green-700 border border-green-200
          rounded-lg font-medium text-sm
          hover:bg-green-100 hover:border-green-300
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Excel
      </button>
    </div>
  );
}

export default ExportButtons;
