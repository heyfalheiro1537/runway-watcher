import { RUNWAY_FEATURE } from '@/data/runwayFeature';
import type { LedgerEntry } from '@/types';

interface Props {
  entries: LedgerEntry[];
}

export default function SubgraphMap({ entries }: Props) {
  const { comprimento_metros: L, largura_metros: W, faixa_metros: F } = RUNWAY_FEATURE;
  const halfF = F / 2;
  const halfW = W / 2;

  // viewBox: x = estaca (0..L), y = afastamento (-100..100)
  const viewMinY = -100;
  const viewH = 200;

  // Tick marks every 500m
  const ticks = Array.from({ length: Math.floor(L / 500) + 1 }, (_, i) => i * 500);

  return (
    <div className="w-full rounded-md border border-border bg-muted/30 p-3">
      <svg
        viewBox={`0 ${viewMinY} ${L} ${viewH}`}
        preserveAspectRatio="none"
        className="w-full h-48"
        role="img"
        aria-label="Subgrafo materializado da pista"
      >
        {/* Faixa de Pista */}
        <rect
          x={0}
          y={-halfF}
          width={L}
          height={F}
          fill="hsl(var(--muted))"
          opacity={0.6}
        />
        {/* Pista (asfalto) */}
        <rect
          x={0}
          y={-halfW}
          width={L}
          height={W}
          fill="hsl(var(--foreground) / 0.75)"
        />
        {/* Eixo central tracejado */}
        <line
          x1={0}
          y1={0}
          x2={L}
          y2={0}
          stroke="hsl(var(--background))"
          strokeWidth={2}
          strokeDasharray="40 30"
          vectorEffect="non-scaling-stroke"
        />
        {/* Ticks de estaca */}
        {ticks.map(t => (
          <g key={t}>
            <line
              x1={t} y1={halfF} x2={t} y2={halfF + 10}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}

        {/* Incidentes */}
        {entries.map(e => {
          const fill =
            e.incidentType === 'FOD'
              ? 'hsl(var(--destructive))'
              : 'hsl(35 95% 55%)';
          const summary = Object.values(e.body).join(' · ');
          return (
            <g key={e.id}>
              <circle
                cx={e.estaca}
                cy={e.afastamento}
                r={8}
                fill={fill}
                stroke="hsl(var(--background))"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className="hover:opacity-80 cursor-pointer"
              >
                <title>{`${e.id} · ${e.incidentType} · ${summary}\nEstaca ${e.estaca}m · Afast ${e.afastamento}m`}</title>
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Legenda + escala */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(35 95% 55%)' }} />
            WILD
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-destructive" />
            FOD
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>0m</span>
          <span>{Math.floor(L / 2)}m</span>
          <span>{L}m</span>
        </div>
      </div>
    </div>
  );
}
