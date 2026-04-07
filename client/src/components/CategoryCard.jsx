import ScoreBar from './ScoreBar';
import Button from './Button';
import { CATEGORY_META } from '../utils/statusHelpers.jsx';

const STATUS_CONFIG = {
  good:    { label: 'Strong',            badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  caution: { label: 'Needs improvement', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  blocker: { label: 'Missing',           badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

export default function CategoryCard({ categoryKey, data, onClick }) {
  const meta   = CATEGORY_META[categoryKey] || { label: categoryKey };
  const status = STATUS_CONFIG[data.status] || STATUS_CONFIG.good;

  return (
    <Button
      size="raw"
      variant="raw"
      onClick={onClick}
      aria-label={`View ${meta.label} details`}
      className="relative group cursor-pointer w-full text-left p-4 rounded-2xl
                 bg-white dark:bg-gray-900
                 border border-gray-100 dark:border-white/10
                 hover:bg-gray-50 dark:hover:bg-white/[0.04]
                 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:border-white/20
                 active:scale-[0.98] active:translate-y-0 active:shadow-none
                 focus-visible:ring-2 focus-visible:ring-indigo-500
                 transition-all duration-200 ease-out active:duration-100"
    >
      {/* Title + status */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="flex items-center gap-1">
          <span className="font-medium text-gray-900 dark:text-white text-[15px]">
            {meta.label}
          </span>
          <span className="text-gray-400 dark:text-gray-500 text-sm opacity-40 group-hover:opacity-80 transition-opacity duration-200">›</span>
        </span>
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${status.badge}`}>
          {status.label}
        </span>
      </div>

      {/* Score */}
      <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white mb-3 leading-tight tracking-tight">
        {data.score}
        <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-0.5">%</span>
      </p>

      {/* Slim progress bar */}
      <ScoreBar score={data.score} slim />
    </Button>
  );
}
