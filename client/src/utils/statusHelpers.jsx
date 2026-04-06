export function getScoreColor(score) {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-500 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

export function getScoreBg(score) {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getStatusColor(status) {
  switch (status) {
    case 'good':    return 'text-emerald-500 dark:text-emerald-400';
    case 'caution': return 'text-amber-500 dark:text-amber-400';
    case 'blocker': return 'text-red-500 dark:text-red-400';
    default:        return 'text-gray-500 dark:text-gray-400';
  }
}

export function getStatusBg(status) {
  switch (status) {
    case 'good':    return 'bg-emerald-500';
    case 'caution': return 'bg-amber-500';
    case 'blocker': return 'bg-red-500';
    default:        return 'bg-gray-500';
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'good':    return 'Good';
    case 'caution': return 'Caution';
    case 'blocker': return 'Blocker';
    default:        return 'Unknown';
  }
}

export function getVerdictStyle(verdict) {
  switch (verdict) {
    case 'READY TO BUILD':
      return {
        bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-700',
        text: 'text-emerald-700 dark:text-emerald-300',
        badge: 'bg-emerald-500 text-white',
        icon: '✓',
      };
    case 'CONDITIONAL APPROVAL':
      return {
        bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-700',
        text: 'text-amber-700 dark:text-amber-300',
        badge: 'bg-amber-500 text-white',
        icon: '⚠',
      };
    case 'NOT READY TO BUILD':
      return {
        bg: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-700',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-500 text-white',
        icon: '✕',
      };
    default:
      return {
        bg: 'bg-gray-100 border-gray-300 dark:bg-gray-900 dark:border-gray-700',
        text: 'text-gray-600 dark:text-gray-300',
        badge: 'bg-gray-500 text-white',
        icon: '?',
      };
  }
}

export function formatScore(score) {
  return `${score}%`;
}

/**
 * Strip markdown artifacts from AI-generated text.
 * Returns a plain STRING — safe for PDF, DOCX, and any non-React context.
 * Use this in downloadReport.js and anywhere JSX is not available.
 */
export function cleanMarkdown(text = "") {
  return text
    .replace(/[*#_`]/g, '')
    .trim();
}

/**
 * Render text with **bold** markers converted to <strong> React elements.
 * Also strips ## heading prefixes.
 */
export function renderText(text) {
  const cleaned = text.replace(/^#{1,6}\s+/gm, '');
  const parts = cleaned.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) =>
    part.startsWith('**')
      ? <strong key={i} className="font-semibold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>
      : part
  );
}

/**
 * Split summary text into readable paragraphs, stripping blank lines and markdown headers.
 */
export function parseParagraphs(text) {
  return text
    .split('\n')
    .map(l => l.replace(/^#{1,6}\s+/, '').trim())
    .filter(Boolean);
}

/**
 * Format a review section as a plain-text block.
 * Returns a STRING — safe for PDF, DOCX, clipboard, and any non-React context.
 */
export function formatSection(section) {
  const text = section.title;
  return `
${text.toUpperCase()}
Score: ${section.score}

Key Issue:
${section.issue}

Why It Matters:
${section.impact}

Recommended Fixes:
${section.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;
}

// Icon components for each category — use as <meta.Icon size={16} /> at call sites
function DesignIcon(props)      { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>; }
function EngineeringIcon(props) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>; }
function ProductIcon(props)     { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>; }
function SecurityIcon(props)    { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }

export const CATEGORY_META = {
  design:      { label: 'Design',      Icon: DesignIcon,      description: 'UX, flows, accessibility & responsiveness' },
  engineering: { label: 'Engineering', Icon: EngineeringIcon, description: 'Feasibility, data model & acceptance criteria' },
  product:     { label: 'Product',     Icon: ProductIcon,     description: 'Goals, metrics & scope clarity' },
  security:    { label: 'Security',    Icon: SecurityIcon,    description: 'Auth, privacy & compliance' },
};