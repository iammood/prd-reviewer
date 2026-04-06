import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';

const ACCEPTED_EXTENSIONS = ['.docx', '.pdf', '.md'];

const STEPS = [
  'Breaking down document',
  'Sending to AI',
  'Reviewing design',
  'Reviewing engineering',
  'Reviewing product & security',
  'Finalizing your review…',
];
const LAST           = STEPS.length - 1;
const STEP_DURATIONS = [2800, 2800, 2600, 2200, 1600, 0];
const MIN_MS         = 380;
const FINAL_PAUSE    = 750;

// ── Processing view ───────────────────────────────────────────────────────────

function ProcessingView({ source, apiDone, onComplete }) {
  const [phase,   setPhase]   = useState('normal');
  const [current, setCurrent] = useState(0);
  const allDone = phase === 'completing';

  useEffect(() => {
    if (phase !== 'normal') return;
    if (current >= LAST - 1) return;
    const t = setTimeout(() => setCurrent(c => c + 1), STEP_DURATIONS[current]);
    return () => clearTimeout(t);
  }, [phase, current]);

  useEffect(() => {
    if (apiDone && phase === 'normal') setPhase('fast');
  }, [apiDone, phase]);

  useEffect(() => {
    if (phase !== 'fast') return;
    const isOnLast = current >= LAST;
    const t = setTimeout(() => {
      if (isOnLast) setPhase('completing');
      else setCurrent(c => c + 1);
    }, isOnLast ? FINAL_PAUSE : MIN_MS);
    return () => clearTimeout(t);
  }, [phase, current]);

  useEffect(() => {
    if (phase !== 'completing') return;
    const t = setTimeout(onComplete, 80);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  const progress = allDone ? 100 : Math.round((current / LAST) * 100);

  return (
    <div className="w-full flex flex-col items-center gap-6 py-8">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800
                      text-sm text-gray-500 dark:text-gray-400 max-w-full">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <span className="truncate font-medium">{source}</span>
      </div>

      <div className="w-full max-w-xs h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        {STEPS.map((label, i) => {
          const isComplete = i < current || allDone;
          const isCurrent  = i === current && !allDone;
          return (
            <motion.div key={label} className="flex items-center gap-3"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06, ease: 'easeOut' }}>
              <span className={`relative flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                isComplete ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 dark:text-emerald-400'
                  : isCurrent ? 'text-indigo-500 dark:text-indigo-400'
                  : 'text-gray-300 dark:text-gray-700'
              }`}>
                <AnimatePresence mode="wait" initial={false}>
                  {isComplete ? (
                    <motion.span key="check" className="flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.18, ease: 'backOut' }}>
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </motion.span>
                  ) : isCurrent ? (
                    <motion.span key="spinner" className="flex items-center justify-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </motion.span>
                  ) : (
                    <motion.span key="dot" className="flex items-center justify-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className={`text-sm transition-colors duration-200 ${
                isComplete ? 'text-gray-400 dark:text-gray-500'
                  : isCurrent ? 'text-gray-800 dark:text-gray-100 font-medium'
                  : 'text-gray-300 dark:text-gray-600'
              }`}>{label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UploadZone({ onSubmit, loading, apiDone, onComplete }) {
  const [tab, setTab]                 = useState('upload');
  const [dragging, setDragging]       = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [pasteText, setPasteText]     = useState('');
  const [source, setSource]           = useState('');
  const inputRef                      = useRef(null);

  if (loading || apiDone) {
    return <ProcessingView source={source || 'Pasted text'} apiDone={apiDone} onComplete={onComplete} />;
  }

  function handleFile(file) {
    setUploadError('');
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some(ext => name.endsWith(ext))) {
      setUploadError('Unsupported format. Please upload a .docx, .pdf, or .md file.');
      return;
    }
    // .md files: extract text client-side and switch to paste tab
    if (name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = e => {
        setPasteText(e.target.result);
        setTab('paste');
      };
      reader.readAsText(file);
      return;
    }
    setSource(file.name);
    onSubmit(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleFileChange(e) {
    handleFile(e.target.files[0]);
    e.target.value = '';
  }

  function handlePasteSubmit() {
    const trimmed = pasteText.trim();
    if (!trimmed) return;
    setSource('Pasted text');
    onSubmit(trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); }
  }

  const wordCount = pasteText.trim() ? pasteText.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ── Segmented control ── */}
      <div className="flex bg-gray-100 dark:bg-gray-800/70 rounded-full p-1 gap-0.5">
        {[{ key: 'upload', label: 'Upload file' }, { key: 'paste', label: 'Paste text' }].map(({ key, label }) => (
          <Button
            key={key}
            size="raw"
            variant="raw"
            onClick={() => { setTab(key); setUploadError(''); }}
            className="relative flex-1 py-1.5 text-sm font-medium text-center"
          >
            {tab === key && (
              <motion.span
                layoutId="segment-pill"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className={`relative z-10 transition-colors duration-150 ${
              tab === key ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>{label}</span>
          </Button>
        ))}
      </div>

      {/* ── Fixed-height unified container ── */}
      <div
        className={`relative h-80 rounded-2xl overflow-hidden border shadow-sm transition-colors duration-200 ${
          dragging
            ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/20'
            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>

          {/* Upload panel */}
          {tab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Drop target area */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload PRD — drag and drop or click to browse"
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                onKeyDown={handleKeyDown}
                className="flex-1 flex flex-col items-center justify-center gap-4 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                  dragging ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }`}>
                  {dragging ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  )}
                </div>

                {dragging ? (
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Drop to analyze</p>
                ) : (
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Drop your PRD here</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      or <span className="text-indigo-500 dark:text-indigo-400">browse to upload</span>
                    </p>
                  </div>
                )}

                {!dragging && (
                  <div className="flex items-center gap-1.5">
                    {['.docx', '.pdf', '.md'].map(ext => (
                      <span key={ext} className="px-2.5 py-1 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-400 dark:text-gray-500">
                        {ext}
                      </span>
                    ))}
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept=".docx,.pdf,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                />
              </div>

              {/* Bottom CTA */}
              <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => inputRef.current?.click()}
                >
                  Browse files
                </Button>
              </div>
            </motion.div>
          )}

          {/* Paste panel */}
          {tab === 'paste' && (
            <motion.div
              key="paste"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Textarea area */}
              <div className="flex-1 relative overflow-hidden">
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="Paste your PRD content here…"
                  className="absolute inset-0 w-full h-full bg-transparent px-5 pt-5 pb-3
                             text-sm text-gray-700 dark:text-gray-200
                             placeholder-gray-400 dark:placeholder-gray-600
                             resize-none outline-none leading-relaxed"
                />
                {wordCount > 0 && (
                  <span className="absolute bottom-2 right-4 text-xs text-gray-300 dark:text-gray-600 pointer-events-none tabular-nums">
                    {wordCount.toLocaleString()} words
                  </span>
                )}
              </div>

              {/* Bottom CTA */}
              <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                >
                  Review PRD
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Error ── */}
      <AnimatePresence initial={false}>
        {uploadError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            role="alert"
            className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {uploadError}
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  );
}
