import { useNavigate } from 'react-router-dom';
import { Heart, Map } from 'lucide-react';
import Badge from '../ui/Badge';
import { categoryConfig } from '../../utils/categoryColors';
import { useMapStore } from '../../store/mapStore';
import type { Location } from '../../types';

interface LocationListCardProps {
  location: Location;
  onUnsave?: () => void;
}

export default function LocationListCard({ location, onUnsave }: LocationListCardProps) {
  const navigate = useNavigate();
  const setSelectedLocation = useMapStore((s) => s.setSelectedLocation);

  function handleViewOnMap() {
    setSelectedLocation(location);
    navigate('/');
  }

  return (
    <div className="flex gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      {/* Photo */}
      <div className="flex-shrink-0">
        {location.primaryPhoto ? (
          <img
            src={location.primaryPhoto}
            alt={location.title}
            className="w-20 h-20 rounded-lg object-cover"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl"
            style={{ backgroundColor: categoryConfig[location.category].bg }}
          >
            {categoryConfig[location.category].emoji}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex gap-1.5 flex-wrap mb-1">
          <Badge variant="category" value={location.category} />
          <Badge variant="difficulty" value={location.difficulty} />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{location.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{location.shortDescription}</p>

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleViewOnMap}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            <Map size={12} />
            View on Map
          </button>
          {onUnsave && (
            <button
              onClick={onUnsave}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <Heart size={12} fill="currentColor" />
              Unsave
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
