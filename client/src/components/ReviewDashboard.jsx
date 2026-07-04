import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import OverallBanner from './OverallBanner';
import CategoryCard from './CategoryCard';
import CategoryModal from './CategoryModal';
import SuggestionsPanel from './SuggestionsPanel';
import Button from './Button';

const CATEGORY_ORDER = ['product', 'design', 'engineering'];

// ─── WIP Modal ────────────────────────────────────────────────────────────────

function WipModal({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          exit={{    opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl
                     border border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-5"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Fix Mode coming soon</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              We're building an AI-assisted flow that walks you through each issue and helps you draft PRD amendments.
            </p>
          </div>

          <Button variant="primary" fullWidth onClick={onClose}>
            Got it
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function ReviewDashboard({ result, onReset }) {
  const [openModal, setOpenModal] = useState(null); // category key or null
  const [showWip,   setShowWip]   = useState(false);

  const hasIssues = CATEGORY_ORDER.some(
    key => ['caution', 'blocker'].includes(result.categories[key]?.status)
  );

  return (
    <>
      {showWip && <WipModal onClose={() => setShowWip(false)} />}

      {openModal && (
        <CategoryModal
          categoryKey={openModal}
          data={result.categories[openModal]}
          onClose={() => setOpenModal(null)}
        />
      )}

      <div className="w-full flex flex-col gap-4 px-6 py-6">
        <OverallBanner
          overall={result.overall}
          categories={result.categories}
          result={result}
          onFixMode={hasIssues ? () => setShowWip(true) : null}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORY_ORDER.map(key => (
            <CategoryCard
              key={key}
              categoryKey={key}
              data={result.categories[key]}
              onClick={() => setOpenModal(key)}
            />
          ))}
        </div>

        <SuggestionsPanel result={result} />
      </div>
    </>
  );
}
