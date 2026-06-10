import { useMemo, useState } from 'react';
import { Database, Network } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/context/AppContext';
import EntryForm from '@/components/ledger/EntryForm';
import ProjectionPanel from '@/components/ledger/ProjectionPanel';
import LedgerCard from '@/components/ledger/LedgerCard';
import SubgraphMap from '@/components/ledger/SubgraphMap';
import { RUNWAY_FEATURE } from '@/data/runwayFeature';

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
                  <Network size={18} className="text-primary" />
                  <CardTitle className="text-base">
                    Subgrafo Materializado
                    <span className="ml-2 text-xs font-mono text-muted-foreground">
                      ({projected.length})
                    </span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="rounded border border-border bg-muted/40 p-2">
                    <div className="text-muted-foreground">Nós Feature</div>
                    <div className="text-base text-primary">1</div>
                    <div className="text-[9px] text-muted-foreground">{RUNWAY_FEATURE.id}</div>
                  </div>
                  <div className="rounded border border-border bg-muted/40 p-2">
                    <div className="text-muted-foreground">Nós Incidente</div>
                    <div className="text-base text-accent">{projected.length}</div>
                    <div className="text-[9px] text-muted-foreground">projetados / {ledger.length} total</div>
                  </div>
                </div>

                <SubgraphMap entries={projected} />

                {projected.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <Database size={28} strokeWidth={1.2} className="mb-2 opacity-60" />
                    <p className="text-sm">Nenhum evento {appliedFilter ? 'na projeção' : 'no ledger'}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
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
