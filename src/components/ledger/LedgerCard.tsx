import { format, parseISO } from 'date-fns';
import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LedgerEntry } from '@/types';

export default function LedgerCard({ entry }: { entry: LedgerEntry }) {
  const typeColor =
    entry.incidentType === 'WILD'
      ? 'bg-status-attention/20 text-status-attention border-status-attention/40'
      : 'bg-primary/20 text-primary border-primary/40';

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={typeColor} variant="outline">{entry.incidentType}</Badge>
          <Badge variant="outline" className="font-mono text-[10px]">{entry.catalogVersion}</Badge>
          <span className="font-mono text-xs font-semibold">{entry.id}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Append-only">
          <Lock size={10} />
          <span>imutável</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <span className="text-muted-foreground">entidade: </span>
          <span>{entry.entityRef}</span>
        </div>
        <div>
          <span className="text-muted-foreground">coord: </span>
          <span>{entry.linearCoord}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">recordedAt: </span>
          <span>{format(parseISO(entry.recordedAt), 'yyyy-MM-dd HH:mm:ss')}</span>
        </div>
      </div>

      <pre className="rounded bg-muted/60 p-2 text-[11px] font-mono overflow-x-auto">
{JSON.stringify(entry.body, null, 2)}
      </pre>
    </div>
  );
}
