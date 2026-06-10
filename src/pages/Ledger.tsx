import { useMemo, useState } from 'react';
import { Database } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/context/AppContext';
import EntryForm from '@/components/ledger/EntryForm';
import ProjectionPanel from '@/components/ledger/ProjectionPanel';
import LedgerCard from '@/components/ledger/LedgerCard';

export default function LedgerPage() {
  const { ledger } = useAppState();
  const [entityFilter, setEntityFilter] = useState('');
  const [layer, setLayer] = useState('fisica');
  const [appliedFilter, setAppliedFilter] = useState('');

  const projected = useMemo(() => {
    if (!appliedFilter) return ledger;
    const q = appliedFilter.toLowerCase();
    return ledger.filter(e => e.entityRef.toLowerCase().includes(q));
  }, [ledger, appliedFilter]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <BrandLogo />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Ledger de Incidentes</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Event Sourcing · Catálogo Versionado · Projeção
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <EntryForm />
          </div>

          <div className="lg:col-span-1">
            <ProjectionPanel
              entityFilter={entityFilter}
              setEntityFilter={setEntityFilter}
              layer={layer}
              setLayer={setLayer}
              appliedFilter={appliedFilter}
              onApply={() => setAppliedFilter(entityFilter.trim())}
              onClear={() => { setEntityFilter(''); setAppliedFilter(''); }}
              totalCount={ledger.length}
              projectedCount={projected.length}
            />
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-primary" />
                  <CardTitle className="text-base">
                    Grafo Materializado
                    <span className="ml-2 text-xs font-mono text-muted-foreground">
                      ({projected.length})
                    </span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {projected.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Database size={32} strokeWidth={1.2} className="mb-3 opacity-60" />
                    <p className="text-sm">Nenhum evento {appliedFilter ? 'na projeção' : 'no ledger'}</p>
                    <p className="text-xs mt-1">Grave incidentes pelo simulador.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {projected.map(e => <LedgerCard key={e.id} entry={e} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
