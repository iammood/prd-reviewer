import { useState } from 'react';
import UploadZone from './components/UploadZone';
import LoadingSpinner from './components/LoadingSpinner';
import ReviewDashboard from './components/ReviewDashboard';
import PrdTemplate from './components/PrdTemplate';
import useReview from './hooks/useReview';
import useTheme from './hooks/useTheme';

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

export default function App() {
  const { submit, status, result, error, reset } = useReview();
  const { theme, toggle } = useTheme();
  const [view, setView] = useState('review');

  if (view === 'template') {
    return <PrdTemplate onBack={() => setView('review')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">PRD Reviewer</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">AI-powered design, engineering &amp; product PRD analysis</p>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {status === 'idle' && (
          <div className="w-full max-w-lg flex flex-col gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review your PRD</h2>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Get a structured review across design, engineering &amp; product
              </p>
            </div>

            <UploadZone onSubmit={submit} loading={false} />

            <div className="text-center">
              <button
                type="button"
                onClick={() => setView('template')}
                className="text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                View PRD template →
              </button>
            </div>
          </div>
        )}

        {status === 'loading' && <LoadingSpinner />}

        {status === 'error' && (
          <div className="w-full max-w-lg flex flex-col items-center gap-6 py-12">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center justify-center text-2xl">
              ✕
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-300">Review failed</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">{error}</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'done' && result && (
          <ReviewDashboard result={result} onReset={reset} />
        )}
      </main>
    </div>
  );
}
