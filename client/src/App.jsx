import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import InputPanel from './components/InputPanel';
import ReviewDashboard from './components/ReviewDashboard';
import Button from './components/Button';
import { TemplateSidebar, TemplateDetail } from './components/PrdTemplate';
import useReview from './hooks/useReview';
import useTheme from './hooks/useTheme';

// ─── Icons ────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

// ─── Processing view ──────────────────────────────────────────────────────────

const STEPS = [
  'Breaking down document',
  'Sending to AI',
  'Reviewing design',
  'Reviewing engineering',
  'Reviewing security',
  'Finalizing your review…',
];
const LAST           = STEPS.length - 1;
const STEP_DURATIONS = [2800, 2800, 2600, 2200, 1600, 0];
const MIN_MS         = 380;
const FINAL_PAUSE    = 750;

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
    <div className="w-full flex flex-col items-center gap-6">
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
                  : isCurrent ? 'text-gray-800 dark:text-white font-medium'
                  : 'text-gray-300 dark:text-gray-600'
              }`}>{label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">No review yet</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 leading-relaxed">
          Upload or paste a PRD on the left to get started
        </p>
      </div>
    </div>
  );
}

// ─── Fade variants ────────────────────────────────────────────────────────────

const fadeSlide = {
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

const fade = {
  initial:    { opacity: 0 },
  animate:    { opacity: 1 },
  exit:       { opacity: 0 },
  transition: { duration: 0.15 },
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { submit, status, result, error, reset } = useReview();
  const { theme, toggle } = useTheme();
  const [tab, setTab]           = useState('review');
  const [uiReady, setUiReady]   = useState(false);
  const [source, setSource]     = useState('');

  // Template state (lifted so sidebar + detail share it)
  const [tmplType, setTmplType]         = useState('new');
  const [tmplAudience, setTmplAudience] = useState('all');
  const [selectedId, setSelectedId]     = useState(null);

  function handleReset() {
    setUiReady(false);
    setSource('');
    reset();
  }

  function handleTypeChange(type) {
    setTmplType(type);
    setTmplAudience('all');
    setSelectedId(null);
  }

  const showProcessing = status === 'loading' || (status === 'done' && !uiReady);
  const showResults    = status === 'done' && uiReady && !!result;

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="flex-shrink-0 h-14 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md
                         border-b border-gray-200/80 dark:border-gray-800/80 z-10">
        <div className="h-full max-w-[1280px] mx-auto px-6 flex items-center gap-6">

          {/* Logo */}
          <div className="flex-shrink-0 w-[180px]">
            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">PRD Reviewer</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">AI-powered review</p>
          </div>

          {/* Tab nav */}
          <div className="flex-1 flex justify-center">
            <div className="flex bg-gray-100 dark:bg-gray-800/70 rounded-full p-1 gap-0.5">
              {[
                { key: 'review',   label: 'Review PRD'   },
                { key: 'template', label: 'PRD Template' },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  size="raw"
                  variant="raw"
                  onClick={() => !showProcessing && setTab(key)}
                  disabled={showProcessing && key !== tab}
                  className="relative px-5 py-1.5 text-sm font-medium"
                >
                  {tab === key && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white dark:bg-gray-700 rounded-full shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className={`relative z-10 transition-colors duration-150 ${
                    tab === key
                      ? 'text-gray-900 dark:text-white'
                      : showProcessing
                      ? 'text-gray-300 dark:text-gray-600'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Theme toggle */}
          <div className="flex-shrink-0 w-[180px] flex justify-end">
            <Button
              size="raw"
              variant="raw"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-gray-400 hover:text-gray-600
                         dark:text-gray-500 dark:hover:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </Button>
          </div>

        </div>
      </header>

      {/* ── Workspace ── */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-hidden flex max-w-[1280px] mx-auto w-full">

          {/* ── Left panel ── */}
          <div className="w-2/5 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {tab === 'review' ? (
                <motion.div
                  key="left-review"
                  {...fade}
                  className="flex-1 p-6 flex flex-col min-h-0"
                >
                  <InputPanel
                    onSubmit={submit}
                    loading={showProcessing}
                    onSourceChange={setSource}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="left-template"
                  {...fade}
                  className="flex-1 overflow-y-auto"
                >
                  <TemplateSidebar
                    type={tmplType}
                    audience={tmplAudience}
                    selectedId={selectedId}
                    onTypeChange={handleTypeChange}
                    onAudienceChange={setTmplAudience}
                    onSelect={setSelectedId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 relative">
            <div className="absolute inset-0 overflow-y-auto flex flex-col">
              <AnimatePresence mode="wait" initial={false}>

                {tab === 'review' ? (
                  <motion.div key="right-review" {...fade} className="flex-1 flex flex-col">
                    <AnimatePresence mode="wait">

                      {status === 'idle' && (
                        <motion.div key="idle" {...fadeSlide}
                          className="flex-1 flex items-center justify-center p-8"
                        >
                          <EmptyState />
                        </motion.div>
                      )}

                      {showProcessing && (
                        <motion.div key="processing" {...fadeSlide}
                          className="flex-1 flex items-center justify-center p-8"
                        >
                          <ProcessingView
                            source={source || 'Pasted text'}
                            apiDone={status === 'done' && !uiReady}
                            onComplete={() => setUiReady(true)}
                          />
                        </motion.div>
                      )}

                      {status === 'error' && (
                        <motion.div key="error" {...fadeSlide}
                          className="flex-1 flex flex-col items-center justify-center gap-5 p-8"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950
                                          border border-red-200 dark:border-red-800
                                          flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Review failed</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-xs leading-relaxed">
                              {error}
                            </p>
                          </div>
                          <Button variant="primary" onClick={handleReset}>
                            Try Again
                          </Button>
                        </motion.div>
                      )}

                      {showResults && (
                        <motion.div key="results" {...fadeSlide} className="flex-1">
                          <ReviewDashboard result={result} onReset={handleReset} />
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div key="right-template" {...fade} className="flex-1 flex flex-col">
                    <TemplateDetail id={selectedId} />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
