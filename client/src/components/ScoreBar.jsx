import { useEffect, useState } from 'react';
import { getScoreBg, getScoreColor } from '../utils/statusHelpers.jsx';

export default function ScoreBar({ score, slim = false }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 50);
    return () => clearTimeout(timer);
  }, [score]);

  if (slim) {
    return (
      <div
        className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score: ${score}%`}
      >
        <div
          className={`h-full rounded-full score-bar-fill ${getScoreBg(score)}`}
          style={{ width: `${width}%` }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score: ${score}%`}
      >
        <div
          className={`h-full rounded-full score-bar-fill ${getScoreBg(score)}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums w-10 text-right ${getScoreColor(score)}`}>
        {score}%
      </span>
    </div>
  );
}
