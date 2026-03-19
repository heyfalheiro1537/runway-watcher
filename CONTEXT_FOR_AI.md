# Contexto do projeto — consulta para assistentes de IA

> **Uso:** leia este arquivo no início de sessões de conversa/código neste repositório para alinhar contexto, convenções e próximos passos.

## O que é

- **Nome:** InfraSegura / **runway-watcher** (workspace local).
- **Objetivo:** app web (PWA-friendly) para **inspeção e gestão de segurança de infraestrutura aeroportuária**: mapa SVG do aeródromo, relatórios de inspeção, feed operacional (NOTAM/boletins mock), regulamentações (RBAC etc.).
- **Idioma da UI:** português (pt-BR).

## Stack

- **Vite** + **React** + **TypeScript**
- **React Router** — rotas em `src/App.tsx`
- **Tailwind CSS** + **shadcn/ui** (`src/components/ui/`)
- **Framer Motion** — animações
- **TanStack Query** — cliente de dados
- **date-fns** — datas

## Estrutura útil

| Caminho | Conteúdo |
|--------|----------|
| `src/pages/` | Telas: `AirportSelection`, `Dashboard`, `MapView`, `InspectionForm`, `Reports`, `NotFound` |
| `src/context/AppContext.tsx` | Aeroporto selecionado, relatórios, papel (inspector), coordenadas pendentes |
| `src/data/mockData.ts` | Aeroportos, elementos, relatórios mock |
| `src/data/newsFeed.ts` | Itens do feed “Relatório de Operações” |
| `src/lib/geoProjection.ts` | Projeção geo ↔ SVG |
| `src/components/RunwayDetailModal.tsx` | Modal “Área Protegida” (esquema RBAC 154) |
| `src/components/OperationsFeed.tsx` + `NewsFeed.tsx` | Feed de operações no painel |
| `public/aviao.png` | Logo / favicon — ver `CREDITS.md` (Flaticon / Good Ware) |
| `src/components/BrandLogo.tsx` | Componente do logotipo (usa `/aviao.png`) |

## Regras do Cursor

- `.cursor/rules/*.mdc` — regras do projeto para o agente (contexto InfraSegura, React/UI, mapa/geo, TypeScript em `lib`/`data`).

## Documentação adicional

- `AISWEB_INTEGRATION_PLAN.md` — plano de integração com AISWEB / NOTAMs reais.
- `CREDITS.md` — atribuições (ícones Flaticon, etc.).

## Convenções

- Componentes e textos de interface em **pt-BR**.
- Tema escuro / “instrument panel” é parte da identidade visual (`bezel`, `instrument-card`, etc.).
- Ao alterar mapa: `MapView.tsx` + `geoProjection` + dados em `mockData` / tipos em `src/types/index.ts`.

## Créditos de assets

Sempre que usar o favicon ou referenciar ícones de avião do Flaticon, manter atribuição em `CREDITS.md` e, se houver página pública de créditos, o snippet HTML documentado lá.

---

*Última atualização: referência para sessões futuras; atualize este arquivo quando o escopo ou a stack mudarem.*
