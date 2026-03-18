import React, { createContext, useContext, useState, useCallback } from 'react';
import { Airport, InspectionReport, UserRole, GeoCoord, SeverityLevel } from '@/types';
import { mockAirports, mockReports } from '@/data/mockData';

export interface ObsDraft {
  description: string;
  severity: SeverityLevel;
}

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedAirport: Airport | null;
  setSelectedAirport: (airport: Airport | null) => void;
  airports: Airport[];
  reports: InspectionReport[];
  addReport: (report: InspectionReport) => void;
  addAirport: (airport: Airport) => void;
  /** Set by MapView pick-mode; consumed once by InspectionForm */
  pendingPickCoord: GeoCoord | null;
  setPendingPickCoord: (coord: GeoCoord | null) => void;
  /** Saved by InspectionForm before navigating to map pick-mode */
  pendingObsDraft: ObsDraft | null;
  setPendingObsDraft: (draft: ObsDraft | null) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('inspector');
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [airports, setAirports] = useState<Airport[]>(mockAirports);
  const [reports, setReports] = useState<InspectionReport[]>(mockReports);
  const [pendingPickCoord, setPendingPickCoord] = useState<GeoCoord | null>(null);
  const [pendingObsDraft, setPendingObsDraft] = useState<ObsDraft | null>(null);

  const addReport = useCallback((report: InspectionReport) => {
    setReports(prev => [report, ...prev]);
  }, []);

  const addAirport = useCallback((airport: Airport) => {
    setAirports(prev => [...prev, airport]);
  }, []);

  return (
    <AppContext.Provider value={{
      role, setRole,
      selectedAirport, setSelectedAirport,
      airports, reports, addReport, addAirport,
      pendingPickCoord, setPendingPickCoord,
      pendingObsDraft, setPendingObsDraft,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
