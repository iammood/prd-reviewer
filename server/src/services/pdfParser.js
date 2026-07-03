async function parsePdf(buffer) {
  // Lazy-require so a missing or broken install doesn't crash the module at load time
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  // No browser worker needed in Node.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';

  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true, isEvalSupported: false });
  const pdfDoc = await loadingTask.promise;

  const pageTexts = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map(item => item.str).join(' '));
  }

  await pdfDoc.destroy();
  return pageTexts.join('\n').trim();
}

module.exports = parsePdf;
