import { SeverityLevel, InspectionStatus } from '@/types';
import { cn } from '@/lib/utils';

const severityStyles: Record<SeverityLevel, string> = {
  low: 'bg-severity-low/15 text-severity-low border-severity-low/30',
  medium: 'bg-severity-medium/15 text-severity-medium border-severity-medium/30',
  high: 'bg-severity-high/15 text-severity-high border-severity-high/30',
  critical: 'bg-severity-critical/15 text-severity-critical border-severity-critical/30',
};

const severityLabels: Record<SeverityLevel, string> = {
  low: 'BAIXA',
  medium: 'MÉDIA',
  high: 'ALTA',
  critical: 'CRÍTICA',
};

const statusStyles: Record<InspectionStatus, string> = {
  regular: 'bg-status-regular/15 text-status-regular border-status-regular/30',
  requires_attention: 'bg-status-attention/15 text-status-attention border-status-attention/30',
  requires_intervention: 'bg-status-intervention/15 text-status-intervention border-status-intervention/30',
};

const statusLabels: Record<InspectionStatus, string> = {
  regular: 'NORMAL',
  requires_attention: 'ATENÇÃO',
  requires_intervention: 'INTERVENÇÃO',
};

export function SeverityBadge({ severity, className }: { severity: SeverityLevel; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
      severityStyles[severity],
      className
    )}>
      {severityLabels[severity]}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: InspectionStatus; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
      statusStyles[status],
      className
    )}>
      {statusLabels[status]}
    </span>
  );
}

export function StatusLed({ status, className }: { status: InspectionStatus; className?: string }) {
  const ledClass = status === 'regular' ? 'status-led-regular' 
    : status === 'requires_attention' ? 'status-led-attention' 
    : 'status-led-intervention';
  return <div className={cn("status-led", ledClass, className)} />;
}
