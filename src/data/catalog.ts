import type { CatalogVersion, IncidentType } from '@/types';

export interface CatalogField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  placeholder?: string;
}

export type CatalogShape = Record<CatalogVersion, Record<IncidentType, CatalogField[]>>;

export const CATALOG: CatalogShape = {
  'v2026.1': {
    WILD: [
      { key: 'especie', label: 'Espécie', type: 'text', placeholder: 'ex: urubu, capivara' },
      { key: 'estado', label: 'Estado', type: 'select', options: ['vivo', 'morto', 'ferido'] },
    ],
    FOD: [
      { key: 'material', label: 'Material', type: 'select', options: ['metal', 'plástico', 'borracha', 'concreto'] },
      { key: 'tamanho', label: 'Tamanho', type: 'select', options: ['pequeno', 'médio', 'grande'] },
    ],
  },
  'v2028.1': {
    WILD: [
      { key: 'especie', label: 'Espécie', type: 'text', placeholder: 'ex: urubu, capivara' },
      { key: 'estado', label: 'Estado', type: 'select', options: ['vivo', 'morto', 'ferido'] },
      { key: 'envergadura', label: 'Envergadura (cm)', type: 'number', placeholder: 'ex: 120' },
    ],
    FOD: [
      { key: 'material', label: 'Material', type: 'select', options: ['metal', 'plástico', 'borracha', 'concreto'] },
      { key: 'tamanho', label: 'Tamanho', type: 'select', options: ['pequeno', 'médio', 'grande'] },
      { key: 'risco_pneu', label: 'Risco Pneu', type: 'select', options: ['baixo', 'médio', 'alto'] },
    ],
  },
};

export const CATALOG_VERSIONS: CatalogVersion[] = ['v2026.1', 'v2028.1'];
export const INCIDENT_TYPES: IncidentType[] = ['WILD', 'FOD'];
