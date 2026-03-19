# Plano de Integração — API AISWEB / DECEA · RunwayNotes

> Versão: 1.0 · Data: 2026-03-19  
> Escopo: feed de NOTAMs, dados de pista (ROTAER) e meteorologia (METAR/TAF)  
> Referência oficial: https://aisweb.decea.mil.br/?i=publicacoes&p=api

---

## 1. Contexto da API

A **API-AISWEB** é a interface oficial do DECEA para acesso programático às informações aeronáuticas brasileiras. Cobre:

| Recurso | Relevância para RunwayNotes |
|---|---|
| **NOTAM** | Alimentar o `NewsFeed` / `OperationsFeed` com avisos reais |
| **ROTAER** | Enriquecer `AirportElement` com comprimento, largura, superfície de pista |
| **METAR / TAF** | Widget meteorológico no Dashboard e MapView |
| **AIP** | Consultas pontuais a dados publicados (suplementos, cartas) |

**Autenticação:** chave `apiKey` + `apiPass` obtidas via cadastro em  
`https://aisweb.decea.mil.br/?i=publicacoes&p=api`  
Ambas são enviadas como query params em toda requisição GET.

**Base URL:** `https://api.decea.mil.br/aisweb/` (HTTP, sem SSL nativo — usar proxy ou variável de ambiente para não expor chaves no bundle)

---

## 2. Endpoints mapeados

### 2.1 NOTAMs
```
GET https://api.decea.mil.br/aisweb/?
  apiKey=<KEY>
  &apiPass=<PASS>
  &area=notam
  &IcaoCode=SBSJ          ← indicador ICAO do aeródromo
  &format=json            ← resposta em JSON (default XML)
```

**Campos úteis na resposta:**

| Campo | Descrição |
|---|---|
| `id` | ID único do NOTAM |
| `numero` | Número serial (ex: `E0530/26`) |
| `inicio` | Data/hora início UTC (`YYYYMMDDHHNN`) |
| `fim` | Data/hora fim UTC |
| `texto` | Corpo completo do NOTAM em formato ICAO |
| `q_code` | Q-code (ex: `QMRLC` = pista fechada) |
| `serie` | Série (E, J, K, N, O, Z) |
| `traducao` | Texto em português, quando disponível |

**Q-codes relevantes para inspeção de pista:**

| Q-code | Significado |
|---|---|
| `QMRLC` | Runway closed |
| `QMRLT` | Runway tora reduced |
| `QMRXX` | Runway unserviceable |
| `QMKLT` | Taxiway closed |
| `QFAAH` | Apron closed |
| `QLCAS` | Approach lighting unserviceable |
| `QNVAS` | PAPI/VASIS unserviceable |

---

### 2.2 ROTAER (dados do aeródromo e pistas)
```
GET https://api.decea.mil.br/aisweb/?
  apiKey=<KEY>
  &apiPass=<PASS>
  &area=rotaer
  &IcaoCode=SBSJ
  &format=json
```

**Campos relevantes para `AirportElement`:**

| Campo ROTAER | Mapeamento no app |
|---|---|
| `pistas[].designacao` | `AirportElement.label` (ex: `09/27`) |
| `pistas[].comprimento` | metadata comprimento em metros |
| `pistas[].largura` | metadata largura em metros |
| `pistas[].revestimento` | surface type (ASFALTO, CONCRETO, GRAMA…) |
| `pistas[].rumo_mag` | heading magnético (para desenho SVG) |
| `pistas[].tora` | TORA declarada |
| `pistas[].lda` | LDA declarada |
| `elevacao` | `Airport.elevation` |
| `var_mag` | `Airport.magneticVariation` |
| `nome` | `Airport.name` |

---

### 2.3 METAR / TAF
```
GET https://api.decea.mil.br/aisweb/?
  apiKey=<KEY>
  &apiPass=<PASS>
  &area=metar        ← ou "taf"
  &IcaoCode=SBSJ
  &format=json
```

**Resposta:**
```json
{
  "metar": {
    "mens": "METAR SBSJ 190000Z 18005KT 9999 FEW025 27/18 Q1018=",
    "dt_mens": "2026-03-19T00:00:00Z"
  }
}
```
O campo `mens` contém o METAR raw — parsear localmente com regex conforme ICA 105-1.

---

## 3. Arquitetura da integração

```
RunwayNotes
│
├── src/lib/
│   └── aisweb.ts              ← cliente HTTP + parseadores
│
├── src/hooks/
│   └── useAirportData.ts      ← orquestra as 3 fontes, cache, refresh
│
├── src/components/
│   ├── MetarWidget.tsx         ← exibe METAR decodificado
│   └── RotaerRunwayPanel.tsx   ← painel de dados de pista reais
│
├── src/context/
│   └── AppContext.tsx          ← expõe `icaoCode` a partir de Airport selecionado
│
└── src/pages/
    ├── Dashboard.tsx           ← consome MetarWidget + enriquecimento de Airport
    ├── MapView.tsx             ← RunwayElement enriquecido com dados ROTAER
    └── OperationsFeed.tsx      ← merge de mockFeedItems + notamsToFeedItems()
```

---

## 4. Variáveis de ambiente necessárias

Criar `.env.local` na raiz do projeto (não versionar):

```env
VITE_AISWEB_API_KEY=sua_chave_aqui
VITE_AISWEB_API_PASS=sua_senha_aqui
```

Consumir em `aisweb.ts`:
```ts
const API_KEY  = import.meta.env.VITE_AISWEB_API_KEY;
const API_PASS = import.meta.env.VITE_AISWEB_API_PASS;
```

> **Atenção CORS:** A API AISWEB não garante cabeçalho CORS para browsers. Em produção, criar um proxy serverless simples (Cloudflare Worker, Vercel Edge Function ou Netlify Function) que repassa as chamadas com as chaves no servidor.

---

## 5. Mapeamento de dados para o app

### 5.1 NOTAM → `FeedItem`

```ts
// src/lib/aisweb.ts
function notamToFeedItem(notam: AiswWebNotam, airportId: string): FeedItem {
  return {
    id:          `notam-${notam.id}`,
    type:        'notam',
    title:       `NOTAM ${notam.numero} — ${notam.icao}`,
    description: notam.traducao ?? formatNotamE(notam.texto),
    source:      'AISWEB / DECEA',
    timestamp:   parseAiswDate(notam.inicio),   // "202603190000" → ISO
    severity:    qCodeToSeverity(notam.q_code), // ver tabela §2.1
    airportId,
  };
}
```

### 5.2 ROTAER → `AirportElement`

```ts
function enrichElementWithRotaer(
  el: AirportElement,
  pistas: RotaerPista[]
): AirportElement {
  const match = pistas.find(p =>
    normalizeDesignator(p.designacao) === normalizeDesignator(el.label)
  );
  if (!match) return el;
  return {
    ...el,
    identifier: buildIdentifier(match), // "RWY 09/27 · 1800m · ASFALTO"
    // Campos extras para RunwayDetailModal:
    _rotaer: {
      comprimento: match.comprimento,
      largura:     match.largura,
      revestimento: match.revestimento,
      tora:        match.tora,
      lda:         match.lda,
      rumoMag:     match.rumo_mag,
    },
  };
}
```

### 5.3 METAR → severidade no feed

| Flight Category | `FeedItem.severity` | Condição |
|---|---|---|
| CAVOK / VFR | `info` | vis ≥ 9999m, sem CB |
| MVFR | `info` | vis 5000–8000m ou teto 1000–3000ft |
| IFR | `warning` | vis < 5000m ou teto < 1000ft |
| LIFR | `critical` | vis < 1500m ou teto < 500ft |

---

## 6. Cache e refresh

| Recurso | TTL sugerido | Gatilho de refresh |
|---|---|---|
| NOTAM | 5 min | entrada no airport + timer |
| METAR | 30 min | entrada no airport + timer |
| ROTAER | 24 h (ou AIRAC cycle) | só na primeira carga do airport |

Usar `Map<icaoCode, { data, fetchedAt }>` em memória (suficiente para PWA session).  
Para persistência cross-session: `localStorage` com key `rn_cache_<icao>`.

---

## 7. Tratamento de erros e fallback

| Cenário | Comportamento |
|---|---|
| Sem chave configurada | Mostra apenas mock data local, sem indicador de erro |
| CORS bloqueado | Log de aviso + fallback para mock |
| NOTAM vazio (aeródromo pequeno) | Feed exibe apenas atividades locais |
| ROTAER sem pistas correspondentes | `AirportElement` inalterado |
| METAR indisponível | Widget meteorológico oculto |

---

## 8. Tarefas de implementação

- [ ] **T1** — Solicitar chave AISWEB em `aisweb.decea.mil.br/?i=publicacoes&p=api`
- [ ] **T2** — Criar `src/lib/aisweb.ts` com funções `fetchNotams`, `fetchRotaer`, `fetchMetar`
- [ ] **T3** — Adicionar parser do Q-code e mapeamento para `FeedItem.severity`
- [ ] **T4** — Criar `src/hooks/useAirportData.ts` com cache e auto-refresh
- [ ] **T5** — Integrar NOTAMs em `OperationsFeed` (merge com mock existente)
- [ ] **T6** — Enriquecer `AirportElement` com dados ROTAER (comprimento, superfície)
- [ ] **T7** — Exibir dados ROTAER no `RunwayDetailModal` (seção "Dados Oficiais")
- [ ] **T8** — Criar `MetarWidget` e inserir no `Dashboard` e painel lateral do `MapView`
- [ ] **T9** — Configurar proxy serverless para produção (evitar exposição de chaves)
- [ ] **T10** — Adicionar `.env.example` ao repositório com as variáveis necessárias

---

## 9. Perguntas em aberto

1. O SBSJ (São José dos Campos) está na AISWEB com cobertura completa de ROTAER? → verificar manualmente em `aisweb.decea.mil.br/?i=aerodromos&codigo=SBSJ`
2. A API retorna `format=json` nativamente ou precisa parse de XML? → confirmar com a documentação Postman (a coleção pública `SzKQyg3H` é a referência)
3. O proxy serverless será na Vercel (dado que o projeto usa Vite/Lovable) ou direto no backend da pesquisa ITA?
4. Os dados de pista do ROTAER incluem coordenadas de cabeceira? Se sim, usar para alinhar a projeção SVG em `geoProjection.ts`

---

*Próximo passo sugerido: concluir T1 (chave) e T2 (cliente HTTP básico) antes de avançar para integração de UI.*
