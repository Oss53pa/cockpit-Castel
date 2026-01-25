import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type {
  StudioReport,
  ReportComment,
  ReportFilters,
  ReportStatus,
  ContentTree,
  ExportOptions,
} from '@/types/reportStudio';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import pptxgen from 'pptxgenjs';

// ============================================================================
// QUERIES
// ============================================================================

export function useReports(filters?: ReportFilters) {
  return useLiveQuery(async () => {
    const query = db.reports.toCollection();

    const reports = await query.toArray();

    // Apply filters
    let filtered = reports;

    if (filters?.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }
    if (filters?.type) {
      filtered = filtered.filter((r) => r.type === filters.type);
    }
    if (filters?.author) {
      filtered = filtered.filter((r) => r.author === filters.author);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          r.description?.toLowerCase().includes(search)
      );
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter((r) => r.createdAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter((r) => r.createdAt <= filters.dateTo!);
    }

    // Sort by updatedAt descending
    return filtered.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [filters]);
}

export function useReport(id?: number) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    return db.reports.get(id);
  }, [id]);
}

export function useReportVersions(reportId?: number) {
  return useLiveQuery(async () => {
    if (!reportId) return [];
    return db.reportVersions
      .where('reportId')
      .equals(reportId)
      .reverse()
      .sortBy('versionNumber');
  }, [reportId]);
}

export function useReportComments(reportId?: number) {
  return useLiveQuery(async () => {
    if (!reportId) return [];
    return db.reportComments
      .where('reportId')
      .equals(reportId)
      .toArray();
  }, [reportId]);
}

export function useReportActivities(reportId?: number) {
  return useLiveQuery(async () => {
    if (!reportId) return [];
    return db.reportActivities
      .where('reportId')
      .equals(reportId)
      .reverse()
      .limit(50)
      .toArray();
  }, [reportId]);
}

// ============================================================================
// MUTATIONS
// ============================================================================

export async function createReport(
  report: Omit<StudioReport, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<number> {
  const now = new Date().toISOString();
  const id = await db.reports.add({
    ...report,
    version: 1,
    createdAt: now,
    updatedAt: now,
    contentTree: report.contentTree || { sections: [] },
    designSettings: report.designSettings || {
      page: { format: 'A4', orientation: 'portrait', margins: 'normal' },
      typography: { headingFont: 'Exo 2', bodyFont: 'Inter', baseFontSize: 12 },
      colors: { primary: '#1C3163', secondary: '#D4AF37', accent: '#10b981', text: '#1f2937', background: '#ffffff' },
      branding: { showPageNumbers: true },
      coverPage: { enabled: true, template: 'standard' },
      tableOfContents: { enabled: true, depth: 2, showPageNumbers: true },
    },
  } as StudioReport);

  // Create initial activity
  await db.reportActivities.add({
    reportId: id,
    type: 'created',
    description: 'Rapport créé',
    userId: 1,
    userName: 'Utilisateur',
    createdAt: now,
  });

  return id;
}

export async function updateReport(
  id: number,
  updates: Partial<StudioReport>
): Promise<void> {
  const report = await db.reports.get(id);
  if (!report) throw new Error('Report not found');

  const now = new Date().toISOString();

  await db.reports.update(id, {
    ...updates,
    updatedAt: now,
  });
}

export async function saveReportContent(
  id: number,
  contentTree: ContentTree
): Promise<void> {
  const report = await db.reports.get(id);
  if (!report) throw new Error('Report not found');

  const now = new Date().toISOString();
  const newVersion = report.version + 1;

  // Save current version
  await db.reportVersions.add({
    reportId: id,
    versionNumber: report.version,
    contentTree: report.contentTree,
    designSettings: report.designSettings,
    createdAt: now,
    createdBy: 'Utilisateur',
  });

  // Update report
  await db.reports.update(id, {
    contentTree,
    version: newVersion,
    updatedAt: now,
  });

  // Add activity
  await db.reportActivities.add({
    reportId: id,
    type: 'edited',
    description: `Version ${newVersion} sauvegardée`,
    userId: 1,
    userName: 'Utilisateur',
    createdAt: now,
  });
}

export async function updateReportStatus(
  id: number,
  status: ReportStatus
): Promise<void> {
  const now = new Date().toISOString();

  await db.reports.update(id, {
    status,
    updatedAt: now,
    publishedAt: status === 'published' ? now : undefined,
  });

  await db.reportActivities.add({
    reportId: id,
    type: 'status_changed',
    description: `Statut changé en "${status}"`,
    userId: 1,
    userName: 'Utilisateur',
    createdAt: now,
  });
}

export async function deleteReport(id: number): Promise<void> {
  await db.transaction('rw', [db.reports, db.reportVersions, db.reportComments, db.reportActivities], async () => {
    await db.reports.delete(id);
    await db.reportVersions.where('reportId').equals(id).delete();
    await db.reportComments.where('reportId').equals(id).delete();
    await db.reportActivities.where('reportId').equals(id).delete();
  });
}

export async function addReportComment(
  comment: Omit<ReportComment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = new Date().toISOString();
  const id = await db.reportComments.add({
    ...comment,
    createdAt: now,
    updatedAt: now,
  } as ReportComment);

  await db.reportActivities.add({
    reportId: comment.reportId,
    type: 'comment_added',
    description: 'Commentaire ajouté',
    userId: comment.authorId,
    userName: comment.authorName,
    createdAt: now,
  });

  return id;
}

export async function resolveComment(
  commentId: number,
  resolvedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  await db.reportComments.update(commentId, {
    isResolved: true,
    resolvedAt: now,
    resolvedBy,
    updatedAt: now,
  });
}

// ============================================================================
// EXPORT
// ============================================================================

export async function exportReportToPDF(
  report: StudioReport,
  options: ExportOptions
): Promise<void> {
  const doc = new jsPDF({
    orientation: report.designSettings.page.orientation,
    unit: 'mm',
    format: report.designSettings.page.format.toLowerCase() as 'a4' | 'letter' | 'legal',
  });

  const colors = report.designSettings.colors;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margins = {
    normal: 25,
    narrow: 12,
    wide: 38,
  }[report.designSettings.page.margins];

  // Cover page
  if (options.includeCoverPage && report.designSettings.coverPage.enabled) {
    doc.setFillColor(colors.primary);
    doc.rect(0, 0, pageWidth, pageHeight / 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text(
      report.designSettings.coverPage.title || report.title,
      pageWidth / 2,
      pageHeight / 4,
      { align: 'center' }
    );

    if (report.designSettings.coverPage.subtitle) {
      doc.setFontSize(14);
      doc.text(
        report.designSettings.coverPage.subtitle,
        pageWidth / 2,
        pageHeight / 4 + 15,
        { align: 'center' }
      );
    }

    doc.setTextColor(colors.text);
    doc.setFontSize(12);
    doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );

    doc.addPage();
  }

  // Table of contents
  if (options.includeTableOfContents && report.designSettings.tableOfContents.enabled) {
    doc.setFontSize(20);
    doc.setTextColor(colors.primary);
    doc.text('Table des matières', margins, margins + 10);

    let tocY = margins + 30;
    doc.setFontSize(12);
    doc.setTextColor(colors.text);

    report.contentTree.sections.forEach((section, index) => {
      doc.text(`${index + 1}. ${section.title}`, margins, tocY);
      tocY += 10;

      if (report.designSettings.tableOfContents.depth >= 2) {
        section.children.forEach((child, childIndex) => {
          doc.text(`    ${index + 1}.${childIndex + 1} ${child.title}`, margins + 10, tocY);
          tocY += 8;
        });
      }
    });

    doc.addPage();
  }

  // Content
  let currentY = margins;

  const addSection = (section: typeof report.contentTree.sections[0], level: number) => {
    // Section title
    doc.setFontSize(level === 1 ? 18 : level === 2 ? 14 : 12);
    doc.setTextColor(colors.primary);
    doc.text(section.title, margins, currentY);
    currentY += level === 1 ? 15 : 10;

    doc.setFontSize(11);
    doc.setTextColor(colors.text);

    // Blocks
    section.blocks.forEach((block) => {
      if (currentY > pageHeight - margins - 20) {
        doc.addPage();
        currentY = margins;
      }

      switch (block.type) {
        case 'paragraph': {
          const lines = doc.splitTextToSize(block.content, pageWidth - margins * 2);
          doc.text(lines, margins, currentY);
          currentY += lines.length * 6 + 5;
          break;
        }

        case 'heading':
          doc.setFontSize(block.level === 1 ? 16 : block.level === 2 ? 14 : 12);
          doc.setTextColor(colors.primary);
          doc.text(block.content, margins, currentY);
          currentY += 10;
          doc.setFontSize(11);
          doc.setTextColor(colors.text);
          break;

        case 'table':
          autoTable(doc, {
            startY: currentY,
            head: [block.headers.map((h) => h.label)],
            body: block.rows.map((row) =>
              block.headers.map((h) => String(row[h.key] ?? '-'))
            ),
            margin: { left: margins, right: margins },
            styles: { fontSize: 9 },
            headStyles: { fillColor: colors.primary },
          });
          currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
          break;

        case 'divider':
          doc.setDrawColor(200, 200, 200);
          doc.line(margins, currentY, pageWidth - margins, currentY);
          currentY += 10;
          break;

        case 'callout':
          doc.setFillColor(240, 240, 240);
          doc.roundedRect(margins, currentY - 5, pageWidth - margins * 2, 20, 2, 2, 'F');
          doc.text(block.content, margins + 5, currentY + 5);
          currentY += 25;
          break;

        default:
          currentY += 5;
      }
    });

    // Child sections
    section.children.forEach((child) => addSection(child, level + 1));
  };

  report.contentTree.sections.forEach((section) => addSection(section, 1));

  // Watermark
  if (options.watermark) {
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(40);
      doc.text(options.watermark, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
    }
  }

  // Page numbers
  if (report.designSettings.branding.showPageNumbers) {
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: 'center',
      });
    }
  }

  // Save
  const fileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  if (options.password) {
    // Note: jsPDF doesn't support password protection natively
    // Would need a different library for this feature
    doc.save(fileName);
  } else {
    doc.save(fileName);
  }
}

export async function exportReportToExcel(
  report: StudioReport,
  _options: ExportOptions
): Promise<void> {
  void _options; // Acknowledge unused parameter
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Titre', report.title],
    ['Description', report.description || ''],
    ['Type', report.type],
    ['Statut', report.status],
    ['Auteur', report.author],
    ['Créé le', new Date(report.createdAt).toLocaleDateString('fr-FR')],
    ['Modifié le', new Date(report.updatedAt).toLocaleDateString('fr-FR')],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

  // Extract tables from sections
  const extractTables = (sections: typeof report.contentTree.sections) => {
    sections.forEach((section) => {
      section.blocks.forEach((block) => {
        if (block.type === 'table') {
          const tableData = [
            block.headers.map((h) => h.label),
            ...block.rows.map((row) =>
              block.headers.map((h) => row[h.key] ?? '')
            ),
          ];
          const sheet = XLSX.utils.aoa_to_sheet(tableData);
          const sheetName = (block.title || section.title).substring(0, 31);
          XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
        }
      });
      extractTables(section.children);
    });
  };

  extractTables(report.contentTree.sections);

  // Save
  const fileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}

export async function exportReportToDocx(
  report: StudioReport,
  options: ExportOptions
): Promise<void> {
  const sections: (Paragraph | Table)[] = [];

  // Cover page
  if (options.includeCoverPage && report.designSettings.coverPage.enabled) {
    sections.push(
      new Paragraph({
        text: report.designSettings.coverPage.title || report.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: report.designSettings.coverPage.subtitle || '',
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      }),
      new Paragraph({
        text: `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: '', pageBreakBefore: true })
    );
  }

  // Table of contents placeholder
  if (options.includeTableOfContents && report.designSettings.tableOfContents.enabled) {
    sections.push(
      new Paragraph({
        text: 'Table des matières',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );
    report.contentTree.sections.forEach((section, index) => {
      sections.push(
        new Paragraph({
          text: `${index + 1}. ${section.title}`,
          spacing: { after: 100 },
        })
      );
    });
    sections.push(new Paragraph({ text: '', pageBreakBefore: true }));
  }

  // Process sections
  const processSection = (section: typeof report.contentTree.sections[0], level: number) => {
    const headingLevel = level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;

    sections.push(
      new Paragraph({
        text: section.title,
        heading: headingLevel,
        spacing: { before: 200, after: 100 },
      })
    );

    section.blocks.forEach((block) => {
      switch (block.type) {
        case 'paragraph':
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: block.content,
                  bold: block.formatting?.bold,
                  italics: block.formatting?.italic,
                }),
              ],
              spacing: { after: 100 },
            })
          );
          break;

        case 'heading': {
          const hLevel = block.level === 1 ? HeadingLevel.HEADING_1 :
                        block.level === 2 ? HeadingLevel.HEADING_2 :
                        block.level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;
          sections.push(
            new Paragraph({
              text: block.content,
              heading: hLevel,
              spacing: { before: 200, after: 100 },
            })
          );
          break;
        }

        case 'table':
          if (block.headers && block.rows) {
            const tableRows = [
              new TableRow({
                children: block.headers.map((h) =>
                  new TableCell({
                    children: [new Paragraph({ text: h.label, alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                  })
                ),
              }),
              ...block.rows.map((row) =>
                new TableRow({
                  children: block.headers.map((h) =>
                    new TableCell({
                      children: [new Paragraph({ text: String(row[h.key] ?? '') })],
                    })
                  ),
                })
              ),
            ];
            sections.push(
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              })
            );
            sections.push(new Paragraph({ text: '', spacing: { after: 100 } }));
          }
          break;

        case 'list':
          if (block.items) {
            block.items.forEach((item, idx) => {
              sections.push(
                new Paragraph({
                  text: `${block.listType === 'numbered' ? `${idx + 1}.` : '•'} ${item.content}`,
                  spacing: { after: 50 },
                })
              );
            });
          }
          break;

        case 'quote':
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `"${block.content}"`, italics: true }),
                block.author ? new TextRun({ text: ` — ${block.author}` }) : new TextRun({ text: '' }),
              ],
              indent: { left: 720 },
              spacing: { before: 100, after: 100 },
            })
          );
          break;

        case 'callout':
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: block.title ? `${block.title}: ` : '', bold: true }),
                new TextRun({ text: block.content }),
              ],
              border: { left: { style: BorderStyle.SINGLE, size: 24, color: '3B82F6' } },
              indent: { left: 200 },
              spacing: { before: 100, after: 100 },
            })
          );
          break;

        case 'divider':
          sections.push(
            new Paragraph({
              text: '────────────────────────────────',
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 100 },
            })
          );
          break;

        case 'pagebreak':
          sections.push(new Paragraph({ text: '', pageBreakBefore: true }));
          break;
      }
    });

    section.children.forEach((child) => processSection(child, level + 1));
  };

  report.contentTree.sections.forEach((section) => processSection(section, 1));

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const buffer = await Packer.toBlob(doc);
  const fileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(buffer, fileName);
}

export async function exportReportToPptx(
  report: StudioReport,
  options: ExportOptions
): Promise<void> {
  const pptx = new pptxgen();

  pptx.author = report.author;
  pptx.title = report.title;
  pptx.subject = report.description || '';

  // Cover slide
  if (options.includeCoverPage && report.designSettings.coverPage.enabled) {
    const coverSlide = pptx.addSlide();
    coverSlide.addText(report.designSettings.coverPage.title || report.title, {
      x: 0.5,
      y: 2,
      w: '90%',
      h: 1,
      fontSize: 36,
      bold: true,
      align: 'center',
      color: report.designSettings.colors.primary.replace('#', ''),
    });
    if (report.designSettings.coverPage.subtitle) {
      coverSlide.addText(report.designSettings.coverPage.subtitle, {
        x: 0.5,
        y: 3.2,
        w: '90%',
        h: 0.5,
        fontSize: 18,
        align: 'center',
        color: '666666',
      });
    }
    coverSlide.addText(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, {
      x: 0.5,
      y: 5,
      w: '90%',
      h: 0.3,
      fontSize: 12,
      align: 'center',
      color: '999999',
    });
  }

  // Table of contents slide
  if (options.includeTableOfContents && report.designSettings.tableOfContents.enabled) {
    const tocSlide = pptx.addSlide();
    tocSlide.addText('Table des matières', {
      x: 0.5,
      y: 0.5,
      w: '90%',
      fontSize: 24,
      bold: true,
      color: report.designSettings.colors.primary.replace('#', ''),
    });

    const tocItems = report.contentTree.sections.map((section, idx) => ({
      text: `${idx + 1}. ${section.title}`,
      options: { fontSize: 14, bullet: false },
    }));

    tocSlide.addText(tocItems, {
      x: 0.5,
      y: 1.5,
      w: '90%',
      h: 4,
    });
  }

  // Section slides
  const processSection = (section: typeof report.contentTree.sections[0], level: number) => {
    const slide = pptx.addSlide();

    // Section title
    slide.addText(section.title, {
      x: 0.5,
      y: 0.3,
      w: '90%',
      fontSize: level === 1 ? 24 : 20,
      bold: true,
      color: report.designSettings.colors.primary.replace('#', ''),
    });

    let currentY = 1.2;

    section.blocks.forEach((block) => {
      if (currentY > 5) return; // Don't overflow

      switch (block.type) {
        case 'paragraph':
          slide.addText(block.content, {
            x: 0.5,
            y: currentY,
            w: '90%',
            fontSize: 12,
            color: '333333',
          });
          currentY += 0.8;
          break;

        case 'heading':
          slide.addText(block.content, {
            x: 0.5,
            y: currentY,
            w: '90%',
            fontSize: block.level === 1 ? 20 : block.level === 2 ? 16 : 14,
            bold: true,
            color: report.designSettings.colors.primary.replace('#', ''),
          });
          currentY += 0.6;
          break;

        case 'table':
          if (block.headers && block.rows) {
            const tableData = [
              block.headers.map((h) => ({ text: h.label, options: { bold: true, fill: { color: 'CCCCCC' } } })),
              ...block.rows.slice(0, 5).map((row) =>
                block.headers.map((h) => String(row[h.key] ?? ''))
              ),
            ];
            slide.addTable(tableData, {
              x: 0.5,
              y: currentY,
              w: 9,
              fontSize: 10,
              border: { pt: 0.5, color: 'CCCCCC' },
            });
            currentY += 2;
          }
          break;

        case 'list':
          if (block.items) {
            const listItems = block.items.map((item) => ({
              text: item.content,
              options: { bullet: block.listType === 'bullet', fontSize: 12 },
            }));
            slide.addText(listItems, {
              x: 0.5,
              y: currentY,
              w: '90%',
            });
            currentY += block.items.length * 0.3 + 0.2;
          }
          break;

        case 'kpi_card':
          slide.addText(block.label, {
            x: 0.5,
            y: currentY,
            fontSize: 14,
            color: '666666',
          });
          slide.addText(String(block.value) + (block.unit || ''), {
            x: 0.5,
            y: currentY + 0.3,
            fontSize: 28,
            bold: true,
            color: report.designSettings.colors.primary.replace('#', ''),
          });
          currentY += 1;
          break;
      }
    });

    // Process children on separate slides
    section.children.forEach((child) => processSection(child, level + 1));
  };

  report.contentTree.sections.forEach((section) => processSection(section, 1));

  const fileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName });
}

export async function exportReportToHtml(
  report: StudioReport,
  options: ExportOptions
): Promise<void> {
  const colors = report.designSettings.colors;
  const typography = report.designSettings.typography;

  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${typography.bodyFont}, sans-serif;
      font-size: ${typography.baseFontSize}px;
      line-height: 1.6;
      color: ${colors.text};
      background: ${colors.background};
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1, h2, h3, h4, h5, h6 { font-family: ${typography.headingFont}, sans-serif; color: ${colors.primary}; margin: 24px 0 12px; }
    h1 { font-size: 2.5em; }
    h2 { font-size: 2em; }
    h3 { font-size: 1.5em; }
    h4 { font-size: 1.25em; }
    p { margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: ${colors.primary}; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    blockquote { border-left: 4px solid ${colors.secondary}; padding-left: 16px; margin: 16px 0; font-style: italic; color: #666; }
    .callout { padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid; }
    .callout-info { background: #e3f2fd; border-color: #2196f3; }
    .callout-warning { background: #fff3e0; border-color: #ff9800; }
    .callout-success { background: #e8f5e9; border-color: #4caf50; }
    .callout-error { background: #ffebee; border-color: #f44336; }
    .callout-tip { background: #f3e5f5; border-color: #9c27b0; }
    .divider { border-top: 1px solid #ddd; margin: 24px 0; }
    .kpi-card { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center; }
    .kpi-value { font-size: 2em; font-weight: bold; color: ${colors.primary}; }
    .kpi-label { color: #666; }
    .cover { text-align: center; padding: 80px 20px; margin-bottom: 40px; }
    .cover h1 { font-size: 3em; margin-bottom: 16px; }
    .cover .subtitle { font-size: 1.2em; color: #666; }
    .toc { margin: 40px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
    .toc h2 { margin-top: 0; }
    .toc ul { list-style: none; }
    .toc li { padding: 8px 0; }
    .toc a { color: ${colors.primary}; text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    .page-break { page-break-after: always; }
    @media print {
      body { max-width: none; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body>
`;

  // Cover page
  if (options.includeCoverPage && report.designSettings.coverPage.enabled) {
    html += `
  <div class="cover">
    <h1>${report.designSettings.coverPage.title || report.title}</h1>
    ${report.designSettings.coverPage.subtitle ? `<p class="subtitle">${report.designSettings.coverPage.subtitle}</p>` : ''}
    <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
  </div>
  <div class="page-break"></div>
`;
  }

  // Table of contents
  if (options.includeTableOfContents && report.designSettings.tableOfContents.enabled) {
    html += `
  <div class="toc">
    <h2>Table des matières</h2>
    <ul>
`;
    report.contentTree.sections.forEach((section, idx) => {
      html += `      <li><a href="#section-${section.id}">${idx + 1}. ${section.title}</a></li>\n`;
    });
    html += `
    </ul>
  </div>
  <div class="page-break"></div>
`;
  }

  // Content
  const processSection = (section: typeof report.contentTree.sections[0], level: number) => {
    const hTag = `h${Math.min(level, 6)}`;
    html += `  <${hTag} id="section-${section.id}">${section.title}</${hTag}>\n`;

    section.blocks.forEach((block) => {
      switch (block.type) {
        case 'paragraph': {
          const style = [];
          if (block.formatting?.bold) style.push('font-weight: bold');
          if (block.formatting?.italic) style.push('font-style: italic');
          if (block.formatting?.underline) style.push('text-decoration: underline');
          if (block.formatting?.alignment) style.push(`text-align: ${block.formatting.alignment}`);
          html += `  <p${style.length ? ` style="${style.join('; ')}"` : ''}>${block.content}</p>\n`;
          break;
        }

        case 'heading': {
          const headingTag = `h${Math.min(block.level + 1, 6)}`;
          html += `  <${headingTag}>${block.content}</${headingTag}>\n`;
          break;
        }

        case 'table':
          if (block.headers && block.rows) {
            html += '  <table>\n    <thead><tr>\n';
            block.headers.forEach((h) => {
              html += `      <th>${h.label}</th>\n`;
            });
            html += '    </tr></thead>\n    <tbody>\n';
            block.rows.forEach((row) => {
              html += '      <tr>\n';
              block.headers.forEach((h) => {
                html += `        <td>${row[h.key] ?? ''}</td>\n`;
              });
              html += '      </tr>\n';
            });
            html += '    </tbody>\n  </table>\n';
          }
          break;

        case 'list':
          if (block.items) {
            const listTag = block.listType === 'numbered' ? 'ol' : 'ul';
            html += `  <${listTag}>\n`;
            block.items.forEach((item) => {
              html += `    <li>${item.content}</li>\n`;
            });
            html += `  </${listTag}>\n`;
          }
          break;

        case 'quote':
          html += `  <blockquote>${block.content}${block.author ? `<footer>— ${block.author}</footer>` : ''}</blockquote>\n`;
          break;

        case 'callout':
          html += `  <div class="callout callout-${block.variant}">${block.title ? `<strong>${block.title}</strong><br>` : ''}${block.content}</div>\n`;
          break;

        case 'divider':
          html += '  <div class="divider"></div>\n';
          break;

        case 'kpi_card':
          html += `  <div class="kpi-card"><div class="kpi-value">${block.value}${block.unit || ''}</div><div class="kpi-label">${block.label}</div></div>\n`;
          break;

        case 'pagebreak':
          html += '  <div class="page-break"></div>\n';
          break;
      }
    });

    section.children.forEach((child) => processSection(child, level + 1));
  };

  report.contentTree.sections.forEach((section) => processSection(section, 1));

  html += `
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const fileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
  saveAs(blob, fileName);
}

export async function exportReportToMarkdown(
  report: StudioReport,
  options: ExportOptions
): Promise<void> {
  let md = '';

  // Cover
  if (options.includeCoverPage && report.designSettings.coverPage.enabled) {
    md += `# ${report.designSettings.coverPage.title || report.title}\n\n`;
    if (report.designSettings.coverPage.subtitle) {
      md += `*${report.designSettings.coverPage.subtitle}*\n\n`;
    }
    md += `Généré le ${new Date().toLocaleDateString('fr-FR')}\n\n---\n\n`;
  }

  // Table of contents
  if (options.includeTableOfContents && report.designSettings.tableOfContents.enabled) {
    md += `## Table des matières\n\n`;
    report.contentTree.sections.forEach((section, idx) => {
      md += `${idx + 1}. [${section.title}](#${section.title.toLowerCase().replace(/\s+/g, '-')})\n`;
    });
    md += '\n---\n\n';
  }

  // Content
  const processSection = (section: typeof report.contentTree.sections[0], level: number) => {
    const hashes = '#'.repeat(Math.min(level, 6));
    md += `${hashes} ${section.title}\n\n`;

    section.blocks.forEach((block) => {
      switch (block.type) {
        case 'paragraph': {
          let text = block.content;
          if (block.formatting?.bold) text = `**${text}**`;
          if (block.formatting?.italic) text = `*${text}*`;
          md += `${text}\n\n`;
          break;
        }

        case 'heading': {
          const headingHashes = '#'.repeat(Math.min(block.level + 1, 6));
          md += `${headingHashes} ${block.content}\n\n`;
          break;
        }

        case 'table':
          if (block.headers && block.rows) {
            md += '| ' + block.headers.map((h) => h.label).join(' | ') + ' |\n';
            md += '| ' + block.headers.map(() => '---').join(' | ') + ' |\n';
            block.rows.forEach((row) => {
              md += '| ' + block.headers.map((h) => String(row[h.key] ?? '')).join(' | ') + ' |\n';
            });
            md += '\n';
          }
          break;

        case 'list':
          if (block.items) {
            block.items.forEach((item, idx) => {
              md += `${block.listType === 'numbered' ? `${idx + 1}.` : '-'} ${item.content}\n`;
            });
            md += '\n';
          }
          break;

        case 'quote':
          md += `> ${block.content}\n`;
          if (block.author) md += `> — *${block.author}*\n`;
          md += '\n';
          break;

        case 'callout':
          md += `> **${block.variant?.toUpperCase() || 'NOTE'}**${block.title ? `: ${block.title}` : ''}\n`;
          md += `> ${block.content}\n\n`;
          break;

        case 'divider':
          md += '---\n\n';
          break;

        case 'kpi_card':
          md += `**${block.label}**: ${block.value}${block.unit || ''}\n\n`;
          break;

        case 'pagebreak':
          md += '\n---\n\n';
          break;
      }
    });

    section.children.forEach((child) => processSection(child, level + 1));
  };

  report.contentTree.sections.forEach((section) => processSection(section, 1));

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const fileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
  saveAs(blob, fileName);
}

export async function exportReport(
  report: StudioReport,
  options: ExportOptions
): Promise<void> {
  switch (options.format) {
    case 'pdf':
      await exportReportToPDF(report, options);
      break;
    case 'xlsx':
      await exportReportToExcel(report, options);
      break;
    case 'docx':
      await exportReportToDocx(report, options);
      break;
    case 'pptx':
      await exportReportToPptx(report, options);
      break;
    case 'html':
      await exportReportToHtml(report, options);
      break;
    case 'md':
      await exportReportToMarkdown(report, options);
      break;
    default:
      throw new Error(`Export format ${options.format} not supported`);
  }
}
