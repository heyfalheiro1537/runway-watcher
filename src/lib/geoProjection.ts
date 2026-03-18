import { AirportElement, GeoCoord } from '@/types';

interface SvgGeoTransform {
  lat0: number;
  lng0: number;
  svgX0: number;
  svgY0: number;
  /** degrees of longitude per SVG pixel */
  scaleX: number;
  /** degrees of latitude per SVG pixel (negative: SVG Y grows downward) */
  scaleY: number;
}

function svgCentroid(pathData: string): { x: number; y: number } {
  const nums = pathData.match(/[\d.]+/g)?.map(Number) || [];
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const x = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 400;
  const y = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 250;
  return { x, y };
}

/**
 * Derive a linear SVG↔geo transform from a set of airport elements.
 * Uses each element's SVG path centroid as the SVG anchor and its
 * stored geo center as the geographic anchor, then averages the scales
 * across all pairs to reduce error.
 */
export function buildTransform(elements: AirportElement[]): SvgGeoTransform {
  if (elements.length === 0) {
    return { lat0: 0, lng0: 0, svgX0: 400, svgY0: 250, scaleX: 0.0001, scaleY: -0.0001 };
  }

  const refs = elements.map(el => ({
    ...svgCentroid(el.pathData),
    lat: el.center.lat,
    lng: el.center.lng,
  }));

  const anchor = refs[0];
  let sumSX = 0, sumSY = 0, cntX = 0, cntY = 0;

  for (let i = 1; i < refs.length; i++) {
    const dX = refs[i].x - anchor.x;
    const dY = refs[i].y - anchor.y;
    if (Math.abs(dX) > 5) { sumSX += (refs[i].lng - anchor.lng) / dX; cntX++; }
    if (Math.abs(dY) > 5) { sumSY += (refs[i].lat - anchor.lat) / dY; cntY++; }
  }

  return {
    lat0: anchor.lat,
    lng0: anchor.lng,
    svgX0: anchor.x,
    svgY0: anchor.y,
    scaleX: cntX > 0 ? sumSX / cntX : 0.0001,
    scaleY: cntY > 0 ? sumSY / cntY : -0.0001,
  };
}

export function geoToSvg(coord: GeoCoord, t: SvgGeoTransform): { x: number; y: number } {
  return {
    x: t.svgX0 + (coord.lng - t.lng0) / t.scaleX,
    y: t.svgY0 + (coord.lat - t.lat0) / t.scaleY,
  };
}

export function svgToGeo(svgX: number, svgY: number, t: SvgGeoTransform): GeoCoord {
  return {
    lng: t.lng0 + (svgX - t.svgX0) * t.scaleX,
    lat: t.lat0 + (svgY - t.svgY0) * t.scaleY,
  };
}
