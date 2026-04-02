import { useState } from 'react';
import TrafficLight from './TrafficLight';
import ScoreBar from './ScoreBar';
import { CATEGORY_META } from '../utils/statusHelpers';

export default function CategoryCard({ categoryKey, data }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[categoryKey] || { label: categoryKey, icon: '📌', description: '' };

  function renderVerdict(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-controls={`category-body-${categoryKey}`}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        <div className="text-2xl mt-0.5 flex-shrink-0" aria-hidden="true">{meta.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <span className="font-semibold text-gray-800 dark:text-gray-100">{meta.label}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{meta.description}</span>
            </div>
            <TrafficLight status={data.status} />
          </div>
          <div className="mt-2">
            <ScoreBar score={data.score} status={data.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            {renderVerdict(data.verdict)}
          </p>
        </div>

        <span
          className={`flex-shrink-0 text-gray-400 dark:text-gray-500 mt-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div
          id={`category-body-${categoryKey}`}
          className="px-5 pb-5 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Analysis</h4>
            {data.summary.split('\n').filter(p => p.trim()).map((paragraph, i) => (
              <p key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Recommendations
            </h4>
            <ul className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
