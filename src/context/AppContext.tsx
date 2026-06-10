import React, { createContext, useContext, useState, useCallback } from 'react';
import { Airport, InspectionReport, UserRole, GeoCoord, SeverityLevel, LedgerEntry, CatalogVersion } from '@/types';
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
  catalogVersion: CatalogVersion;
  setCatalogVersion: (v: CatalogVersion) => void;
  ledger: LedgerEntry[];
  addLedgerEntry: (entry: LedgerEntry) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('inspector');
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [airports, setAirports] = useState<Airport[]>(mockAirports);
  const [reports, setReports] = useState<InspectionReport[]>(mockReports);
  const [pendingPickCoord, setPendingPickCoord] = useState<GeoCoord | null>(null);
  const [pendingObsDraft, setPendingObsDraft] = useState<ObsDraft | null>(null);
  const [catalogVersion, setCatalogVersion] = useState<CatalogVersion>('v2026.1');
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  const addLedgerEntry = useCallback((entry: LedgerEntry) => {
    setLedger(prev => [entry, ...prev]);
  }, []);

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
      catalogVersion, setCatalogVersion,
      ledger, addLedgerEntry,
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
