import { useEffect, useState } from 'react';
import Button from './Button';
import { CATEGORY_META, renderText, parseParagraphs, cleanMarkdown } from '../utils/statusHelpers.jsx';

const SECTION_LABEL = 'text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2';

function buildCopyText(label, data) {
  const paragraphs    = parseParagraphs(data.summary);
  const whyItMatters  = cleanMarkdown(paragraphs[0] || '');
  const issue         = cleanMarkdown(data.verdict);
  const recs          = data.recommendations.map((r, i) => `${i + 1}. ${cleanMarkdown(r)}`).join('\n');

  return [
    label,
    '',
    'ISSUE',
    issue,
    '',
    'WHY IT MATTERS',
    whyItMatters,
    ...(recs ? ['', 'SUGGESTED FIX', recs] : []),
  ].join('\n');
}

export default function CategoryModal({ categoryKey, data, onClose }) {
  const [copied, setCopied] = useState(false);

  const meta         = CATEGORY_META[categoryKey] || { label: categoryKey };
  const paragraphs   = parseParagraphs(data.summary);
  const whyItMatters = paragraphs[0] || '';

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleCopy() {
    await navigator.clipboard.writeText(buildCopyText(meta.label, data));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`${meta.label} details`}
    >
      <div className="w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-xl flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white text-base leading-tight tracking-tight">{meta.label}</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              size="raw"
              variant="raw"
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/10 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">

          {/* Issue */}
          <div>
            <p className={SECTION_LABEL}>Issue</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {renderText(data.verdict)}
            </p>
          </div>

          {/* Why It Matters */}
          {whyItMatters && (
            <div>
              <p className={SECTION_LABEL}>Why It Matters</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {renderText(whyItMatters)}
              </p>
            </div>
          )}

          {/* Suggested Fix */}
          {data.recommendations.length > 0 && (
            <div>
              <p className={SECTION_LABEL}>Suggested Fix</p>
              <ol className="flex flex-col gap-2.5">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10
                                     text-gray-400 text-[11px] font-bold
                                     flex items-center justify-center mt-0.5 select-none">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-300 leading-relaxed">
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
