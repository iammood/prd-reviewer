import { useEffect, useState } from 'react';

const STEPS = [
  'Parsing document...',
  'Sending to AI...',
  'Analyzing design...',
  'Analyzing engineering...',
  'Analyzing product...',
  'Compiling results...',
];

export default function LoadingSpinner() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(i => (i + 1 < STEPS.length ? i + 1 : i));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Analyzing PRD"
      className="flex flex-col items-center gap-6 py-16"
    >
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-800" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-base font-medium text-gray-700 dark:text-gray-300">Analyzing your PRD</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 transition-all">{STEPS[stepIndex]}</p>
      </div>
    </div>
  );
}
