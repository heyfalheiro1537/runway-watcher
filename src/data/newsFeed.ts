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
    title: 'FOD Incident — RWY 28L Closed',
    description: 'Metal debris detected at threshold. Runway closed for sweep and inspection. ETA 45min.',
    source: 'RunwayNotes',
    timestamp: '2026-03-15T03:30:00Z',
    severity: 'critical',
    airportId: 'sfo',
  },
  {
    id: 'feed-002',
    type: 'activity',
    title: 'Inspection Submitted — TWY B',
    description: 'Inspector A. Chen submitted a report for TWY B with 1 medium-severity finding.',
    source: 'RunwayNotes',
    timestamp: '2026-03-14T22:15:00Z',
    airportId: 'sfo',
  },
  {
    id: 'feed-003',
    type: 'safety_bulletin',
    title: 'ICAO Safety Alert: Rubber Buildup',
    description: 'Updated guidance on runway rubber removal intervals. Airports with >50k annual movements should increase frequency.',
    source: 'ICAO',
    timestamp: '2026-03-14T18:00:00Z',
    severity: 'warning',
  },
  {
    id: 'feed-004',
    type: 'notam',
    title: 'NOTAM A0234/26 — RWY 01L/19R',
    description: 'Reduced runway length due to threshold displacement. TORA 3200m effective until 20 MAR.',
    source: 'FAA',
    timestamp: '2026-03-14T12:00:00Z',
    severity: 'warning',
    airportId: 'sfo',
  },
  {
    id: 'feed-005',
    type: 'activity',
    title: 'Status Change — APRON T1',
    description: 'Element status updated to "Requires Attention" following oil spill report.',
    source: 'RunwayNotes',
    timestamp: '2026-03-13T09:35:00Z',
    airportId: 'sfo',
  },
  {
    id: 'feed-006',
    type: 'safety_bulletin',
    title: 'FAA Advisory: Winter Pavement Checks',
    description: 'Reminder to increase pavement surface inspections during freeze-thaw cycles. Ref: AC 150/5380-6.',
    source: 'FAA',
    timestamp: '2026-03-13T08:00:00Z',
    severity: 'info',
  },
  {
    id: 'feed-007',
    type: 'activity',
    title: 'Routine Inspection — RWY 28R/10L',
    description: 'Inspector A. Chen completed routine inspection. No defects found.',
    source: 'RunwayNotes',
    timestamp: '2026-03-13T06:05:00Z',
    airportId: 'sfo',
  },
  {
    id: 'feed-008',
    type: 'notam',
    title: 'NOTAM A0230/26 — TWY A',
    description: 'Taxiway A intersection hold lights u/s at junction TWY A/C. Maintenance scheduled.',
    source: 'FAA',
    timestamp: '2026-03-12T20:00:00Z',
    severity: 'info',
    airportId: 'sfo',
  },
];
