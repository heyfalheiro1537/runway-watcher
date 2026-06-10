import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/context/AppContext';
import { CATALOG, CATALOG_VERSIONS, INCIDENT_TYPES } from '@/data/catalog';
import type { CatalogVersion, IncidentType, LedgerEntry } from '@/types';

export default function EntryForm() {
  const { catalogVersion, setCatalogVersion, ledger, addLedgerEntry, selectedAirport } = useAppState();
  const [eventId, setEventId] = useState('');
  const [entityRef, setEntityRef] = useState('');
  const [linearCoord, setLinearCoord] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('WILD');
  const [body, setBody] = useState<Record<string, string>>({});

  const fields = useMemo(() => CATALOG[catalogVersion][incidentType], [catalogVersion, incidentType]);

  // Reset dynamic body when catalog/type changes (Zona de Mutabilidade)
  useEffect(() => {
    setBody({});
  }, [catalogVersion, incidentType]);

  const entitySuggestions = useMemo(
    () => selectedAirport?.elements.map(e => e.identifier) ?? [],
    [selectedAirport],
  );

  const handleSubmit = () => {
    if (!eventId.trim() || !entityRef.trim() || !linearCoord.trim()) {
      toast.error('Preencha todos os campos do envelope');
      return;
    }
    const missing = fields.find(f => !body[f.key]?.toString().trim());
    if (missing) {
      toast.error(`Campo "${missing.label}" obrigatório pelo catálogo ${catalogVersion}`);
      return;
    }
    if (ledger.some(e => e.id === eventId.trim())) {
      toast.error('ID de evento já registrado (ledger é append-only)');
      return;
    }

    const entry: LedgerEntry = {
      id: eventId.trim(),
      entityRef: entityRef.trim(),
      linearCoord: linearCoord.trim(),
      incidentType,
      catalogVersion,
      body: { ...body },
      recordedAt: new Date().toISOString(),
    };
    addLedgerEntry(entry);
    toast.success(`Evento ${entry.id} gravado no Ledger`);
    setEventId('');
    setEntityRef('');
    setLinearCoord('');
    setBody({});
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <ScrollText size={18} className="text-primary" />
          <CardTitle className="text-base">Simulador de Entrada</CardTitle>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Catálogo Vigente</Label>
          <Select value={catalogVersion} onValueChange={(v) => setCatalogVersion(v as CatalogVersion)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATALOG_VERSIONS.map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Zona 1 - Envelope */}
        <div className="space-y-3 border-l-2 border-primary/40 pl-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            Zona 1 — Envelope (imutável)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">ID do Evento</Label>
              <Input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="EVT-001" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Incidente</Label>
              <Select value={incidentType} onValueChange={v => setIncidentType(v as IncidentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Entidade Ref</Label>
            <Input
              value={entityRef}
              onChange={e => setEntityRef(e.target.value)}
              placeholder="PISTA-10R, TAXIWAY-B…"
              list="entity-suggestions"
              className="font-mono"
            />
            {entitySuggestions.length > 0 && (
              <datalist id="entity-suggestions">
                {entitySuggestions.map(s => <option key={s} value={s} />)}
              </datalist>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Coordenada Linear</Label>
            <Input value={linearCoord} onChange={e => setLinearCoord(e.target.value)} placeholder="ex: 1450m" className="font-mono" />
          </div>
        </div>

        {/* Zona 2 - Corpo dinâmico */}
        <div className="space-y-3 border-l-2 border-accent/40 pl-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            Zona 2 — Corpo ({catalogVersion} · {incidentType})
          </p>
          {fields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs">{f.label}</Label>
              {f.type === 'select' ? (
                <Select value={body[f.key] ?? ''} onValueChange={v => setBody(b => ({ ...b, [f.key]: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {f.options!.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={body[f.key] ?? ''}
                  onChange={e => setBody(b => ({ ...b, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} className="w-full">Gravar no Ledger</Button>
      </CardContent>
    </Card>
  );
}
