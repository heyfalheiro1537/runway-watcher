import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { StatusLed } from '@/components/StatusBadge';
import { Airport } from '@/types';
import { searchAirport, fetchAerowayElements } from '@/lib/overpass';

export default function AirportSelection() {
  const { airports, selectedAirport, setSelectedAirport, addAirport } = useAppState();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [coordLat, setCoordLat] = useState('');
  const [coordLng, setCoordLng] = useState('');
  const [importMode, setImportMode] = useState<'search' | 'coords'>('search');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSelectAirport = (airport: Airport) => {
    setSelectedAirport(airport);
  };

  const handleEnterAirport = () => {
    if (selectedAirport) {
      navigate('/dashboard');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);

    try {
      let lat: number, lng: number, name: string, code: string;

      if (importMode === 'search') {
        if (!searchQuery.trim()) throw new Error('Informe o nome ou código ICAO/IATA do aeroporto');
        const result = await searchAirport(searchQuery.trim());
        if (!result) throw new Error('Aeroporto não encontrado. Tente outro nome ou use coordenadas.');
        lat = result.lat;
        lng = result.lng;
        name = result.displayName.split(',')[0];
        code = searchQuery.trim().toUpperCase().slice(0, 4);
      } else {
        lat = parseFloat(coordLat);
        lng = parseFloat(coordLng);
        if (isNaN(lat) || isNaN(lng)) throw new Error('Informe latitude e longitude válidas');
        name = `Aeroporto em ${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        code = 'CUST';
      }

      const airportId = `ovp-${Date.now()}`;
      const elements = await fetchAerowayElements(lat, lng, airportId);
      const runwayCount = elements.filter(e => e.type === 'runway').length;

      const newAirport: Airport = {
        id: airportId,
        iataCode: code.slice(0, 4),
        name,
        city: importMode === 'search' ? searchQuery.trim() : `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        runways: runwayCount,
        elevation: 0,
        magneticVariation: '---',
        elements,
      };

      addAirport(newAirport);
      setSelectedAirport(newAirport);
      setSearchQuery('');
      setCoordLat('');
      setCoordLng('');
    } catch (err: any) {
      setImportError(err.message || 'Falha na importação');
    } finally {
      setImporting(false);
    }
  };

  const getAirportWorstStatus = (airport: Airport) => {
    if (!airport.elements.length) return 'regular' as const;
    if (airport.elements.some(e => e.status === 'requires_intervention')) return 'requires_intervention' as const;
    if (airport.elements.some(e => e.status === 'requires_attention')) return 'requires_attention' as const;
    return 'regular' as const;
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">InfraSegura</h1>
        <p className="text-sm text-muted-foreground mt-1">Selecione um aeródromo ou importe um novo</p>
      </header>

      {/* Painel de importação */}
      <div className="bezel p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-primary" />
          <span className="text-sm font-medium">Importar Aeroporto</span>
        </div>

        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setImportMode('search')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              importMode === 'search'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Buscar por nome
          </button>
          <button
            onClick={() => setImportMode('coords')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              importMode === 'coords'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Coordenadas
          </button>
        </div>

        {importMode === 'search' ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
              placeholder="Ex: GRU, Congonhas, SBSP…"
              className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleImport}
              disabled={importing}
              className="touch-target bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium flex items-center gap-1.5 active:translate-y-0.5 transition-transform disabled:opacity-50"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {importing ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={coordLat}
              onChange={e => setCoordLat(e.target.value)}
              placeholder="Latitude"
              className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <input
              type="text"
              value={coordLng}
              onChange={e => setCoordLng(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
              placeholder="Longitude"
              className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <button
              onClick={handleImport}
              disabled={importing}
              className="touch-target bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium flex items-center gap-1.5 active:translate-y-0.5 transition-transform disabled:opacity-50"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {importing ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        )}

        {importError && (
          <p className="text-xs text-destructive mt-2">{importError}</p>
        )}

        <p className="text-[10px] text-muted-foreground mt-2">
          Busca geometria real de aerovias do OpenStreetMap via Overpass API
        </p>
      </div>

      {/* Grid de aeroportos */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Aeródromos Ativos</h2>
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
                    <span>PISTAS: {airport.runways}</span>
                    <span className="text-border">|</span>
                    <span>ELEV: {airport.elevation}FT</span>
                    <span className="text-border">|</span>
                    <span>VAR MAG: {airport.magneticVariation}</span>
                  </div>
                  {airport.elements.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {airport.elements.length} elementos mapeados
                    </p>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Detalhe do aeroporto selecionado */}
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
                {selectedAirport.elements.length} elementos mapeados
              </p>
            </div>
            <button
              onClick={handleEnterAirport}
              className="touch-target bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium flex items-center gap-1 active:translate-y-0.5 transition-transform"
            >
              Entrar <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
