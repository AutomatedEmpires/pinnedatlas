import { Heart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useSavedLocations, useUnsaveLocation } from '../hooks/useSaved';
import LocationListCard from '../components/cards/LocationListCard';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

export default function SavedPage() {
  const user = useAuthStore((s) => s.user);
  const setAuthModalOpen = useUiStore((s) => s.setAuthModalOpen);
  const { data, isLoading } = useSavedLocations();
  const unsave = useUnsaveLocation();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          icon={<Heart />}
          title="Sign in to see saved locations"
          description="Save your favorite spots and access them anytime."
          action={<Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Saved Locations</h1>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.data?.length ? (
        <EmptyState
          icon={<Heart />}
          title="No saved locations yet"
          description="Tap the heart icon on any location to save it here."
        />
      ) : (
        <div className="p-4 space-y-3 pb-24">
          {data.data.map((loc) => (
            <LocationListCard
              key={loc.id}
              location={loc}
              onUnsave={() => unsave.mutate(loc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
