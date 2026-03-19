import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ChevronDown, ChevronUp } from 'lucide-react';
import NewsFeed from './NewsFeed';

interface OperationsFeedProps {
  airportId?: string;
}

export default function OperationsFeed({ airportId }: OperationsFeedProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-t border-border bg-card/95 backdrop-blur-sm">
      {/* Header - always visible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Relatório de Operações
          </span>
          <span className="w-2 h-2 rounded-full bg-status-regular animate-pulse-glow" />
        </div>
        {collapsed ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {/* Content */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 max-h-72 overflow-y-auto">
              <NewsFeed airportId={airportId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
