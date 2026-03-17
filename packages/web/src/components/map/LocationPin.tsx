import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../store/mapStore';
import { categoryConfig } from '../../utils/categoryColors';
import type { Location } from '../../types';

interface LocationPinProps {
  location: Location;
}

function createPinIcon(location: Location): L.DivIcon {
  const cfg = categoryConfig[location.category];
  const hasWarning = location.warnings.some((w) => w.active);
  return L.divIcon({
    className: '',
    html: `<div class="whc-pin${hasWarning ? ' whc-pin-warning' : ''}" style="background:${cfg.bg}; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 2px 8px rgba(0,0,0,0.3); border:2px solid rgba(255,255,255,0.8); position:relative;">
      ${cfg.emoji}
      ${hasWarning ? '<span style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#EF4444;border-radius:50%;border:1.5px solid white;"></span>' : ''}
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
}

export default function LocationPin({ location }: LocationPinProps) {
  const setSelectedLocation = useMapStore((s) => s.setSelectedLocation);

  return (
    <Marker
      position={[location.coordinates.lat, location.coordinates.lng]}
      icon={createPinIcon(location)}
      eventHandlers={{
        click: () => setSelectedLocation(location),
      }}
    />
  );
}
