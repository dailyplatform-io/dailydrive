import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png?url';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png?url';
import './AddressPicker.css';

const defaultMarkerIcon = new L.Icon({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

type Suggestion = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

function getCityFromAddress(address?: Record<string, string>) {
  if (!address) return '';
  return address.city || address.town || address.village || address.county || address.state || '';
}

async function nominatimSearch(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  url.searchParams.set('q', query);
  const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  return (await res.json()) as Suggestion[];
}

async function nominatimReverse(lat: number, lng: number, signal: AbortSignal) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  return (await res.json()) as { display_name?: string; address?: Record<string, string> };
}

function MapClicker({ onPick }: { onPick: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

export function AddressPicker({
  defaultCenter,
  value,
  onChange,
  searchLabel,
  searchPlaceholder,
  addressLabel,
  addressPlaceholder,
  mapHint,
}: {
  defaultCenter: { lat: number; lng: number };
  value: { fullAddress: string; city: string; lat?: number; lng?: number };
  onChange: (next: { fullAddress: string; city: string; lat: number; lng: number }) => void;
  searchLabel: string;
  searchPlaceholder: string;
  addressLabel: string;
  addressPlaceholder: string;
  mapHint: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const position = useMemo(() => {
    if (typeof value.lat === 'number' && typeof value.lng === 'number') return { lat: value.lat, lng: value.lng };
    return defaultCenter;
  }, [value.lat, value.lng, defaultCenter]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const results = await nominatimSearch(query.trim(), controller.signal);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current) return;
      if (event.target instanceof Node && wrapperRef.current.contains(event.target)) return;
      setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const pickCoords = async (next: { lat: number; lng: number }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const reversed = await nominatimReverse(next.lat, next.lng, controller.signal);
      const fullAddress = reversed?.display_name || `${next.lat.toFixed(5)}, ${next.lng.toFixed(5)}`;
      const city = getCityFromAddress(reversed?.address) || value.city || '';
      onChange({ fullAddress, city, lat: next.lat, lng: next.lng });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="address-picker" ref={wrapperRef}>
      <div className="address-picker__row">
        <div className="address-picker__search">
          <span className="address-picker__label">{searchLabel}</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={searchPlaceholder}
            aria-label="Search on map"
          />
          {open && (loading || suggestions.length > 0) && (
            <div className="address-picker__dropdown" role="listbox">
              {loading && <div className="address-picker__hint">Searching…</div>}
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s.place_id}
                  className="address-picker__option"
                  onClick={() => {
                    const lat = Number(s.lat);
                    const lng = Number(s.lon);
                    const city = getCityFromAddress(s.address) || value.city || '';
                    onChange({ fullAddress: s.display_name, city, lat, lng });
                    setQuery(s.display_name);
                    setOpen(false);
                  }}
                >
                  {s.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="address-picker__address">
          <span className="address-picker__label">{addressLabel}</span>
          <input value={value.fullAddress} readOnly aria-label="Full address" placeholder={addressPlaceholder} />
        </div>
      </div>

      <div className="address-picker__map">
        <MapContainer center={[position.lat, position.lng]} zoom={15} scrollWheelZoom={true}>
          <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClicker onPick={pickCoords} />
          <Marker position={[position.lat, position.lng]} icon={defaultMarkerIcon} />
        </MapContainer>
        <div className="address-picker__mapHint">
          {mapHint}{loading ? '…' : ''}
        </div>
      </div>
    </div>
  );
}
