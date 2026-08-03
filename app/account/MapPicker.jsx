'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Default center: Malaybalay City, Bukidnon.
const DEFAULT = { lat: 8.1575, lng: 125.1278 };
const ICON_BASE = 'https://unpkg.com/leaflet@1.9.4/dist/images';

export default function MapPicker({ initialLat, initialLng, initialAddress }) {
  const [lat, setLat] = useState(initialLat ?? null);
  const [lng, setLng] = useState(initialLng ?? null);
  const [address, setAddress] = useState(initialAddress ?? '');
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let map;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = initialLat && initialLng ? { lat: initialLat, lng: initialLng } : DEFAULT;
      map = L.map(containerRef.current).setView([start.lat, start.lng], 15);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      const icon = L.icon({
        iconUrl: `${ICON_BASE}/marker-icon.png`,
        iconRetinaUrl: `${ICON_BASE}/marker-icon-2x.png`,
        shadowUrl: `${ICON_BASE}/marker-shadow.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      const marker = L.marker([start.lat, start.lng], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;

      const update = (ll) => {
        setLat(ll.lat);
        setLng(ll.lng);
        reverseGeocode(ll.lat, ll.lng);
      };
      marker.on('dragend', () => update(marker.getLatLng()));
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        update(e.latlng);
      });
      setTimeout(() => map.invalidateSize(), 200);
    })();
    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reverseGeocode(la, ln) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${la}&lon=${ln}`);
      const data = await res.json();
      if (data?.display_name) setAddress(data.display_name);
    } catch {
      /* best-effort; keep whatever address is typed */
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setLat(latitude);
      setLng(longitude);
      if (mapRef.current && markerRef.current) {
        mapRef.current.setView([latitude, longitude], 16);
        markerRef.current.setLatLng([latitude, longitude]);
      }
      reverseGeocode(latitude, longitude);
    });
  }

  return (
    <div>
      <label htmlFor="address">Delivery address *</label>
      <input
        id="address"
        name="address"
        required
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="House/street, barangay, city"
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0 0.4rem' }}>
        <small style={{ color: 'var(--muted)' }}>Drag the pin or tap the map to set your exact spot.</small>
        <button
          type="button"
          className="btn secondary"
          style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          onClick={useMyLocation}
        >
          📍 Use my location
        </button>
      </div>
      <div ref={containerRef} className="map-picker" />
      <input type="hidden" name="latitude" value={lat ?? ''} />
      <input type="hidden" name="longitude" value={lng ?? ''} />
    </div>
  );
}