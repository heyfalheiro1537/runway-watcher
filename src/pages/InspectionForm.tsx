import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Trash2, MapPin, Layers, Navigation, Map, X } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { SeverityBadge } from '@/components/StatusBadge';
import { ElementType, SeverityLevel, InspectionStatus, Observation, InspectionReport, GeoCoord, RunwayZoneId } from '@/types';
import { inspectorNames } from '@/data/mockData';
import { useGeolocation } from '@/hooks/useGeolocation';

const runwayZoneLabels: Record<RunwayZoneId, string> = {
  runway: 'Pista de Pouso e Decolagem',
  swy: 'Stopway (SWY)',
  resa: 'RESA — Área de Seg. de Fim de Pista',
  cwy: 'Clearway (CWY)',
  strip: 'Faixa de Pista',
  protected: 'Área Protegida',
};

const elementTypes: { value: ElementType; label: string }[] = [
  { value: 'runway', label: 'Pista' },
  { value: 'taxiway', label: 'Taxiway' },
  { value: 'apron', label: 'Pátio' },
  { value: 'safety_strip', label: 'Faixa de Seg.' },
  { value: 'shoulder', label: 'Acostamento' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'hangar', label: 'Hangar' },
  { value: 'holding_position', label: 'Pos. Espera' },
  { value: 'other', label: 'Outro' },
];

const severityLevels: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];
const severityLabels: Record<SeverityLevel, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const statusOptions: { value: InspectionStatus; label: string }[] = [
  { value: 'regular', label: 'Normal' },
  { value: 'requires_attention', label: 'Requer Atenção' },
  { value: 'requires_intervention', label: 'Requer Intervenção' },
];

export default function InspectionForm() {
  const { selectedAirport, addReport, pendingPickCoord, setPendingPickCoord, pendingObsDraft, setPendingObsDraft } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledElementId = searchParams.get('element');
  const runwayZone = (searchParams.get('zone') || undefined) as RunwayZoneId | undefined;
  const { position: gpsPosition } = useGeolocation();

  const prefilledElement = selectedAirport?.elements.find(e => e.id === prefilledElementId);

  const [inspectorName, setInspectorName] = useState(inspectorNames[0]);
  const [elementType, setElementType] = useState<ElementType>(prefilledElement?.type || 'runway');
  const [elementIdentifier, setElementIdentifier] = useState(prefilledElement?.identifier || '');
  const [status, setStatus] = useState<InspectionStatus>('regular');
  const [observations, setObservations] = useState<Observation[]>([]);

  const [obsDescription, setObsDescription] = useState(() => pendingObsDraft?.description ?? '');
  const [obsSeverity, setObsSeverity] = useState<SeverityLevel>(() => pendingObsDraft?.severity ?? 'low');
  const [obsGeoCoord, setObsGeoCoord] = useState<GeoCoord | null>(() => {
    if (pendingPickCoord) return pendingPickCoord;
    return null;
  });

  useEffect(() => {
    if (pendingPickCoord) setPendingPickCoord(null);
    if (pendingObsDraft) setPendingObsDraft(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchingElements = useMemo(() =>
    selectedAirport?.elements.filter(e => e.type === elementType) || [],
    [selectedAirport, elementType]
  );

  const captureGps = () => {
    if (gpsPosition) {
      setObsGeoCoord({ lat: gpsPosition.lat, lng: gpsPosition.lng });
    }
  };

  const openMapPick = () => {
    setPendingObsDraft({ description: obsDescription, severity: obsSeverity });
    const params = new URLSearchParams({ pickLocation: 'true' });
    if (prefilledElementId) params.set('element', prefilledElementId);
    navigate(`/map?${params.toString()}`);
  };

  const addObservation = () => {
    if (!obsDescription.trim()) return;
    const geoCoord = obsGeoCoord
      ?? prefilledElement?.center
      ?? selectedAirport?.elements[0]?.center
      ?? { lat: 0, lng: 0 };
    const obs: Observation = {
      id: `obs-${Date.now()}`,
      description: obsDescription.trim(),
      severity: obsSeverity,
      geoCoord,
      createdAt: new Date().toISOString(),
    };
    setObservations(prev => [...prev, obs]);
    setObsDescription('');
    setObsSeverity('low');
    setObsGeoCoord(null);
  };

  const removeObservation = (id: string) => {
    setObservations(prev => prev.filter(o => o.id !== id));
  };

  const submitReport = () => {
    if (!elementIdentifier || observations.length === 0) return;
    const report: InspectionReport = {
      id: `rpt-${Date.now()}`,
      airportId: selectedAirport?.id || '',
      date: new Date().toISOString().split('T')[0],
      inspectorName,
      elementType,
      elementId: prefilledElement?.id || `${elementType}-custom`,
      elementIdentifier,
      ...(runwayZone ? { runwayZone } : {}),
      observations,
      status,
      createdAt: new Date().toISOString(),
    };
    addReport(report);
    navigate('/map');
  };

  if (!selectedAirport) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="touch-target -ml-2">
          <ChevronLeft size={20} className="text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-sm font-semibold">Novo Relatório de Inspeção</h1>
          <span className="text-xs font-mono text-muted-foreground">{selectedAirport.iataCode}</span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Banner do elemento pré-selecionado */}
        {prefilledElement && (
          <div className="flex items-center gap-3 bezel border-primary/40 bg-primary/5 p-3">
            <Layers size={16} className="text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary truncate">{prefilledElement.identifier}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {prefilledElement.type.replace(/_/g, ' ')} · selecionado do mapa
              </p>
              {runwayZone && (
                <p className="text-[10px] text-amber-400 uppercase tracking-widest mt-0.5">
                  Zona: {runwayZoneLabels[runwayZone]}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Inspetor */}
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Inspetor</label>
          <select
            value={inspectorName}
            onChange={e => setInspectorName(e.target.value)}
            className="w-full bg-card border border-border rounded p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            {inspectorNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Tipo de elemento */}
        {!prefilledElement && (
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Tipo de Elemento</label>
            <div className="grid grid-cols-3 gap-2">
              {elementTypes.map(et => (
                <button
                  key={et.value}
                  onClick={() => { setElementType(et.value); setElementIdentifier(''); }}
                  className={`bezel p-3 text-xs font-medium text-center active:translate-y-0.5 transition-all ${
                    elementType === et.value ? 'border-primary text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {et.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Identificador do elemento */}
        {!prefilledElement && (
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Identificador</label>
            {matchingElements.length > 0 ? (
              <select
                value={elementIdentifier}
                onChange={e => setElementIdentifier(e.target.value)}
                className="w-full bg-card border border-border rounded p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">Selecionar elemento...</option>
                {matchingElements.map(el => (
                  <option key={el.id} value={el.identifier}>{el.identifier}</option>
                ))}
              </select>
            ) : (
              <input
                value={elementIdentifier}
                onChange={e => setElementIdentifier(e.target.value)}
                placeholder="Ex: RWY 09/27"
                className="w-full bg-card border border-border rounded p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder:text-muted-foreground"
              />
            )}
          </div>
        )}

        {/* Status geral */}
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Status Geral</label>
          <div className="grid grid-cols-3 gap-2">
            {statusOptions.map(s => {
              const color = s.value === 'regular' ? 'border-status-regular text-status-regular'
                : s.value === 'requires_attention' ? 'border-status-attention text-status-attention'
                : 'border-status-intervention text-status-intervention';
              return (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`bezel p-3 text-[10px] font-semibold uppercase tracking-wider text-center active:translate-y-0.5 transition-all ${
                    status === s.value ? color : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Observações */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Observações ({observations.length})
            </label>
          </div>

          {observations.map(obs => (
            <motion.div
              key={obs.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="instrument-card mb-2 flex items-start gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={obs.severity} />
                  <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                    <MapPin size={8} /> {obs.geoCoord.lat.toFixed(4)}°N {Math.abs(obs.geoCoord.lng).toFixed(4)}°W
                  </span>
                </div>
                <p className="text-xs">{obs.description}</p>
              </div>
              <button onClick={() => removeObservation(obs.id)} className="touch-target -m-2">
                <Trash2 size={14} className="text-destructive" />
              </button>
            </motion.div>
          ))}

          {/* Adicionar observação */}
          <div className="bezel p-3 space-y-3">
            <textarea
              value={obsDescription}
              onChange={e => setObsDescription(e.target.value)}
              placeholder="Descreva a observação..."
              rows={2}
              className="w-full bg-muted border-none rounded p-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
            />

            {/* Severidade */}
            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Severidade</span>
              <div className="grid grid-cols-4 gap-2">
                {severityLevels.map(sev => (
                  <button
                    key={sev}
                    onClick={() => setObsSeverity(sev)}
                    className={`bezel p-2 text-[10px] font-semibold uppercase text-center active:translate-y-0.5 transition-all ${
                      obsSeverity === sev
                        ? sev === 'low' ? 'border-severity-low text-severity-low'
                          : sev === 'medium' ? 'border-severity-medium text-severity-medium'
                          : sev === 'high' ? 'border-severity-high text-severity-high'
                          : 'border-severity-critical text-severity-critical'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {severityLabels[sev]}
                  </button>
                ))}
              </div>
            </div>

            {/* Seletor de localização */}
            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Localização</span>

              {obsGeoCoord ? (
                <div className="flex items-center gap-2 bg-muted rounded p-2">
                  <MapPin size={12} className="text-amber-400 shrink-0" />
                  <span className="text-[10px] font-mono text-primary flex-1">
                    {obsGeoCoord.lat.toFixed(5)}°N &nbsp;{Math.abs(obsGeoCoord.lng).toFixed(5)}°W
                  </span>
                  <button onClick={() => setObsGeoCoord(null)} className="touch-target">
                    <X size={12} className="text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={captureGps}
                    disabled={!gpsPosition}
                    className="flex-1 bezel p-2 text-[10px] font-medium flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-all disabled:opacity-40 text-muted-foreground hover:text-foreground"
                  >
                    <Navigation size={11} /> GPS
                  </button>
                  <button
                    onClick={openMapPick}
                    className="flex-1 bezel p-2 text-[10px] font-medium flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-all text-muted-foreground hover:text-foreground"
                  >
                    <Map size={11} /> Marcar no Mapa
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={addObservation}
              disabled={!obsDescription.trim()}
              className="w-full bg-secondary text-secondary-foreground rounded p-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 active:translate-y-0.5 transition-all"
            >
              <Plus size={14} /> Adicionar Observação
            </button>
          </div>
        </div>

        {/* Enviar */}
        <button
          onClick={submitReport}
          disabled={!elementIdentifier || observations.length === 0}
          className="w-full bg-primary text-primary-foreground rounded p-4 text-sm font-semibold disabled:opacity-40 active:translate-y-0.5 transition-all"
        >
          Enviar Relatório
        </button>
      </div>
    </div>
  );
}
