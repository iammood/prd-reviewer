import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';

const ACCEPTED = ['.docx', '.pdf', '.md'];

export default function InputPanel({ onSubmit, loading, onSourceChange }) {
  const [pasteText,  setPasteText]  = useState('');
  const [dragging,   setDragging]   = useState(false);
  const [error,      setError]      = useState('');
  const [extracting, setExtracting] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    setError('');
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!ACCEPTED.some(ext => name.endsWith(ext))) {
      setError('Unsupported format. Upload .docx, .pdf, or .md');
      return;
    }

    if (name.endsWith('.md')) {
      // Markdown — extract client-side instantly
      const reader = new FileReader();
      reader.onload = e => {
        setPasteText(e.target.result);
        onSourceChange?.(file.name);
      };
      reader.readAsText(file);
    } else {
      // .docx / .pdf — extract text via server, populate textarea
      setExtracting(true);
      onSourceChange?.(file.name);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/extract', { method: 'POST', body: fd });
        let data;
        try {
          data = await res.json();
        } catch (err) {
          throw new Error('Invalid server response');
        }
        if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to extract text');
        setPasteText(data.text || '');
      } catch (err) {
        setError('Could not read file: ' + err.message);
      } finally {
        setExtracting(false);
      }
    }
  }

  function handleSubmit() {
    const trimmed = pasteText.trim();
    if (!trimmed || loading || extracting) return;
    onSourceChange?.('Pasted text');
    onSubmit(trimmed);
  }

  const wordCount = pasteText.trim() ? pasteText.trim().split(/\s+/).length : 0;
  const busy = loading || extracting;

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2.5">

      {/* ── Unified container ── */}
      <div
        className={`flex-1 flex flex-col rounded-2xl overflow-hidden border transition-colors duration-150 min-h-0 ${
          dragging
            ? 'border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20'
            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      >
        {/* Drop / upload strip */}
        <Button
          size="raw"
          variant="raw"
          onClick={() => !extracting && inputRef.current?.click()}
          disabled={extracting}
          className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5
                     border-b border-gray-100 dark:border-gray-800/60
                     hover:bg-gray-50 dark:hover:bg-gray-800/40
                     disabled:cursor-default transition-colors text-left"
        >
          {extracting ? (
            <>
              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="flex-1 text-xs text-indigo-500 dark:text-indigo-400 font-medium">
                Extracting text…
              </span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 min-w-0 truncate">
                Drop a file or{' '}
                <span className="text-indigo-500 dark:text-indigo-400">click to upload</span>
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {ACCEPTED.map(ext => (
                  <span key={ext}
                    className="px-1.5 py-0.5 rounded-2xl bg-gray-100 dark:bg-gray-800
                               text-[10px] text-gray-400 dark:text-gray-500">
                    {ext}
                  </span>
                ))}
              </div>
            </>
          )}
        </Button>

        {/* Textarea */}
        <div className="flex-1 relative min-h-0">
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste your PRD content here…"
            className="absolute inset-0 w-full h-full bg-transparent px-4 pt-4 pb-8
                       text-sm text-gray-700 dark:text-gray-300
                       placeholder-gray-400 dark:placeholder-gray-600
                       resize-none outline-none leading-relaxed"
          />
          {wordCount > 0 && (
            <span className="absolute bottom-3 right-3 text-xs text-gray-300 dark:text-gray-600
                             pointer-events-none tabular-nums select-none">
              {wordCount.toLocaleString()} words
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="flex-shrink-0 p-5 border-t border-gray-100 dark:border-gray-800/60">
          <Button
            variant="primary"
            fullWidth
            loading={loading}
            disabled={!pasteText.trim() || busy}
            onClick={handleSubmit}
          >
            {loading ? 'Reviewing…' : 'Review PRD'}
          </Button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept=".docx,.pdf,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
        onChange={e => { handleFile(e.target.files[0]); e.target.value = ''; }}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
