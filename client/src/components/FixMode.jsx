import { useState, useEffect, useRef } from 'react';
import { CATEGORY_META, getVerdictStyle, cleanMarkdown, parseParagraphs } from '../utils/statusHelpers.jsx';
import { downloadUpdatedPrdPdf, downloadUpdatedPrdDocx } from '../utils/downloadReport';
import Button from './Button';

const API_URL = import.meta.env.VITE_API_URL;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ORDER = ['design', 'engineering', 'product', 'security'];
const STATUS_ORDER   = { blocker: 0, caution: 1 };

const STATUS_BADGE = {
  blocker: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  caution: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
};
const STATUS_LABEL = { blocker: 'Blocker', caution: 'Caution' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstSentences(text, n = 2) {
  const plain     = cleanMarkdown(text);
  const sentences = plain.match(/[^.!?]+[.!?]+/g) || [plain];
  return sentences.slice(0, n).join(' ').trim();
}

function buildSteps(result, categoryKey = null) {
  const steps = [];
  const relevantKeys = CATEGORY_ORDER
    .filter(key => (categoryKey ? key === categoryKey : true))
    .filter(key => ['blocker', 'caution'].includes(result.categories[key]?.status))
    .sort((a, b) => STATUS_ORDER[result.categories[a].status] - STATUS_ORDER[result.categories[b].status]);

  for (const key of relevantKeys) {
    const cat  = result.categories[key];
    const meta = CATEGORY_META[key] || { label: key, icon: '📌' };
    const issue = firstSentences(cat.verdict, 2);
    const whyItMatters = parseParagraphs(cat.summary)[0] || '';
    cat.recommendations.forEach((rec, i) => {
      steps.push({
        id: `${key}-${i}`,
        categoryKey: key,
        categoryLabel: meta.label,
        categoryIcon: meta.icon,
        status: cat.status,
        issue,
        whyItMatters: cleanMarkdown(whyItMatters),
        suggestedFix: cleanMarkdown(rec),
      });
    });
  }
  return steps;
}

function buildUpdatedPrd(prdText, steps, inputs) {
  const addressed = steps.filter(s => inputs[s.id]?.trim());
  if (addressed.length === 0) return prdText;
  const lines = ['', '---', '## PRD Amendments (Fix Mode)', ''];
  for (const step of addressed) {
    lines.push(`### ${step.categoryLabel}: ${step.issue}`, '', inputs[step.id].trim(), '');
  }
  return prdText + lines.join('\n');
}

function estimateUpdatedScore(result, steps, inputs) {
  const weights      = { design: 0.25, engineering: 0.30, product: 0.25, security: 0.20 };
  const addressedIds = new Set(steps.filter(s => inputs[s.id]?.trim()).map(s => s.id));

  const updatedCategories = {};
  for (const [key, cat] of Object.entries(result.categories)) {
    const stepsForCat    = steps.filter(s => s.categoryKey === key);
    const addressedCount = stepsForCat.filter(s => addressedIds.has(s.id)).length;
    const improvement    = stepsForCat.length > 0
      ? (addressedCount / stepsForCat.length) * (100 - cat.score) * 0.65
      : 0;
    updatedCategories[key] = { ...cat, score: Math.min(100, Math.round(cat.score + improvement)) };
  }

  const overallScore = Math.round(
    Object.entries(weights).reduce((sum, [key, w]) => sum + ((updatedCategories[key]?.score ?? 0) * w), 0)
  );
  const hasBlocker = Object.values(updatedCategories).some(c => c.status === 'blocker' && c.score < 40);
  const verdict    = hasBlocker ? 'NOT READY TO BUILD' : overallScore >= 75 ? 'READY TO BUILD' : 'CONDITIONAL APPROVAL';
  return { score: overallScore, verdict, categories: updatedCategories };
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({ prdText, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label="Updated PRD Preview"
    >
      <div className="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm leading-tight tracking-tight">Updated PRD Preview</h3>
          <Button size="raw" variant="raw" onClick={onClose} aria-label="Close preview"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {prdText}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({ steps, inputs, result, onClose }) {
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const addressedCount = steps.filter(s => inputs[s.id]?.trim()).length;
  const total          = steps.length;
  const updatedPrd     = buildUpdatedPrd(result.prdText || '', steps, inputs);
  const estimated      = estimateUpdatedScore(result, steps, inputs);
  const verdictStyle   = getVerdictStyle(estimated.verdict);
  const originalScore  = result.overall.score;
  const scoreDelta     = estimated.score - originalScore;

  const downloadResult = {
    ...result,
    overall: { ...result.overall, score: estimated.score, verdict: estimated.verdict },
    prdText: updatedPrd,
    amendments: steps
      .filter(s => inputs[s.id]?.trim())
      .map(s => ({ category: s.categoryLabel, issue: s.issue, fix: inputs[s.id].trim() })),
  };

  async function handleDownload(type) {
    setDownloading(type);
    try {
      if (type === 'pdf') await downloadUpdatedPrdPdf(downloadResult);
      else                await downloadUpdatedPrdDocx(downloadResult);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      {showPreview && <PreviewModal prdText={updatedPrd} onClose={() => setShowPreview(false)} />}

      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 py-4">

        {/* Score comparison */}
        <div className={`rounded-2xl border p-6 ${verdictStyle.bg}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${verdictStyle.badge}`}>
              <span aria-hidden="true">{verdictStyle.icon}</span>
              {estimated.verdict}
            </span>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Estimated Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold tabular-nums ${verdictStyle.text}`}>{estimated.score}%</span>
                {scoreDelta !== 0 && (
                  <span className={`text-sm font-semibold ${scoreDelta > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {scoreDelta > 0 ? '+' : ''}{scoreDelta}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className={`mt-3 text-sm ${verdictStyle.text} opacity-70`}>
            {addressedCount === total
              ? `All ${total} issues addressed. Apply these amendments to your PRD and re-upload for a final score.`
              : `${addressedCount} of ${total} issues addressed. Apply the fixes below to your PRD and re-upload.`}
          </p>

          <div className="mt-4 space-y-2">
            {[
              { label: 'Before', score: originalScore, muted: true },
              { label: 'After',  score: estimated.score, muted: false },
            ].map(({ label, score, muted }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`text-xs w-12 ${muted ? 'text-gray-500' : 'font-medium text-gray-700 dark:text-gray-300'}`}>{label}</span>
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full score-bar-fill ${muted ? 'bg-gray-400 dark:bg-gray-500' : score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className={`text-xs tabular-nums w-8 text-right ${muted ? 'text-gray-500' : 'font-bold text-gray-700 dark:text-gray-300'}`}>{score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Updated PRD (Ready to Use) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Updated PRD
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              Ready to Use
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.prdText && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              >
                Preview
              </Button>
            )}
            {['pdf', 'docx'].map(type => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => handleDownload(type)}
                disabled={!!downloading}
                loading={downloading === type}
              >
                {downloading === type ? 'Downloading…' : `Download ${type.toUpperCase()}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Session summary */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Session Summary — {addressedCount} of {total} addressed
            </p>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {steps.map(step => {
              const isAddressed = !!inputs[step.id]?.trim();
              return (
                <li key={step.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                    isAddressed
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {isAddressed ? '✓' : '–'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${isAddressed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                      {step.suggestedFix}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {step.categoryLabel} · {isAddressed ? 'Addressed' : 'Skipped'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex justify-center">
          <Button variant="secondary" onClick={onClose}>
            ← Back to Results
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FixMode({ result, categoryKey, onClose }) {
  const steps = buildSteps(result, categoryKey);

  const [stepIndex,     setStepIndex]     = useState(0);
  const [direction,     setDirection]     = useState(1);
  const [slideKey,      setSlideKey]      = useState(0);
  const [inputs,        setInputs]        = useState({});
  const [generating,    setGenerating]    = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [done,          setDone]          = useState(false);
  const textareaRef = useRef(null);

  const step        = steps[stepIndex];
  const isLast      = stepIndex === steps.length - 1;
  const progressPct = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 100;

  useEffect(() => { textareaRef.current?.focus(); }, [stepIndex]);

  function goNext() {
    setDirection(1);
    setSlideKey(k => k + 1);
    if (isLast) { setDone(true); } else { setStepIndex(i => i + 1); }
  }

  function goPrev() {
    if (stepIndex === 0) return;
    setDirection(-1);
    setSlideKey(k => k + 1);
    setStepIndex(i => i - 1);
  }

  function jumpTo(i) {
    if (i === stepIndex) return;
    setDirection(i > stepIndex ? 1 : -1);
    setSlideKey(k => k + 1);
    setStepIndex(i);
  }

  async function handleGenerateFix() {
    setGenerating(true);
    setGenerateError('');
    try {
      const res  = await fetch(`${API_URL}/api/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryLabel: step.categoryLabel,
          issue:         step.issue,
          whyItMatters:  step.whyItMatters,
          suggestedFix:  step.suggestedFix,
        }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Invalid JSON response:', text);
        throw e;
      }
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setInputs(prev => ({ ...prev, [step.id]: data.fixText }));
    } catch (err) {
      setGenerateError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (steps.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16 flex flex-col items-center gap-4">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No issues to fix — all categories look good.</p>
        <Button variant="ghost" onClick={onClose}>← Back to Results</Button>
      </div>
    );
  }

  if (done) {
    return <CompletionScreen steps={steps} inputs={inputs} result={result} onClose={onClose} />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">

      {/* ── Top nav ── */}
      <div className="flex items-center justify-between">
        <Button size="raw" variant="raw" onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Review
        </Button>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 tabular-nums">
          Step {stepIndex + 1} of {steps.length}
        </span>
      </div>

      {/* ── Page title ── */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Improve Your PRD</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Work through each issue and add your response — or let AI draft it.
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
        />
      </div>

      {/* ── Step card (animated) ── */}
      <div key={slideKey} className={direction === 1 ? 'slide-from-right' : 'slide-from-left'}>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">

          {/* Category pill */}
          <div className="px-6 pt-5 pb-0 flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">{step.categoryIcon}</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{step.categoryLabel}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[step.status]}`}>
              {STATUS_LABEL[step.status]}
            </span>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Key Issue */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Key Issue</p>
              <p className="text-sm text-gray-800 dark:text-white leading-relaxed font-medium">{step.issue}</p>
            </div>

            {/* Why it matters */}
            {step.whyItMatters && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Why It Matters</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.whyItMatters}</p>
              </div>
            )}

            {/* Suggested fix */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1.5">
                💡 Suggested Fix
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step.suggestedFix}</p>
            </div>

            {/* Editable response */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={`fix-input-${step.id}`}
                  className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Your Response
                </label>
                <Button
                  variant="indigo-outline"
                  size="sm"
                  loading={generating}
                  onClick={handleGenerateFix}
                  aria-label="Generate AI fix text"
                >
                  {generating ? 'Generating…' : '✨ AI Fix'}
                </Button>
              </div>

              <textarea
                id={`fix-input-${step.id}`}
                ref={textareaRef}
                value={inputs[step.id] || ''}
                onChange={e => setInputs(prev => ({ ...prev, [step.id]: e.target.value }))}
                placeholder="Describe how you'll address this in your PRD, or click ✨ AI Fix to generate a draft…"
                rows={4}
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300
                           placeholder-gray-400 dark:placeholder-gray-600
                           px-4 py-3 resize-none focus:outline-none focus:ring-2
                           focus:ring-indigo-500 focus:border-transparent
                           transition-colors leading-relaxed"
              />
              {generateError && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{generateError}</p>
              )}
            </div>
          </div>

          {/* ── Footer: Prev / Next ── */}
          <div className="px-6 pb-5 pt-4 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              disabled={stepIndex === 0}
              onClick={goPrev}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            >
              Previous
            </Button>

            <Button
              variant="secondary"
              onClick={goNext}
              iconAfter={
                !isLast ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : null
              }
            >
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Step dots ── */}
      <div className="flex items-center justify-center gap-1.5 py-1 flex-wrap" role="tablist" aria-label="Fix mode steps">
        {steps.map((s, i) => {
          const isAddressed = !!inputs[s.id]?.trim();
          const isCurrent   = i === stepIndex;
          return (
            <Button key={s.id} size="raw" variant="raw" role="tab"
              aria-selected={isCurrent}
              aria-label={`Step ${i + 1}: ${s.categoryLabel}`}
              onClick={() => jumpTo(i)}
              className={`transition-all duration-200 ${
                isCurrent
                  ? 'w-5 h-2 bg-indigo-500'
                  : isAddressed
                    ? 'w-2 h-2 bg-emerald-400 dark:bg-emerald-500 hover:bg-emerald-500'
                    : 'w-2 h-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
