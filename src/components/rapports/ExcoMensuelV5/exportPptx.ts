/**
 * PPTX export for EXCO Mensuel V5
 * Uses pptxgenjs (dynamic import) — mirrors the pattern in ExcoLancement.tsx
 */

import type { ExcoV5Data } from './hooks/useExcoV5Data';
import { AXES_V5, METEO_CONFIG, type MeteoLevel } from './constants';
import { PROJET_CONFIG } from '@/data/constants';

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const NAVY = '263238';
const GOLD = 'B8953F';
const WHITE = 'FFFFFF';
const GRAY = '607d8b';
const LIGHT_BG = 'FAFBFC';
const GREEN = '81C784';
const RED = 'E57373';
const ORANGE = 'FFB74D';
const BLUE = '64B5F6';
const FONT = 'Arial';

// ============================================================================
// HELPERS
// ============================================================================

function meteoColor(level: MeteoLevel): string {
  const map: Record<MeteoLevel, string> = { bleu: BLUE, vert: GREEN, orange: ORANGE, rouge: RED };
  return map[level] || GRAY;
}

function meteoEmoji(level: MeteoLevel): string {
  return METEO_CONFIG[level]?.emoji || '⚪';
}

function pct(n: number): string {
  return `${Math.round(n)}%`;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export async function generateExcoPptx(data: ExcoV5Data, presentationDate: string): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
  pptx.author = `Cockpit ${PROJET_CONFIG.nom}`;
  pptx.title = `EXCO Mensuel — ${presentationDate}`;

  const dateFormatted = new Date(presentationDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Slide helpers
  const addHeader = (slide: ReturnType<typeof pptx.addSlide>, title: string) => {
    // Navy bar
    slide.addShape('rect', { x: 0, y: 0, w: '100%', h: 0.6, fill: { color: NAVY } });
    // Gold accent line
    slide.addShape('rect', { x: 0, y: 0.6, w: '100%', h: 0.04, fill: { color: GOLD } });
    // Title
    slide.addText(title, {
      x: 0.5, y: 0.08, w: 8, h: 0.45,
      fontSize: 18, fontFace: FONT, color: WHITE, bold: true,
    });
    // Date
    slide.addText(dateFormatted, {
      x: 9.5, y: 0.12, w: 3.5, h: 0.35,
      fontSize: 11, fontFace: FONT, color: GOLD, align: 'right',
    });
  };

  const addFooter = (slide: ReturnType<typeof pptx.addSlide>, page: number, total: number) => {
    slide.addText(`EXCO Mensuel — ${dateFormatted}`, {
      x: 0.3, y: 7.05, w: 6, h: 0.35,
      fontSize: 8, fontFace: FONT, color: GRAY,
    });
    slide.addText(`${page} / ${total}`, {
      x: 10, y: 7.05, w: 3, h: 0.35,
      fontSize: 8, fontFace: FONT, color: GRAY, align: 'right',
    });
  };

  const totalSlides = 6;
  let page = 0;

  // ===========================================================================
  // SLIDE 1 — COVER
  // ===========================================================================
  {
    page++;
    const slide = pptx.addSlide();
    slide.background = { fill: NAVY };
    // Gold accent
    slide.addShape('rect', { x: 0, y: 3.2, w: '100%', h: 0.06, fill: { color: GOLD } });
    // Title
    slide.addText(PROJET_CONFIG.nom, {
      x: 1, y: 2, w: 11, h: 1,
      fontSize: 40, fontFace: FONT, color: WHITE, bold: true, align: 'center',
    });
    slide.addText('EXCO Mensuel', {
      x: 1, y: 3.5, w: 11, h: 0.8,
      fontSize: 24, fontFace: FONT, color: GOLD, align: 'center',
    });
    slide.addText(dateFormatted, {
      x: 1, y: 4.5, w: 11, h: 0.6,
      fontSize: 16, fontFace: FONT, color: WHITE, align: 'center',
    });
    slide.addText(`${meteoEmoji(data.meteoGlobale)} Météo globale: ${METEO_CONFIG[data.meteoGlobale]?.label || ''}  |  J-${data.joursRestants}`, {
      x: 1, y: 5.5, w: 11, h: 0.5,
      fontSize: 14, fontFace: FONT, color: GOLD, align: 'center',
    });
    addFooter(slide, page, totalSlides);
  }

  // ===========================================================================
  // SLIDE 2 — EXECUTIVE SUMMARY
  // ===========================================================================
  {
    page++;
    const slide = pptx.addSlide();
    slide.background = { fill: LIGHT_BG };
    addHeader(slide, 'Synthèse Exécutive');

    // KPI row
    const kpis = [
      { label: 'Avancement', value: pct(data.avancementGlobal), color: GREEN },
      { label: 'Projection', value: pct(data.projectionLineaire), color: BLUE },
      { label: 'J restants', value: String(data.joursRestants), color: GOLD },
      { label: 'Confiance', value: data.confidenceScore?.score ? pct(data.confidenceScore.score) : 'N/A', color: meteoColor(data.meteoGlobale) },
    ];

    kpis.forEach((kpi, i) => {
      const x = 0.5 + i * 3.1;
      slide.addShape('roundRect', { x, y: 0.9, w: 2.8, h: 1.1, rectRadius: 0.1, fill: { color: WHITE }, shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.1 } });
      slide.addText(kpi.value, { x, y: 0.95, w: 2.8, h: 0.6, fontSize: 28, fontFace: FONT, color: kpi.color, bold: true, align: 'center' });
      slide.addText(kpi.label, { x, y: 1.5, w: 2.8, h: 0.4, fontSize: 11, fontFace: FONT, color: GRAY, align: 'center' });
    });

    // Messages clés
    if (data.execSummary.length > 0) {
      slide.addText('Messages clés', {
        x: 0.5, y: 2.3, w: 12, h: 0.4,
        fontSize: 14, fontFace: FONT, color: NAVY, bold: true,
      });

      data.execSummary.slice(0, 5).forEach((msg, i) => {
        const typeColor: Record<string, string> = { alerte: ORANGE, blocage: RED, levier: GREEN };
        const bullet = msg.type === 'alerte' ? '⚠️' : msg.type === 'blocage' ? '🚫' : '✅';
        slide.addText(`${bullet} ${msg.title}: ${msg.text}`, {
          x: 0.7, y: 2.8 + i * 0.45, w: 11.5, h: 0.4,
          fontSize: 11, fontFace: FONT, color: NAVY,
          paraSpaceBefore: 2,
        });
      });
    }

    addFooter(slide, page, totalSlides);
  }

  // ===========================================================================
  // SLIDE 3 — DASHBOARD (KPIs table)
  // ===========================================================================
  {
    page++;
    const slide = pptx.addSlide();
    slide.background = { fill: LIGHT_BG };
    addHeader(slide, 'Tableau de Bord');

    const kpis = data.kpis;
    const rows: Array<Array<{ text: string; options?: Record<string, unknown> }>> = [
      [
        { text: 'Indicateur', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Valeur', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Cible', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      ],
      [{ text: 'Jalons atteints' }, { text: `${kpis.jalonsAtteints} / ${kpis.jalonsTotal}` }, { text: '100%' }],
      [{ text: 'Actions terminées' }, { text: `${kpis.actionsTerminees} / ${kpis.actionsTotal}` }, { text: '100%' }],
      [{ text: 'Actions en retard' }, { text: String(kpis.actionsEnRetard) }, { text: '0' }],
      [{ text: 'Risques critiques' }, { text: String(kpis.risquesCritiques) }, { text: '0' }],
      [{ text: 'Risques actifs' }, { text: String(kpis.risquesActifs) }, { text: '—' }],
    ];

    slide.addTable(rows, {
      x: 0.5, y: 0.9, w: 12,
      fontSize: 11, fontFace: FONT,
      border: { pt: 0.5, color: 'E0E0E0' },
      colW: [5, 3.5, 3.5],
      rowH: [0.4, 0.35, 0.35, 0.35, 0.35, 0.35],
      autoPage: false,
    });

    addFooter(slide, page, totalSlides);
  }

  // ===========================================================================
  // SLIDE 4 — SCORECARD AXES
  // ===========================================================================
  {
    page++;
    const slide = pptx.addSlide();
    slide.background = { fill: LIGHT_BG };
    addHeader(slide, 'Scorecard Axes');

    const headerRow = [
      { text: 'Axe', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Avanc.', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Prévu', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Écart', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Risques', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Météo', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
    ];

    const dataRows = data.axesData.map((axe) => {
      const ecart = axe.avancement - axe.prevu;
      return [
        { text: `${axe.icon} ${axe.label}` },
        { text: pct(axe.avancement) },
        { text: pct(axe.prevu) },
        { text: `${ecart >= 0 ? '+' : ''}${pct(ecart)}`, options: { color: ecart >= 0 ? GREEN : RED } },
        { text: `${axe.risquesCritiques}/${axe.risquesActifs}` },
        { text: meteoEmoji(axe.meteo) },
      ];
    });

    slide.addTable([headerRow, ...dataRows], {
      x: 0.3, y: 0.9, w: 12.7,
      fontSize: 10, fontFace: FONT,
      border: { pt: 0.5, color: 'E0E0E0' },
      colW: [3.5, 1.5, 1.5, 1.5, 1.5, 1.2],
      rowH: 0.38,
      autoPage: false,
    });

    addFooter(slide, page, totalSlides);
  }

  // ===========================================================================
  // SLIDE 5 — RISQUES MAJEURS
  // ===========================================================================
  {
    page++;
    const slide = pptx.addSlide();
    slide.background = { fill: LIGHT_BG };
    addHeader(slide, 'Risques Majeurs');

    const top = data.topRisques.slice(0, 6);
    if (top.length === 0) {
      slide.addText('Aucun risque majeur identifié', {
        x: 1, y: 3, w: 11, h: 1,
        fontSize: 16, fontFace: FONT, color: GRAY, align: 'center',
      });
    } else {
      const headerRow = [
        { text: '#', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Risque', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'P×I', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Statut', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      ];

      const rows = top.map((r, i) => {
        const score = (r.probabilite || 0) * (r.impact || 0);
        return [
          { text: String(i + 1) },
          { text: r.titre || r.description || `Risque ${r.id}` },
          { text: String(score) },
          { text: r.statut || 'actif' },
        ];
      });

      slide.addTable([headerRow, ...rows], {
        x: 0.5, y: 0.9, w: 12,
        fontSize: 11, fontFace: FONT,
        border: { pt: 0.5, color: 'E0E0E0' },
        colW: [0.8, 7, 1.5, 2.7],
        rowH: 0.45,
        autoPage: false,
      });
    }

    addFooter(slide, page, totalSlides);
  }

  // ===========================================================================
  // SLIDE 6 — DÉCISIONS EXCO
  // ===========================================================================
  {
    page++;
    const slide = pptx.addSlide();
    slide.background = { fill: LIGHT_BG };
    addHeader(slide, 'Décisions EXCO');

    const decisions = data.decisions.slice(0, 6);
    if (decisions.length === 0) {
      slide.addText('Aucune décision en attente', {
        x: 1, y: 3, w: 11, h: 1,
        fontSize: 16, fontFace: FONT, color: GRAY, align: 'center',
      });
    } else {
      const headerRow = [
        { text: '#', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Décision', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Urgence', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Responsable', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Échéance', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      ];

      const urgenceColor: Record<string, string> = { critique: RED, haute: ORANGE, moyenne: GOLD };

      const rows = decisions.map((d, i) => [
        { text: String(i + 1) },
        { text: d.titre },
        { text: d.urgence, options: { color: urgenceColor[d.urgence] || GRAY } },
        { text: d.responsable },
        { text: d.echeance },
      ]);

      slide.addTable([headerRow, ...rows], {
        x: 0.5, y: 0.9, w: 12,
        fontSize: 11, fontFace: FONT,
        border: { pt: 0.5, color: 'E0E0E0' },
        colW: [0.8, 5, 1.5, 2.5, 2.2],
        rowH: 0.45,
        autoPage: false,
      });
    }

    addFooter(slide, page, totalSlides);
  }

  // ===========================================================================
  // SAVE
  // ===========================================================================
  try {
    await pptx.writeFile({ fileName: `EXCO-Mensuel-${presentationDate}.pptx` });
  } catch (error) {
    console.error('Erreur export PPTX:', error);
    throw new Error('Impossible de générer le fichier PPTX');
  }
}
