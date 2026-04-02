
const CATEGORY_ORDER = ['design', 'engineering', 'product', 'security'];
const CATEGORY_LABELS = {
  design: 'Design',
  engineering: 'Engineering',
  product: 'Product',
  security: 'Security',
};

function stripBold(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1');
}

function formatDate() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export async function downloadPdf(result) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  function checkPage(needed = 10) {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function addText(text, opts = {}) {
    const { size = 10, bold = false, color = [30, 30, 30], indent = 0 } = opts;
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentW - indent);
    checkPage(lines.length * (size * 0.4 + 1.5));
    doc.text(lines, margin + indent, y);
    y += lines.length * (size * 0.4 + 1.5);
  }

  function addGap(h = 4) { y += h; }

  function addDivider() {
    checkPage(6);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  }

  // Title
  addText('PRD Review Analysis', { size: 20, bold: true, color: [20, 20, 20] });
  addGap(2);
  addText(formatDate(), { size: 9, color: [120, 120, 120] });
  addGap(6);
  addDivider();

  // Overall
  addText('Overall Result', { size: 14, bold: true, color: [20, 20, 20] });
  addGap(3);
  addText(`Verdict: ${result.overall.verdict}`, { size: 11, bold: true });
  addGap(2);
  addText(`Score: ${result.overall.score}%`, { size: 11 });
  addGap(3);
  addText(result.overall.summary, { size: 10, color: [60, 60, 60] });
  addGap(6);

  // Categories
  for (const key of CATEGORY_ORDER) {
    const cat = result.categories[key];
    if (!cat) continue;
    addDivider();
    addText(CATEGORY_LABELS[key], { size: 13, bold: true, color: [20, 20, 20] });
    addGap(2);
    addText(`Score: ${cat.score}%  ·  Status: ${cat.status.charAt(0).toUpperCase() + cat.status.slice(1)}`, { size: 10, color: [80, 80, 80] });
    addGap(2);
    addText(stripBold(cat.verdict), { size: 10, color: [50, 50, 50] });
    addGap(4);

    addText('Analysis', { size: 10, bold: true, color: [60, 60, 60] });
    addGap(2);
    for (const para of cat.summary.split('\n').filter(p => p.trim())) {
      addText(para, { size: 10, color: [60, 60, 60] });
      addGap(2);
    }
    addGap(2);

    addText('Recommendations', { size: 10, bold: true, color: [60, 60, 60] });
    addGap(2);
    cat.recommendations.forEach((rec, i) => {
      addText(`${i + 1}. ${rec}`, { size: 10, color: [60, 60, 60], indent: 4 });
      addGap(2);
    });
    addGap(2);
  }

  doc.save('prd-review-analysis.pdf');
}

// ─── DOCX ────────────────────────────────────────────────────────────────────

export async function downloadDocx(result) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
  const children = [];

  function heading1(text) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
    });
  }

  function heading2(text) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 80 },
    });
  }

  function label(text) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 20, color: '555555' })],
      spacing: { before: 120, after: 40 },
    });
  }

  function body(text) {
    return new Paragraph({
      children: [new TextRun({ text, size: 20 })],
      spacing: { after: 60 },
    });
  }

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'PRD Review Analysis', bold: true, size: 36 })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: formatDate(), size: 18, color: '888888' })],
      spacing: { after: 200 },
    }),
  );

  // Overall
  children.push(heading1('Overall Result'));
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

  // Categories
  for (const key of CATEGORY_ORDER) {
    const cat = result.categories[key];
    if (!cat) continue;

    children.push(heading2(CATEGORY_LABELS[key]));
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `Score: ${cat.score}%`, size: 20, color: '555555' }),
        new TextRun({ text: '   ·   ', size: 20, color: '999999' }),
        new TextRun({ text: `Status: ${cat.status.charAt(0).toUpperCase() + cat.status.slice(1)}`, size: 20, color: '555555' }),
      ],
      spacing: { after: 80 },
    }));
    children.push(body(stripBold(cat.verdict)));

    children.push(label('Analysis'));
    for (const para of cat.summary.split('\n').filter(p => p.trim())) {
      children.push(body(para));
    }

    children.push(label('Recommendations'));
    cat.recommendations.forEach((rec, i) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${i + 1}.  ${rec}`, size: 20 })],
        spacing: { after: 60 },
        indent: { left: 360 },
      }));
    });
  }

  const docx = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(docx);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prd-review-analysis.docx';
  a.click();
  URL.revokeObjectURL(url);
}
