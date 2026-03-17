import { useMapStore } from '../../store/mapStore';
import type { LocationCategory } from '../../types';
import { categoryConfig } from '../../utils/categoryColors';
import clsx from 'clsx';

const filters: { label: string; value: LocationCategory | null; emoji?: string }[] = [
  { label: 'All', value: null },
  { label: 'Hot Springs', value: 'hot_spring', emoji: categoryConfig.hot_spring.emoji },
  { label: 'Caves', value: 'cave', emoji: categoryConfig.cave.emoji },
  { label: 'Waterfalls', value: 'waterfall', emoji: categoryConfig.waterfall.emoji },
];

export default function MapFilters() {
  const activeFilter = useMapStore((s) => s.activeFilter);
  const setActiveFilter = useMapStore((s) => s.setActiveFilter);

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 px-2">
      {filters.map(({ label, value, emoji }) => {
        const isActive = activeFilter === value;
        const cfg = value ? categoryConfig[value] : null;
        return (
          <button
            key={label}
            onClick={() => setActiveFilter(value)}
            className={clsx(
              'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-md border transition-all whitespace-nowrap',
              isActive
                ? 'text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            )}
            style={isActive && cfg ? { backgroundColor: cfg.bg, borderColor: cfg.bg } : undefined}
          >
            {emoji && <span>{emoji}</span>}
            {label}
          </button>
        );
      })}
    </div>
  );
}
