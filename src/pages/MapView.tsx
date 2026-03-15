import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertOctagon, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { StatusBadge, SeverityBadge, StatusLed } from '@/components/StatusBadge';
import { AirportElement, Observation, InspectionReport } from '@/types';
import { getStatusColor, mockReports } from '@/data/mockData';
import { format, parseISO } from 'date-fns';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LocationDot, LocationReadout } from '@/components/LocationIndicator';

const severityIcons = {
  low: CheckCircle,
  medium: Info,
  high: AlertTriangle,
  critical: AlertOctagon,
};

export default function MapView() {
  const { selectedAirport, reports, role } = useAppState();
  const navigate = useNavigate();
  const { position: gpsPosition } = useGeolocation();
  const [selectedElement, setSelectedElement] = useState<AirportElement | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 500 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const airportReports = useMemo(() =>
    reports.filter(r => r.airportId === selectedAirport?.id),
    [reports, selectedAirport]
  );

  const allObservations = useMemo(() =>
    airportReports.flatMap(r => r.observations.map(obs => ({
      ...obs,
      reportId: r.id,
      elementId: r.elementId,
      elementIdentifier: r.elementIdentifier,
    }))),
    [airportReports]
  );

  const elementReports = useMemo(() => {
    if (!selectedElement) return [];
    return airportReports.filter(r => r.elementId === selectedElement.id);
  }, [airportReports, selectedElement]);

  // Pan handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = (e.clientX - panStart.x) * (viewBox.w / 800);
    const dy = (e.clientY - panStart.y) * (viewBox.h / 500);
    setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    const newW = viewBox.w * scale;
    const newH = viewBox.h * scale;
    const dx = (viewBox.w - newW) / 2;
    const dy = (viewBox.h - newH) / 2;
    setViewBox({ x: viewBox.x + dx, y: viewBox.y + dy, w: newW, h: newH });
  };

  // Map observation coords to SVG space (simplified)
  const obsToSvg = (obs: typeof allObservations[0]) => {
    const el = selectedAirport?.elements.find(e => e.id === obs.elementId);
    if (!el) return null;
    // Spread observations around element center with slight offset based on id hash
    const hash = obs.id.charCodeAt(obs.id.length - 1);
    const cx = parseFloat(el.pathData.match(/M\s*(\d+)/)?.[1] || '400') + (hash % 50);
    const cy = parseFloat(el.pathData.match(/M\s*\d+\s+(\d+)/)?.[1] || '250') + ((hash * 7) % 30);
    return { x: cx, y: cy };
  };

  if (!selectedAirport) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20 px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No airport selected</p>
          <button onClick={() => navigate('/')} className="text-primary text-sm font-medium">Go to Hangar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pb-16 flex flex-col bg-surface-sunken">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold">{selectedAirport.iataCode}</span>
          <span className="text-xs text-muted-foreground">AIRPORT MAP</span>
        </div>
        {role === 'inspector' && (
          <button
            onClick={() => navigate('/inspect')}
            className="touch-target bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs font-medium flex items-center gap-1 active:translate-y-0.5 transition-transform"
          >
            <Plus size={14} /> New Report
          </button>
        )}
      </div>

      {/* SVG Map */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(217, 32%, 12%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="-200" y="-200" width="1200" height="900" fill="url(#grid)" />

          {/* Airport elements */}
          {selectedAirport.elements.map(element => (
            <motion.path
              key={element.id}
              d={element.pathData}
              fill={getStatusColor(element.status)}
              fillOpacity={selectedElement?.id === element.id ? 0.4 : 0.15}
              stroke={getStatusColor(element.status)}
              strokeWidth={selectedElement?.id === element.id ? 2.5 : 1.5}
              className="cursor-pointer"
              whileTap={{ fillOpacity: 0.4 }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElement(element);
                setSelectedObservation(null);
              }}
            />
          ))}

          {/* Element labels */}
          {selectedAirport.elements.map(element => {
            const match = element.pathData.match(/M\s*(\d+)\s+(\d+)/);
            if (!match) return null;
            const pathParts = element.pathData.match(/\d+/g)?.map(Number) || [];
            const xs = pathParts.filter((_, i) => i % 2 === 0);
            const ys = pathParts.filter((_, i) => i % 2 === 1);
            const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
            const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
            return (
              <text
                key={`label-${element.id}`}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none"
                fill="hsl(210, 40%, 90%)"
                fontSize="9"
                fontFamily="'Geist Mono', monospace"
                fontWeight="600"
              >
                {element.label}
              </text>
            );
          })}

          {/* GPS Location dot */}
          {gpsPosition && (() => {
            // Map GPS to SVG space using first element as reference
            const refEl = selectedAirport.elements[0];
            if (!refEl) return null;
            const refMatch = refEl.pathData.match(/M\s*(\d+)\s+(\d+)/);
            if (!refMatch) return null;
            const refSvgX = parseFloat(refMatch[1]);
            const refSvgY = parseFloat(refMatch[2]);
            // Scale: rough px per degree
            const scale = 20000;
            const dotX = refSvgX + (gpsPosition.lng - refEl.center.lng) * scale;
            const dotY = refSvgY - (gpsPosition.lat - refEl.center.lat) * scale;
            return <LocationDot cx={dotX} cy={dotY} heading={gpsPosition.heading} />;
          })()}

          {/* Observation pins */}
          {allObservations.map(obs => {
            const pos = obsToSvg(obs);
            if (!pos) return null;
            const Icon = severityIcons[obs.severity];
            const color = obs.severity === 'critical' ? 'hsl(0,84%,60%)'
              : obs.severity === 'high' ? 'hsl(25,95%,53%)'
              : obs.severity === 'medium' ? 'hsl(38,92%,50%)'
              : 'hsl(142,70%,45%)';
            return (
              <g
                key={obs.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedObservation(obs);
                }}
              >
                <circle r="8" fill="hsl(222,47%,7%)" stroke={color} strokeWidth="2" />
                <circle r="2" fill={color} />
              </g>
            );
          })}
        </svg>

        {/* Minimap */}
        <div className="absolute bottom-3 left-3 w-28 h-20 bezel overflow-hidden opacity-80">
          <svg viewBox="0 0 800 500" className="w-full h-full">
            <rect width="800" height="500" fill="hsl(222,47%,4%)" />
            {selectedAirport.elements.map(el => (
              <path key={el.id} d={el.pathData} fill={getStatusColor(el.status)} fillOpacity={0.3} stroke={getStatusColor(el.status)} strokeWidth="1" />
            ))}
            <rect
              x={viewBox.x}
              y={viewBox.y}
              width={viewBox.w}
              height={viewBox.h}
              fill="none"
              stroke="hsl(217,91%,60%)"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Coordinates readout */}
        <div className="absolute bottom-3 right-3 data-strip text-[9px]">
          {selectedAirport.elements[0]?.center.lat.toFixed(4)}° N, {Math.abs(selectedAirport.elements[0]?.center.lng || 0).toFixed(4)}° W
        </div>
      </div>

      {/* Observation popup */}
      <AnimatePresence>
        {selectedObservation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute bottom-20 left-4 right-4 bezel p-4 z-20"
          >
            <div className="flex items-start justify-between mb-2">
              <SeverityBadge severity={selectedObservation.severity} />
              <button onClick={() => setSelectedObservation(null)} className="touch-target -m-2">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm mb-2">{selectedObservation.description}</p>
            <div className="data-strip text-[9px]">
              <span>{selectedObservation.geoCoord.lat.toFixed(4)}° N</span>
              <span>{Math.abs(selectedObservation.geoCoord.lng).toFixed(4)}° W</span>
              <span>{format(parseISO(selectedObservation.createdAt), 'dd MMM HH:mm')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element side panel */}
      <AnimatePresence>
        {selectedElement && !selectedObservation && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute top-12 right-0 bottom-16 w-80 max-w-[85vw] bg-card border-l border-border z-20 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-mono text-sm font-bold">{selectedElement.identifier}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusLed status={selectedElement.status} />
                    <StatusBadge status={selectedElement.status} />
                  </div>
                </div>
                <button onClick={() => setSelectedElement(null)} className="touch-target -m-2">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              <div className="data-strip mb-4">
                <span>TYPE: {selectedElement.type.replace('_', ' ').toUpperCase()}</span>
              </div>

              {role === 'inspector' && (
                <button
                  onClick={() => navigate(`/inspect?element=${selectedElement.id}`)}
                  className="w-full bg-primary text-primary-foreground rounded p-3 text-sm font-medium mb-4 flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform"
                >
                  <Plus size={14} /> Start Inspection
                </button>
              )}

              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Inspection History
              </h3>
              {elementReports.length === 0 ? (
                <p className="text-xs text-muted-foreground">No reports for this element</p>
              ) : (
                <div className="space-y-2">
                  {elementReports.map(report => (
                    <div key={report.id} className="instrument-card">
                      <div className="flex items-center justify-between mb-1">
                        <StatusBadge status={report.status} />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {format(parseISO(report.createdAt), 'dd MMM HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{report.inspectorName}</p>
                      <div className="flex gap-1 mt-2">
                        {report.observations.map(obs => (
                          <SeverityBadge key={obs.id} severity={obs.severity} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
