import { ElementType } from '@/types';

export interface Regulation {
  id: string;
  code: string;
  title: string;
  description: string;
  elementTypes: ElementType[];
  source: 'ICAO' | 'FAA' | 'EASA';
  category: 'surface' | 'marking' | 'lighting' | 'safety' | 'fod' | 'drainage';
}

export const regulations: Regulation[] = [
  {
    id: 'reg-001',
    code: 'ICAO Annex 14 §3.1',
    title: 'Runway Surface Conditions',
    description: 'Runway surfaces shall be maintained in a condition to prevent formation of harmful irregularities. Surface friction must meet minimum levels.',
    elementTypes: ['runway'],
    source: 'ICAO',
    category: 'surface',
  },
  {
    id: 'reg-002',
    code: 'ICAO Annex 14 §5.2',
    title: 'Runway Marking Standards',
    description: 'Runway markings shall be conspicuous and kept in good condition at all times. Threshold, touchdown zone, and centerline markings are mandatory.',
    elementTypes: ['runway'],
    source: 'ICAO',
    category: 'marking',
  },
  {
    id: 'reg-003',
    code: 'FAA AC 150/5320-12',
    title: 'Measurement of Pavement Friction',
    description: 'Procedures and guidance for measuring and reporting pavement friction characteristics on runways.',
    elementTypes: ['runway', 'taxiway'],
    source: 'FAA',
    category: 'surface',
  },
  {
    id: 'reg-004',
    code: 'ICAO Annex 14 §3.13',
    title: 'Taxiway Surface Requirements',
    description: 'Taxiway surfaces shall be free of irregularities that would cause damage to aircraft. Joints and edges shall be properly maintained.',
    elementTypes: ['taxiway'],
    source: 'ICAO',
    category: 'surface',
  },
  {
    id: 'reg-005',
    code: 'FAA AC 150/5210-24',
    title: 'FOD Detection & Management',
    description: 'Airport FOD management programs shall include regular inspections, reporting procedures, and removal protocols.',
    elementTypes: ['runway', 'taxiway', 'apron'],
    source: 'FAA',
    category: 'fod',
  },
  {
    id: 'reg-006',
    code: 'ICAO Annex 14 §5.3',
    title: 'Taxiway Marking & Signage',
    description: 'Taxiway centerline markings, holding position markings, and edge markings shall be maintained to standards.',
    elementTypes: ['taxiway'],
    source: 'ICAO',
    category: 'marking',
  },
  {
    id: 'reg-007',
    code: 'ICAO Annex 14 §3.15',
    title: 'Apron Standards',
    description: 'Apron surfaces shall provide adequate drainage, prevent fuel/oil contamination, and be maintained for safe aircraft movement.',
    elementTypes: ['apron'],
    source: 'ICAO',
    category: 'surface',
  },
  {
    id: 'reg-008',
    code: 'FAA AC 150/5300-13',
    title: 'Runway Safety Area Standards',
    description: 'RSA shall be graded, drained, and free of objects. Minimum dimensions based on airport reference code.',
    elementTypes: ['safety_strip'],
    source: 'FAA',
    category: 'safety',
  },
  {
    id: 'reg-009',
    code: 'ICAO Annex 14 §3.4',
    title: 'Runway Shoulder Maintenance',
    description: 'Shoulders shall be maintained to prevent erosion and ingestion of surface material by aircraft engines.',
    elementTypes: ['shoulder'],
    source: 'ICAO',
    category: 'surface',
  },
  {
    id: 'reg-010',
    code: 'EASA CS-ADR-DSN §D.040',
    title: 'Runway End Safety Area',
    description: 'RESA dimensions, grading, and object-free requirements for European airports.',
    elementTypes: ['safety_strip', 'runway'],
    source: 'EASA',
    category: 'safety',
  },
  {
    id: 'reg-011',
    code: 'FAA AC 150/5340-1',
    title: 'Airport Lighting Standards',
    description: 'Standards for runway edge, threshold, end, touchdown zone, and centerline lights. Maintenance and inspection requirements.',
    elementTypes: ['runway', 'taxiway'],
    source: 'FAA',
    category: 'lighting',
  },
  {
    id: 'reg-012',
    code: 'ICAO Annex 14 §5.4',
    title: 'Apron Marking & Safety Lines',
    description: 'Aircraft stand markings, lead-in/lead-out lines, and equipment restraint areas shall be clearly marked.',
    elementTypes: ['apron'],
    source: 'ICAO',
    category: 'marking',
  },
  {
    id: 'reg-013',
    code: 'FAA AC 150/5320-5',
    title: 'Airport Drainage Design',
    description: 'Drainage systems for all pavement areas including runways, taxiways, and aprons. Inspection and maintenance of drainage infrastructure.',
    elementTypes: ['runway', 'taxiway', 'apron', 'safety_strip'],
    source: 'FAA',
    category: 'drainage',
  },
];

export const regulationCategories = [
  { value: 'surface', label: 'Surface' },
  { value: 'marking', label: 'Marking' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'safety', label: 'Safety' },
  { value: 'fod', label: 'FOD' },
  { value: 'drainage', label: 'Drainage' },
] as const;
