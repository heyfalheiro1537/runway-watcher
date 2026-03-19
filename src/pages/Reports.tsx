import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import { ElementType, SeverityLevel, InspectionStatus, RunwayZoneId } from '@/types';

const runwayZoneLabels: Record<RunwayZoneId, string> = {
  runway: 'Pista de Pouso e Decolagem',
  swy: 'Stopway (SWY)',
  resa: 'RESA',
  cwy: 'Clearway (CWY)',
  strip: 'Faixa de Pista',
  protected: 'Área Protegida',
};
import { format, parseISO, isWithinInterval } from 'date-fns';
import jsPDF from 'jspdf';

export default function Reports() {
  const { selectedAirport, reports, role } = useAppState();
  const navigate = useNavigate();

  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<InspectionStatus | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | ''>('');
  const [filterElement, setFilterElement] = useState<ElementType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const airportReports = useMemo(() =>
    reports.filter(r => r.airportId === selectedAirport?.id),
    [reports, selectedAirport]
  );

  const filteredReports = useMemo(() => {
    return airportReports.filter(r => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterElement && r.elementType !== filterElement) return false;
      if (filterSeverity && !r.observations.some(o => o.severity === filterSeverity)) return false;
      if (dateFrom && dateTo) {
        const reportDate = parseISO(r.date);
        if (!isWithinInterval(reportDate, { start: parseISO(dateFrom), end: parseISO(dateTo) })) return false;
      }
      return true;
    });
  }, [airportReports, filterStatus, filterSeverity, filterElement, dateFrom, dateTo]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${selectedAirport?.iataCode} - Relatórios de Inspeção`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28);

    let y = 40;
    filteredReports.forEach((report) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.text(`${report.elementIdentifier} - ${report.status.replace(/_/g, ' ').toUpperCase()}`, 14, y);
      y += 6;
      doc.setFontSize(9);
      if (report.runwayZone) {
        doc.text(`Zona: ${runwayZoneLabels[report.runwayZone]}`, 14, y);
        y += 5;
      }
      doc.text(`Inspetor: ${report.inspectorName} | Data: ${format(parseISO(report.createdAt), 'dd MMM yyyy HH:mm')}`, 14, y);
      y += 5;
      report.observations.forEach(obs => {
        doc.text(`  [${obs.severity.toUpperCase()}] ${obs.description}`, 14, y);
        y += 5;
        doc.text(`    ${obs.geoCoord.lat.toFixed(4)}°N, ${Math.abs(obs.geoCoord.lng).toFixed(4)}°W`, 14, y);
        y += 6;
      });
      y += 4;
    });

    doc.save(`${selectedAirport?.iataCode}_relatorios_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  if (!selectedAirport) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20 px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nenhum aeroporto selecionado</p>
          <button onClick={() => navigate('/')} className="text-primary text-sm font-medium">Ir para o Hangar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <header className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold">{selectedAirport.iataCode}</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Relatórios</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{filteredReports.length} relatórios</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`touch-target bezel px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${showFilters ? 'border-primary text-primary' : ''}`}
          >
            <Filter size={12} /> Filtrar
          </button>
          {role === 'supervisor' && (
            <button
              onClick={exportPDF}
              className="touch-target bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs font-medium flex items-center gap-1 active:translate-y-0.5 transition-transform"
            >
              <Download size={12} /> PDF
            </button>
          )}
        </div>
      </header>

      {/* Filtros */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bezel p-3 mb-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as InspectionStatus | '')}
                className="w-full bg-muted border-none rounded p-2 text-xs outline-none"
              >
                <option value="">Todos</option>
                <option value="regular">Normal</option>
                <option value="requires_attention">Atenção</option>
                <option value="requires_intervention">Intervenção</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Severidade</label>
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value as SeverityLevel | '')}
                className="w-full bg-muted border-none rounded p-2 text-xs outline-none"
              >
                <option value="">Todas</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Elemento</label>
              <select
                value={filterElement}
                onChange={e => setFilterElement(e.target.value as ElementType | '')}
                className="w-full bg-muted border-none rounded p-2 text-xs outline-none"
              >
                <option value="">Todos</option>
                <option value="runway">Pista</option>
                <option value="taxiway">Taxiway</option>
                <option value="apron">Pátio</option>
                <option value="safety_strip">Faixa de Seg.</option>
                <option value="shoulder">Acostamento</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Período</label>
              <div className="flex gap-1">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="flex-1 bg-muted border-none rounded p-2 text-[10px] outline-none" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="flex-1 bg-muted border-none rounded p-2 text-[10px] outline-none" />
              </div>
            </div>
          </div>
          <button
            onClick={() => { setFilterStatus(''); setFilterSeverity(''); setFilterElement(''); setDateFrom(''); setDateTo(''); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </button>
        </motion.div>
      )}

      {/* Lista de relatórios */}
      <div className="space-y-2">
        {filteredReports.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="instrument-card"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold">{report.elementIdentifier}</span>
                <StatusBadge status={report.status} />
                {report.runwayZone && (
                  <span className="text-[9px] uppercase tracking-widest bg-amber-950/60 text-amber-400 border border-amber-800/40 rounded px-1.5 py-0.5">
                    {runwayZoneLabels[report.runwayZone]}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                {format(parseISO(report.createdAt), 'dd MMM HH:mm')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Inspetor: {report.inspectorName}</p>
            <div className="space-y-1.5">
              {report.observations.map(obs => (
                <div key={obs.id} className="flex items-start gap-2">
                  <SeverityBadge severity={obs.severity} className="mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{obs.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Nenhum relatório corresponde aos filtros atuais</p>
          </div>
        )}
      </div>
    </div>
  );
}
