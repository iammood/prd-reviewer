import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getVerdictStyle, CATEGORY_META } from '../utils/statusHelpers.jsx';
import { downloadReviewPdf, downloadReviewDocx } from '../utils/downloadReport';
import Button from './Button';

const NEXT_STEP = {
  'NOT READY TO BUILD':   'Address all blockers before this PRD is ready to build.',
  'CONDITIONAL APPROVAL': 'Resolve caution areas and get stakeholder sign-off before building.',
  'READY TO BUILD':       'This PRD is ready — share the report and begin sprint planning.',
};

// ─── Download icon ─────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── Download dropdown ─────────────────────────────────────────────────────────

function DownloadDropdown({ result }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  async function handle(fn, key) {
    setOpen(false);
    setBusy(key);
    try { await fn(); } finally { setBusy(null); }
  }

  const items = [
    { key: 'pdf',  label: 'PDF (.pdf)',   fn: () => downloadReviewPdf(result)  },
    { key: 'docx', label: 'Word (.docx)', fn: () => downloadReviewDocx(result) },
  ];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen(v => !v)}
        disabled={busy !== null}
        loading={busy !== null}
        icon={busy ? null : <DownloadIcon />}
        iconAfter={busy ? null : <ChevronIcon open={open} />}
      >
        {busy ? 'Downloading…' : 'Download'}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top left' }}
            className="absolute top-full left-0 mt-2 w-44
                       bg-white dark:bg-gray-800
                       border border-gray-200 dark:border-gray-700
                       rounded-2xl shadow-lg overflow-hidden z-50"
          >
            {items.map(({ key, label, fn }) => (
              <Button
                key={key}
                size="raw"
                variant="raw"
                onClick={() => handle(fn, key)}
                className="w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200
                           hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                {label}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function OverallBanner({ overall, categories, result, onFixMode }) {
  const style = getVerdictStyle(overall.verdict);

  const keyIssues = ['design', 'engineering', 'product', 'security']
    .filter(key => categories[key]?.status !== 'good')
    .map(key => {
      const cat   = categories[key];
      const meta  = CATEGORY_META[key];
      const plain = cat.verdict.replace(/\*\*([^*]+)\*\*/g, '$1');
      return { key, label: meta.label, status: cat.status, plain };
    });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">

      {/* ── Verdict + score ── */}
      <div className="px-6 pt-6 pb-5 flex items-center justify-between gap-4 flex-wrap
                      border-b border-gray-100 dark:border-gray-800">
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${style.badge}`}>
          {overall.verdict}
        </span>
        <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
          {overall.score}<span className="text-base font-medium text-gray-400 dark:text-gray-500 ml-0.5">%</span>
        </span>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* ── Key Issues ── */}
        {keyIssues.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Key Issues
            </p>
            <div className="flex flex-col gap-2">
              {keyIssues.map(({ key, label, status, plain }) => {
                const statusLabel = status === 'blocker' ? 'Missing' : 'Needs improvement';
                const statusStyle = status === 'blocker'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
                return (
                  <div key={key}
                    className="p-4 rounded-2xl border border-gray-100 dark:border-white/10
                               bg-gray-50/50 dark:bg-white/5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {label}
                      </span>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                      {plain}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Next Step ── */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Next Step
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {NEXT_STEP[overall.verdict]}
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {onFixMode && (
            <Button
              variant="primary"
              onClick={onFixMode}
              iconAfter={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
            >
              Fix Issues
            </Button>
          )}
          <DownloadDropdown result={result} />
        </div>

      </div>
    </div>
  );
}
