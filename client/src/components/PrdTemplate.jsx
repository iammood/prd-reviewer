import sections from '../data/templateSections';
import Button from './Button';

const TYPES = [
  { id: 'new',         label: 'New PRD'     },
  { id: 'enhancement', label: 'Enhancement' },
  { id: 'bug',         label: 'Bug'         },
];

const AUDIENCES = [
  { id: 'all',         label: 'All'         },
  { id: 'design',      label: 'Design'      },
  { id: 'engineering', label: 'Engineering' },
  { id: 'product',     label: 'Product'     },
];

function filterSections(type, audience) {
  return sections.filter(s =>
    s.types.includes(type) &&
    (audience === 'all' || s.audiences.includes('all') || s.audiences.includes(audience))
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function TemplateSidebar({ type, audience, selectedId, onTypeChange, onAudienceChange, onSelect }) {
  const visible = filterSections(type, audience);

  return (
    <div className="flex flex-col h-full">

      {/* Filters */}
      <div className="flex-shrink-0 p-5 border-b border-gray-200 dark:border-gray-800 space-y-4">

        {/* Type segmented control */}
        <div className="flex bg-gray-100 dark:bg-gray-800/70 rounded-full p-1 gap-0.5">
          {TYPES.map(t => (
            <Button
              key={t.id}
              size="raw"
              variant="raw"
              onClick={() => onTypeChange(t.id)}
              className={`relative flex-1 py-1.5 text-xs font-medium transition-colors ${
                type === t.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {/* Audience pills */}
        <div className="flex gap-1.5 flex-wrap">
          {AUDIENCES.map(a => (
            <Button
              key={a.id}
              size="raw"
              variant="raw"
              onClick={() => onAudienceChange(a.id)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                audience === a.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {a.label}
            </Button>
          ))}
        </div>

      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto py-2">
        {visible.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-10 px-5">
            No sections match this combination.
          </p>
        ) : (
          visible.map(s => (
            <Button
              key={s.id}
              size="raw"
              variant="raw"
              onClick={() => onSelect(s.id)}
              className={`w-full text-left px-5 py-3 transition-colors ${
                selectedId === s.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/40'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
              }`}
            >
              <p className={`text-sm font-medium leading-snug ${
                selectedId === s.id
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-200'
              }`}>
                {s.title}
              </p>
              {s.description && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug line-clamp-1">
                  {s.description}
                </p>
              )}
            </Button>
          ))
        )}
      </div>

    </div>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export function TemplateDetail({ id }) {
  const section = id ? sections.find(s => s.id === id) : null;

  if (!section) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8 py-16">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Select a section</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Choose a template section on the left to see its contents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight tracking-tight">{section.title}</h2>
        {section.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            {section.description}
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-4">
        {section.items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40
                             text-indigo-600 dark:text-indigo-400 text-[10px] font-bold
                             flex items-center justify-center select-none">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{item.text}</p>
              {item.example && (
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed italic">
                  e.g. {item.example}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
