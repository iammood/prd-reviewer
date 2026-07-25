import { useState } from 'react';
import { CATEGORY_META } from '../utils/statusHelpers.jsx';
import Button from './Button';

const CATEGORY_ORDER = ['product', 'design', 'engineering'];

const STATUS_ORDER = { blocker: 0, caution: 1 };

const STATUS_BADGE = {
  blocker: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  caution: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
};

const STATUS_LABEL = { blocker: 'Blocker', caution: 'Caution' };

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

export default function MissingEssentials({ result }) {
  const [checked, setChecked] = useState(() => new Set());

  // Only surface categories with real gaps
  const gapCategories = CATEGORY_ORDER
    .filter(key => result.categories[key]?.status === 'blocker' || result.categories[key]?.status === 'caution')
    .sort((a, b) => STATUS_ORDER[result.categories[a].status] - STATUS_ORDER[result.categories[b].status]);

  if (gapCategories.length === 0) return null;

  const allItems = gapCategories.flatMap(key =>
    result.categories[key].recommendations.map((_, i) => `${key}-${i}`)
  );
  const allChecked = allItems.length > 0 && allItems.every(id => checked.has(id));

  function toggle(id) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white leading-tight tracking-tight">
              Missing Essentials
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Address these before moving to build.
            </p>
          </div>
          {allChecked && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              <CheckIcon />
              All addressed
            </span>
          )}
          {!allChecked && (
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
              {allItems.length - checked.size} of {allItems.length} remaining
            </span>
          )}
        </div>
      </div>

      {/* Category groups */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {gapCategories.map(key => {
          const cat = result.categories[key];
          const meta = CATEGORY_META[key] || { label: key, icon: '📌' };
          const items = cat.recommendations;
          const checkedCount = items.filter((_, i) => checked.has(`${key}-${i}`)).length;
          const groupDone = checkedCount === items.length;

          return (
            <div key={key} className="px-5 py-4">
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base" aria-hidden="true">{meta.icon}</span>
                <span className={`text-sm font-semibold ${groupDone ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                  {meta.label}
                </span>
                {groupDone ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ml-auto">
                    <CheckIcon />
                    Done
                  </span>
                ) : (
                  <>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[cat.status]}`}>
                      {STATUS_LABEL[cat.status]}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                      {items.length - checkedCount} left
                    </span>
                  </>
                )}
              </div>

              {/* Checklist items */}
              <ul className="space-y-2.5">
                {items.map((rec, i) => {
                  const id = `${key}-${i}`;
                  const done = checked.has(id);
                  return (
                    <li key={id}>
                      <Button
                        size="raw"
                        variant="raw"
                        onClick={() => toggle(id)}
                        className="w-full flex items-start gap-3 text-left group"
                        aria-pressed={done}
                        aria-label={`${done ? 'Unmark' : 'Mark as addressed'}: ${rec}`}
                      >
                        {/* Checkbox */}
                        <span className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                          done
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                        }`}>
                          {done && <CheckIcon />}
                        </span>
                        {/* Text */}
                        <span className={`text-sm leading-relaxed transition-colors ${
                          done
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100'
                        }`}>
                          {rec}
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
