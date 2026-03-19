import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
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

export default function RunwayDetailModal({ element, open, onClose }: RunwayDetailModalProps) {
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);

  const activeZone = hoveredZone || selectedZone;

  if (!open) return null;

  // SVG layout constants
  const W = 900;
  const H = 500;
  const cx = W / 2;
  const cy = H / 2;

  // Zones dimensions
  const rwyW = 400;
  const rwyH = 50;
  const swyW = 50;
  const resaW = 60;
  const cwyW = 80;
  const stripPadX = 30;
  const stripPadY = 80;
  const protectedPadX = 10;
  const protectedPadY = 10;

  const rwyX = cx - rwyW / 2;
  const rwyY = cy - rwyH / 2;

  // Strip
  const stripX = rwyX - swyW - stripPadX;
  const stripY = rwyY - stripPadY;
  const stripW2 = rwyW + 2 * swyW + 2 * stripPadX;
  const stripH2 = rwyH + 2 * stripPadY;

  // Protected area
  const protX = stripX - resaW - protectedPadX;
  const protY = stripY - protectedPadY;
  const protW = stripW2 + 2 * resaW + 2 * cwyW + 2 * protectedPadX;
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
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold">
                  Área Protegida — {element.identifier}
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  Esquema Técnico · RBAC nº 154
                </p>
              </div>
              <button onClick={onClose} className="touch-target -m-2">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* SVG Schematic */}
            <div className="p-4">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: '50vh' }}>
                {/* Background */}
                <rect width={W} height={H} fill="hsl(222, 47%, 5%)" rx="4" />

                {/* Protected area (outermost) */}
                <rect
                  x={protX} y={protY} width={protW} height={protH}
                  fill="hsl(200, 80%, 55%)" fillOpacity={0.08}
                  stroke="hsl(200, 80%, 55%)" strokeWidth="1.5" strokeDasharray="6 3"
                  rx="3"
                  {...makeZoneProps('protected')}
                />

                {/* CWY left */}
                <rect
                  x={protX + protectedPadX} y={rwyY - 15} width={cwyW} height={rwyH + 30}
                  fill="hsl(45, 90%, 50%)" fillOpacity={0.18}
                  stroke="hsl(45, 90%, 50%)" strokeWidth="1.5"
                  {...makeZoneProps('cwy')}
                />
                {/* CWY right */}
                <rect
                  x={rwyX + rwyW + swyW + resaW} y={rwyY - 15} width={cwyW} height={rwyH + 30}
                  fill="hsl(45, 90%, 50%)" fillOpacity={0.18}
                  stroke="hsl(45, 90%, 50%)" strokeWidth="1.5"
                  {...makeZoneProps('cwy')}
                />

                {/* RESA left */}
                <rect
                  x={rwyX - swyW - resaW} y={rwyY - 20} width={resaW} height={rwyH + 40}
                  fill="hsl(320, 50%, 35%)" fillOpacity={0.25}
                  stroke="hsl(320, 50%, 35%)" strokeWidth="1.5"
                  {...makeZoneProps('resa')}
                />
                {/* RESA right */}
                <rect
                  x={rwyX + rwyW + swyW} y={rwyY - 20} width={resaW} height={rwyH + 40}
                  fill="hsl(320, 50%, 35%)" fillOpacity={0.25}
                  stroke="hsl(320, 50%, 35%)" strokeWidth="1.5"
                  {...makeZoneProps('resa')}
                />

                {/* Strip */}
                <rect
                  x={stripX} y={stripY} width={stripW2} height={stripH2}
                  fill="hsl(120, 40%, 40%)" fillOpacity={0.1}
                  stroke="hsl(120, 40%, 40%)" strokeWidth="1" strokeDasharray="4 2"
                  {...makeZoneProps('strip')}
                />

                {/* SWY left */}
                <rect
                  x={rwyX - swyW} y={rwyY} width={swyW} height={rwyH}
                  fill="hsl(0, 0%, 45%)" fillOpacity={0.3}
                  stroke="hsl(0, 0%, 60%)" strokeWidth="1"
                  {...makeZoneProps('swy')}
                />
                {/* SWY right */}
                <rect
                  x={rwyX + rwyW} y={rwyY} width={swyW} height={rwyH}
                  fill="hsl(0, 0%, 45%)" fillOpacity={0.3}
                  stroke="hsl(0, 0%, 60%)" strokeWidth="1"
                  {...makeZoneProps('swy')}
                />

                {/* Runway */}
                <rect
                  x={rwyX} y={rwyY} width={rwyW} height={rwyH}
                  fill="hsl(0, 0%, 25%)" fillOpacity={0.9}
                  stroke="hsl(0, 0%, 50%)" strokeWidth="1.5"
                  {...makeZoneProps('runway')}
                />

                {/* Runway centerline dashes */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <rect
                    key={i}
                    x={rwyX + 20 + i * 30}
                    y={cy - 1}
                    width={18}
                    height={2}
                    fill="hsl(0, 0%, 90%)"
                    pointerEvents="none"
                  />
                ))}

                {/* Threshold markings */}
                {[rwyX + 8, rwyX + rwyW - 14].map((tx, idx) => (
                  <g key={idx}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <rect
                        key={j}
                        x={tx}
                        y={rwyY + 8 + j * 10}
                        width={6}
                        height={6}
                        fill="hsl(0, 0%, 90%)"
                        pointerEvents="none"
                      />
                    ))}
                  </g>
                ))}

                {/* Runway designators */}
                <text x={rwyX + 30} y={cy + 4} fill="hsl(0,0%,90%)" fontSize="14" fontFamily="monospace" textAnchor="middle" pointerEvents="none">
                  {element.label?.split('/')[0] || '20'}
                </text>
                <text x={rwyX + rwyW - 30} y={cy + 4} fill="hsl(0,0%,90%)" fontSize="14" fontFamily="monospace" textAnchor="middle" pointerEvents="none">
                  {element.label?.split('/')[1] || '02'}
                </text>

                {/* Zone labels */}
                <text x={cx} y={rwyY - 5} fill="hsl(0,0%,65%)" fontSize="9" textAnchor="middle" pointerEvents="none">PISTA</text>
                <text x={rwyX - swyW / 2} y={rwyY - 5} fill="hsl(0,0%,55%)" fontSize="8" textAnchor="middle" pointerEvents="none">SWY</text>
                <text x={rwyX + rwyW + swyW / 2} y={rwyY - 5} fill="hsl(0,0%,55%)" fontSize="8" textAnchor="middle" pointerEvents="none">SWY</text>
                <text x={rwyX - swyW - resaW / 2} y={rwyY - 25} fill="hsl(320,50%,55%)" fontSize="8" textAnchor="middle" pointerEvents="none">RESA</text>
                <text x={rwyX + rwyW + swyW + resaW / 2} y={rwyY - 25} fill="hsl(320,50%,55%)" fontSize="8" textAnchor="middle" pointerEvents="none">RESA</text>
                <text x={protX + protectedPadX + cwyW / 2} y={rwyY - 20} fill="hsl(45,90%,60%)" fontSize="8" textAnchor="middle" pointerEvents="none">CWY</text>
                <text x={rwyX + rwyW + swyW + resaW + cwyW / 2} y={rwyY - 20} fill="hsl(45,90%,60%)" fontSize="8" textAnchor="middle" pointerEvents="none">CWY</text>
                <text x={cx} y={stripY + 12} fill="hsl(120,40%,55%)" fontSize="8" textAnchor="middle" pointerEvents="none">FAIXA DE PISTA</text>
                <text x={cx} y={protY + 12} fill="hsl(200,80%,65%)" fontSize="8" textAnchor="middle" pointerEvents="none">ÁREA PROTEGIDA</text>
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
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Info size={12} className="text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Legenda</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {(Object.entries(zones) as [ZoneId, ZoneInfo][]).map(([id, zone]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedZone(selectedZone === id ? null : id)}
                    className={`flex items-center gap-2 p-1.5 rounded text-left transition-colors ${
                      selectedZone === id ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-sm shrink-0 border border-border"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="text-[10px] text-muted-foreground leading-tight">{zone.label}</span>
                  </button>
                ))}
              </div>

              {/* Footer definition */}
              <div className="bg-muted/50 rounded p-3 border border-border">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Área protegida:</strong> área que compreende a pista de pouso e decolagem, 
                  a stopway, o comprimento da faixa de pista, a área em ambos os lados da pista, a RESA e a zona desimpedida 
                  (clearway), conforme RBAC nº 154.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
