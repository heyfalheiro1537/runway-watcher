import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { StatusLed } from '@/components/StatusBadge';
import { Airport } from '@/types';

export default function AirportSelection() {
  const { airports, selectedAirport, setSelectedAirport, addAirport } = useAppState();
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSelectAirport = (airport: Airport) => {
    setSelectedAirport(airport);
  };

  const handleEnterAirport = () => {
    if (selectedAirport) {
      navigate('/dashboard');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.geojson') || file.name.endsWith('.json'))) {
      handleFileImport(file);
    }
  };

  const handleFileImport = (file: File) => {
    // Mock import — create a fake airport
    const newAirport: Airport = {
      id: `imported-${Date.now()}`,
      iataCode: 'IMP',
      name: file.name.replace(/\.(geo)?json$/, ''),
      city: 'Imported',
      runways: 2,
      elevation: 0,
      magneticVariation: '---',
      elements: [],
    };
    addAirport(newAirport);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileImport(file);
  };

  // Determine worst status for airport
  const getAirportWorstStatus = (airport: Airport) => {
    if (!airport.elements.length) return 'regular' as const;
    if (airport.elements.some(e => e.status === 'requires_intervention')) return 'requires_intervention' as const;
    if (airport.elements.some(e => e.status === 'requires_attention')) return 'requires_attention' as const;
    return 'regular' as const;
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">RunwayNotes</h1>
        <p className="text-sm text-muted-foreground mt-1">Select an airfield or import a new one</p>
      </header>

      {/* Import dropzone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`bezel p-6 mb-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
          isDragOver ? 'border-primary bg-primary/5' : ''
        }`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload size={24} className="text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">Import Airport</p>
          <p className="text-xs text-muted-foreground mt-1">.geojson or .json files</p>
        </div>
        <input
          id="file-input"
          type="file"
          accept=".geojson,.json"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Airport grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Active Airfields</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {airports.map((airport, i) => {
            const isSelected = selectedAirport?.id === airport.id;
            const worstStatus = getAirportWorstStatus(airport);
            return (
              <motion.div
                key={airport.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <button
                  onClick={() => handleSelectAirport(airport)}
                  className={`bezel w-full text-left p-4 transition-all ${
                    isSelected ? 'border-primary ring-1 ring-primary/30' : 'hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-2xl font-bold tracking-wider">{airport.iataCode}</span>
                    <StatusLed status={worstStatus} />
                  </div>
                  <p className="text-sm text-foreground mb-2">{airport.name}</p>
                  <div className="data-strip">
                    <span>RWYS: {airport.runways}</span>
                    <span className="text-border">|</span>
                    <span>ELEV: {airport.elevation}FT</span>
                    <span className="text-border">|</span>
                    <span>MAG VAR: {airport.magneticVariation}</span>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected airport detail + enter */}
      {selectedAirport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed bottom-20 left-4 right-4 bezel p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold">{selectedAirport.iataCode}</span>
                <span className="text-sm text-muted-foreground">{selectedAirport.city}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedAirport.elements.length} elements mapped
              </p>
            </div>
            <button
              onClick={handleEnterAirport}
              className="touch-target bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium flex items-center gap-1 active:translate-y-0.5 transition-transform"
            >
              Enter <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
