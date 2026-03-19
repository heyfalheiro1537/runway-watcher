export type FeedItemType = 'safety_bulletin' | 'notam' | 'activity' | 'alert';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string;
  source: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'critical';
  airportId?: string;
}

export const mockFeedItems: FeedItem[] = [
  {
    id: 'feed-001',
    type: 'alert',
    title: 'Incidente FOD — RWY 28L Fechada',
    description: 'Detritos metálicos detectados na cabeceira. Pista fechada para varredura e inspeção. Previsão: 45min.',
    source: 'InfraSegura',
    timestamp: '2026-03-15T03:30:00Z',
    severity: 'critical',
    airportId: 'sfo',
  },
  {
    id: 'feed-002',
    type: 'activity',
    title: 'Inspeção Enviada — TWY B',
    description: 'Inspetor A. Chen enviou relatório para TWY B com 1 achado de severidade média.',
    source: 'InfraSegura',
    timestamp: '2026-03-14T22:15:00Z',
    airportId: 'sfo',
  },
  {
    id: 'feed-003',
    type: 'safety_bulletin',
    title: 'Alerta ICAO: Acúmulo de Borracha',
    description: 'Orientação atualizada sobre intervalos de remoção de borracha em pistas. Aeroportos com >50k movimentos anuais devem aumentar a frequência.',
    source: 'ICAO',
    timestamp: '2026-03-14T18:00:00Z',
    severity: 'warning',
  },
  {
    id: 'feed-004',
    type: 'notam',
    title: 'NOTAM A0234/26 — RWY 01L/19R',
    description: 'Comprimento de pista reduzido por deslocamento de cabeceira. TORA 3200m vigente até 20 MAR.',
    source: 'ANAC',
    timestamp: '2026-03-14T12:00:00Z',
    severity: 'warning',
    airportId: 'sfo',
  },
  {
    id: 'feed-005',
    type: 'activity',
    title: 'Alteração de Status — PÁTIO T1',
    description: 'Status do elemento atualizado para "Requer Atenção" após relato de vazamento de óleo.',
    source: 'InfraSegura',
    timestamp: '2026-03-13T09:35:00Z',
    airportId: 'sfo',
  },
  {
    id: 'feed-006',
    type: 'safety_bulletin',
    title: 'Aviso ANAC: Verificação de Pavimento no Inverno',
    description: 'Lembrete para aumentar inspeções da superfície de pavimento durante ciclos de congelamento-degelo. Ref: RBAC 154.',
    source: 'ANAC',
    timestamp: '2026-03-13T08:00:00Z',
    severity: 'info',
  },
  {
    id: 'feed-007',
    type: 'activity',
    title: 'Inspeção Rotineira — RWY 28R/10L',
    description: 'Inspetor A. Chen concluiu inspeção rotineira. Nenhum defeito encontrado.',
    source: 'InfraSegura',
    timestamp: '2026-03-13T06:05:00Z',
    airportId: 'sfo',
  },
  {
    id: 'feed-008',
    type: 'notam',
    title: 'NOTAM A0230/26 — TWY A',
    description: 'Luzes de posição de espera da TWY A interseção TWY A/C inoperantes. Manutenção programada.',
    source: 'ANAC',
    timestamp: '2026-03-12T20:00:00Z',
    severity: 'info',
    airportId: 'sfo',
  },
];
