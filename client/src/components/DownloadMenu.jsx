import { useState, useEffect, useRef } from 'react';
import { downloadPdf, downloadDocx } from '../utils/downloadReport';
import Button from './Button';

export default function DownloadMenu({ result }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handle(fn) {
    setOpen(false);
    setBusy(true);
    try {
      await fn(result);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative flex justify-end">
      <Button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={busy}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {busy ? 'Downloading...' : 'Download report'}
        {!busy && (
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </Button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-10">
          <Button
            type="button"
            onClick={() => handle(downloadPdf)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <span className="text-base">📄</span> PDF (.pdf)
          </Button>
          <Button
            type="button"
            onClick={() => handle(downloadDocx)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <span className="text-base">📝</span> Word (.docx)
          </Button>
        </div>
      )}
    </div>
  );
}
