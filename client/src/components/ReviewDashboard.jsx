import OverallBanner from './OverallBanner';
import CategoryCard from './CategoryCard';
import DownloadMenu from './DownloadMenu';

const CATEGORY_ORDER = ['design', 'engineering', 'product', 'security'];

export default function ReviewDashboard({ result, onReset }) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      <OverallBanner overall={result.overall} onReset={onReset} />
      <DownloadMenu result={result} />

      <div className="flex flex-col gap-3">
        {CATEGORY_ORDER.map(key => (
          <CategoryCard
            key={key}
            categoryKey={key}
            data={result.categories[key]}
          />
        ))}
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
        >
          Review another PRD
        </button>
      </div>
    </div>
  );
}
