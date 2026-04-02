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

export const CATEGORY_META = {
  design:      { label: 'Design',      icon: '🎨', description: 'UX, flows, accessibility & responsiveness' },
  engineering: { label: 'Engineering', icon: '⚙️', description: 'Feasibility, data model & acceptance criteria' },
  product:     { label: 'Product',     icon: '📋', description: 'Goals, metrics & scope clarity' },
  security:    { label: 'Security',    icon: '🔒', description: 'Auth, privacy & compliance' },
};
