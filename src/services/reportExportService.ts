// ============================================================================
// SERVICE D'EXPORT DE RAPPORTS - PDF & HTML
// ============================================================================

import type { GeneratedReport, ExportOptions } from '@/types/reports.types';
import { PROJET_CONFIG } from '@/data/constants';
import { logger } from '@/lib/logger';

// ============================================================================
// GENERATION HTML
// ============================================================================

export function generateReportHTML(
  report: GeneratedReport,
  options: ExportOptions
): string {
  const { inclureCommentaires, inclurePiecesJointes, tableDesMatieres } = options;

  // Styles CSS
  const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #1a1a2e;
        line-height: 1.6;
        padding: 40px;
        max-width: 900px;
        margin: 0 auto;
        background: #f8f9fa;
      }
      .header {
        background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
        color: white;
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 30px;
      }
      .header h1 { font-size: 28px; margin-bottom: 8px; }
      .header .subtitle { opacity: 0.8; font-size: 14px; }
      .header .meta {
        display: flex;
        gap: 20px;
        margin-top: 15px;
        font-size: 13px;
        opacity: 0.9;
      }
      .meteo-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(255,255,255,0.15);
        border-radius: 20px;
        font-size: 14px;
      }
      .meteo-emoji { font-size: 24px; }
      .compte-rebours {
        background: #3b82f6;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
      }
      .toc {
        background: white;
        padding: 20px 30px;
        border-radius: 12px;
        margin-bottom: 30px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      .toc h2 { font-size: 18px; margin-bottom: 15px; color: #18181b; }
      .toc ul { list-style: none; }
      .toc li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
      .toc li:last-child { border-bottom: none; }
      .toc a { color: #3b82f6; text-decoration: none; }
      .toc a:hover { text-decoration: underline; }
      .section {
        background: white;
        padding: 25px;
        border-radius: 12px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        page-break-inside: avoid;
      }
      .section h2 {
        font-size: 18px;
        color: #18181b;
        padding-bottom: 12px;
        border-bottom: 2px solid #f0f0f0;
        margin-bottom: 20px;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
      }
      .kpi-card {
        padding: 20px;
        border-radius: 10px;
        text-align: center;
      }
      .kpi-card.blue { background: #eff6ff; }
      .kpi-card.red { background: #fef2f2; }
      .kpi-card.green { background: #f0fdf4; }
      .kpi-card.amber { background: #fffbeb; }
      .kpi-value { font-size: 28px; font-weight: 700; }
      .kpi-card.blue .kpi-value { color: #1d4ed8; }
      .kpi-card.red .kpi-value { color: #dc2626; }
      .kpi-card.green .kpi-value { color: #16a34a; }
      .kpi-card.amber .kpi-value { color: #d97706; }
      .kpi-label { font-size: 13px; color: #6b7280; margin-top: 5px; }
      .item-list { list-style: none; }
      .item-list li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 15px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 8px;
      }
      .item-title { font-weight: 500; }
      .item-meta { font-size: 13px; color: #6b7280; }
      .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      .badge.danger { background: #fef2f2; color: #dc2626; }
      .badge.warning { background: #fffbeb; color: #d97706; }
      .badge.success { background: #f0fdf4; color: #16a34a; }
      .badge.info { background: #eff6ff; color: #1d4ed8; }
      .comment-box {
        background: #eff6ff;
        border-left: 4px solid #3b82f6;
        padding: 15px;
        margin-top: 15px;
        border-radius: 0 8px 8px 0;
      }
      .comment-label { font-size: 12px; color: #3b82f6; font-weight: 600; margin-bottom: 5px; }
      .attachments {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px dashed #e5e7eb;
      }
      .attachments-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
      .attachment-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .attachment-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: #f3f4f6;
        border-radius: 6px;
        font-size: 13px;
        color: #374151;
      }
      .attachment-item a {
        color: #3b82f6;
        text-decoration: none;
      }
      .attachment-item a:hover { text-decoration: underline; }
      .footer {
        text-align: center;
        padding: 30px;
        font-size: 12px;
        color: #9ca3af;
      }
      @media print {
        body { padding: 20px; background: white; }
        .section { box-shadow: none; border: 1px solid #e5e7eb; }
      }
    </style>
  `;

  // Helper pour emoji meteo
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

  // Generer la table des matieres
  const generateTOC = () => {
    if (!tableDesMatieres) return '';

    return `
      <div class="toc">
        <h2>Table des matieres</h2>
        <ul>
          ${report.sections
            .filter(s => s.visible)
            .map((s, i) => `<li><a href="#section-${s.id}">${i + 1}. ${s.titre}</a></li>`)
            .join('')}
        </ul>
      </div>
    `;
  };

  // Generer le contenu d'une section
  const generateSectionContent = (section: typeof report.sections[0]) => {
    const data = section.donnees as Record<string, unknown>;

    let content = '';

    switch (section.type) {
      case 'kpi':
        content = `
          <div class="kpi-grid">
            <div class="kpi-card blue">
              <div class="kpi-value">${data.actionsTerminees}/${data.actionsTotal}</div>
              <div class="kpi-label">Actions terminees</div>
            </div>
            <div class="kpi-card red">
              <div class="kpi-value">${data.actionsEnRetard}</div>
              <div class="kpi-label">En retard</div>
            </div>
            <div class="kpi-card green">
              <div class="kpi-value">${data.jalonsAtteints}/${data.jalonsTotal}</div>
              <div class="kpi-label">Jalons atteints</div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-value">${data.risquesCritiques}</div>
              <div class="kpi-label">Risques critiques</div>
            </div>
          </div>
        `;
        break;

      case 'jalons':
        const jalonsData = data as { titre: string; date: string; responsable: string; statut: string }[];
        if (Array.isArray(jalonsData) && jalonsData.length > 0) {
          content = `
            <ul class="item-list">
              ${jalonsData.map(j => `
                <li>
                  <div>
                    <div class="item-title">${j.titre}</div>
                    <div class="item-meta">${new Date(j.date).toLocaleDateString('fr-FR')} - ${j.responsable}</div>
                  </div>
                  <span class="badge ${j.statut === 'ATTEINT' ? 'success' : 'warning'}">${j.statut}</span>
                </li>
              `).join('')}
            </ul>
          `;
        } else {
          content = '<p style="color: #6b7280; font-style: italic;">Aucun jalon critique</p>';
        }
        break;

      case 'actions':
        const actionsData = data as { titre: string; raison: string; responsable: string }[];
        if (Array.isArray(actionsData) && actionsData.length > 0) {
          content = `
            <ul class="item-list">
              ${actionsData.map(a => `
                <li style="background: #fef2f2;">
                  <div>
                    <div class="item-title" style="color: #dc2626;">${a.titre}</div>
                    <div class="item-meta">Raison: ${a.raison}</div>
                    <div class="item-meta">Responsable: ${a.responsable}</div>
                  </div>
                  <span class="badge danger">Bloquee</span>
                </li>
              `).join('')}
            </ul>
          `;
        } else {
          content = '<p style="color: #16a34a;">Aucune action bloquee</p>';
        }
        break;

      case 'alertes':
        const alertesData = data as { titre: string; message: string; criticite: string }[];
        if (Array.isArray(alertesData) && alertesData.length > 0) {
          content = `
            <ul class="item-list">
              ${alertesData.map(a => `
                <li style="background: #fffbeb;">
                  <div>
                    <div class="item-title">${a.titre}</div>
                    <div class="item-meta">${a.message}</div>
                  </div>
                  <span class="badge ${a.criticite === 'critique' ? 'danger' : 'warning'}">${a.criticite}</span>
                </li>
              `).join('')}
            </ul>
          `;
        } else {
          content = '<p style="color: #16a34a;">Aucune alerte active</p>';
        }
        break;

      case 'risques':
        const risquesData = data as { titre: string; score: number; mitigation: string }[];
        if (Array.isArray(risquesData) && risquesData.length > 0) {
          content = `
            <ul class="item-list">
              ${risquesData.map((r, i) => `
                <li style="background: #fff7ed;">
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 30px; height: 30px; background: #f97316; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${i + 1}</div>
                    <div>
                      <div class="item-title">${r.titre}</div>
                      <div class="item-meta">${r.mitigation || 'Aucune mitigation'}</div>
                    </div>
                  </div>
                  <span class="badge ${r.score >= 15 ? 'danger' : 'warning'}">Score: ${r.score}</span>
                </li>
              `).join('')}
            </ul>
          `;
        } else {
          content = '<p style="color: #16a34a;">Aucun risque actif</p>';
        }
        break;

      case 'budget':
        content = `
          <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="kpi-card blue">
              <div class="kpi-value">${((data.budgetTotal as number) / 1000000).toFixed(1)}M</div>
              <div class="kpi-label">Budget Total</div>
            </div>
            <div class="kpi-card green">
              <div class="kpi-value">${((data.budgetConsomme as number) / 1000000).toFixed(1)}M</div>
              <div class="kpi-label">Consomme</div>
            </div>
            <div class="kpi-card" style="background: #f5f3ff;">
              <div class="kpi-value" style="color: #7c3aed;">${data.pourcentageConsomme}%</div>
              <div class="kpi-label">Taux consommation</div>
            </div>
          </div>
        `;
        break;

      default:
        content = `<pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 12px; overflow: auto;">${JSON.stringify(data, null, 2)}</pre>`;
    }

    // Ajouter commentaire
    if (inclureCommentaires && section.commentaire) {
      content += `
        <div class="comment-box">
          <div class="comment-label">COMMENTAIRE</div>
          <p>${section.commentaire}</p>
        </div>
      `;
    }

    // Ajouter pieces jointes
    if (inclurePiecesJointes && section.piecesJointes.length > 0) {
      content += `
        <div class="attachments">
          <div class="attachments-label">PIECES JOINTES</div>
          <div class="attachment-list">
            ${section.piecesJointes.map(a => `
              <span class="attachment-item">
                📎 ${a.url ? `<a href="${a.url}" target="_blank">${a.nom}</a>` : a.nom}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    return content;
  };

  // Assembler le HTML
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${report.titre}</title>
      ${styles}
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <h1>${report.titre}</h1>
        <div class="subtitle">Periode: ${report.periode.displayText}</div>
        <div class="meta">
          <span>Genere le ${new Date(report.dateGeneration).toLocaleDateString('fr-FR')}</span>
          <span>Par ${report.genereePar}</span>
          ${report.meteoGlobale ? `
            <span class="meteo-badge">
              <span class="meteo-emoji">${getMeteoEmoji(report.meteoGlobale)}</span>
              <span style="text-transform: capitalize;">${report.meteoGlobale}</span>
            </span>
          ` : ''}
          ${report.compteARebours ? `
            <span class="compte-rebours">
              J-${report.compteARebours.jours} ${report.compteARebours.evenement}
            </span>
          ` : ''}
        </div>
      </div>

      ${generateTOC()}

      <!-- Sections -->
      ${report.sections
        .filter(s => s.visible)
        .map(section => `
          <div class="section" id="section-${section.id}">
            <h2>${section.titre}</h2>
            ${generateSectionContent(section)}
          </div>
        `).join('')}

      <!-- Footer -->
      <div class="footer">
        <p>Rapport genere automatiquement par COCKPIT - ${PROJET_CONFIG.nom}</p>
        <p>${new Date().toLocaleString('fr-FR')}</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

// ============================================================================
// EXPORT VERS FICHIER
// ============================================================================

export function downloadReportHTML(report: GeneratedReport, options: ExportOptions) {
  const html = generateReportHTML(report, options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.titre.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openReportHTML(report: GeneratedReport, options: ExportOptions) {
  const html = generateReportHTML(report, options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

// ============================================================================
// EXPORT PDF (via impression navigateur)
// ============================================================================

export function downloadReportPDF(report: GeneratedReport, options: ExportOptions) {
  const html = generateReportHTML(report, { ...options, qualite: 'impression' });

  // Ouvrir dans une nouvelle fenetre pour impression
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups ne sont pas bloquées.');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Attendre le chargement puis lancer l'impression
  printWindow.onload = () => {
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (error) {
        logger.error('Erreur impression:', error);
      }
    }, 500);
  };
}

// ============================================================================
// EXPORT PPTX (placeholder - necessite une librairie externe)
// ============================================================================

export async function downloadReportPPTX(
  report: GeneratedReport,
  _options: ExportOptions
): Promise<void> {
  // Cette fonction necessite pptxgenjs ou une librairie similaire
  // Pour l'instant, on affiche un message

  alert(
    'Export PowerPoint: Cette fonctionnalite necessite la librairie pptxgenjs.\n\n' +
    'Utilisez le EXCO Mensuel pour generer des presentations PowerPoint.'
  );

  logger.info('Rapport a exporter en PPTX:', report);
}
