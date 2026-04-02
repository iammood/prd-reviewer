const mammoth = require('mammoth');

async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

module.exports = parseDocx;
