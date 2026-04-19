
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// ── Fix broken Leaflet marker icons in Vite ───────────────────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

// ── Map click handler component ────────────────────────────────────────────
const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      onPick({ lat, lng, address: 'Fetching address...' });

      try {
        // Nominatim reverse geocoding — free, no API key needed
        // Added email parameter to comply with Nominatim Usage Policy and prevent 403 Forbidden
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&email=mdashrafulislam0807@gmail.com`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        onPick({ lat, lng, address: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      } catch {
        onPick({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      }
    },
  });
  return null;
};

/**
 * LocationPicker — Interactive Leaflet map for vendor location selection
 *
 * Props:
 *  - value: { lat, lng, address }
 *  - onChange: (location) => void
 */
const LocationPicker = ({ value, onChange }) => {
  // Default center: Dhaka, Bangladesh
  const DEFAULT_CENTER = [23.8103, 90.4125];
  const center = value?.lat ? [value.lat, value.lng] : DEFAULT_CENTER;

  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-white/10 h-64 sm:h-72 relative z-0">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="rounded-xl"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value?.lat && (
            <Marker position={[value.lat, value.lng]} />
          )}
        </MapContainer>
      </div>

      {/* Address display */}
      {value?.address && (
        <div className="mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                        flex items-start gap-2">
          <svg className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" fill="none"
               viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0
                 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs text-gray-300 leading-relaxed">{value.address}</p>
        </div>
      )}

      {!value?.lat && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          📍 Click anywhere on the map to set your company location
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
