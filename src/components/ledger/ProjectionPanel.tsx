import { Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  entityFilter: string;
  setEntityFilter: (v: string) => void;
  layer: string;
  setLayer: (v: string) => void;
  appliedFilter: string;
  onApply: () => void;
  onClear: () => void;
  totalCount: number;
  projectedCount: number;
}

export default function ProjectionPanel({
  entityFilter, setEntityFilter, layer, setLayer,
  appliedFilter, onApply, onClear, totalCount, projectedCount,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-primary" />
          <CardTitle className="text-base">Motor de Projeção</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Lente que consulta o Ledger imutável e materializa uma projeção do espaço de interesse.
        </p>

        <div className="space-y-1.5">
          <Label className="text-xs">Entidade (substring)</Label>
          <Input
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            placeholder="ex: PISTA-10R"
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Camada Semântica</Label>
          <Select value={layer} onValueChange={setLayer}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fisica">Física</SelectItem>
              <SelectItem value="operacional">Operacional</SelectItem>
              <SelectItem value="utilidades">Utilidades</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={onApply} className="flex-1">Gerar Projeção</Button>
          <Button onClick={onClear} variant="outline">Limpar</Button>
        </div>

        <div className="rounded-md border border-border bg-muted/40 p-3 font-mono text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total no Ledger</span>
            <span>{totalCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Projetados</span>
            <span className="text-primary">{projectedCount}</span>
          </div>
          {appliedFilter && (
            <div className="flex justify-between pt-1 border-t border-border">
              <span className="text-muted-foreground">Filtro ativo</span>
              <span className="text-accent">"{appliedFilter}"</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
