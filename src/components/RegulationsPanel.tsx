import { useState, useMemo } from 'react';
import { Search, BookOpen, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { regulations, regulationCategories, type Regulation } from '@/data/regulations';
import { ElementType } from '@/types';

interface RegulationsPanelProps {
  elementType?: ElementType;
}

const sourceColors: Record<string, string> = {
  ICAO: 'bg-primary/20 text-primary',
  FAA: 'bg-status-attention/20 text-status-attention',
  EASA: 'bg-status-regular/20 text-status-regular',
};

export default function RegulationsPanel({ elementType }: RegulationsPanelProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return regulations.filter(reg => {
      if (elementType && !reg.elementTypes.includes(elementType)) return false;
      if (categoryFilter && reg.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return reg.code.toLowerCase().includes(q) ||
          reg.title.toLowerCase().includes(q) ||
          reg.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [elementType, categoryFilter, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen size={14} className="text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Regulations
        </h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search regulations..."
          className="w-full bg-muted border-none rounded pl-9 pr-3 py-2 text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
            !categoryFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          All
        </button>
        {regulationCategories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(categoryFilter === cat.value ? null : cat.value)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              categoryFilter === cat.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No matching regulations</p>
        ) : (
          filtered.map(reg => (
            <motion.div
              key={reg.id}
              layout
              className="instrument-card !p-3 cursor-pointer"
              onClick={() => setExpanded(expanded === reg.id ? null : reg.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sourceColors[reg.source]}`}>
                      {reg.source}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{reg.code}</span>
                  </div>
                  <p className="text-xs font-medium">{reg.title}</p>
                </div>
              </div>
              <AnimatePresence>
                {expanded === reg.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      {reg.description}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {reg.elementTypes.map(et => (
                        <span key={et} className="px-1.5 py-0.5 bg-muted rounded text-[9px] text-muted-foreground">
                          {et.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
