import { Airport, AirportElement, InspectionReport, type InspectionStatus } from '@/types';

export const mockAirports: Airport[] = [
  {
    id: 'sfo',
    iataCode: 'SFO',
    name: 'San Francisco International',
    city: 'San Francisco, CA',
    runways: 4,
    elevation: 13,
    magneticVariation: '13.1°E',
    elements: [],
  },
  {
    id: 'lax',
    iataCode: 'LAX',
    name: 'Los Angeles International',
    city: 'Los Angeles, CA',
    runways: 4,
    elevation: 128,
    magneticVariation: '12.3°E',
    elements: [],
  },
  {
    id: 'jfk',
    iataCode: 'JFK',
    name: 'John F. Kennedy International',
    city: 'New York, NY',
    runways: 4,
    elevation: 13,
    magneticVariation: '13.0°W',
    elements: [],
  },
];

export const mockElements: AirportElement[] = [
  {
    id: 'rwy-28l',
    airportId: 'sfo',
    type: 'runway',
    identifier: 'RWY 28L/10R',
    label: '28L/10R',
    status: 'requires_intervention',
    pathData: 'M 120 180 L 680 180 L 680 210 L 120 210 Z',
    center: { lat: 37.6188, lng: -122.375 },
  },
  {
    id: 'rwy-28r',
    airportId: 'sfo',
    type: 'runway',
    identifier: 'RWY 28R/10L',
    label: '28R/10L',
    status: 'regular',
    pathData: 'M 100 280 L 700 280 L 700 310 L 100 310 Z',
    center: { lat: 37.6138, lng: -122.375 },
  },
  {
    id: 'rwy-01l',
    airportId: 'sfo',
    type: 'runway',
    identifier: 'RWY 01L/19R',
    label: '01L/19R',
    status: 'requires_attention',
    pathData: 'M 360 80 L 390 80 L 390 380 L 360 380 Z',
    center: { lat: 37.6160, lng: -122.380 },
  },
  {
    id: 'rwy-01r',
    airportId: 'sfo',
    type: 'runway',
    identifier: 'RWY 01R/19L',
    label: '01R/19L',
    status: 'regular',
    pathData: 'M 440 90 L 470 90 L 470 370 L 440 370 Z',
    center: { lat: 37.6160, lng: -122.370 },
  },
  {
    id: 'twy-a',
    airportId: 'sfo',
    type: 'taxiway',
    identifier: 'TWY A',
    label: 'A',
    status: 'regular',
    pathData: 'M 110 230 L 710 230 L 710 255 L 110 255 Z',
    center: { lat: 37.6165, lng: -122.375 },
  },
  {
    id: 'twy-b',
    airportId: 'sfo',
    type: 'taxiway',
    identifier: 'TWY B',
    label: 'B',
    status: 'requires_attention',
    pathData: 'M 130 140 L 660 140 L 660 165 L 130 165 Z',
    center: { lat: 37.6200, lng: -122.375 },
  },
  {
    id: 'apron-1',
    airportId: 'sfo',
    type: 'apron',
    identifier: 'APRON T1',
    label: 'T1',
    status: 'regular',
    pathData: 'M 200 320 L 350 320 L 350 400 L 200 400 Z',
    center: { lat: 37.6120, lng: -122.382 },
  },
  {
    id: 'apron-2',
    airportId: 'sfo',
    type: 'apron',
    identifier: 'APRON T2',
    label: 'T2',
    status: 'regular',
    pathData: 'M 480 320 L 650 320 L 650 400 L 480 400 Z',
    center: { lat: 37.6120, lng: -122.368 },
  },
  {
    id: 'shoulder-28l',
    airportId: 'sfo',
    type: 'shoulder',
    identifier: 'SHD 28L-N',
    label: '28L-N',
    status: 'regular',
    pathData: 'M 120 165 L 680 165 L 680 178 L 120 178 Z',
    center: { lat: 37.6192, lng: -122.375 },
  },
  {
    id: 'safety-01l',
    airportId: 'sfo',
    type: 'safety_strip',
    identifier: 'RESA 01L',
    label: 'RESA 01L',
    status: 'regular',
    pathData: 'M 340 380 L 410 380 L 410 410 L 340 410 Z',
    center: { lat: 37.6130, lng: -122.380 },
  },
];

// Assign elements to SFO
mockAirports[0].elements = mockElements.filter(e => e.airportId === 'sfo');

export const mockReports: InspectionReport[] = [
  {
    id: 'rpt-001',
    airportId: 'sfo',
    date: '2026-03-15',
    inspectorName: 'J. Martinez',
    elementType: 'runway',
    elementId: 'rwy-28l',
    elementIdentifier: 'RWY 28L/10R',
    observations: [
      {
        id: 'obs-001',
        description: 'FOD detected at threshold. 40m from centerline. Metal debris approximately 15cm.',
        severity: 'critical',
        geoCoord: { lat: 37.6188, lng: -122.393 },
        createdAt: '2026-03-15T03:22:00Z',
      },
      {
        id: 'obs-002',
        description: 'Surface cracking observed at 1200m mark, longitudinal, 3m length.',
        severity: 'high',
        geoCoord: { lat: 37.6188, lng: -122.382 },
        createdAt: '2026-03-15T03:28:00Z',
      },
    ],
    status: 'requires_intervention',
    createdAt: '2026-03-15T03:20:00Z',
  },
  {
    id: 'rpt-002',
    airportId: 'sfo',
    date: '2026-03-14',
    inspectorName: 'A. Chen',
    elementType: 'taxiway',
    elementId: 'twy-b',
    elementIdentifier: 'TWY B',
    observations: [
      {
        id: 'obs-003',
        description: 'Edge light fixture #B-14 damaged. Non-functional.',
        severity: 'medium',
        geoCoord: { lat: 37.6200, lng: -122.378 },
        createdAt: '2026-03-14T22:15:00Z',
      },
    ],
    status: 'requires_attention',
    createdAt: '2026-03-14T22:10:00Z',
  },
  {
    id: 'rpt-003',
    airportId: 'sfo',
    date: '2026-03-14',
    inspectorName: 'J. Martinez',
    elementType: 'runway',
    elementId: 'rwy-01l',
    elementIdentifier: 'RWY 01L/19R',
    observations: [
      {
        id: 'obs-004',
        description: 'Runway marking faded at touchdown zone. Requires repaint.',
        severity: 'medium',
        geoCoord: { lat: 37.6145, lng: -122.380 },
        createdAt: '2026-03-14T14:45:00Z',
      },
      {
        id: 'obs-005',
        description: 'Minor rubber buildup at threshold area.',
        severity: 'low',
        geoCoord: { lat: 37.6175, lng: -122.380 },
        createdAt: '2026-03-14T14:50:00Z',
      },
    ],
    status: 'requires_attention',
    createdAt: '2026-03-14T14:40:00Z',
  },
  {
    id: 'rpt-004',
    airportId: 'sfo',
    date: '2026-03-13',
    inspectorName: 'S. Patel',
    elementType: 'apron',
    elementId: 'apron-1',
    elementIdentifier: 'APRON T1',
    observations: [
      {
        id: 'obs-006',
        description: 'Oil spill on stand 14. Approximately 2m diameter. Containment required.',
        severity: 'high',
        geoCoord: { lat: 37.6125, lng: -122.384 },
        createdAt: '2026-03-13T09:30:00Z',
      },
    ],
    status: 'requires_attention',
    createdAt: '2026-03-13T09:25:00Z',
  },
  {
    id: 'rpt-005',
    airportId: 'sfo',
    date: '2026-03-13',
    inspectorName: 'A. Chen',
    elementType: 'runway',
    elementId: 'rwy-28r',
    elementIdentifier: 'RWY 28R/10L',
    observations: [
      {
        id: 'obs-007',
        description: 'Routine inspection. No defects observed. Surface condition good.',
        severity: 'low',
        geoCoord: { lat: 37.6138, lng: -122.375 },
        createdAt: '2026-03-13T06:00:00Z',
      },
    ],
    status: 'regular',
    createdAt: '2026-03-13T05:55:00Z',
  },
  {
    id: 'rpt-006',
    airportId: 'sfo',
    date: '2026-03-12',
    inspectorName: 'J. Martinez',
    elementType: 'safety_strip',
    elementId: 'safety-01l',
    elementIdentifier: 'RESA 01L',
    observations: [
      {
        id: 'obs-008',
        description: 'Grass height within limits. Drainage functioning normally.',
        severity: 'low',
        geoCoord: { lat: 37.6130, lng: -122.380 },
        createdAt: '2026-03-12T16:00:00Z',
      },
    ],
    status: 'regular',
    createdAt: '2026-03-12T15:55:00Z',
  },
];

export const inspectorNames = ['J. Martinez', 'A. Chen', 'S. Patel', 'R. Kim'];

export function getStatusColor(status: InspectionStatus): string {
  switch (status) {
    case 'regular': return 'hsl(142, 70%, 45%)';
    case 'requires_attention': return 'hsl(38, 92%, 50%)';
    case 'requires_intervention': return 'hsl(0, 84%, 60%)';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low': return 'hsl(142, 70%, 45%)';
    case 'medium': return 'hsl(38, 92%, 50%)';
    case 'high': return 'hsl(25, 95%, 53%)';
    case 'critical': return 'hsl(0, 84%, 60%)';
    default: return 'hsl(215, 20%, 55%)';
  }
}
