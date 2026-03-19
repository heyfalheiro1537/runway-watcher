import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AirportElement } from '@/types';

interface RunwayDetailModalProps {
  element: AirportElement;
  open: boolean;
  onClose: () => void;
}

type ZoneId = 'runway' | 'swy' | 'resa' | 'cwy' | 'strip' | 'protected';

interface ZoneInfo {
  label: string;
  color: string;
  description: string;
}

const zones: Record<ZoneId, ZoneInfo> = {
  runway: {
    label: 'Pista de Pouso e Decolagem',
    color: 'hsl(0, 0%, 30%)',
    description: 'Área retangular definida em um aeródromo, preparada para pouso e decolagem de aeronaves. Deve possuir superfície com atrito adequado e ser mantida livre de irregularidades.',
  },
  swy: {
    label: 'Stopway (SWY)',
    color: 'hsl(0, 0%, 45%)',
    description: 'Área além da extremidade da pista, preparada como extensão adequada para parada de aeronaves em caso de decolagem abortada. Deve suportar a aeronave sem causar danos estruturais.',
  },
  resa: {
    label: 'RESA — Área de Segurança de Fim de Pista',
    color: 'hsl(320, 50%, 35%)',
    description: 'Área simétrica em relação ao prolongamento do eixo da pista, adjacente ao fim da faixa de pista, destinada a reduzir o risco de danos a aeronaves que realizem pousos curtos ou ultrapassem o fim da pista. Dimensões mínimas conforme RBAC nº 154.',
  },
  cwy: {
    label: 'Clearway (CWY) — Zona Desimpedida',
    color: 'hsl(45, 90%, 50%)',
    description: 'Área retangular definida sobre o solo ou água, sob controle da autoridade do aeródromo, selecionada como área adequada sobre a qual a aeronave pode efetuar parte de sua subida inicial até uma altura especificada.',
  },
  strip: {
    label: 'Faixa de Pista',
    color: 'hsl(120, 40%, 40%)',
    description: 'Área que compreende a pista e as zonas de parada (stopways), se existentes, destinada a reduzir o risco de danos a aeronaves que saiam da pista e proteger aeronaves que sobrevoam a área durante pousos e decolagens.',
  },
  protected: {
    label: 'Área Protegida',
    color: 'hsl(200, 80%, 55%)',
    description: 'Área que compreende a pista de pouso e decolagem, a stopway, o comprimento da faixa de pista, a área em ambos os lados da pista, a RESA e a zona desimpedida (clearway), conforme RBAC nº 154.',
  },
};

/** Parse "16/34", "28L/10R", "16-34" → ["16", "34"] */
function parseDesignators(label: string): [string, string] {
  const sep = label.includes('/') ? '/' : '-';
  const parts = label.split(sep);
  return [parts[0]?.trim() || '', parts[1]?.trim() || ''];
}

/** "16L" → 160, "34R" → 340, "09" → 90 */
function headingFromDesignator(des: string): number {
  const num = parseInt(des.replace(/[LRClrc]/g, ''), 10);
  return isNaN(num) ? 0 : (num % 36 || 36) * 10;
}

export default function RunwayDetailModal({ element, open, onClose }: RunwayDetailModalProps) {
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);

  const activeZone = hoveredZone || selectedZone;

  if (!open) return null;

  const [desA, desB] = parseDesignators(element.label || '');
  const hdgA = headingFromDesignator(desA); // heading of the left/low end
  const hdgB = headingFromDesignator(desB); // heading of the right/high end

  // SVG layout — compact proportions for mobile
  const W = 700;
  const H = 320;
  const cx = W / 2;
  const cy = 140;

  const rwyW = 300;
  const rwyH = 28;
  const swyW = 28;
  const resaW = 34;
  const cwyW = 44;
  const stripPadX = 18;
  const stripPadY = 34;
  const protectedPadX = 6;
  const protectedPadY = 10;

  const rwyX = cx - rwyW / 2;
  const rwyY = cy - rwyH / 2;

  const stripX = rwyX - swyW - stripPadX;
  const stripY = rwyY - stripPadY;
  const stripW2 = rwyW + 2 * swyW + 2 * stripPadX;
  const stripH2 = rwyH + 2 * stripPadY;

  const protW = rwyW + 2 * swyW + 2 * resaW + 2 * cwyW + 2 * protectedPadX;
  const protX = cx - protW / 2;
  const protY = stripY - protectedPadY;
  const protH = stripH2 + 2 * protectedPadY;

  const makeZoneProps = (zone: ZoneId) => ({
    className: 'cursor-pointer transition-opacity',
    style: { opacity: activeZone && activeZone !== zone ? 0.5 : 1 },
    onMouseEnter: () => setHoveredZone(zone),
    onMouseLeave: () => setHoveredZone(null),
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSelectedZone(selectedZone === zone ? null : zone); },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 sm:px-4 border-b border-border">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold truncate">
                  Área Protegida — {element.identifier}
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  RBAC nº 154
                </p>
                {desA && desB && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-mono bg-muted px-1 py-0.5 rounded text-foreground">
                      ← {hdgA.toString().padStart(3, '0')}°
                    </span>
                    <span className="text-[8px] text-muted-foreground">·</span>
                    <span className="text-[9px] font-mono bg-muted px-1 py-0.5 rounded text-foreground">
                      {hdgB.toString().padStart(3, '0')}° →
                    </span>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="touch-target -m-2 shrink-0">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* SVG Schematic */}
            <div className="px-3 py-3 sm:px-4">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                <defs>
                  <pattern id="hatch-cwy" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="hsl(45,90%,50%)" strokeWidth="0.7" strokeOpacity="0.35" />
                  </pattern>
                  <pattern id="hatch-resa" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="hsl(320,50%,50%)" strokeWidth="0.7" strokeOpacity="0.4" />
                  </pattern>
                </defs>

                <rect width={W} height={H} fill="hsl(222,47%,5%)" rx="4" />

                {/* Protected area (outermost) */}
                <rect
                  x={protX} y={protY} width={protW} height={protH}
                  fill="hsl(200,80%,55%)" fillOpacity={0.06}
                  stroke="hsl(200,80%,55%)" strokeWidth="1" strokeDasharray="5 3"
                  rx="3"
                  {...makeZoneProps('protected')}
                />

                {/* CWY left */}
                <g {...makeZoneProps('cwy')}>
                  <rect x={protX + protectedPadX} y={rwyY - 8} width={cwyW} height={rwyH + 16}
                    fill="hsl(45,90%,50%)" fillOpacity={0.1} stroke="hsl(45,90%,50%)" strokeWidth="0.8" />
                  <rect x={protX + protectedPadX} y={rwyY - 8} width={cwyW} height={rwyH + 16}
                    fill="url(#hatch-cwy)" stroke="none" />
                </g>
                {/* CWY right */}
                <g {...makeZoneProps('cwy')}>
                  <rect x={rwyX + rwyW + swyW + resaW} y={rwyY - 8} width={cwyW} height={rwyH + 16}
                    fill="hsl(45,90%,50%)" fillOpacity={0.1} stroke="hsl(45,90%,50%)" strokeWidth="0.8" />
                  <rect x={rwyX + rwyW + swyW + resaW} y={rwyY - 8} width={cwyW} height={rwyH + 16}
                    fill="url(#hatch-cwy)" stroke="none" />
                </g>

                {/* RESA left */}
                <g {...makeZoneProps('resa')}>
                  <rect x={rwyX - swyW - resaW} y={rwyY - 10} width={resaW} height={rwyH + 20}
                    fill="hsl(320,50%,35%)" fillOpacity={0.16} stroke="hsl(320,50%,35%)" strokeWidth="0.8" />
                  <rect x={rwyX - swyW - resaW} y={rwyY - 10} width={resaW} height={rwyH + 20}
                    fill="url(#hatch-resa)" stroke="none" />
                </g>
                {/* RESA right */}
                <g {...makeZoneProps('resa')}>
                  <rect x={rwyX + rwyW + swyW} y={rwyY - 10} width={resaW} height={rwyH + 20}
                    fill="hsl(320,50%,35%)" fillOpacity={0.16} stroke="hsl(320,50%,35%)" strokeWidth="0.8" />
                  <rect x={rwyX + rwyW + swyW} y={rwyY - 10} width={resaW} height={rwyH + 20}
                    fill="url(#hatch-resa)" stroke="none" />
                </g>

                {/* Strip */}
                <rect
                  x={stripX} y={stripY} width={stripW2} height={stripH2}
                  fill="hsl(120,40%,40%)" fillOpacity={0.08}
                  stroke="hsl(120,40%,40%)" strokeWidth="0.8" strokeDasharray="4 2"
                  {...makeZoneProps('strip')}
                />

                {/* SWY left */}
                <rect
                  x={rwyX - swyW} y={rwyY} width={swyW} height={rwyH}
                  fill="hsl(0,0%,45%)" fillOpacity={0.3}
                  stroke="hsl(0,0%,60%)" strokeWidth="0.8"
                  {...makeZoneProps('swy')}
                />
                {/* SWY right */}
                <rect
                  x={rwyX + rwyW} y={rwyY} width={swyW} height={rwyH}
                  fill="hsl(0,0%,45%)" fillOpacity={0.3}
                  stroke="hsl(0,0%,60%)" strokeWidth="0.8"
                  {...makeZoneProps('swy')}
                />

                {/* Runway */}
                <rect
                  x={rwyX} y={rwyY} width={rwyW} height={rwyH}
                  fill="hsl(0,0%,22%)" fillOpacity={0.95}
                  stroke="hsl(0,0%,50%)" strokeWidth="1.2"
                  {...makeZoneProps('runway')}
                />

                {/* Runway centerline dashes */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <rect
                    key={i}
                    x={rwyX + 18 + i * 27}
                    y={cy - 0.75}
                    width={16}
                    height={1.5}
                    fill="hsl(0,0%,90%)"
                    pointerEvents="none"
                  />
                ))}

                {/* Threshold markings */}
                {[rwyX + 6, rwyX + rwyW - 10].map((tx, idx) => (
                  <g key={idx}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <rect
                        key={j}
                        x={tx}
                        y={rwyY + 5 + j * 8}
                        width={4}
                        height={5}
                        fill="hsl(0,0%,90%)"
                        pointerEvents="none"
                      />
                    ))}
                  </g>
                ))}

                {/* Runway designators */}
                <text x={rwyX + 24} y={cy - 1} fill="hsl(0,0%,90%)" fontSize="12" fontFamily="monospace" textAnchor="middle" pointerEvents="none">
                  {desA || '—'}
                </text>
                {desA && (
                  <text x={rwyX + 24} y={cy + 10} fill="hsl(0,0%,55%)" fontSize="7" fontFamily="monospace" textAnchor="middle" pointerEvents="none">
                    {hdgA.toString().padStart(3, '0')}°
                  </text>
                )}
                <text x={rwyX + rwyW - 24} y={cy - 1} fill="hsl(0,0%,90%)" fontSize="12" fontFamily="monospace" textAnchor="middle" pointerEvents="none">
                  {desB || '—'}
                </text>
                {desB && (
                  <text x={rwyX + rwyW - 24} y={cy + 10} fill="hsl(0,0%,55%)" fontSize="7" fontFamily="monospace" textAnchor="middle" pointerEvents="none">
                    {hdgB.toString().padStart(3, '0')}°
                  </text>
                )}

                {/* Zone labels */}
                <text x={cx} y={rwyY - 4} fill="hsl(0,0%,65%)" fontSize="8" textAnchor="middle" pointerEvents="none">PISTA</text>
                <text x={rwyX - swyW / 2} y={rwyY - 4} fill="hsl(0,0%,50%)" fontSize="7" textAnchor="middle" pointerEvents="none">SWY</text>
                <text x={rwyX + rwyW + swyW / 2} y={rwyY - 4} fill="hsl(0,0%,50%)" fontSize="7" textAnchor="middle" pointerEvents="none">SWY</text>
                <text x={rwyX - swyW - resaW / 2} y={rwyY - 14} fill="hsl(320,50%,55%)" fontSize="7" textAnchor="middle" pointerEvents="none">RESA</text>
                <text x={rwyX + rwyW + swyW + resaW / 2} y={rwyY - 14} fill="hsl(320,50%,55%)" fontSize="7" textAnchor="middle" pointerEvents="none">RESA</text>
                <text x={protX + protectedPadX + cwyW / 2} y={rwyY - 12} fill="hsl(45,90%,60%)" fontSize="7" textAnchor="middle" pointerEvents="none">CWY</text>
                <text x={rwyX + rwyW + swyW + resaW + cwyW / 2} y={rwyY - 12} fill="hsl(45,90%,60%)" fontSize="7" textAnchor="middle" pointerEvents="none">CWY</text>
                <text x={cx} y={stripY + 10} fill="hsl(120,40%,55%)" fontSize="7" textAnchor="middle" pointerEvents="none">FAIXA DE PISTA</text>
                <text x={cx} y={protY + 10} fill="hsl(200,80%,65%)" fontSize="7" textAnchor="middle" pointerEvents="none">ÁREA PROTEGIDA</text>

                {/* Dimension annotations */}
                {(() => {
                  const dimBase = protY + protH + 16;
                  const tick = 3;
                  const dims = [
                    { x1: rwyX, x2: rwyX + rwyW, y: dimBase, label: 'Pista', color: 'hsl(0,0%,45%)' },
                    { x1: stripX, x2: stripX + stripW2, y: dimBase + 16, label: 'Faixa de Pista', color: 'hsl(120,40%,45%)' },
                    { x1: protX, x2: protX + protW, y: dimBase + 32, label: 'Área Protegida', color: 'hsl(200,80%,50%)' },
                  ];
                  return dims.map((d, i) => (
                    <g key={i} pointerEvents="none" opacity={0.7}>
                      <line x1={d.x1} y1={d.y} x2={d.x2} y2={d.y} stroke={d.color} strokeWidth="0.6" />
                      <line x1={d.x1} y1={d.y - tick} x2={d.x1} y2={d.y + tick} stroke={d.color} strokeWidth="0.6" />
                      <line x1={d.x2} y1={d.y - tick} x2={d.x2} y2={d.y + tick} stroke={d.color} strokeWidth="0.6" />
                      <text x={(d.x1 + d.x2) / 2} y={d.y - 4} fill={d.color} fontSize="6.5" fontFamily="monospace" textAnchor="middle">
                        {d.label}
                      </text>
                    </g>
                  ));
                })()}
              </svg>
            </div>

            {/* Zone detail panel */}
            <AnimatePresence>
              {activeZone && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="p-4 flex items-start gap-3">
                    <div
                      className="w-4 h-4 rounded-sm shrink-0 mt-0.5 border border-border"
                      style={{ backgroundColor: zones[activeZone].color }}
                    />
                    <div>
                      <p className="text-xs font-semibold">{zones[activeZone].label}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {zones[activeZone].description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legend */}
            <div className="px-3 py-3 sm:px-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Info size={11} className="text-primary shrink-0" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Legenda — toque para selecionar</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                {(Object.entries(zones) as [ZoneId, ZoneInfo][]).map(([id, zone]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedZone(selectedZone === id ? null : id)}
                    className={`flex items-center gap-1.5 p-1.5 rounded text-left transition-colors ${
                      selectedZone === id ? 'bg-muted ring-1 ring-primary/30' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0 border border-border"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="text-[9px] text-muted-foreground leading-tight">{zone.label}</span>
                  </button>
                ))}
              </div>

              {selectedZone ? (
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({
                      element: element.id,
                      type: element.type,
                      identifier: element.identifier,
                      zone: selectedZone,
                    });
                    onClose();
                    navigate(`/inspect?${params.toString()}`);
                  }}
                  className="w-full bg-primary text-primary-foreground rounded p-2.5 text-xs font-medium mb-3 flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-transform"
                >
                  <Plus size={13} /> Inspeção — {zones[selectedZone].label}
                </button>
              ) : (
                <p className="text-[10px] text-muted-foreground text-center mb-3 py-1.5">
                  Selecione uma zona para iniciar a inspeção
                </p>
              )}

              <div className="bg-muted/50 rounded p-2.5 border border-border">
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Área protegida:</strong> pista de pouso e decolagem, 
                  stopway, faixa de pista, RESA e clearway, conforme RBAC nº 154.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
