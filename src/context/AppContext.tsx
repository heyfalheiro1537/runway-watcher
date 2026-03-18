import React, { createContext, useContext, useState, useCallback } from 'react';
import { Airport, InspectionReport, UserRole } from '@/types';
import { mockAirports, mockReports } from '@/data/mockData';

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedAirport: Airport | null;
  setSelectedAirport: (airport: Airport | null) => void;
  airports: Airport[];
  reports: InspectionReport[];
  addReport: (report: InspectionReport) => void;
  addAirport: (airport: Airport) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('inspector');
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [airports, setAirports] = useState<Airport[]>(mockAirports);
  const [reports, setReports] = useState<InspectionReport[]>(mockReports);

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
