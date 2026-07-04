import { useState } from 'react';
import { Clipboard, Check } from 'lucide-react';
import Button from './Button';
import { cleanMarkdown } from '../utils/statusHelpers.jsx';

// ─── Claude prompt builder (client-side, no extra AI tokens) ──────────────────

const CATEGORY_LABELS = { product: 'Product', design: 'Design', engineering: 'Engineering' };
const CATEGORY_ORDER  = ['product', 'design', 'engineering'];

function buildClaudePrompt(result) {
  const { overall, categories, suggestions } = result;

  const issueBlocks = CATEGORY_ORDER
    .filter(k => categories[k]?.status !== 'good')
    .map(k => {
      const cat  = categories[k];
      const recs = cat.recommendations
        .map((r, i) => `   ${i + 1}. ${cleanMarkdown(r)}`)
        .join('\n');
      return `${CATEGORY_LABELS[k]} (${cat.score}% — ${cat.status})\n   ${cleanMarkdown(cat.summary)}\n${recs}`;
    });

  const missingLines = suggestions?.missingInformation?.length
    ? `\nMissing from the PRD:\n${suggestions.missingInformation.map(m => `- ${m}`).join('\n')}`
    : '';

  const weaknessLines = suggestions?.weaknesses?.length
    ? `\nWeaknesses to address:\n${suggestions.weaknesses.map(w => `- ${w}`).join('\n')}`
    : '';

  const context = [
    issueBlocks.length ? `\nIssues found:\n${issueBlocks.join('\n\n')}` : '',
    missingLines,
    weaknessLines,
  ].filter(Boolean).join('\n');

  return `You are helping me improve a Product Requirements Document (PRD).

A Senior PM reviewed it and gave it ${overall.score}% (${overall.verdict}).
${context}

Please improve this PRD by doing ALL of the following:
1. Fix every issue identified above
2. Improve clarity throughout — plain, simple language only
3. Fill in every missing section (especially the Overview if it is absent)
4. Improve user stories to focus on what the user needs and why
5. Improve feature requirements to be specific and actionable
6. Rewrite acceptance criteria as simple checklist items (✓ User can...)
7. Remove all technical jargon — replace with plain English
8. Preserve the original writing style and intent
9. Return the complete, improved PRD with all sections fully written out — do not truncate or summarise`.trim();
}

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key:   'strengths',
    label: 'Strengths',
    dot:   'bg-emerald-500',
    text:  'text-emerald-700 dark:text-emerald-400',
  },
  {
    key:   'weaknesses',
    label: 'Weaknesses',
    dot:   'bg-amber-500',
    text:  'text-amber-700 dark:text-amber-400',
  },
  {
    key:   'missingInformation',
    label: 'Missing Information',
    dot:   'bg-red-500',
    text:  'text-red-700 dark:text-red-400',
  },
  {
    key:   'quickWins',
    label: 'Quick Wins',
    dot:   'bg-indigo-500',
    text:  'text-indigo-700 dark:text-indigo-400',
  },
  {
    key:   'highestImpact',
    label: 'Highest Impact Improvements',
    dot:   'bg-indigo-500',
    text:  'text-indigo-700 dark:text-indigo-400',
  },
];

const LABEL_CLASS = 'text-[11px] font-semibold uppercase tracking-widest mb-2';
const DIVIDER     = 'border-t border-gray-100 dark:border-gray-800 pt-4';

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SuggestionsPanel({ result }) {
  const [copied, setCopied] = useState(false);
  const { suggestions } = result;

  if (!suggestions) return null;

  const prompt = buildClaudePrompt(result);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* ── Suggested Improvements ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-5 flex flex-col gap-5">
        <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
          Suggested Improvements
        </p>

        {SECTIONS.map(({ key, label, dot, text }) => {
          const items = suggestions[key];
          if (!items?.length) return null;
          return (
            <div key={key} className={DIVIDER}>
              <p className={`${LABEL_CLASS} ${text}`}>{label}</p>
              <ul className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {suggestions.overallRecommendation && (
          <div className={DIVIDER}>
            <p className={`${LABEL_CLASS} text-gray-400 dark:text-gray-500`}>
              Overall Recommendation
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {suggestions.overallRecommendation}
            </p>
          </div>
        )}
      </div>

      {/* ── Claude Update Prompt ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
              Claude Update Prompt
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Copy into Claude to get a fully improved PRD
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium
                       bg-gray-100 hover:bg-gray-200 text-gray-600
                       dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300
                       hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg
                       active:scale-[0.98] active:translate-y-0 active:shadow-none
                       transition-all duration-200 ease-out active:duration-100"
          >
            {copied ? <Check size={15} /> : <Clipboard size={15} />}
            <span>{copied ? 'Copied' : 'Copy prompt'}</span>
          </button>
        </div>

        <pre className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed
                        bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10
                        rounded-xl p-4 overflow-x-auto whitespace-pre-wrap font-mono">
          {prompt}
        </pre>
      </div>
    </>
  );
}
