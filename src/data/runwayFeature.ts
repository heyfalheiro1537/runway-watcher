import type { RunwayFeature, LedgerEntry } from '@/types';

export const RUNWAY_FEATURE: RunwayFeature = {
  id: 'PISTA-10R',
  comprimento_metros: 3000,
  largura_metros: 45,
  faixa_metros: 150,
};

export const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: 'EVT-001',
    entityRef: 'PISTA-10R',
    estaca: 500,
    afastamento: 0,
    incidentType: 'WILD',
    catalogVersion: 'v2026.1',
    body: { especie: 'quero-quero', estado: 'vivo' },
    recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'EVT-002',
    entityRef: 'PISTA-10R',
    estaca: 1200,
    afastamento: -15,
    incidentType: 'FOD',
    catalogVersion: 'v2026.1',
    body: { material: 'borracha', tamanho: 'médio' },
    recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'EVT-003',
    entityRef: 'PISTA-10R',
    estaca: 2800,
    afastamento: 25,
    incidentType: 'WILD',
    catalogVersion: 'v2028.1',
    body: { especie: 'urubu', estado: 'vivo', envergadura: '160' },
    recordedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];
