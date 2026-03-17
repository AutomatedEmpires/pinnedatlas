import { useNavigate } from 'react-router-dom';
import { Heart, Navigation, Info, X, MapPin, AlertTriangle } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useSaveLocation, useUnsaveLocation, useSavedLocations } from '../../hooks/useSaved';
import Badge from '../ui/Badge';
import { categoryConfig } from '../../utils/categoryColors';
import { formatDistance } from '../../utils/formatters';

export default function SnapshotCard() {
  const navigate = useNavigate();
  const selectedLocation = useMapStore((s) => s.selectedLocation);
  const setSelectedLocation = useMapStore((s) => s.setSelectedLocation);
  const user = useAuthStore((s) => s.user);
  const setAuthModalOpen = useUiStore((s) => s.setAuthModalOpen);

  const { data: savedData } = useSavedLocations();
  const saveLocation = useSaveLocation();
  const unsaveLocation = useUnsaveLocation();

  const isSaved = savedData?.data?.some((l) => l.id === selectedLocation?.id) ?? false;

  function handleSave() {
    if (!user) { setAuthModalOpen(true); return; }
    if (!selectedLocation) return;
    if (isSaved) {
      unsaveLocation.mutate(selectedLocation.id);
    } else {
      saveLocation.mutate(selectedLocation.id);
    }
  }

  function handleNavigate() {
    if (!selectedLocation) return;
    const { lat, lng } = selectedLocation.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  }

  function handleDetails() {
    if (!selectedLocation) return;
    navigate(`/location/${selectedLocation.id}`);
  }

  const loc = selectedLocation;

  return (
    <div
      className={`bottom-sheet ${loc ? 'bottom-sheet-visible' : 'bottom-sheet-hidden'} fixed left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl`}
      style={{ bottom: '64px', maxWidth: '600px', margin: '0 auto' }}
    >
      {loc && (
        <>
          <div className="drag-handle mt-3" />
          <div className="px-4 pb-4">
            {/* Close button */}
            <button
              onClick={() => setSelectedLocation(null)}
              className="absolute top-3 right-4 p-1 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={18} className="text-gray-400" />
            </button>

            {/* Main content row */}
            <div className="flex gap-3 mb-3">
              {/* Photo */}
              <div className="flex-shrink-0">
                {loc.primaryPhoto ? (
                  <img
                    src={loc.primaryPhoto}
                    alt={loc.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl"
                    style={{ backgroundColor: categoryConfig[loc.category].bg }}
                  >
                    {categoryConfig[loc.category].emoji}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex gap-1.5 flex-wrap mb-1">
                  <Badge variant="category" value={loc.category} />
                  <Badge variant="difficulty" value={loc.difficulty} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                  {loc.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{loc.shortDescription}</p>

                {/* Quick facts */}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <MapPin size={11} />
                    {loc.state}
                  </span>
                  {loc.hikingDistanceMi !== undefined && (
                    <span>{formatDistance(loc.hikingDistanceMi)}</span>
                  )}
                  {loc.warnings.some((w) => w.active) && (
                    <span className="flex items-center gap-0.5 text-red-500">
                      <AlertTriangle size={11} />
                      Warning
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  isSaved
                    ? 'bg-red-50 text-red-500 border-red-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleNavigate}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <Navigation size={14} />
                Navigate
              </button>
              <button
                onClick={handleDetails}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 transition-colors"
              >
                <Info size={14} />
                Details
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
