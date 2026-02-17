// ============================================================================
// EXPORT PDF ET PPTX POUR LE TABLEAU DE BORD COPIL
// ============================================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgen from 'pptxgenjs';
import { formatCurrency } from '@/lib/utils';
import {
  COLORS,
  drawProgressBar,
  drawSectionHeader,
  drawKPIRow,
  drawInfoBox,
  drawSeparator,
} from '@/services/pdfChartService';

// ============================================================================
// TYPES
// ============================================================================

interface COPILExportData {
  projectName: string;
  date: string;
  meteo: {
    avancementProjet: number;
    avancementMobilisation: number;
    budget: number;
    risques: number;
    jalons: number;
  };
  risques: Array<{
    id: number;
    titre: string;
    score: number;
    probabilite_actuelle: number;
    impact_actuel: number;
    proprietaire?: string;
    categorie: string;
  }>;
  jalons: Array<{
    id: number;
    titre: string;
    date_prevue?: string;
    statut: string;
    axe: string;
    responsable?: string;
  }>;
  budget: {
    prevu: number;
    engage: number;
    realise: number;
    tauxRealisation: number;
  };
  alertes: Array<{
    id: number;
    titre: string;
    message: string;
    criticite: string;
  }>;
  decisions: Array<{
    id: number;
    titre: string;
    responsable?: string;
  }>;
}

// ============================================================================
// COULEURS ET STYLES
// ============================================================================

const COPIL_COLORS = {
  primary: '1C3163',
  secondary: '64748B',
  success: '16A34A',
  warning: 'CA8A04',
  error: 'DC2626',
  info: '2563EB',
  light: 'F8FAFC',
  white: 'FFFFFF',
};

const getMeteoEmoji = (value: number, isRisk: boolean = false): string => {
  if (isRisk) {
    // For risks: 0 critical = sunny, 1-2 = cloudy, 3+ = stormy
    if (value === 0) return '☀️';
    if (value <= 2) return '⛅';
    return '🌧️';
  }
  // For progress: 80+ = sunny, 50-79 = cloudy, 25-49 = rainy, <25 = stormy
  if (value >= 80) return '☀️';
  if (value >= 50) return '🌤️';
  if (value >= 25) return '⛅';
  return '🌧️';
};

const getMeteoColor = (value: number, isRisk: boolean = false): string => {
  if (isRisk) {
    if (value === 0) return COPIL_COLORS.success;
    if (value <= 2) return COPIL_COLORS.warning;
    return COPIL_COLORS.error;
  }
  if (value >= 80) return COPIL_COLORS.success;
  if (value >= 50) return COPIL_COLORS.warning;
  if (value >= 25) return COPIL_COLORS.warning;
  return COPIL_COLORS.error;
};

// ============================================================================
// EXPORT PDF
// ============================================================================

export function exportCOPILToPDF(data: COPILExportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // ========================================================================
  // PAGE 1: COUVERTURE
  // ========================================================================

  // Header band
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLEAU DE BORD COPIL', pageWidth / 2, 30, { align: 'center' });

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(data.projectName, pageWidth / 2, 42, { align: 'center' });

  // Date
  doc.setFontSize(12);
  doc.text(
    new Date(data.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    pageWidth / 2,
    52,
    { align: 'center' }
  );

  // Logo placeholder
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.text('Comité de Pilotage', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // ========================================================================
  // PAGE 2: MÉTÉO PROJET
  // ========================================================================
  doc.addPage();
  currentY = drawSectionHeader(doc, 'Météo Projet', pageWidth);

  // Weather indicators in a row
  const meteoItems = [
    { label: 'Avancement Projet', value: data.meteo.avancementProjet },
    { label: 'Mobilisation', value: data.meteo.avancementMobilisation },
    { label: 'Budget', value: Math.min(data.meteo.budget, 100) },
    { label: 'Risques Critiques', value: data.meteo.risques, isRisk: true },
    { label: 'Jalons', value: data.meteo.jalons },
  ];

  const colWidth = contentWidth / 5;
  meteoItems.forEach((item, i) => {
    const x = margin + i * colWidth;

    // Background
    doc.setFillColor(...COLORS.bgLight);
    doc.roundedRect(x + 2, currentY, colWidth - 4, 35, 2, 2, 'F');

    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    const labelLines = doc.splitTextToSize(item.label, colWidth - 8);
    doc.text(labelLines, x + colWidth / 2, currentY + 6, { align: 'center' });

    // Value with emoji
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    const emoji = getMeteoEmoji(item.value, item.isRisk);
    const valueText = item.isRisk ? `${item.value}` : `${Math.round(item.value)}%`;
    doc.text(`${emoji} ${valueText}`, x + colWidth / 2, currentY + 25, { align: 'center' });
  });

  currentY += 45;

  // Progress bars
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Détail des indicateurs', margin, currentY);
  currentY += 8;

  meteoItems.filter(m => !m.isRisk).forEach((item) => {
    const color = item.value >= 70
      ? COLORS.success
      : item.value >= 40
      ? COLORS.warning
      : COLORS.error;
    currentY = drawProgressBar(doc, margin, currentY, contentWidth, 6, item.value, {
      label: item.label,
      showValue: true,
      color,
    });
  });

  // ========================================================================
  // PAGE 3: TOP 5 RISQUES
  // ========================================================================
  doc.addPage();
  currentY = drawSectionHeader(doc, 'Top 5 Risques Actifs', pageWidth);

  if (data.risques.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Aucun risque actif', pageWidth / 2, currentY + 20, { align: 'center' });
  } else {
    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Score', 'Titre', 'P×I', 'Propriétaire']],
      body: data.risques.map((r, i) => [
        `${i + 1}`,
        r.score.toString(),
        r.titre.substring(0, 40) + (r.titre.length > 40 ? '...' : ''),
        `${r.probabilite_actuelle ?? r.probabilite}×${r.impact_actuel ?? r.impact}`,
        r.proprietaire || 'N/A',
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 80 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 40 },
      },
      didDrawCell: (data) => {
        // Color code the score cell
        if (data.section === 'body' && data.column.index === 1) {
          const score = parseInt(data.cell.text[0]);
          if (score >= 16) {
            doc.setFillColor(...COLORS.error);
          } else if (score >= 10) {
            doc.setFillColor(...COLORS.warning);
          } else {
            doc.setFillColor(...COLORS.info);
          }
          doc.roundedRect(
            data.cell.x + 2,
            data.cell.y + 1,
            data.cell.width - 4,
            data.cell.height - 2,
            1, 1, 'F'
          );
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text(
            data.cell.text[0],
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 1,
            { align: 'center' }
          );
        }
      },
    });
  }

  // ========================================================================
  // PAGE 4: JALONS J-30
  // ========================================================================
  doc.addPage();
  currentY = drawSectionHeader(doc, 'Jalons J-30', pageWidth);

  if (data.jalons.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Aucun jalon dans les 30 prochains jours', pageWidth / 2, currentY + 20, { align: 'center' });
  } else {
    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Jalon', 'Axe', 'Statut', 'Responsable']],
      body: data.jalons.map((j) => [
        j.date_prevue
          ? new Date(j.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
          : 'N/A',
        j.titre.substring(0, 35) + (j.titre.length > 35 ? '...' : ''),
        j.axe.replace('axe', '').replace('_', ' ').toUpperCase().substring(0, 10),
        j.statut.replace('_', ' '),
        j.responsable || 'N/A',
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30 },
      },
    });
  }

  // ========================================================================
  // PAGE 5: BUDGET
  // ========================================================================
  doc.addPage();
  currentY = drawSectionHeader(doc, 'Budget', pageWidth);

  // Budget KPIs
  const budgetKPIs = [
    { label: 'Budget Prévu', value: formatCurrency(data.budget.prevu), status: 'neutral' as const },
    { label: 'Budget Engagé', value: formatCurrency(data.budget.engage), status: 'neutral' as const },
    { label: 'Budget Réalisé', value: formatCurrency(data.budget.realise), status: 'neutral' as const },
    {
      label: 'Taux de réalisation',
      value: `${Math.round(data.budget.tauxRealisation)}%`,
      status: data.budget.tauxRealisation > 100 ? 'bad' as const : 'good' as const,
    },
  ];

  currentY = drawKPIRow(doc, margin, currentY, contentWidth, budgetKPIs);
  currentY += 10;

  // Budget bars - calcul sécurisé pour éviter division par zéro
  const budgetPrevu = data.budget.prevu || 1; // Éviter division par zéro
  const budgetBars = [
    { label: 'Prévu', value: 100, color: COLORS.primary },
    { label: 'Engagé', value: data.budget.prevu > 0 ? Math.min((data.budget.engage / budgetPrevu) * 100, 200) : 0, color: COLORS.info },
    { label: 'Réalisé', value: data.budget.prevu > 0 ? Math.min((data.budget.realise / budgetPrevu) * 100, 200) : 0, color: COLORS.success },
  ];

  budgetBars.forEach((bar) => {
    currentY = drawProgressBar(doc, margin, currentY, contentWidth, 8, bar.value, {
      label: bar.label,
      showValue: true,
      color: bar.color,
    });
  });

  currentY += 10;

  // Ecart
  const ecart = data.budget.prevu - data.budget.realise;
  const isOverBudget = ecart < 0;
  currentY = drawInfoBox(
    doc,
    margin,
    currentY,
    contentWidth,
    `Écart budgétaire: ${isOverBudget ? '-' : '+'}${formatCurrency(Math.abs(ecart))} (${isOverBudget ? 'Dépassement' : 'Sous contrôle'})`,
    isOverBudget ? 'error' : 'info'
  );

  // ========================================================================
  // PAGE 6: ALERTES
  // ========================================================================
  doc.addPage();
  currentY = drawSectionHeader(doc, 'Alertes en Cours', pageWidth);

  if (data.alertes.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.success);
    doc.text('Aucune alerte en cours', pageWidth / 2, currentY + 20, { align: 'center' });
  } else {
    data.alertes.forEach((alerte) => {
      const type = alerte.criticite === 'critical' || alerte.criticite === 'high' ? 'error' : 'warning';
      currentY = drawInfoBox(doc, margin, currentY, contentWidth, `${alerte.titre}: ${alerte.message}`, type);
    });
  }

  // ========================================================================
  // PAGE 7: DÉCISIONS À PRENDRE
  // ========================================================================
  currentY = drawSeparator(doc, margin, currentY + 10, contentWidth);
  currentY += 5;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Décisions à prendre', margin, currentY);
  currentY += 8;

  if (data.decisions.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.success);
    doc.text('Aucune décision urgente', pageWidth / 2, currentY + 10, { align: 'center' });
  } else {
    data.decisions.forEach((decision, i) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(`${i + 1}. ${decision.titre}`, margin, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textLight);
      doc.text(`Responsable: ${decision.responsable || 'Non assigné'}`, margin + 5, currentY + 5);
      currentY += 12;
    });
  }

  // Save
  const fileName = `COPIL_${data.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// ============================================================================
// EXPORT PPTX
// ============================================================================

export async function exportCOPILToPPTX(data: COPILExportData): Promise<void> {
  const pptx = new pptxgen();

  pptx.author = 'COPIL Dashboard';
  pptx.title = `Tableau de Bord COPIL - ${data.projectName}`;
  pptx.subject = 'Comité de Pilotage';

  // ========================================================================
  // SLIDE 1: COUVERTURE
  // ========================================================================
  const slide1 = pptx.addSlide();

  // Header band
  slide1.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 2.5,
    fill: { color: COPIL_COLORS.primary },
  });

  // Title
  slide1.addText('TABLEAU DE BORD COPIL', {
    x: 0.5,
    y: 0.8,
    w: '90%',
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: COPIL_COLORS.white,
    align: 'center',
  });

  // Project name
  slide1.addText(data.projectName, {
    x: 0.5,
    y: 1.5,
    w: '90%',
    h: 0.4,
    fontSize: 18,
    color: COPIL_COLORS.white,
    align: 'center',
  });

  // Date
  slide1.addText(
    new Date(data.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    {
      x: 0.5,
      y: 3.5,
      w: '90%',
      h: 0.3,
      fontSize: 14,
      color: COPIL_COLORS.secondary,
      align: 'center',
    }
  );

  // ========================================================================
  // SLIDE 2: MÉTÉO PROJET
  // ========================================================================
  const slide2 = pptx.addSlide();

  slide2.addText('Météo Projet', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    fontSize: 24,
    bold: true,
    color: COPIL_COLORS.primary,
  });

  // Weather indicators
  const meteoItems = [
    { label: 'Avancement Projet', value: data.meteo.avancementProjet },
    { label: 'Mobilisation', value: data.meteo.avancementMobilisation },
    { label: 'Budget', value: Math.min(data.meteo.budget, 100) },
    { label: 'Risques Critiques', value: data.meteo.risques, isRisk: true },
    { label: 'Jalons', value: data.meteo.jalons },
  ];

  const boxWidth = 1.7;
  const startX = 0.5;

  meteoItems.forEach((item, i) => {
    const x = startX + i * (boxWidth + 0.2);

    // Background box
    slide2.addShape('rect', {
      x,
      y: 1.2,
      w: boxWidth,
      h: 1.5,
      fill: { color: COPIL_COLORS.light },
      line: { color: 'DDDDDD', width: 0.5 },
    });

    // Label
    slide2.addText(item.label, {
      x,
      y: 1.3,
      w: boxWidth,
      h: 0.4,
      fontSize: 10,
      color: COPIL_COLORS.secondary,
      align: 'center',
    });

    // Value with emoji
    const emoji = getMeteoEmoji(item.value, item.isRisk);
    const valueText = item.isRisk ? `${item.value}` : `${Math.round(item.value)}%`;
    slide2.addText(`${emoji} ${valueText}`, {
      x,
      y: 1.8,
      w: boxWidth,
      h: 0.6,
      fontSize: 20,
      bold: true,
      color: getMeteoColor(item.value, item.isRisk),
      align: 'center',
    });
  });

  // Progress summary
  slide2.addText('Vue d\'ensemble', {
    x: 0.5,
    y: 3,
    w: '90%',
    fontSize: 14,
    bold: true,
    color: COPIL_COLORS.primary,
  });

  const progressData = meteoItems
    .filter((m) => !m.isRisk)
    .map((m) => [m.label, `${Math.round(m.value)}%`]);

  slide2.addTable([[{ text: 'Indicateur', options: { bold: true, fill: { color: COPIL_COLORS.primary }, color: 'FFFFFF' } }, { text: 'Valeur', options: { bold: true, fill: { color: COPIL_COLORS.primary }, color: 'FFFFFF' } }], ...progressData], {
    x: 0.5,
    y: 3.4,
    w: 5,
    fontSize: 10,
    border: { pt: 0.5, color: 'DDDDDD' },
    colW: [3, 2],
  });

  // ========================================================================
  // SLIDE 3: RISQUES + JALONS
  // ========================================================================
  const slide3 = pptx.addSlide();

  slide3.addText('Risques & Jalons', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    fontSize: 24,
    bold: true,
    color: COPIL_COLORS.primary,
  });

  // Risques section
  slide3.addText('Top 5 Risques Actifs', {
    x: 0.5,
    y: 0.9,
    w: 4.5,
    fontSize: 14,
    bold: true,
    color: COPIL_COLORS.error,
  });

  if (data.risques.length > 0) {
    const risquesData = data.risques.slice(0, 5).map((r, i) => [
      `${i + 1}`,
      { text: r.score.toString(), options: { bold: true, color: r.score >= 16 ? COPIL_COLORS.error : r.score >= 10 ? COPIL_COLORS.warning : COPIL_COLORS.info } },
      r.titre.substring(0, 25) + (r.titre.length > 25 ? '...' : ''),
    ]);

    slide3.addTable(
      [
        [
          { text: '#', options: { bold: true, fill: { color: COPIL_COLORS.primary }, color: 'FFFFFF' } },
          { text: 'Score', options: { bold: true, fill: { color: COPIL_COLORS.primary }, color: 'FFFFFF' } },
          { text: 'Risque', options: { bold: true, fill: { color: COPIL_COLORS.primary }, color: 'FFFFFF' } },
        ],
        ...risquesData,
      ],
      {
        x: 0.5,
        y: 1.3,
        w: 4.5,
        fontSize: 9,
        border: { pt: 0.5, color: 'DDDDDD' },
        colW: [0.4, 0.6, 3.5],
      }
    );
  } else {
    slide3.addText('Aucun risque actif', {
      x: 0.5,
      y: 1.5,
      fontSize: 10,
      color: COPIL_COLORS.success,
    });
  }

  // Jalons section
  slide3.addText('Jalons J-30', {
    x: 5.5,
    y: 0.9,
    w: 4,
    fontSize: 14,
    bold: true,
    color: COPIL_COLORS.info,
  });

  if (data.jalons.length > 0) {
    const jalonsData = data.jalons.slice(0, 5).map((j) => [
      j.date_prevue
        ? new Date(j.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        : 'N/A',
      j.titre.substring(0, 25) + (j.titre.length > 25 ? '...' : ''),
    ]);

    slide3.addTable(
      [
        [
          { text: 'Date', options: { bold: true, fill: { color: COPIL_COLORS.primary }, color: 'FFFFFF' } },
          { text: 'Jalon', options: { bold: true, fill: { color: COPIL_COLORS.primary }, color: 'FFFFFF' } },
        ],
        ...jalonsData,
      ],
      {
        x: 5.5,
        y: 1.3,
        w: 4,
        fontSize: 9,
        border: { pt: 0.5, color: 'DDDDDD' },
        colW: [0.8, 3.2],
      }
    );
  } else {
    slide3.addText('Aucun jalon à venir', {
      x: 5.5,
      y: 1.5,
      fontSize: 10,
      color: COPIL_COLORS.secondary,
    });
  }

  // ========================================================================
  // SLIDE 4: BUDGET + ALERTES
  // ========================================================================
  const slide4 = pptx.addSlide();

  slide4.addText('Budget & Alertes', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    fontSize: 24,
    bold: true,
    color: COPIL_COLORS.primary,
  });

  // Budget section
  slide4.addText('Synthèse Budget', {
    x: 0.5,
    y: 0.9,
    w: 4.5,
    fontSize: 14,
    bold: true,
    color: COPIL_COLORS.success,
  });

  const budgetData = [
    ['Budget Prévu', formatCurrency(data.budget.prevu)],
    ['Budget Engagé', formatCurrency(data.budget.engage)],
    ['Budget Réalisé', formatCurrency(data.budget.realise)],
    ['Taux de réalisation', `${Math.round(data.budget.tauxRealisation)}%`],
  ];

  slide4.addTable(
    [
      [
        { text: 'Poste', options: { bold: true, fill: { color: COPIL_COLORS.primary }, color: 'FFFFFF' } },
        { text: 'Montant', options: { bold: true, fill: { color: COPIL_COLORS.primary }, color: 'FFFFFF' } },
      ],
      ...budgetData,
    ],
    {
      x: 0.5,
      y: 1.3,
      w: 4.5,
      fontSize: 10,
      border: { pt: 0.5, color: 'DDDDDD' },
      colW: [2.5, 2],
    }
  );

  // Ecart
  const ecart = data.budget.prevu - data.budget.realise;
  const isOverBudget = ecart < 0;
  slide4.addText(
    `Écart: ${isOverBudget ? '-' : '+'}${formatCurrency(Math.abs(ecart))}`,
    {
      x: 0.5,
      y: 3.2,
      w: 4.5,
      fontSize: 12,
      bold: true,
      color: isOverBudget ? COPIL_COLORS.error : COPIL_COLORS.success,
    }
  );

  // Alertes section
  slide4.addText('Alertes en Cours', {
    x: 5.5,
    y: 0.9,
    w: 4,
    fontSize: 14,
    bold: true,
    color: COPIL_COLORS.warning,
  });

  if (data.alertes.length > 0) {
    let alertY = 1.3;
    data.alertes.slice(0, 4).forEach((alerte) => {
      const color =
        alerte.criticite === 'critical'
          ? COPIL_COLORS.error
          : alerte.criticite === 'high'
          ? COPIL_COLORS.warning
          : COPIL_COLORS.info;

      slide4.addShape('rect', {
        x: 5.5,
        y: alertY,
        w: 4,
        h: 0.6,
        fill: { color: color + '20' },
        line: { color, width: 1 },
      });

      slide4.addText(alerte.titre.substring(0, 30), {
        x: 5.6,
        y: alertY + 0.15,
        w: 3.8,
        fontSize: 9,
        color: color,
        bold: true,
      });

      alertY += 0.7;
    });
  } else {
    slide4.addText('Aucune alerte en cours', {
      x: 5.5,
      y: 1.5,
      fontSize: 10,
      color: COPIL_COLORS.success,
    });
  }

  // ========================================================================
  // SLIDE 5: DÉCISIONS + FAITS MARQUANTS
  // ========================================================================
  const slide5 = pptx.addSlide();

  slide5.addText('Décisions & Actions', {
    x: 0.5,
    y: 0.3,
    w: '90%',
    fontSize: 24,
    bold: true,
    color: COPIL_COLORS.primary,
  });

  // Decisions section
  slide5.addText('Décisions à Prendre', {
    x: 0.5,
    y: 0.9,
    w: '90%',
    fontSize: 14,
    bold: true,
    color: '#8B5CF6', // Purple
  });

  if (data.decisions.length > 0) {
    const decisionsText = data.decisions
      .slice(0, 4)
      .map((d, i) => `${i + 1}. ${d.titre} (${d.responsable || 'Non assigné'})`)
      .join('\n');

    slide5.addText(decisionsText, {
      x: 0.5,
      y: 1.3,
      w: 9,
      fontSize: 11,
      color: COPIL_COLORS.secondary,
      bullet: false,
    });
  } else {
    slide5.addText('Aucune décision urgente en attente', {
      x: 0.5,
      y: 1.5,
      fontSize: 11,
      color: COPIL_COLORS.success,
    });
  }

  // Summary box
  slide5.addShape('rect', {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 1.2,
    fill: { color: COPIL_COLORS.light },
    line: { color: COPIL_COLORS.primary, width: 1 },
  });

  slide5.addText('Points Clés', {
    x: 0.6,
    y: 3.6,
    w: 8.8,
    fontSize: 12,
    bold: true,
    color: COPIL_COLORS.primary,
  });

  const summaryPoints = [
    `Avancement global: ${Math.round(data.meteo.avancementProjet)}%`,
    `Risques critiques: ${data.meteo.risques}`,
    `Jalons à venir: ${data.jalons.length}`,
    `Budget: ${data.budget.tauxRealisation > 100 ? 'Dépassement' : 'Sous contrôle'}`,
  ].join(' | ');

  slide5.addText(summaryPoints, {
    x: 0.6,
    y: 4,
    w: 8.8,
    fontSize: 10,
    color: COPIL_COLORS.secondary,
  });

  // Footer on all slides
  [slide1, slide2, slide3, slide4, slide5].forEach((slide, i) => {
    if (i > 0) {
      slide.addText(`${data.projectName} | COPIL | ${new Date().toLocaleDateString('fr-FR')}`, {
        x: 0.5,
        y: 5.2,
        w: '90%',
        fontSize: 8,
        color: COPIL_COLORS.secondary,
      });
    }
  });

  // Save
  const fileName = `COPIL_${data.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName });
}
