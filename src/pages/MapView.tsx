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
import RunwayDetailModal from '@/components/RunwayDetailModal';
import OperationsFeed from '@/components/OperationsFeed';

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
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);
  const [runwayModalElement, setRunwayModalElement] = useState<AirportElement | null>(null);

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

  // Pan / pinch-zoom / pick-tap handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      pickDownPos.current = { x: e.clientX, y: e.clientY };
      lastPinchDist.current = null;
    } else if (activePointers.current.size === 2) {
      setIsPanning(false);
      pickDownPos.current = null;
      const pts = Array.from(activePointers.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current !== null && newDist > 0 && svgRef.current) {
        const scale = lastPinchDist.current / newDist;
        lastPinchDist.current = newDist;
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        const svgEl = svgRef.current;
        const pt = svgEl.createSVGPoint();
        pt.x = cx; pt.y = cy;
        const svgP = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
        const px = svgP.x; const py = svgP.y;
        setViewBox(prev => ({
          x: px - (px - prev.x) * scale,
          y: py - (py - prev.y) * scale,
          w: prev.w * scale,
          h: prev.h * scale,
        }));
      }
      return;
    }

    if (!isPanning) return;
    const rawDx = e.clientX - panStart.x;
    const rawDy = e.clientY - panStart.y;
    setViewBox(prev => ({ ...prev, x: prev.x - rawDx * (prev.w / 800), y: prev.y - rawDy * (prev.h / 500) }));
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size === 0) {
      setIsPanning(false);
      lastPinchDist.current = null;
      if (pickMode && pickDownPos.current && svgRef.current) {
        const ddx = e.clientX - pickDownPos.current.x;
        const ddy = e.clientY - pickDownPos.current.y;
        if (Math.sqrt(ddx * ddx + ddy * ddy) <= 8) {
          const svgEl = svgRef.current;
          const pt = svgEl.createSVGPoint();
          pt.x = e.clientX; pt.y = e.clientY;
          const svgP = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
          const geo = svgToGeo(svgP.x, svgP.y, svgTransform);
          setPickDraft({ svgPos: { x: svgP.x, y: svgP.y }, geo });
        }
      }
      pickDownPos.current = null;
    } else if (activePointers.current.size === 1) {
      lastPinchDist.current = null;
      pickDownPos.current = null;
      const remaining = Array.from(activePointers.current.values())[0];
      setIsPanning(true);
      setPanStart(remaining);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size === 0) {
      setIsPanning(false);
      lastPinchDist.current = null;
      pickDownPos.current = null;
    }
  };

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
          <p className="text-muted-foreground mb-4">Nenhum aeroporto selecionado</p>
          <button onClick={() => navigate('/')} className="text-primary text-sm font-medium">Ir para o Hangar</button>
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

  const handleElementClick = (element: AirportElement, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pickMode) return;
    
    if (element.type === 'runway') {
      setRunwayModalElement(element);
    }
    
    setSelectedElement(element);
    setSelectedObservation(null);
  };

  return (
    <div className="fixed inset-0 pb-16 flex flex-col bg-surface-sunken">
      {/* Pick-mode banner */}
      {pickMode ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-amber-950/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-200">
              {pickDraft ? 'Pino posicionado — confirme ou toque novamente' : 'Toque no mapa para marcar a localização'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelPick}
              className="px-3 py-1.5 text-xs rounded border border-amber-700/50 text-amber-300 hover:bg-amber-900/40 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmPick}
              disabled={!pickDraft}
              className="px-3 py-1.5 text-xs rounded bg-amber-500 text-amber-950 font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0.5 transition-transform"
            >
              Confirmar
            </button>
          </div>
        </div>
      ) : (
      /* Normal header */
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold">{selectedAirport.iataCode}</span>
          <span className="text-xs text-muted-foreground">MAPA DO AEROPORTO</span>
        </div>
        {role === 'inspector' && (
          <button
            onClick={() => navigate('/inspect')}
            className="touch-target bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs font-medium flex items-center gap-1 active:translate-y-0.5 transition-transform"
          >
            <Plus size={14} /> Novo Relatório
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

          {/* Airport elements */}
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
                onClick={(e) => handleElementClick(element, e as any)}
              />
            );
          })}

          {/* GPS Location dot */}
          {gpsPosition && (() => {
            const refEl = selectedAirport.elements[0];
            if (!refEl) return null;
            const refMatch = refEl.pathData.match(/M\s*(\d+)\s+(\d+)/);
            if (!refMatch) return null;
            const refSvgX = parseFloat(refMatch[1]);
            const refSvgY = parseFloat(refMatch[2]);
            const scale = 20000;
            const dotX = refSvgX + (gpsPosition.lng - refEl.center.lng) * scale;
            const dotY = refSvgY - (gpsPosition.lat - refEl.center.lat) * scale;
            return <LocationDot cx={dotX} cy={dotY} heading={gpsPosition.heading} />;
          })()}

          {/* Observation pins */}
          {allObservations.map(obs => {
            const pos = obsToSvg(obs);
            if (!pos) return null;
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
            const r = 11 * s;
            const neck = 4 * s;
            const stem = 15 * s;
            const d = [
              `M 0 0`,
              `C ${-neck} ${-(stem * 0.4)} ${-r} ${-(stem + r * 0.5)} ${-r} ${-(stem + r)}`,
              `A ${r} ${r} 0 1 1 ${r} ${-(stem + r)}`,
              `C ${r} ${-(stem + r * 0.5)} ${neck} ${-(stem * 0.4)} 0 0`,
              'Z',
            ].join(' ');
            return (
              <g transform={`translate(${pickDraft.svgPos.x}, ${pickDraft.svgPos.y})`}>
                <ellipse cx={0} cy={1.5 * s} rx={5 * s} ry={2 * s} fill="hsl(0,0%,0%)" fillOpacity={0.25} />
                <path d={d} fill="hsl(38,96%,54%)" />
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
          title="Mostrar minha localização"
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

      {/* Operations feed drawer */}
      {!pickMode && !selectedElement && !selectedObservation && (
        <OperationsFeed airportId={selectedAirport.id} />
      )}

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
                <span>TIPO: {selectedElement.type.replace('_', ' ').toUpperCase()}</span>
              </div>

              {/* Runway detail button */}
              {selectedElement.type === 'runway' && (
                <button
                  onClick={() => setRunwayModalElement(selectedElement)}
                  className="w-full bg-muted text-foreground rounded p-3 text-sm font-medium mb-3 flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform border border-border hover:border-primary/50"
                >
                  <Info size={14} className="text-primary" /> Ver Área Protegida
                </button>
              )}

              {role === 'inspector' && (
                <button
                  onClick={() => navigate(`/inspect?element=${selectedElement.id}&type=${selectedElement.type}&identifier=${encodeURIComponent(selectedElement.identifier)}`)}
                  className="w-full bg-primary text-primary-foreground rounded p-3 text-sm font-medium mb-4 flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform"
                >
                  <Plus size={14} /> Iniciar Inspeção
                </button>
              )}

              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Histórico de Inspeções
              </h3>
              {elementReports.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum relatório para este elemento</p>
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

              {/* Regulamentações */}
              <div className="mt-5">
                <RegulationsPanel elementType={selectedElement.type} />
              </div>

              {/* Feed filtrado */}
              <div className="mt-5">
                <NewsFeed airportId={selectedAirport.id} compact />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Runway Detail Modal */}
      {runwayModalElement && (
        <RunwayDetailModal
          element={runwayModalElement}
          open={!!runwayModalElement}
          onClose={() => setRunwayModalElement(null)}
        />
      )}
    </div>
  );
}
