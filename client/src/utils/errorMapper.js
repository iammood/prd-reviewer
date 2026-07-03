// Centralised mapping of error conditions → user-facing messages.
// Never expose HTTP status codes, stack traces, or raw AI error strings to users.

const MSG = {
  network:     "We couldn't connect to the server. Check your connection and try again.",
  timeout:     "Your review is taking longer than expected. Please try again.",
  unavailable: "Our review service is temporarily unavailable. Please try again shortly.",
  cannotRead:  "We couldn't read your document. Please upload another file.",
  upload:      "We couldn't upload your document. Please try again.",
  unknown:     "Something unexpected happened while reviewing your PRD.",
};

// Raw technical strings that must never be shown to users
const TECHNICAL_PATTERNS = [
  /ai_schema_error/i,
  /could not parse json/i,
  /did not match expected schema/i,
  /bad gateway/i,
  /unexpected token/i,
  /invalid json/i,
  /502/,
  /520/,
];

const TIMEOUT_PATTERNS = [/timeout/i, /timed out/i];

function isNetworkError(err) {
  if (!err) return false;
  if (err instanceof TypeError) return true;
  const m = err.message || '';
  return m.includes('Failed to fetch') || m.includes('NetworkError') || m.includes('network error');
}

/**
 * Convert any error condition to a user-friendly message.
 *
 * @param {Object} [opts]
 * @param {Error|null}  [opts.err]           Caught JS error (fetch throw, JSON.parse throw, etc.)
 * @param {number|null} [opts.status]        HTTP response status code
 * @param {string}      [opts.serverMessage] Error string from the server JSON body
 * @param {'review'|'extract'|'fix'} [opts.context]
 * @returns {string}
 */
export function mapError({ err = null, status = null, serverMessage = '', context = 'review' } = {}) {
  // Network / offline (fetch threw, not a server response)
  if (isNetworkError(err)) return MSG.network;

  // Non-JSON body (server sent HTML error page — SyntaxError from JSON.parse)
  if (err instanceof SyntaxError) return MSG.unavailable;

  // HTTP status-based mapping
  if (status === 504) return MSG.timeout;
  if (status === 413) return 'Your document is too large. Please try a smaller file.';
  if (status === 422) return context === 'extract' ? MSG.cannotRead : MSG.unavailable;
  if (status >= 500)  return MSG.unavailable;

  // Server message hints at a timeout
  if (TIMEOUT_PATTERNS.some(p => p.test(serverMessage))) return MSG.timeout;

  // Server message is a raw technical string — suppress it
  if (TECHNICAL_PATTERNS.some(p => p.test(serverMessage))) return MSG.unavailable;

  // Context-aware fallback
  return context === 'extract' ? MSG.upload : MSG.unknown;
}
