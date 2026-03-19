import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, AlertTriangle, Bell, FileText, Activity } from 'lucide-react';
import { mockFeedItems, type FeedItem, type FeedItemType } from '@/data/newsFeed';
import { format, parseISO } from 'date-fns';

interface NewsFeedProps {
  airportId?: string;
  compact?: boolean;
  /** Evita título duplicado quando embutido em OperationsFeed */
  hideTitle?: boolean;
}

const typeConfig: Record<FeedItemType, { icon: typeof Radio; color: string; label: string }> = {
  safety_bulletin: { icon: FileText, color: 'text-severity-medium', label: 'Boletim' },
  notam: { icon: Bell, color: 'text-primary', label: 'NOTAM' },
  activity: { icon: Activity, color: 'text-status-regular', label: 'Atividade' },
  alert: { icon: AlertTriangle, color: 'text-severity-critical', label: 'Alerta' },
};

const severityBg: Record<string, string> = {
  info: 'border-l-primary',
  warning: 'border-l-status-attention',
  critical: 'border-l-status-intervention',
};

export default function NewsFeed({ airportId, compact = false, hideTitle = false }: NewsFeedProps) {
  const [filter, setFilter] = useState<FeedItemType | 'all'>('all');

  const items = useMemo(() => {
    let filtered = mockFeedItems;
    if (airportId) {
      filtered = filtered.filter(f => !f.airportId || f.airportId === airportId);
    }
    if (filter !== 'all') {
      filtered = filtered.filter(f => f.type === filter);
    }
    return compact ? filtered.slice(0, 5) : filtered;
  }, [airportId, filter, compact]);

  return (
    <div className="space-y-3">
      {!hideTitle && (
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Relatório de Operações
          </h3>
        </div>
      )}

      {/* Filtros */}
      {!compact && (
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'alert', 'notam', 'safety_bulletin', 'activity'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                filter === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {type === 'all' ? 'Todos' : type === 'safety_bulletin' ? 'Boletins' : type === 'alert' ? 'Alertas' : type === 'notam' ? 'NOTAMs' : 'Atividades'}
            </button>
          ))}
        </div>
      )}

      {/* Itens */}
      <div className="space-y-1.5">
        {items.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center py-6 px-2">
            Nenhum evento para este aeroporto com os filtros atuais. Boletins gerais (sem aeroporto) aparecem em todos os painéis.
          </p>
        )}
        {items.map((item, i) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className={`instrument-card !p-3 border-l-2 ${
                item.severity ? severityBg[item.severity] : 'border-l-border'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Icon size={14} className={`${config.color} mt-0.5 shrink-0`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold uppercase ${config.color}`}>{config.label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {format(parseISO(item.timestamp), 'dd MMM HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-snug">{item.title}</p>
                  {!compact && (
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                  )}
                  <span className="text-[9px] text-muted-foreground mt-1 block">{item.source}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
