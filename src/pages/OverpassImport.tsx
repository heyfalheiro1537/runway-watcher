import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Download } from 'lucide-react';
import { AirportElement, ElementType } from '@/types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const QUERY = `[out:json];
(
  way["aeroway"](around:8000, 37.6188, -122.3750);
  relation["aeroway"](around:8000, 37.6188, -122.3750);
);
out geom;`;

interface OverpassGeometry {
  lat: number;
  lon: number;
}

interface OverpassElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
  geometry?: OverpassGeometry[];
  members?: Array<{
    type: string;
    role: string;
    geometry?: OverpassGeometry[];
  }>;
}

function mapAerowayToType(aeroway: string): ElementType {
  if (aeroway === 'runway') return 'runway';
  if (aeroway === 'taxiway') return 'taxiway';
  if (aeroway === 'apron') return 'apron';
  return 'other';
}

function slugify(type: string, ref: string): string {
  const prefix = type === 'runway' ? 'rwy' : type === 'taxiway' ? 'twy' : type === 'apron' ? 'apn' : type;
  const slug = (ref || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `${prefix}-${slug}`;
}

function getGeometryCoords(el: OverpassElement): OverpassGeometry[] {
  if (el.geometry && el.geometry.length > 0) return el.geometry;
  if (el.members) {
    return el.members.flatMap(m => m.geometry || []);
  }
  return [];
}

function centroid(coords: OverpassGeometry[]): { lat: number; lng: number } {
  if (coords.length === 0) return { lat: 0, lng: 0 };
  const sum = coords.reduce(
    (acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lon }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / coords.length, lng: sum.lng / coords.length };
}

function projectToSvg(
  coords: OverpassGeometry[],
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  width: number,
  height: number,
  padding: number = 40
): string {
  if (coords.length === 0) return '';

  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  const latRange = bbox.maxLat - bbox.minLat || 0.001;
  const lngRange = bbox.maxLng - bbox.minLng || 0.001;

  const points = coords.map(c => {
    const x = padding + ((c.lon - bbox.minLng) / lngRange) * usableW;
    const y = padding + ((bbox.maxLat - c.lat) / latRange) * usableH;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });

  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
}

export default function OverpassImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elements, setElements] = useState<AirportElement[] | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(QUERY)}`,
      });
      if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
      const data = await res.json();

      const raw: OverpassElement[] = data.elements || [];

      // Compute bounding box of all coords
      const allCoords = raw.flatMap(getGeometryCoords);
      if (allCoords.length === 0) throw new Error('No geometry data returned');

      const bbox = {
        minLat: Math.min(...allCoords.map(c => c.lat)),
        maxLat: Math.max(...allCoords.map(c => c.lat)),
        minLng: Math.min(...allCoords.map(c => c.lon)),
        maxLng: Math.max(...allCoords.map(c => c.lon)),
      };

      const seen = new Set<string>();
      const normalized: AirportElement[] = raw
        .filter(el => el.tags?.aeroway)
        .map(el => {
          const aeroway = el.tags!.aeroway;
          const type = mapAerowayToType(aeroway);
          const ref = el.tags?.ref || el.tags?.name || `${aeroway}-${el.id}`;
          let id = slugify(type, ref);
          // Deduplicate
          if (seen.has(id)) id = `${id}-${el.id}`;
          seen.add(id);

          const coords = getGeometryCoords(el);
          const identifier = type === 'runway' ? `RWY ${ref}` : ref;

          return {
            id,
            airportId: 'sfo',
            type,
            identifier,
            label: ref,
            status: 'regular' as const,
            center: centroid(coords),
            pathData: projectToSvg(coords, bbox, 800, 600),
          };
        })
        .filter(el => el.pathData.length > 0);

      setElements(normalized);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Overpass Import</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fetch SFO aeroway data from OpenStreetMap
        </p>
      </header>

      <button
        onClick={fetchData}
        disabled={loading}
        className="bezel px-5 py-3 text-sm font-medium flex items-center gap-2 mb-6 active:translate-y-0.5 transition-transform disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin text-primary" />
        ) : (
          <Download size={16} className="text-primary" />
        )}
        {loading ? 'Fetching…' : 'Fetch from Overpass'}
      </button>

      {error && (
        <div className="bezel p-4 mb-6 border-destructive/40 bg-destructive/5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {elements && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={14} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {elements.length} elements found
            </span>
          </div>

          <div className="bezel p-4 overflow-auto max-h-[60vh]">
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
              {JSON.stringify(elements, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
