import { useEffect, useState } from 'react';
import { Clipboard, Check } from 'lucide-react';
import Button from './Button';
import { CATEGORY_META, renderText, cleanMarkdown } from '../utils/statusHelpers.jsx';

const SECTION_LABEL = 'text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2';

function buildCopyText(label, data) {
  const summary = cleanMarkdown(data.summary);
  const recs    = data.recommendations.map((r, i) => `${i + 1}. ${cleanMarkdown(r)}`).join('\n');

  return [
    label,
    '',
    'SUMMARY',
    summary,
    ...(recs ? ['', 'SUGGESTED FIX', recs] : []),
  ].join('\n');
}

export default function CategoryModal({ categoryKey, data, onClose }) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const meta = CATEGORY_META[categoryKey] || { label: categoryKey };

  useEffect(() => { requestAnimationFrame(() => setIsOpen(true)); }, []);

  function handleClose() {
    setIsOpen(false);
    setTimeout(onClose, 300);
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(buildCopyText(meta.label, data));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4
                  backdrop-blur-sm transition-opacity duration-300
                  bg-black/30 dark:bg-black/60
                  ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`${meta.label} details`}
    >
      <div className={`w-full max-w-2xl rounded-2xl shadow-xl flex flex-col
                       bg-white dark:bg-[#0B1220]
                       border border-gray-200 dark:border-white/10
                       transform transition-all duration-300 ease-out
                       ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100 dark:border-white/10">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base leading-tight tracking-tight">
            {meta.label}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium
                         bg-gray-100 hover:bg-gray-200 text-gray-600
                         dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300
                         hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg
                         active:scale-[0.98] active:translate-y-0 active:shadow-none
                         transition-all duration-200 ease-out active:duration-100"
            >
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <Button
              size="raw"
              variant="raw"
              onClick={handleClose}
              aria-label="Close"
              className="p-2 rounded-xl transition-colors
                         text-gray-400 hover:text-gray-600 hover:bg-gray-100
                         dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">

          {/* Summary */}
          <div>
            <p className={SECTION_LABEL}>Summary</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {renderText(data.summary)}
            </p>
          </div>

          {/* Suggested Fix */}
          {data.recommendations.length > 0 && (
            <div>
              <p className={SECTION_LABEL}>Suggested Fix</p>
              <ol className="flex flex-col gap-2.5">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full text-[11px] font-bold
                                     flex items-center justify-center mt-0.5 select-none
                                     bg-gray-100 text-gray-500
                                     dark:bg-white/10 dark:text-gray-400">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {renderText(rec)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
