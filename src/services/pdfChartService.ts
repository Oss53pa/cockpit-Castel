// ============================================================================
// SERVICE DE GRAPHIQUES PDF - VERSION PROFESSIONNELLE SOBRE
// Couleurs neutres, design épuré
// ============================================================================

import type { jsPDF } from 'jspdf';

// Palette de couleurs professionnelle et sobre
export const COLORS = {
  // Couleurs principales
  primary: [30, 41, 59] as [number, number, number], // slate-800
  secondary: [71, 85, 105] as [number, number, number], // slate-500
  text: [15, 23, 42] as [number, number, number], // slate-900
  textLight: [100, 116, 139] as [number, number, number], // slate-400

  // Fonds
  bgLight: [248, 250, 252] as [number, number, number], // slate-50
  bgMedium: [241, 245, 249] as [number, number, number], // slate-100
  white: [255, 255, 255] as [number, number, number],

  // Statuts (tons désaturés)
  success: [22, 163, 74] as [number, number, number], // green-600
  warning: [202, 138, 4] as [number, number, number], // yellow-600
  error: [220, 38, 38] as [number, number, number], // red-600
  info: [37, 99, 235] as [number, number, number], // blue-600

  // Bordures
  border: [226, 232, 240] as [number, number, number], // slate-200
  borderDark: [203, 213, 225] as [number, number, number], // slate-300
};

// ============================================================================
// BARRE DE PROGRESSION SIMPLE
// ============================================================================
export function drawProgressBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  percentage: number,
  options?: {
    label?: string;
    showValue?: boolean;
    color?: [number, number, number];
  }
) {
  const { label, showValue = true, color = COLORS.primary } = options || {};
  const normalizedPct = Math.min(100, Math.max(0, percentage));

  // Label à gauche
  if (label) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    const truncated = label.length > 22 ? label.substring(0, 20) + '...' : label;
    doc.text(truncated, x, y + height - 1);
  }

  const barX = label ? x + 55 : x;
  const barWidth = label ? width - 55 - 25 : width - 25;

  // Fond gris
  doc.setFillColor(...COLORS.bgMedium);
  doc.rect(barX, y, barWidth, height, 'F');

  // Barre de progression
  if (normalizedPct > 0) {
    const progressWidth = (normalizedPct / 100) * barWidth;
    doc.setFillColor(...color);
    doc.rect(barX, y, progressWidth, height, 'F');
  }

  // Valeur à droite
  if (showValue) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(`${Math.round(normalizedPct)}%`, barX + barWidth + 3, y + height - 1);
  }

  return y + height + 4;
}

// ============================================================================
// LISTE DE BARRES DE PROGRESSION
// ============================================================================
export function drawProgressList(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  data: Array<{ label: string; value: number; color?: [number, number, number] }>,
  options?: { title?: string; barHeight?: number }
) {
  const { title, barHeight = 6 } = options || {};
  let currentY = y;

  if (title) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(title, x, currentY);
    currentY += 8;
  }

  data.forEach((item) => {
    const color = item.value >= 70 ? COLORS.success : item.value >= 40 ? COLORS.warning : COLORS.error;
    currentY = drawProgressBar(doc, x, currentY, width, barHeight, item.value, {
      label: item.label,
      showValue: true,
      color: item.color || color,
    });
  });

  return currentY;
}

// ============================================================================
// INDICATEUR KPI SIMPLE (texte seul, pas de carte colorée)
// ============================================================================
export function drawKPIText(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string | number,
  options?: { status?: 'good' | 'warning' | 'bad' | 'neutral'; small?: boolean }
) {
  const { status, small = false } = options || {};

  // Label
  doc.setFontSize(small ? 7 : 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text(label, x, y);

  // Valeur
  doc.setFontSize(small ? 12 : 14);
  doc.setFont('helvetica', 'bold');

  if (status === 'good') {
    doc.setTextColor(...COLORS.success);
  } else if (status === 'warning') {
    doc.setTextColor(...COLORS.warning);
  } else if (status === 'bad') {
    doc.setTextColor(...COLORS.error);
  } else {
    doc.setTextColor(...COLORS.text);
  }

  doc.text(String(value), x, y + (small ? 8 : 10));

  return y + (small ? 15 : 18);
}

// ============================================================================
// LIGNE DE KPIS HORIZONTALE
// ============================================================================
export function drawKPIRow(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  kpis: Array<{ label: string; value: string | number; status?: 'good' | 'warning' | 'bad' | 'neutral' }>
) {
  const colWidth = width / kpis.length;

  kpis.forEach((kpi, i) => {
    drawKPIText(doc, x + i * colWidth, y, kpi.label, kpi.value, { status: kpi.status });
  });

  return y + 20;
}

// ============================================================================
// ENCADRE D'INFORMATION SOBRE
// ============================================================================
export function drawInfoBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  text: string,
  type: 'info' | 'warning' | 'error' = 'info'
) {
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(text, width - 8);
  const height = lines.length * 4.5 + 6;

  // Fond très léger
  const bgColors = {
    info: [241, 245, 249] as [number, number, number],
    warning: [254, 252, 232] as [number, number, number],
    error: [254, 242, 242] as [number, number, number],
  };
  doc.setFillColor(...bgColors[type]);
  doc.rect(x, y, width, height, 'F');

  // Barre latérale
  const barColors = {
    info: COLORS.secondary,
    warning: COLORS.warning,
    error: COLORS.error,
  };
  doc.setFillColor(...barColors[type]);
  doc.rect(x, y, 2, height, 'F');

  // Texte
  const textColors = {
    info: COLORS.secondary,
    warning: [133, 77, 14] as [number, number, number],
    error: [153, 27, 27] as [number, number, number],
  };
  doc.setTextColor(...textColors[type]);
  doc.setFont('helvetica', 'normal');
  doc.text(lines, x + 6, y + 5);

  doc.setTextColor(...COLORS.text);
  return y + height + 4;
}

// ============================================================================
// SEPARATEUR HORIZONTAL
// ============================================================================
export function drawSeparator(doc: jsPDF, x: number, y: number, width: number) {
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + width, y);
  return y + 5;
}

// ============================================================================
// SOUS-TITRE DE SECTION
// ============================================================================
export function drawSubtitle(doc: jsPDF, x: number, y: number, text: string) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(text, x, y);
  return y + 6;
}

// ============================================================================
// TABLEAU SIMPLE DE STATISTIQUES
// ============================================================================
export function drawStatsTable(
  doc: jsPDF,
  x: number,
  y: number,
  data: Array<{ label: string; value: string | number; highlight?: boolean }>
) {
  let currentY = y;
  const rowHeight = 7;

  data.forEach((row, i) => {
    // Fond alterné
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.bgLight);
      doc.rect(x, currentY - 4, 90, rowHeight, 'F');
    }

    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text(row.label, x + 2, currentY);

    // Valeur
    doc.setFont('helvetica', row.highlight ? 'bold' : 'normal');
    doc.setTextColor(...(row.highlight ? COLORS.error : COLORS.text));
    doc.text(String(row.value), x + 70, currentY, { align: 'right' });

    currentY += rowHeight;
  });

  return currentY + 2;
}

// ============================================================================
// EN-TETE DE SECTION SOBRE
// ============================================================================
export function drawSectionHeader(
  doc: jsPDF,
  title: string,
  pageWidth: number
) {
  // Bande grise sobre
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 12, 'F');

  // Titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 8);

  doc.setTextColor(...COLORS.text);
  return 20;
}

// ============================================================================
// INDICATEUR PASTILLE DE STATUT
// ============================================================================
export function drawStatusDot(
  doc: jsPDF,
  x: number,
  y: number,
  status: 'good' | 'warning' | 'bad' | 'neutral'
) {
  const colors = {
    good: COLORS.success,
    warning: COLORS.warning,
    bad: COLORS.error,
    neutral: COLORS.secondary,
  };
  doc.setFillColor(...colors[status]);
  doc.circle(x, y, 2, 'F');
}

// ============================================================================
// MATRICE DES RISQUES SIMPLE
// ============================================================================
export function drawRiskMatrix(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  risks: Array<{ probability: number; impact: number }>
) {
  const cellSize = size / 5;

  // Couleurs de la matrice (vert -> jaune -> rouge)
  const getColor = (row: number, col: number): [number, number, number] => {
    const score = (5 - row) * (col + 1);
    if (score >= 12) return [254, 202, 202]; // rouge clair
    if (score >= 6) return [254, 240, 138]; // jaune clair
    return [187, 247, 208]; // vert clair
  };

  // Dessiner la grille
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cellX = x + col * cellSize;
      const cellY = y + row * cellSize;

      doc.setFillColor(...getColor(row, col));
      doc.rect(cellX, cellY, cellSize, cellSize, 'F');

      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.2);
      doc.rect(cellX, cellY, cellSize, cellSize, 'S');
    }
  }

  // Placer les risques
  risks.forEach((risk) => {
    if (risk.probability && risk.impact) {
      const col = Math.min(4, Math.max(0, risk.impact - 1));
      const row = Math.min(4, Math.max(0, 5 - risk.probability));
      const dotX = x + col * cellSize + cellSize / 2;
      const dotY = y + row * cellSize + cellSize / 2;

      doc.setFillColor(...COLORS.primary);
      doc.circle(dotX, dotY, 2.5, 'F');
    }
  });

  // Labels axes
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Impact', x + size / 2, y + size + 8, { align: 'center' });

  // Label Y vertical
  doc.text('P', x - 6, y + size / 2);

  return y + size + 12;
}

// ============================================================================
// GRAPHIQUE EN BARRES VERTICALES SIMPLE
// ============================================================================
export function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: Array<{ label: string; value: number; color?: [number, number, number] }>,
  options?: { title?: string; maxValue?: number }
) {
  const { title, maxValue: customMax } = options || {};
  let currentY = y;

  if (title) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(title, x, currentY);
    currentY += 8;
  }

  const chartHeight = height - (title ? 8 : 0) - 15;
  const maxValue = customMax || Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min(25, (width - 10) / data.length - 5);
  const startX = x + (width - (data.length * (barWidth + 5))) / 2;

  // Dessiner les barres
  data.forEach((item, i) => {
    const barX = startX + i * (barWidth + 5);
    const barHeight = (item.value / maxValue) * chartHeight;
    const barY = currentY + chartHeight - barHeight;

    // Barre
    const color = item.color || COLORS.primary;
    doc.setFillColor(...color);
    doc.rect(barX, barY, barWidth, barHeight, 'F');

    // Valeur au-dessus
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(String(item.value), barX + barWidth / 2, barY - 2, { align: 'center' });

    // Label en dessous
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    const shortLabel = item.label.length > 8 ? item.label.substring(0, 7) + '.' : item.label;
    doc.text(shortLabel, barX + barWidth / 2, currentY + chartHeight + 6, { align: 'center' });
  });

  return currentY + height;
}

// ============================================================================
// JAUGE CIRCULAIRE SIMPLE
// ============================================================================
export function drawGaugeSimple(
  doc: jsPDF,
  x: number,
  y: number,
  radius: number,
  percentage: number,
  label: string
) {
  const normalizedPct = Math.min(100, Math.max(0, percentage));

  // Cercle de fond
  doc.setDrawColor(...COLORS.bgMedium);
  doc.setLineWidth(4);
  doc.circle(x, y, radius, 'S');

  // Arc de progression (approximation par segments)
  if (normalizedPct > 0) {
    doc.setDrawColor(...COLORS.primary);
    const segments = Math.ceil(normalizedPct / 10);
    for (let i = 0; i < segments; i++) {
      const startAngle = -90 + (i * 10 / 100) * 360;
      const endAngle = -90 + (Math.min((i + 1) * 10, normalizedPct) / 100) * 360;
      const _midAngle = (startAngle + endAngle) / 2;

      const x1 = x + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = y + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = x + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = y + radius * Math.sin((endAngle * Math.PI) / 180);

      doc.line(x1, y1, x2, y2);
    }
  }

  // Pourcentage au centre
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(`${Math.round(normalizedPct)}%`, x, y + 3, { align: 'center' });

  // Label en dessous
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text(label, x, y + radius + 8, { align: 'center' });
}
