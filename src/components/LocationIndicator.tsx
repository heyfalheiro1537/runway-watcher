import { motion } from 'framer-motion';
import { Navigation } from 'lucide-react';

interface LocationDotProps {
  cx: number;
  cy: number;
  heading?: number | null;
}

export function LocationDot({ cx, cy, heading }: LocationDotProps) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Accuracy ring */}
      <motion.circle
        r="14"
        fill="hsl(217, 91%, 60%)"
        fillOpacity={0.08}
        stroke="hsl(217, 91%, 60%)"
        strokeOpacity={0.25}
        strokeWidth="1"
        animate={{ r: [14, 18, 14] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Outer pulse */}
      <motion.circle
        r="6"
        fill="none"
        stroke="hsl(217, 91%, 60%)"
        strokeWidth="1.5"
        strokeOpacity={0.5}
        animate={{ r: [6, 10], strokeOpacity: [0.5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />
      {/* Core dot */}
      <circle r="5" fill="hsl(217, 91%, 60%)" />
      <circle r="2.5" fill="hsl(210, 40%, 98%)" />
      {/* Heading indicator */}
      {heading != null && (
        <polygon
          points="0,-10 -3,-5 3,-5"
          fill="hsl(217, 91%, 60%)"
          transform={`rotate(${heading})`}
        />
      )}
    </g>
  );
}

interface LocationReadoutProps {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

export function LocationReadout({ lat, lng, accuracy, heading, speed }: LocationReadoutProps) {
  return (
    <div className="data-strip text-[9px] gap-4">
      <div className="flex items-center gap-1">
        <Navigation size={9} className="text-primary" />
        <span>{lat.toFixed(5)}° {lat >= 0 ? 'N' : 'S'}</span>
      </div>
      <span>{Math.abs(lng).toFixed(5)}° {lng >= 0 ? 'E' : 'W'}</span>
      <span>±{accuracy.toFixed(0)}m</span>
      {heading != null && <span>HDG {heading.toFixed(0)}°</span>}
      {speed != null && <span>{(speed * 3.6).toFixed(1)} km/h</span>}
    </div>
  );
}
