import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer as LeafletMapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft, Heart, Navigation, AlertTriangle, MapPin, Thermometer,
  Droplets, Mountain
} from 'lucide-react';
import { useLocation } from '../hooks/useLocations';
import { useSavedLocations, useSaveLocation, useUnsaveLocation } from '../hooks/useSaved';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ReportModal from '../components/modals/ReportModal';
import { categoryConfig } from '../utils/categoryColors';
import { formatDifficulty, formatAccessType, formatDistance, formatSeason } from '../utils/formatters';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const openReportModal = useUiStore((s) => s.openReportModal);
  const closeReportModal = useUiStore((s) => s.closeReportModal);
  const reportModalOpen = useUiStore((s) => s.reportModalOpen);
  const reportLocationId = useUiStore((s) => s.reportLocationId);
  const setAuthModalOpen = useUiStore((s) => s.setAuthModalOpen);

  const { data, isLoading, error } = useLocation(id ?? '');
  const { data: savedData } = useSavedLocations();
  const saveLocation = useSaveLocation();
  const unsaveLocation = useUnsaveLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-gray-600">{error?.message ?? 'Location not found'}</p>
        <Button onClick={() => navigate(-1)} variant="secondary">Go Back</Button>
      </div>
    );
  }

  const loc = data.data;
  const isSaved = savedData?.data?.some((l) => l.id === loc.id) ?? false;
  const cfg = categoryConfig[loc.category];
  const activeWarnings = loc.warnings.filter((w) => w.active);

  function handleSave() {
    if (!user) { setAuthModalOpen(true); return; }
    if (isSaved) unsaveLocation.mutate(loc.id);
    else saveLocation.mutate(loc.id);
  }

  function handleNavigate() {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${loc.coordinates.lat},${loc.coordinates.lng}`,
      '_blank'
    );
  }

  const miniMapIcon = L.divIcon({
    className: '',
    html: `<div style="background:${cfg.bg};width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid rgba(255,255,255,0.9)">${cfg.emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="font-semibold text-gray-900 truncate flex-1">{loc.title}</h1>
      </div>

      {/* Hero image */}
      {loc.primaryPhoto ? (
        <img src={loc.primaryPhoto} alt={loc.title} className="w-full h-48 object-cover" />
      ) : (
        <div
          className="w-full h-48 flex items-center justify-center text-6xl"
          style={{
            background: `linear-gradient(135deg, ${cfg.bg}cc, ${cfg.bg}88)`,
          }}
        >
          {cfg.emoji}
        </div>
      )}

      <div className="px-4 py-4 space-y-5">
        {/* Warning banner */}
        {activeWarnings.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-700">Active Warning{activeWarnings.length > 1 ? 's' : ''}</span>
            </div>
            {activeWarnings.map((w) => (
              <p key={w.id} className="text-xs text-red-600 ml-6">{w.message}</p>
            ))}
          </div>
        )}

        {/* Title + badges */}
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="category" value={loc.category} />
            <Badge variant="difficulty" value={loc.difficulty} />
            {loc.status !== 'approved' && <Badge variant="status" value={loc.status} />}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{loc.title}</h2>
          {loc.nearestCity && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={13} /> {loc.nearestCity}, {loc.state}
            </p>
          )}
        </div>

        {/* Quick facts grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Difficulty', value: formatDifficulty(loc.difficulty) },
            { label: 'Access', value: formatAccessType(loc.accessType) },
            ...(loc.hikingDistanceMi !== undefined
              ? [{ label: 'Distance', value: formatDistance(loc.hikingDistanceMi) }]
              : []),
            ...(loc.hikingElevationFt !== undefined
              ? [{ label: 'Elevation', value: `${loc.hikingElevationFt.toLocaleString()} ft` }]
              : []),
            { label: 'Remoteness', value: loc.remoteness.replace('_', ' ') },
            { label: 'Family Friendly', value: loc.familyFriendly ? 'Yes' : 'No' },
            ...(loc.swimAllowed !== undefined
              ? [{ label: 'Swimming', value: loc.swimAllowed ? 'Allowed' : 'Not Allowed' }]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-800 capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* Terrain */}
        {loc.terrain.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Mountain size={12} /> Terrain</p>
            <div className="flex flex-wrap gap-1.5">
              {loc.terrain.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1.5">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{loc.description}</p>
        </div>

        {/* Category-specific */}
        {loc.hotSpring && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-1.5">
              <Thermometer size={14} /> Hot Spring Details
            </h3>
            <div className="space-y-1.5 text-sm">
              {loc.hotSpring.temperatureF !== undefined && (
                <p><span className="text-gray-500">Temperature:</span> <span className="font-medium">{loc.hotSpring.temperatureF}°F</span></p>
              )}
              {loc.hotSpring.tempRangeF && (
                <p><span className="text-gray-500">Range:</span> <span className="font-medium">{loc.hotSpring.tempRangeF.min}–{loc.hotSpring.tempRangeF.max}°F</span></p>
              )}
              <p><span className="text-gray-500">Natural Pool:</span> <span className="font-medium">{loc.hotSpring.naturalPool ? 'Yes' : 'No'}</span></p>
              <p><span className="text-gray-500">Developed:</span> <span className="font-medium">{loc.hotSpring.developed ? 'Yes' : 'No'}</span></p>
              {loc.hotSpring.nudityPolicy && (
                <p><span className="text-gray-500">Clothing:</span> <span className="font-medium capitalize">{loc.hotSpring.nudityPolicy.replace(/_/g, ' ')}</span></p>
              )}
              {loc.hotSpring.etiquetteNotes && (
                <p className="text-gray-600 text-xs mt-2 bg-white/60 rounded p-2">{loc.hotSpring.etiquetteNotes}</p>
              )}
            </div>
          </div>
        )}

        {loc.cave && (
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <h3 className="text-sm font-semibold text-purple-700 mb-3">🦇 Cave Details</h3>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-gray-500">Type:</span> <span className="font-medium capitalize">{loc.cave.caveType}</span></p>
              <p><span className="text-gray-500">Guided:</span> <span className="font-medium">{loc.cave.guided === 'required' ? 'Required' : loc.cave.guided ? 'Available' : 'Self-guided'}</span></p>
              {loc.cave.depthFt !== undefined && (
                <p><span className="text-gray-500">Depth:</span> <span className="font-medium">{loc.cave.depthFt} ft</span></p>
              )}
              {loc.cave.lengthFt !== undefined && (
                <p><span className="text-gray-500">Length:</span> <span className="font-medium">{loc.cave.lengthFt} ft</span></p>
              )}
              {loc.cave.formations && loc.cave.formations.length > 0 && (
                <p><span className="text-gray-500">Formations:</span> <span className="font-medium">{loc.cave.formations.join(', ')}</span></p>
              )}
              {loc.cave.safetyNotes && (
                <p className="text-xs text-gray-600 mt-2 bg-white/60 rounded p-2">{loc.cave.safetyNotes}</p>
              )}
            </div>
          </div>
        )}

        {loc.waterfall && (
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
            <h3 className="text-sm font-semibold text-sky-700 mb-3 flex items-center gap-1.5">
              <Droplets size={14} /> Waterfall Details
            </h3>
            <div className="space-y-1.5 text-sm">
              {loc.waterfall.heightFt !== undefined && (
                <p><span className="text-gray-500">Height:</span> <span className="font-medium">{loc.waterfall.heightFt} ft</span></p>
              )}
              <p><span className="text-gray-500">Flow:</span> <span className="font-medium capitalize">{loc.waterfall.flow}</span></p>
              <p><span className="text-gray-500">Swimming Hole:</span> <span className="font-medium">{loc.waterfall.swimmingHole ? 'Yes' : 'No'}</span></p>
              <p><span className="text-gray-500">Viewable from Trail:</span> <span className="font-medium">{loc.waterfall.viewableFromTrail ? 'Yes' : 'No'}</span></p>
              <p><span className="text-gray-500">Multi-tiered:</span> <span className="font-medium">{loc.waterfall.multiTiered ? 'Yes' : 'No'}</span></p>
            </div>
          </div>
        )}

        {/* Seasonality */}
        {loc.seasonality.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Best Seasons</p>
            <div className="flex flex-wrap gap-1.5">
              {loc.seasonality.map((s) => (
                <span key={s} className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{formatSeason(s)}</span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {loc.tags.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {loc.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">#{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            variant={isSaved ? 'danger' : 'secondary'}
            className="flex-1"
          >
            <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? 'Unsave' : 'Save'}
          </Button>
          <Button onClick={handleNavigate} variant="secondary" className="flex-1">
            <Navigation size={16} />
            Navigate
          </Button>
          <Button
            onClick={() => {
              if (!user) { setAuthModalOpen(true); return; }
              openReportModal(loc.id);
            }}
            variant="ghost"
            className="flex-1"
          >
            Report
          </Button>
        </div>

        {/* Mini map */}
        <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 150 }}>
          <LeafletMapContainer
            center={[loc.coordinates.lat, loc.coordinates.lng]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={[loc.coordinates.lat, loc.coordinates.lng]}
              icon={miniMapIcon}
            />
          </LeafletMapContainer>
        </div>
      </div>

      {/* Report modal */}
      {reportLocationId && (
        <ReportModal
          locationId={reportLocationId}
          isOpen={reportModalOpen}
          onClose={closeReportModal}
        />
      )}
    </div>
  );
}
