import { AirportElement, ElementType } from '@/types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

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
  width = 800,
  height = 600,
  padding = 40
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

/** Search for an airport by name/code using Nominatim and return coordinates */
export async function searchAirport(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const res = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(query + ' airport')}&format=json&limit=1`,
    { headers: { 'User-Agent': 'RunwayNotes/1.0' } }
  );
  if (!res.ok) return null;
  const results = await res.json();
  if (!results.length) return null;
  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}

/** Fetch aeroway elements from Overpass around given coordinates */
export async function fetchAerowayElements(
  lat: number,
  lng: number,
  airportId: string,
  radius = 8000
): Promise<AirportElement[]> {
  const query = `[out:json];
(
  way["aeroway"](around:${radius}, ${lat}, ${lng});
  relation["aeroway"](around:${radius}, ${lat}, ${lng});
);
out geom;`;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
  const data = await res.json();

  const raw: OverpassElement[] = data.elements || [];
  const allCoords = raw.flatMap(getGeometryCoords);
  if (allCoords.length === 0) throw new Error('No geometry data found at this location');

  const bbox = {
    minLat: Math.min(...allCoords.map(c => c.lat)),
    maxLat: Math.max(...allCoords.map(c => c.lat)),
    minLng: Math.min(...allCoords.map(c => c.lon)),
    maxLng: Math.max(...allCoords.map(c => c.lon)),
  };

  const seen = new Set<string>();
  return raw
    .filter(el => el.tags?.aeroway)
    .map(el => {
      const aeroway = el.tags!.aeroway;
      const type = mapAerowayToType(aeroway);
      const ref = el.tags?.ref || el.tags?.name || `${aeroway}-${el.id}`;
      let id = slugify(type, ref);
      if (seen.has(id)) id = `${id}-${el.id}`;
      seen.add(id);

      const coords = getGeometryCoords(el);
      const identifier = type === 'runway' ? `RWY ${ref}` : ref;

      return {
        id,
        airportId,
        type,
        identifier,
        label: ref,
        status: 'regular' as const,
        center: centroid(coords),
        pathData: projectToSvg(coords, bbox),
      };
    })
    .filter(el => el.pathData.length > 0);
}
