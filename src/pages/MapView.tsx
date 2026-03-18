import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertOctagon, AlertTriangle, Info, CheckCircle, Locate, MapPin } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { StatusBadge, SeverityBadge, StatusLed } from '@/components/StatusBadge';
import { AirportElement, Observation, InspectionReport, GeoCoord } from '@/types';
import { getStatusColor, getTypeColor, mockReports } from '@/data/mockData';
import { buildTransform, geoToSvg, svgToGeo } from '@/lib/geoProjection';
import { format, parseISO } from 'date-fns';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LocationDot, LocationReadout } from '@/components/LocationIndicator';
import RegulationsPanel from '@/components/RegulationsPanel';
import NewsFeed from '@/components/NewsFeed';

const severityIcons = {
  low: CheckCircle,
  medium: Info,
  high: AlertTriangle,
  critical: AlertOctagon,
};

export default function MapView() {
  const { selectedAirport, reports, role, setPendingPickCoord } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pickMode = searchParams.get('pickLocation') === 'true';
  const returnElement = searchParams.get('element');
  const { position: gpsPosition } = useGeolocation();
  const [selectedElement, setSelectedElement] = useState<AirportElement | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 500 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const pickDownPos = useRef<{ x: number; y: number } | null>(null);
  const [pickDraft, setPickDraft] = useState<{ svgPos: { x: number; y: number }; geo: GeoCoord } | null>(null);

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

  // Pan / pick-tap handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    pickDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = (e.clientX - panStart.x) * (viewBox.w / 800);
    const dy = (e.clientY - panStart.y) * (viewBox.h / 500);
    setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    if (pickMode && pickDownPos.current && svgRef.current) {
      const ddx = e.clientX - pickDownPos.current.x;
      const ddy = e.clientY - pickDownPos.current.y;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist <= 8) {
        const svgEl = svgRef.current;
        const pt = svgEl.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
        const geo = svgToGeo(svgP.x, svgP.y, svgTransform);
        setPickDraft({ svgPos: { x: svgP.x, y: svgP.y }, geo });
      }
    }
    pickDownPos.current = null;
  };

  const handlePointerLeave = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    const newW = viewBox.w * scale;
    const newH = viewBox.h * scale;
    const dx = (viewBox.w - newW) / 2;
    const dy = (viewBox.h - newH) / 2;
    setViewBox({ x: viewBox.x + dx, y: viewBox.y + dy, w: newW, h: newH });
  };

  const svgTransform = useMemo(
    () => buildTransform(selectedAirport?.elements || []),
    [selectedAirport]
  );

  const obsToSvg = (obs: typeof allObservations[0]) => {
    if (!selectedAirport || selectedAirport.elements.length === 0) return null;
    return geoToSvg(obs.geoCoord, svgTransform);
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

  const confirmPick = () => {
    if (!pickDraft) return;
    setPendingPickCoord(pickDraft.geo);
    const params = new URLSearchParams();
    if (returnElement) params.set('element', returnElement);
    navigate(`/inspect?${params.toString()}`);
  };

  const cancelPick = () => {
    const params = new URLSearchParams();
    if (returnElement) params.set('element', returnElement);
    navigate(`/inspect?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 pb-16 flex flex-col bg-surface-sunken">
      {/* Pick-mode banner */}
      {pickMode ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-amber-950/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-200">
              {pickDraft ? 'Pin placed — confirm or tap again' : 'Tap the map to mark observation location'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelPick}
              className="px-3 py-1.5 text-xs rounded border border-amber-700/50 text-amber-300 hover:bg-amber-900/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmPick}
              disabled={!pickDraft}
              className="px-3 py-1.5 text-xs rounded bg-amber-500 text-amber-950 font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0.5 transition-transform"
            >
              Confirm
            </button>
          </div>
        </div>
      ) : (
      /* Normal header */
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
      )}

      {/* SVG Map */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className={`w-full h-full ${pickMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
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

          {/* Airport elements — background first, runways on top */}
          {[...selectedAirport.elements].sort((a, b) => {
            const order = (t: string) => {
              switch (t) {
                case 'other':            return 0;
                case 'terminal':
                case 'hangar':           return 1;
                case 'safety_strip':
                case 'shoulder':         return 2;
                case 'apron':            return 3;
                case 'holding_position': return 4;
                case 'taxiway':          return 5;
                case 'runway':           return 6;
                default:                 return 0;
              }
            };
            return order(a.type) - order(b.type);
          }).map(element => {
            const isSelected = selectedElement?.id === element.id;
            const typeColor = getTypeColor(element.type);
            // Open paths (no Z) are centerlines — render as thick strokes with no fill
            const isOpenPath = !element.pathData.trimEnd().endsWith('Z');
            const centerlineStroke =
              element.type === 'runway' ? 10 :
              element.type === 'taxiway' ? 2.5 : 3;
            const polyStroke =
              element.type === 'runway' ? 2.5 :
              element.type === 'taxiway' ? 0.8 : 0.8;
            const baseStroke = isOpenPath ? centerlineStroke : polyStroke;

            return (
              <motion.path
                key={element.id}
                d={element.pathData}
                fill={isOpenPath ? 'none' : (isSelected ? 'hsl(217,91%,60%)' : typeColor)}
                fillOpacity={isOpenPath ? 0 : (isSelected ? 0.35 : (element.type === 'runway' || element.type === 'taxiway' ? 0.22 : 0.12))}
                stroke={isSelected ? 'hsl(217,91%,60%)' : typeColor}
                strokeWidth={isSelected ? baseStroke * 1.4 : baseStroke}
                strokeOpacity={isSelected ? 1 : 0.85}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cursor-pointer"
                animate={{
                  stroke: isSelected ? 'hsl(217,91%,60%)' : typeColor,
                  strokeWidth: isSelected ? baseStroke * 1.4 : baseStroke,
                }}
                transition={{ duration: 0.15 }}
                whileTap={{ strokeOpacity: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (pickMode) return;
                  setSelectedElement(element);
                  setSelectedObservation(null);
                }}
              />
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
                  if (pickMode) return;
                  setSelectedObservation(obs);
                }}
              >
                <circle r="8" fill="hsl(222,47%,7%)" stroke={color} strokeWidth="2" />
                <circle r="2" fill={color} />
              </g>
            );
          })}

          {/* Pick-mode draft pin */}
          {pickMode && pickDraft && (() => {
            const s = viewBox.w / 800;
            const r = 11 * s;     // head radius
            const neck = 4 * s;   // narrow point below head
            const stem = 15 * s;  // stem height from tip to neck
            // Teardrop path: tip at (0,0), body above
            const d = [
              `M 0 0`,
              `C ${-neck} ${-(stem * 0.4)} ${-r} ${-(stem + r * 0.5)} ${-r} ${-(stem + r)}`,
              `A ${r} ${r} 0 1 1 ${r} ${-(stem + r)}`,
              `C ${r} ${-(stem + r * 0.5)} ${neck} ${-(stem * 0.4)} 0 0`,
              'Z',
            ].join(' ');
            return (
              <g transform={`translate(${pickDraft.svgPos.x}, ${pickDraft.svgPos.y})`}>
                {/* Shadow */}
                <ellipse cx={0} cy={1.5 * s} rx={5 * s} ry={2 * s} fill="hsl(0,0%,0%)" fillOpacity={0.25} />
                {/* Pin body */}
                <path d={d} fill="hsl(38,96%,54%)" />
                {/* Inner circle */}
                <circle cx={0} cy={-(stem + r)} r={r * 0.42} fill="hsl(222,47%,10%)" />
              </g>
            );
          })()}
        </svg>

        {/* Minimap */}
        <div className="absolute bottom-3 left-3 w-28 h-20 bezel overflow-hidden opacity-80">
          <svg viewBox="0 0 800 500" className="w-full h-full">
            <rect width="800" height="500" fill="hsl(222,47%,4%)" />
            {selectedAirport.elements.map(el => {
              const open = !el.pathData.trimEnd().endsWith('Z');
              return (
                <path
                  key={el.id}
                  d={el.pathData}
                  fill={open ? 'none' : getTypeColor(el.type)}
                  fillOpacity={0.3}
                  stroke={getTypeColor(el.type)}
                  strokeWidth={open ? (el.type === 'runway' ? 6 : el.type === 'taxiway' ? 1.5 : 2) : 1}
                />
              );
            })}
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

        {/* Locate me button */}
        <button
          onClick={() => {
            if (!gpsPosition) return;
            const refEl = selectedAirport.elements[0];
            if (!refEl) return;
            const refMatch = refEl.pathData.match(/M\s*(\d+)\s+(\d+)/);
            if (!refMatch) return;
            const refSvgX = parseFloat(refMatch[1]);
            const refSvgY = parseFloat(refMatch[2]);
            const scale = 20000;
            const dotX = refSvgX + (gpsPosition.lng - refEl.center.lng) * scale;
            const dotY = refSvgY - (gpsPosition.lat - refEl.center.lat) * scale;
            setViewBox({ x: dotX - 200, y: dotY - 150, w: 400, h: 300 });
          }}
          className="absolute top-3 right-3 touch-target bezel p-2.5 rounded-full active:translate-y-0.5 transition-transform z-10"
          title="Show my location"
        >
          <Locate size={18} className="text-primary" />
        </button>

        {/* GPS Readout */}
        {gpsPosition && (
          <div className="absolute bottom-3 right-3">
            <LocationReadout
              lat={gpsPosition.lat}
              lng={gpsPosition.lng}
              accuracy={gpsPosition.accuracy}
              heading={gpsPosition.heading}
              speed={gpsPosition.speed}
            />
          </div>
        )}
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
                  onClick={() => navigate(`/inspect?element=${selectedElement.id}&type=${selectedElement.type}&identifier=${encodeURIComponent(selectedElement.identifier)}`)}
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

              {/* Regulations for this element type */}
              <div className="mt-5">
                <RegulationsPanel elementType={selectedElement.type} />
              </div>

              {/* Feed filtered to this airport */}
              <div className="mt-5">
                <NewsFeed airportId={selectedAirport.id} compact />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
