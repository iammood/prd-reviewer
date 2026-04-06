import { useRef, useState } from 'react';

// ─── Mock demo data ────────────────────────────────────────────────────────────

const MOCK_RESULT = [
  {
    key: 'design',
    label: 'Design',
    status: 'caution',
    statusLabel: 'Needs improvement',
    score: 62,
    feedback: 'User flows are partially described but edge cases are missing. Error states and empty states are not covered.',
    fix: 'Add a flow diagram for the onboarding journey and explicitly describe what happens when a user skips optional steps.',
  },
  {
    key: 'engineering',
    label: 'Engineering',
    status: 'blocker',
    statusLabel: 'Missing',
    score: 34,
    feedback: 'No API contracts, data model, or acceptance criteria defined. Engineers cannot estimate from this document.',
    fix: 'Define the data model, list all API endpoints, and add testable acceptance criteria for each feature.',
  },
  {
    key: 'product',
    label: 'Product',
    status: 'caution',
    statusLabel: 'Needs improvement',
    score: 71,
    feedback: 'Goals are stated but success metrics are vague. Scope boundaries are unclear — feature creep risk is high.',
    fix: 'Define measurable KPIs (e.g. activation rate ≥ 40% in 30 days) and explicitly list what is out of scope.',
  },
  {
    key: 'security',
    label: 'Security',
    status: 'blocker',
    statusLabel: 'Missing',
    score: 28,
    feedback: 'No mention of authentication, authorization roles, or data privacy considerations. GDPR exposure is unaddressed.',
    fix: 'Add a security section covering auth model, PII handling, and any applicable compliance requirements.',
  },
];

const STATUS_STYLE = {
  caution: {
    badge:  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    bar:    'bg-amber-500',
  },
  blocker: {
    badge:  'bg-red-500/10 text-red-400 border border-red-500/20',
    bar:    'bg-red-500',
  },
  good: {
    badge:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    bar:    'bg-emerald-500',
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function ScoreBar({ score, color }) {
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function ReviewCard({ item }) {
  const s = STATUS_STYLE[item.status];
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white">{item.label}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
          {item.statusLabel}
        </span>
      </div>
      <ScoreBar score={item.score} color={s.bar} />
      <p className="text-sm text-gray-400 leading-relaxed">{item.feedback}</p>
      <div className="border-t border-white/10 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Suggested fix</p>
        <p className="text-sm text-gray-300 leading-relaxed">{item.fix}</p>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function LandingPage({ onEnter }) {
  const demoRef  = useRef(null);
  const [demoText, setDemoText]     = useState('');
  const [demoState, setDemoState]   = useState('idle'); // idle | loading | done
  const [expanded, setExpanded]     = useState(null);

  function scrollToDemo() {
    demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleDemoReview() {
    if (!demoText.trim()) return;
    setDemoState('loading');
    setTimeout(() => setDemoState('done'), 1800);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <p className="text-sm font-bold tracking-tight">PRD Reviewer</p>
          <button
            onClick={onEnter}
            className="h-9 px-4 rounded-2xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            Open app
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 space-y-32 py-24">

        {/* ── 1. Hero ── */}
        <section className="text-center flex flex-col items-center gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
              Write better PRDs.<br />
              <span className="text-gray-400">Catch gaps before engineering does.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
              Run a structured review across design, engineering, and product — in seconds.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onEnter}
              className="h-12 px-6 rounded-2xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Review my PRD
            </button>
            <button
              onClick={scrollToDemo}
              className="h-12 px-6 rounded-2xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              See how it works
            </button>
          </div>
        </section>

        {/* ── 2. Pain ── */}
        <section className="text-center flex flex-col items-center gap-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            Most PRDs look complete — until they're not.
          </h2>
          <div className="flex flex-col gap-3 w-full max-w-md">
            {[
              'Is this actually ready for engineering?',
              'Why are we going back and forth again?',
              'What am I missing?',
            ].map(q => (
              <div key={q} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left">
                <p className="text-gray-300 text-sm">"{q}"</p>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm">You shouldn't have to guess.</p>
        </section>

        {/* ── 3. Solution ── */}
        <section className="flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold tracking-tight">A second set of eyes for every PRD.</h2>
            <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
              PRD Reviewer analyzes your document across four dimensions — the same ones your team will question you on.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {[
              { label: 'Design',      desc: 'Flows, edge cases, accessibility' },
              { label: 'Engineering', desc: 'Feasibility, specs, acceptance criteria' },
              { label: 'Product',     desc: 'Goals, metrics, scope clarity' },
              { label: 'Security',    desc: 'Auth, privacy, compliance' },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-500 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. How it works ── */}
        <section className="flex flex-col items-center gap-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {[
              { n: '1', title: 'Paste or upload your PRD',         desc: 'Drop in a .docx, .pdf, or paste text directly.' },
              { n: '2', title: 'Get a structured review in seconds', desc: 'AI analyzes across all four dimensions instantly.' },
              { n: '3', title: 'Fix gaps before sharing',           desc: 'Actionable recommendations, not vague feedback.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left flex flex-col gap-3">
                <span className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center">
                  {n}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-sm">No templates. No guesswork.</p>
        </section>

        {/* ── 5. Output preview ── */}
        <section className="flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">See exactly what needs improvement</h2>
            <p className="text-gray-400 mt-3">Every review surfaces specific gaps with actionable fixes — not just a score.</p>
          </div>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MOCK_RESULT.map(item => (
              <ReviewCard key={item.key} item={item} />
            ))}
          </div>
        </section>

        {/* ── 6. Before / After ── */}
        <section className="flex flex-col items-center gap-8">
          <h2 className="text-3xl font-semibold tracking-tight text-center">Before and after</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="bg-white/5 border border-red-500/20 rounded-2xl p-6 flex flex-col gap-3">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">Before</p>
              <div className="flex flex-col gap-2 text-sm text-gray-500 leading-relaxed">
                <p>"Users should be able to log in easily."</p>
                <p>"The dashboard needs to show relevant info."</p>
                <p>"We should handle errors somehow."</p>
                <p>"Security is important and will be addressed."</p>
              </div>
              <p className="text-xs text-red-400/70 mt-1">Vague. Unactionable. Engineering can't build from this.</p>
            </div>
            <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-3">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">After</p>
              <div className="flex flex-col gap-2 text-sm text-gray-300 leading-relaxed">
                <p>"Users authenticate via email/password or Google OAuth. Session timeout: 30 days."</p>
                <p>"Dashboard shows: active projects, recent activity, and pending reviews. Default sort: last modified."</p>
                <p>"On API failure, show inline error with retry. Log to Sentry."</p>
              </div>
              <p className="text-xs text-emerald-400/70 mt-1">Specific. Testable. Ready for engineering.</p>
            </div>
          </div>
        </section>

        {/* ── 7. Sample review ── */}
        <section className="flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">What the review looks like</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto">Real output — specific, actionable, structured.</p>
          </div>
          <div className="w-full flex flex-col gap-3">
            {[
              {
                label: 'Design Feedback',
                color: 'text-amber-400',
                border: 'border-amber-500/20',
                items: [
                  'Onboarding flow is described linearly but doesn\'t account for users who already have an account. Add a "returning user" branch.',
                  'No empty states defined for the dashboard. What should a new user see before they have any data?',
                ],
              },
              {
                label: 'Engineering Gaps',
                color: 'text-red-400',
                border: 'border-red-500/20',
                items: [
                  'No data model provided. Engineers need to know the shape of a "project" before they can estimate storage or query patterns.',
                  'Acceptance criteria are missing for all 5 listed features. Add testable pass/fail conditions.',
                ],
              },
              {
                label: 'Product Clarity Issues',
                color: 'text-amber-400',
                border: 'border-amber-500/20',
                items: [
                  'Success metric "improve engagement" is not measurable. Define a baseline and target (e.g. DAU/MAU ≥ 40%).',
                  'Scope is too broad for a single sprint. Recommend splitting into an MVP phase and a follow-on phase.',
                ],
              },
            ].map(({ label, color, border, items }) => (
              <div key={label} className={`bg-white/5 border ${border} rounded-2xl p-5`}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${color}`}>{label}</p>
                <ul className="flex flex-col gap-2.5">
                  {items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-400 leading-relaxed">
                      <span className="flex-shrink-0 mt-1 text-gray-600">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. Inline demo ── */}
        <section ref={demoRef} className="flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Try it instantly</h2>
            <p className="text-gray-400 mt-3">Paste a section of your PRD to see what a review looks like.</p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <textarea
              value={demoText}
              onChange={e => { setDemoText(e.target.value); setDemoState('idle'); }}
              placeholder="Paste a section of your PRD..."
              rows={6}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4
                         text-sm text-gray-300 placeholder-gray-600
                         resize-none outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-colors leading-relaxed"
            />
            <button
              onClick={handleDemoReview}
              disabled={!demoText.trim() || demoState === 'loading'}
              className="self-start h-12 px-6 rounded-2xl text-sm font-semibold
                         bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
            >
              {demoState === 'loading' ? 'Reviewing…' : 'Review this'}
            </button>
          </div>

          {demoState === 'done' && (
            <div className="w-full flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Sample output</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_RESULT.map(item => (
                  <ReviewCard key={item.key} item={item} />
                ))}
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">
                This is a simulated preview. Upload your real PRD for an actual review.
              </p>
            </div>
          )}
        </section>

        {/* ── 9. Final CTA ── */}
        <section className="text-center flex flex-col items-center gap-6 py-8">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to review your PRD?</h2>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            Takes under a minute. No account needed.
          </p>
          <button
            onClick={onEnter}
            className="h-12 px-8 rounded-2xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            Review my PRD
          </button>
        </section>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-gray-600">
          <p>PRD Reviewer</p>
          <p>AI-powered review for product teams</p>
        </div>
      </footer>

    </div>
  );
}
