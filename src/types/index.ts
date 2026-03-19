export type UserRole = 'inspector' | 'supervisor';

export type ElementType =
  | 'runway'
  | 'taxiway'
  | 'apron'
  | 'safety_strip'
  | 'shoulder'
  | 'terminal'
  | 'hangar'
  | 'holding_position'
  | 'other';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type InspectionStatus = 'regular' | 'requires_attention' | 'requires_intervention';

export interface GeoCoord {
  lat: number;
  lng: number;
}

export interface Airport {
  id: string;
  iataCode: string;
  name: string;
  city: string;
  runways: number;
  elevation: number;
  magneticVariation: string;
  elements: AirportElement[];
}

export interface AirportElement {
  id: string;
  airportId: string;
  type: ElementType;
  identifier: string;
  label: string;
  status: InspectionStatus;
  pathData: string; // SVG path
  center: GeoCoord;
}

export interface Observation {
  id: string;
  description: string;
  severity: SeverityLevel;
  photoUrl?: string;
  geoCoord: GeoCoord;
  createdAt: string;
}

export type RunwayZoneId = 'runway' | 'swy' | 'resa' | 'cwy' | 'strip' | 'protected';

export interface InspectionReport {
  id: string;
  airportId: string;
  date: string;
  inspectorName: string;
  elementType: ElementType;
  elementId: string;
  elementIdentifier: string;
  /** Zone within the área protegida that the report targets (runway elements only) */
  runwayZone?: RunwayZoneId;
  observations: Observation[];
  status: InspectionStatus;
  createdAt: string;
}

export interface DashboardStats {
  totalInspectionsThisWeek: number;
  openOccurrences: Record<SeverityLevel, number>;
  recentReports: InspectionReport[];
}
