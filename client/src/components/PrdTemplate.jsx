import { useState } from 'react';
import sections from '../data/templateSections';
import useTheme from '../hooks/useTheme';

const TYPES = [
  { id: 'new', label: 'New PRD' },
  { id: 'enhancement', label: 'Enhancement' },
  { id: 'bug', label: 'Bug' },
];

const AUDIENCES = [
  { id: 'all', label: 'All' },
  { id: 'design', label: 'Design' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'product', label: 'Product' },
];

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function SectionCard({ section }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{section.title}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{section.description}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-gray-200 dark:border-gray-800">
          <ul className="mt-3 flex flex-col gap-3">
            {section.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                  {item.example && (
                    <span className="text-gray-400 dark:text-gray-500 text-xs">{item.example}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function PrdTemplate({ onBack }) {
  const [selectedType, setSelectedType] = useState('new');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const { theme, toggle } = useTheme();

  function handleTypeChange(type) {
    setSelectedType(type);
    setSelectedAudience('all');
  }

  const visible = sections.filter(s =>
    s.types.includes(selectedType) &&
    (selectedAudience === 'all' || s.audiences.includes('all') || s.audiences.includes(selectedAudience))
  );

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to reviewer
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">PRD Template</h1>
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Description + Filters */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 pt-5 pb-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use these templates to write clear and well-structured PRDs. The sections shown will adjust based on your selected PRD type.
          </p>
          {/* Type tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
            {TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === t.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Audience pills */}
          <div className="flex gap-2 flex-wrap">
            {AUDIENCES.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAudience(a.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedAudience === a.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section list */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {visible.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
              No sections match this combination.
            </p>
          ) : (
            visible.map(s => <SectionCard key={s.id} section={s} />)
          )}
        </div>
      </main>
    </div>
  );
}
