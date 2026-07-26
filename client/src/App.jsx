// update
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import InputPanel from './components/InputPanel';
import ReviewDashboard from './components/ReviewDashboard';
import Button from './components/Button';
import LandingPage from './components/LandingPage';
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
  'Uploading document',
  'Reading document',
  'Reviewing Product',
  'Reviewing Design',
  'Reviewing Engineering',
  'Preparing report',
];
const LAST           = STEPS.length - 1;
const STEP_DURATIONS = [1000, 1500, 4000, 3500, 3000, 0];
const MIN_MS         = 380;
const FINAL_PAUSE    = 750;

// Maps server failedAt string → STEPS index
const FAIL_STEP = { uploading: 0, reading: 1, reviewing: 2, preparing: 5 };

function ProcessingView({ source, apiDone, onComplete, error, failedAt, onRetry }) {
  const [phase,   setPhase]   = useState('normal');
  const [current, setCurrent] = useState(0);
  const allDone = phase === 'completing';

  useEffect(() => {
    if (error) return;
    if (phase !== 'normal') return;
    if (current >= LAST - 1) return;
    const t = setTimeout(() => setCurrent(c => c + 1), STEP_DURATIONS[current]);
    return () => clearTimeout(t);
  }, [phase, current, error]);

  useEffect(() => {
    if (!error && apiDone && phase === 'normal') setPhase('fast');
  }, [apiDone, phase, error]);

  useEffect(() => {
    if (error) return;
    if (phase !== 'fast') return;
    const isOnLast = current >= LAST;
    const t = setTimeout(() => {
      if (isOnLast) setPhase('completing');
      else setCurrent(c => c + 1);
    }, isOnLast ? FINAL_PAUSE : MIN_MS);
    return () => clearTimeout(t);
  }, [phase, current, error]);

  useEffect(() => {
    if (phase !== 'completing') return;
    const t = setTimeout(onComplete, 80);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  const progress = allDone ? 100 : Math.round((current / LAST) * 100);

  function stepState(i) {
    if (error) {
      const failIdx = failedAt != null ? (FAIL_STEP[failedAt] ?? current) : current;
      if (i < failIdx)   return 'complete';
      if (i === failIdx) return 'failed';
      return 'pending';
    }
    if (i < current || allDone) return 'complete';
    if (i === current && !allDone) return 'active';
    return 'pending';
  }

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

      {!error && (
        <div className="w-full max-w-xs h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      )}

      <div className="w-full max-w-xs flex flex-col gap-3">
        {STEPS.map((label, i) => {
          const state = stepState(i);
          return (
            <motion.div key={label} className="flex items-center gap-3"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06, ease: 'easeOut' }}>
              <span className={`relative flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                state === 'complete' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 dark:text-emerald-400'
                : state === 'active'  ? 'text-indigo-500 dark:text-indigo-400'
                : state === 'failed'  ? 'bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400'
                : 'text-gray-300 dark:text-gray-700'
              }`}>
                <AnimatePresence mode="wait" initial={false}>
                  {state === 'complete' && (
                    <motion.span key="check" className="flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.18, ease: 'backOut' }}>
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </motion.span>
                  )}
                  {state === 'active' && (
                    <motion.span key="spinner" className="flex items-center justify-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </motion.span>
                  )}
                  {state === 'failed' && (
                    <motion.span key="x" className="flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.18, ease: 'backOut' }}>
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </motion.span>
                  )}
                  {state === 'pending' && (
                    <motion.span key="dot" className="flex items-center justify-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className={`text-sm transition-colors duration-200 ${
                state === 'complete' ? 'text-gray-400 dark:text-gray-500'
                : state === 'active'  ? 'text-gray-800 dark:text-white font-medium'
                : state === 'failed'  ? 'text-red-600 dark:text-red-400 font-medium'
                : 'text-gray-300 dark:text-gray-600'
              }`}>{label}</span>
            </motion.div>
          );
        })}
      </div>

      {error && (
        <div className="flex flex-col items-center gap-3 pt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs leading-relaxed">
            {error}
          </p>
          <Button variant="primary" onClick={onRetry}>Try again</Button>
        </div>
      )}
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
          Upload or paste a PRD <span className="md:hidden">above</span><span className="hidden md:inline">on the left</span> to get started
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
  const { submit, retry, status, result, error, failedAt, reset } = useReview();
  const { theme, toggle } = useTheme();
  const [showLanding, setShowLanding] = useState(true);
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

  // ── Device back/forward navigation via the History API (no URL routing) ──
  // Each forward step (enter the app; open a section on mobile) pushes a
  // history entry, so the device back-swipe / browser Back returns to the
  // previous view instead of leaving the site. `d` tracks depth so the logo
  // can jump straight home from any level.
  const depthRef = useRef(0);

  useEffect(() => {
    window.history.replaceState({ v: 'landing', d: 0 }, '');
    depthRef.current = 0;
    function onPop(e) {
      const st = e.state || { v: 'landing', d: 0 };
      depthRef.current = st.d || 0;
      if (st.v === 'app') {
        setShowLanding(false);
        setSelectedId(null);
      } else if (st.v === 'section') {
        setShowLanding(false);
        setSelectedId(st.id ?? null);
      } else {
        setShowLanding(true);
        setSelectedId(null);
      }
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function pushHistory(state) {
    depthRef.current += 1;
    window.history.pushState({ ...state, d: depthRef.current }, '');
  }

  const isMobileWidth = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  function enterApp() {
    setShowLanding(false);
    pushHistory({ v: 'app' });
  }

  function goHome() {
    if (depthRef.current > 0) window.history.go(-depthRef.current);
    else { setShowLanding(true); setSelectedId(null); }
  }

  // On mobile, opening a section is a navigation (full-screen detail) → push a
  // history entry so Back returns to the list. On desktop it's just a selection.
  function handleSelectSection(id) {
    setSelectedId(id);
    if (id != null && isMobileWidth()) pushHistory({ v: 'section', id });
  }

  const showProcessing = status === 'loading' || (status === 'done' && !uiReady) || status === 'error';
  const showResults    = status === 'done' && uiReady && !!result;

  if (showLanding) {
    return (
      <MotionConfig reducedMotion="user">
        <LandingPage onEnter={enterApp} />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-dvh md:h-dvh bg-gray-50 dark:bg-gray-950 flex flex-col overflow-x-hidden md:overflow-hidden">

      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md
                         border-b border-gray-200/80 dark:border-gray-800/80 z-10">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-2 md:py-0 md:h-14
                        flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-2">

          {/* Logo — click to return to the landing page */}
          <button
            type="button"
            onClick={goHome}
            aria-label="PRD Reviewer — back to home"
            className="order-1 flex-shrink-0 md:w-[180px] text-left rounded-lg -mx-1 px-1 cursor-pointer
                       transition-opacity hover:opacity-70
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">PRD Reviewer</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">AI-powered review</p>
          </button>

          {/* Tab nav */}
          <div className="order-3 md:order-2 w-full md:w-auto md:flex-1 flex justify-center">
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
                  className="relative px-5 py-2.5 md:py-1.5 text-sm font-medium min-h-[44px] md:min-h-0"
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
          <div className="order-2 md:order-3 flex-shrink-0 md:w-[180px] flex justify-end ml-auto md:ml-0">
            <Button
              size="raw"
              variant="raw"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-full min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center
                         text-gray-400 hover:text-gray-600
                         dark:text-gray-500 dark:hover:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </Button>
          </div>

        </div>
      </header>

      {/* ── Workspace ── */}
      <div className="flex-1 flex md:overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden max-w-[1280px] mx-auto w-full">

          {/* ── Left panel (list) — hidden on mobile once a template section is open ── */}
          <div className={`${tab === 'template' && selectedId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-2/5 md:border-r border-gray-200 dark:border-gray-800 md:overflow-hidden`}>
            <AnimatePresence mode="wait" initial={false}>
              {tab === 'review' ? (
                <motion.div
                  key="left-review"
                  {...fade}
                  className="flex-1 p-4 md:p-6 flex flex-col min-h-0"
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
                  className="flex-1 md:overflow-y-auto"
                >
                  <TemplateSidebar
                    type={tmplType}
                    audience={tmplAudience}
                    selectedId={selectedId}
                    onTypeChange={handleTypeChange}
                    onAudienceChange={setTmplAudience}
                    onSelect={handleSelectSection}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right panel (detail) — hidden on mobile until a template section is open ── */}
          <div className={`${tab === 'template' && !selectedId ? 'hidden md:block' : 'block'} w-full md:flex-1 md:relative`}>
            <div className="md:absolute md:inset-0 md:overflow-y-auto flex flex-col">
              <AnimatePresence mode="wait" initial={false}>

                {tab === 'review' ? (
                  <motion.div key="right-review" {...fade} className="flex-1 flex flex-col">
                    <AnimatePresence mode="wait">

                      {status === 'idle' && (
                        <motion.div key="idle" {...fadeSlide}
                          className="flex-1 flex items-center justify-center p-8 min-h-[45vh] md:min-h-0"
                        >
                          <EmptyState />
                        </motion.div>
                      )}

                      {showProcessing && (
                        <motion.div key="processing" {...fadeSlide}
                          className="flex-1 flex items-center justify-center p-8 min-h-[45vh] md:min-h-0"
                        >
                          <ProcessingView
                            source={source || 'Pasted text'}
                            apiDone={status === 'done' && !uiReady}
                            onComplete={() => setUiReady(true)}
                            error={status === 'error' ? error : null}
                            failedAt={status === 'error' ? failedAt : null}
                            onRetry={() => { setUiReady(false); retry(); }}
                          />
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
                    {/* Mobile: back to the section list */}
                    {selectedId && (
                      <button
                        type="button"
                        onClick={() => window.history.back()}
                        aria-label="Back to sections"
                        className="md:hidden flex items-center gap-1.5 px-4 pt-4 text-sm font-medium
                                   text-indigo-600 dark:text-indigo-400 active:opacity-60 transition-opacity"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to sections
                      </button>
                    )}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedId || 'tmpl-empty'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="flex-1"
                      >
                        <TemplateDetail id={selectedId} />
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

    </div>
    </MotionConfig>
  );
}
