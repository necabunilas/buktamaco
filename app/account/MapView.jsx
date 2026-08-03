'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const ICON_BASE = 'https://unpkg.com/leaflet@1.9.4/dist/images';

// Read-only mini map showing a single pin at [lat, lng].
export default function MapView({ lat, lng, zoom = 16, height = 180 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let map;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([lat, lng], zoom);
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
      L.marker([lat, lng], { icon }).addTo(map);
      setTimeout(() => map.invalidateSize(), 200);
    })();
    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, zoom]);

  return <div ref={containerRef} className="map-view" style={{ height }} />;
}