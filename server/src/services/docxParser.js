const mammoth = require('mammoth');

async function parseDocx(buffer, mimetype = '', originalname = '') {
  const isText =
    mimetype.startsWith('text/') ||
    originalname.endsWith('.md') ||
    originalname.endsWith('.txt') ||
    originalname.endsWith('.markdown');

  if (isText) {
    return buffer.toString('utf8');
  }

  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

module.exports = parseDocx;
