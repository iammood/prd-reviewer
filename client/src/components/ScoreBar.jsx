import { useEffect, useState } from 'react';
import { getStatusBg } from '../utils/statusHelpers';

export default function ScoreBar({ score, status }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 50);
    return () => clearTimeout(timer);
  }, [score]);

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
          className={`h-full rounded-full score-bar-fill ${getStatusBg(status)}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-10 text-right text-gray-700 dark:text-gray-200">
        {score}%
      </span>
    </div>
  );
}
