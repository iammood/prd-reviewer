import { getStatusBg, getStatusLabel } from '../utils/statusHelpers';

export default function TrafficLight({ status, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span
      className={`inline-flex items-center gap-1.5`}
      aria-label={`Status: ${getStatusLabel(status)}`}
    >
      <span className={`${sizeClass} rounded-full flex-shrink-0 ${getStatusBg(status)}`} />
      <span className={`text-xs font-medium ${
        status === 'good' ? 'text-emerald-400' : status === 'caution' ? 'text-amber-400' : 'text-red-400'
      }`}>
        {getStatusLabel(status)}
      </span>
    </span>
  );
}
