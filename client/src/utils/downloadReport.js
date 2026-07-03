import { cleanMarkdown } from '../utils/statusHelpers.jsx';

const CATEGORY_ORDER = ['product', 'design', 'engineering'];
const CATEGORY_LABELS = {
  product: 'Product',
  design: 'Design',
  engineering: 'Engineering',
};

function formatDate() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

function makePdfWriter(doc) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  function checkPage(needed = 10) {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  }

  function text(str, opts = {}) {
    const { size = 10, bold = false, color = [30, 30, 30], indent = 0 } = opts;
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(str, contentW - indent);
    checkPage(lines.length * (size * 0.4 + 1.5));
    doc.text(lines, margin + indent, y);
    y += lines.length * (size * 0.4 + 1.5);
  }

  function gap(h = 4) { y += h; }

  function divider() {
    checkPage(6);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  }

  return { text, gap, divider };
}

// ─── DOCX helpers ─────────────────────────────────────────────────────────────

async function importDocx() {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
  return { Document, Packer, Paragraph, TextRun, HeadingLevel };
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Review Report — PDF ──────────────────────────────────────────────────────

export async function downloadReviewPdf(result) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { text, gap, divider } = makePdfWriter(doc);

  text('PRD Review Report', { size: 20, bold: true, color: [20, 20, 20] });
  gap(2);
  text(formatDate(), { size: 9, color: [120, 120, 120] });
  gap(6);
  divider();

  text('Overall Result', { size: 14, bold: true });
  gap(3);
  text(`Verdict: ${result.overall.verdict}`, { size: 11, bold: true });
  gap(2);
  text(`Score: ${result.overall.score}%`, { size: 11 });
  gap(3);
  const cleanText = cleanMarkdown(result.overall.summary);
  text(cleanText, { size: 10, color: [60, 60, 60] });
  gap(6);

  for (const key of CATEGORY_ORDER) {
    const cat = result.categories[key];
    if (!cat) continue;
    divider();
    text(CATEGORY_LABELS[key], { size: 13, bold: true, color: [20, 20, 20] });
    gap(2);
    text(`Score: ${cat.score}%  ·  Status: ${cat.status.charAt(0).toUpperCase() + cat.status.slice(1)}`, { size: 10, color: [80, 80, 80] });
    gap(2);

    text('Issue', { size: 10, bold: true, color: [60, 60, 60] });
    gap(1);
    const cleanVerdict = cleanMarkdown(cat.verdict);
    text(cleanVerdict, { size: 10, color: [50, 50, 50] });
    gap(3);

    text('Why It Matters', { size: 10, bold: true, color: [60, 60, 60] });
    gap(1);
    const paras = cat.summary.split('\n').map(l => l.replace(/^#{1,6}\s+/, '').trim()).filter(Boolean);
    const cleanWhy = cleanMarkdown(paras[0] || '');
    text(cleanWhy, { size: 10, color: [60, 60, 60] });
    gap(3);

    text('Suggested Fix', { size: 10, bold: true, color: [60, 60, 60] });
    gap(2);
    cat.recommendations.forEach((rec, i) => {
      const cleanRec = cleanMarkdown(rec);
      text(`${i + 1}. ${cleanRec}`, { size: 10, color: [60, 60, 60], indent: 4 });
      gap(2);
    });
    gap(2);
  }

  doc.save('prd-review-report.pdf');
}

// ─── Review Report — DOCX ─────────────────────────────────────────────────────

export async function downloadReviewDocx(result) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await importDocx();
  const children = [];

  const h1 = t => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } });
  const h2 = t => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } });
  const label = t => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 20, color: '555555' })], spacing: { before: 120, after: 40 } });
  const body = t => new Paragraph({ children: [new TextRun({ text: cleanMarkdown(t), size: 20 })], spacing: { after: 60 } });
  const numbered = (t, n) => new Paragraph({
    children: [new TextRun({ text: `${n}.  ${cleanMarkdown(t)}`, size: 20 })],
    spacing: { after: 60 },
    indent: { left: 360 },
  });

  children.push(
    new Paragraph({ children: [new TextRun({ text: 'PRD Review Report', bold: true, size: 36 })], spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: formatDate(), size: 18, color: '888888' })], spacing: { after: 200 } }),
  );

  children.push(h1('Overall Result'));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: 'Verdict: ', bold: true, size: 22 }),
      new TextRun({ text: result.overall.verdict, size: 22 }),
    ],
    spacing: { after: 60 },
  }));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: 'Score: ', bold: true, size: 22 }),
      new TextRun({ text: `${result.overall.score}%`, size: 22 }),
    ],
    spacing: { after: 80 },
  }));
  children.push(body(result.overall.summary));

  for (const key of CATEGORY_ORDER) {
    const cat = result.categories[key];
    if (!cat) continue;
    const paras = cat.summary.split('\n').map(l => l.replace(/^#{1,6}\s+/, '').trim()).filter(Boolean);

    children.push(h2(CATEGORY_LABELS[key]));
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `Score: ${cat.score}%`, size: 20, color: '555555' }),
        new TextRun({ text: '   ·   ', size: 20, color: '999999' }),
        new TextRun({ text: `Status: ${cat.status.charAt(0).toUpperCase() + cat.status.slice(1)}`, size: 20, color: '555555' }),
      ],
      spacing: { after: 80 },
    }));
    children.push(label('Issue'));
    children.push(body(cat.verdict));
    children.push(label('Why It Matters'));
    children.push(body(paras[0] || ''));
    children.push(label('Suggested Fix'));
    cat.recommendations.forEach((rec, i) => children.push(numbered(rec, i + 1)));
  }

  const blob = await Packer.toBlob(new Document({ sections: [{ properties: {}, children }] }));
  saveBlob(blob, 'prd-review-report.docx');
}

// ─── Updated PRD — PDF ────────────────────────────────────────────────────────
// Clean document with no scores, statuses, or review language.
// Contains the original PRD text plus any Fix Mode amendments.

export async function downloadUpdatedPrdPdf(result) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { text, gap, divider } = makePdfWriter(doc);

  const prdText = result.prdText || '';
  const amendments = result.amendments || []; // set by Fix Mode completion

  text('Product Requirements Document', { size: 20, bold: true, color: [20, 20, 20] });
  gap(2);
  text(formatDate(), { size: 9, color: [120, 120, 120] });
  gap(6);

  if (prdText) {
    // Render original PRD as paragraphs
    const paras = prdText
      .split('\n')
      .map(l => l.replace(/^#{1,6}\s+/, '').trim())
      .filter(Boolean);

    for (const para of paras) {
      // Heuristic: short lines that were headings in the original
      const isHeading = para.length < 80 && !para.endsWith('.') && !para.endsWith(',');
      text(para, isHeading ? { size: 12, bold: true, color: [20, 20, 20] } : { size: 10, color: [40, 40, 40] });
      gap(isHeading ? 2 : 3);
    }
  } else {
    text('Original PRD text not available.', { size: 10, color: [120, 120, 120] });
    gap(4);
  }

  // Append amendments if any
  if (amendments.length > 0) {
    divider();
    text('Amendments', { size: 14, bold: true, color: [20, 20, 20] });
    gap(4);
    for (const a of amendments) {
      text(`${a.category}`, { size: 11, bold: true, color: [40, 40, 40] });
      gap(2);
      text(a.fix, { size: 10, color: [50, 50, 50] });
      gap(5);
    }
  }

  doc.save('updated-prd.pdf');
}

// ─── Updated PRD — DOCX ───────────────────────────────────────────────────────

export async function downloadUpdatedPrdDocx(result) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await importDocx();
  const children = [];
  const prdText = result.prdText || '';
  const amendments = result.amendments || [];

  const body = (t, bold = false, size = 20) => new Paragraph({
    children: [new TextRun({ text: t, size, bold })],
    spacing: { after: 80 },
  });

  children.push(
    new Paragraph({ children: [new TextRun({ text: 'Product Requirements Document', bold: true, size: 36 })], spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: formatDate(), size: 18, color: '888888' })], spacing: { after: 240 } }),
  );

  if (prdText) {
    const lines = prdText
      .split('\n')
      .map(l => l.replace(/^#{1,6}\s+/, '').trim())
      .filter(Boolean);

    for (const line of lines) {
      const isHeading = line.length < 80 && !line.endsWith('.') && !line.endsWith(',');
      if (isHeading) {
        children.push(new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
        }));
      } else {
        children.push(body(line));
      }
    }
  } else {
    children.push(body('Original PRD text not available.'));
  }

  if (amendments.length > 0) {
    children.push(new Paragraph({
      text: 'Amendments',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 120 },
    }));
    for (const a of amendments) {
      children.push(new Paragraph({
        text: a.category,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
      }));
      children.push(body(a.fix));
    }
  }

  const blob = await Packer.toBlob(new Document({ sections: [{ properties: {}, children }] }));
  saveBlob(blob, 'updated-prd.docx');
}

// ─── Legacy aliases (used by FixMode completion screen) ───────────────────────
export const downloadPdf = downloadReviewPdf;
export const downloadDocx = downloadReviewDocx;
