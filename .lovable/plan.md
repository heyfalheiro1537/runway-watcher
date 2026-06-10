## Objetivo

Adicionar uma página `/ledger` ao InfraSegura que demonstre o Framework de Event Sourcing (Catálogo + Ledger append-only + Projeção), reaproveitando entidades do aeroporto selecionado.

## Arquitetura

### Estado global (AppContext)
Adicionar ao `AppContext.tsx`:
- `catalogVersion: 'v2026.1' | 'v2028.1'` + setter
- `ledger: LedgerEntry[]` + `addLedgerEntry(entry)` (append-only, sem update/delete)

### Tipos novos (`src/types/index.ts`)
```ts
type CatalogVersion = 'v2026.1' | 'v2028.1';
type IncidentType = 'WILD' | 'FOD';

interface LedgerEntry {
  id: string;                 // ID do Evento (user-input)
  entityRef: string;          // ex: PISTA-10R
  linearCoord: string;
  incidentType: IncidentType;
  catalogVersion: CatalogVersion;
  body: Record<string, string>;  // campos dinâmicos
  recordedAt: string;         // ISO, gerado automaticamente
}
```

### Catálogo (`src/data/catalog.ts` — novo)
```ts
export const CATALOG = {
  'v2026.1': {
    WILD: [{key:'especie',label:'Espécie'},{key:'estado',label:'Estado'}],
    FOD:  [{key:'material',label:'Material'},{key:'tamanho',label:'Tamanho'}],
  },
  'v2028.1': {
    WILD: [...v2026 + {key:'envergadura',label:'Envergadura (cm)'}],
    FOD:  [...v2026 + {key:'risco_pneu',label:'Risco Pneu',options:['baixo','médio','alto']}],
  },
};
```

## Layout da página (`src/pages/Ledger.tsx`)

Header padrão InfraSegura (BrandLogo + título "Ledger de Incidentes"), depois grid 3 colunas (`lg:grid-cols-3`, empilha em mobile):

```text
┌─────────────────┬─────────────────┬─────────────────┐
│ P1: Simulador   │ P2: Projeção    │ P3: Grafo       │
│ de Entrada      │ (Filtros)       │ Materializado   │
│                 │                 │                 │
│ Catálogo ▾      │ Entidade [____] │ [card log]      │
│ ─ Zona Envelope │ Camada     ▾    │ [card log]      │
│   ID, Entidade, │ [Gerar Projeção]│ [card log]      │
│   Coord, Tipo   │                 │                 │
│ ─ Zona Corpo    │ Stats:          │                 │
│   (dinâmico)    │  N eventos      │                 │
│ [Gravar Ledger] │                 │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

### Painel 1 — Simulador
- `Select` Catálogo Vigente no header do Card
- Zona Envelope: `Input` ID, `Input/Select` Entidade Ref (pré-populado com `selectedAirport.elements.map(e => e.identifier)` quando houver, além de free-text), `Input` Coordenada Linear, `Select` Tipo (WILD/FOD)
- Zona Corpo: renderiza `CATALOG[version][type].fields` dinamicamente — re-monta ao trocar versão/tipo (estado `body` é resetado)
- Botão "Gravar no Ledger" → `addLedgerEntry({...form, recordedAt: new Date().toISOString()})`, `toast.success`, limpa form
- Validação simples: todos os campos obrigatórios

### Painel 2 — Motor de Projeção
- `Input` filtro Entidade (substring, case-insensitive)
- `Select` Camada Semântica: Física / Operacional / Utilidades (visual apenas; sem efeito no filtro)
- Botão "Gerar Projeção" aplica filtro a um state local `appliedFilter` (até clicar, P3 mostra tudo)
- Contador "N eventos projetados / total"

### Painel 3 — Grafo Materializado
- Lista de cards (sem botões editar/excluir, reforçando imutabilidade)
- Cada card:
  - Header: `Badge` Tipo (WILD/FOD com cor distinta), `Badge` outline catalogVersion, timestamp formatado com `date-fns`
  - Linha: ID do Evento (mono), Entidade Ref, Coordenada
  - Corpo: bloco `<pre>` com JSON do `body` em fonte mono, fundo `bg-muted`
- Empty state quando ledger vazio: ícone Lucide `Database` + "Nenhum evento registrado"

## Integrações

- **Rota**: adicionar `<Route path="/ledger" element={<Ledger />} />` em `src/App.tsx`
- **BottomNav** (`src/components/BottomNav.tsx`): adicionar item "Ledger" com ícone `ScrollText` ou `Database`
- **Toast**: usar sonner (já no projeto)
- **Estilo**: tokens existentes (`bg-card`, `border-border`, `text-muted-foreground`, classes `instrument-card`/`bezel` se aplicáveis) — sem cores hardcoded

## Regras de imutabilidade
- `addLedgerEntry` apenas faz `setLedger(prev => [entry, ...prev])`
- Nenhum botão de editar/deletar em P3
- IDs duplicados: bloquear com toast de erro

## Arquivos

**Criar:**
- `src/pages/Ledger.tsx`
- `src/data/catalog.ts`
- `src/components/ledger/EntryForm.tsx` (Painel 1)
- `src/components/ledger/ProjectionPanel.tsx` (Painel 2)
- `src/components/ledger/LedgerCard.tsx` (item de P3)

**Editar:**
- `src/types/index.ts` — tipos novos
- `src/context/AppContext.tsx` — slice ledger + catalogVersion
- `src/App.tsx` — rota
- `src/components/BottomNav.tsx` — item de navegação

## Fora de escopo
- Persistência (mantém em memória, alinhado com a arquitetura atual)
- Filtro real por Camada Semântica (só visual conforme spec)
- Edição/Exclusão (proibido pelo conceito append-only)
