import { useRef, useCallback } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Locate, Plus } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useUiStore } from '../../store/uiStore';
import { useLocations } from '../../hooks/useLocations';
import { useAuthStore } from '../../store/authStore';
import LocationPin from './LocationPin';
import MapFilters from './MapFilters';
import SnapshotCard from '../cards/SnapshotCard';
import SubmitLocationModal from '../modals/SubmitLocationModal';

// Fix default Leaflet icon URLs
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function BoundsTracker() {
  const setMapBounds = useMapStore((s) => s.setMapBounds);

  const updateBounds = useCallback(
    (map: L.Map) => {
      const b = map.getBounds();
      setMapBounds({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    },
    [setMapBounds]
  );

  useMapEvents({
    moveend: (e) => updateBounds(e.target as L.Map),
    zoomend: (e) => updateBounds(e.target as L.Map),
    load: (e) => updateBounds(e.target as L.Map),
  });

  return null;
}

function LocateMeControl() {
  const mapRef = useRef<L.Map | null>(null);
  useMapEvents({
    load: (e) => { mapRef.current = e.target as L.Map; },
    moveend: (e) => { mapRef.current = e.target as L.Map; },
  });
  return null;
}

export default function AppMap() {
  const activeFilter = useMapStore((s) => s.activeFilter);
  const setSelectedLocation = useMapStore((s) => s.setSelectedLocation);
  const submitLocationModalOpen = useUiStore((s) => s.submitLocationModalOpen);
  const setSubmitLocationModalOpen = useUiStore((s) => s.setSubmitLocationModalOpen);
  const user = useAuthStore((s) => s.user);
  const setAuthModalOpen = useUiStore((s) => s.setAuthModalOpen);

  const mapRef = useRef<L.Map | null>(null);

  const { data } = useLocations(
    activeFilter ? { category: activeFilter, pageSize: 200 } : { pageSize: 200 }
  );

  const locations = data?.data ?? [];

  function handleLocateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 12);
      },
      () => {
        // geolocation denied or failed - ignore silently
      }
    );
  }

  function handleAddLocation() {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSubmitLocationModalOpen(true);
  }

  return (
    <div className="relative" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Filters float above map */}
      <MapFilters />

      <LeafletMapContainer
        center={[39.5, -98.35]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        onClick={() => setSelectedLocation(null)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsTracker />
        <LocateMeControl />
        {locations.map((loc) => (
          <LocationPin key={loc.id} location={loc} />
        ))}
      </LeafletMapContainer>

      {/* Locate Me FAB */}
      <button
        onClick={handleLocateMe}
        aria-label="Locate me"
        className="absolute z-[1000] bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        style={{ bottom: '80px', right: '16px' }}
      >
        <Locate size={20} className="text-sky-500" />
      </button>

      {/* Add location FAB */}
      <button
        onClick={handleAddLocation}
        aria-label="Add location"
        className="absolute z-[1000] bg-sky-500 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-sky-600 transition-colors"
        style={{ bottom: '140px', right: '16px' }}
      >
        <Plus size={20} className="text-white" />
      </button>

      {/* Snapshot card */}
      <SnapshotCard />

      <SubmitLocationModal
        isOpen={submitLocationModalOpen}
        onClose={() => setSubmitLocationModalOpen(false)}
      />
    </div>
  );
}
