import { useRef, useState } from 'react';

const ACCEPTED_EXTENSIONS = ['.docx', '.pdf', '.md'];

export default function UploadZone({ onSubmit, loading }) {
  const [tab, setTab] = useState('upload');
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [pasteText, setPasteText] = useState('');
  const inputRef = useRef(null);

  function validateAndSubmit(file) {
    setUploadError('');
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some(ext => name.endsWith(ext))) {
      setUploadError('Please upload a .docx, .pdf, or .md file.');
      return;
    }
    onSubmit(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    validateAndSubmit(e.dataTransfer.files[0]);
  }

  function handleFileChange(e) {
    validateAndSubmit(e.target.files[0]);
    e.target.value = '';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  function handlePasteSubmit() {
    const trimmed = pasteText.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Tab bar */}
      <div className="flex w-full max-w-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
        <button
          type="button"
          onClick={() => { setTab('upload'); setUploadError(''); }}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'upload'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setTab('paste')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'paste'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Paste text
        </button>
      </div>

      {tab === 'upload' && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload PRD document — drag and drop or click to browse"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={handleKeyDown}
            className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950 ${
              dragging
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100/60 dark:hover:bg-gray-900/40'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl">
              📄
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-gray-700 dark:text-gray-200">Drop your PRD here</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                or <span className="text-indigo-500 dark:text-indigo-400 underline underline-offset-2">browse to upload</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 font-medium">
                .docx, .pdf, or .md
              </p>
            </div>
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

          {uploadError && (
            <p role="alert" className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
              <span aria-hidden="true">✕</span> {uploadError}
            </p>
          )}
        </>
      )}

      {tab === 'paste' && (
        <div className="w-full max-w-lg flex flex-col gap-3">
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste your PRD content here..."
            rows={12}
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-4 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 resize-none outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
          />
          <button
            type="button"
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim() || loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            Review PRD
          </button>
        </div>
      )}
    </div>
  );
}
