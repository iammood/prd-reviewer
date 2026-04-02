import { getVerdictStyle } from '../utils/statusHelpers';

export default function OverallBanner({ overall, onReset }) {
  const style = getVerdictStyle(overall.verdict);

  return (
    <div className={`rounded-2xl border p-6 ${style.bg}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${style.badge}`}
            aria-label={`Overall verdict: ${overall.verdict}`}
          >
            <span aria-hidden="true">{style.icon}</span>
            {overall.verdict}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Overall Score</p>
            <p className={`text-3xl font-bold tabular-nums ${style.text}`}>
              {overall.score}%
            </p>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="ml-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors border border-gray-300 dark:border-gray-700"
            aria-label="Upload a new PRD and start over"
          >
            Upload New PRD
          </button>
        </div>
      </div>

      <p className={`mt-4 text-sm leading-relaxed ${style.text} opacity-80`}>
        {overall.summary}
      </p>
    </div>
  );
}
