import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import { ElementType, SeverityLevel, InspectionStatus } from '@/types';
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
    doc.text(`${selectedAirport?.iataCode} - Inspection Reports`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28);

    let y = 40;
    filteredReports.forEach((report, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.text(`${report.elementIdentifier} - ${report.status.replace(/_/g, ' ').toUpperCase()}`, 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.text(`Inspector: ${report.inspectorName} | Date: ${format(parseISO(report.createdAt), 'dd MMM yyyy HH:mm')}`, 14, y);
      y += 5;
      report.observations.forEach(obs => {
        doc.text(`  [${obs.severity.toUpperCase()}] ${obs.description}`, 14, y);
        y += 5;
        doc.text(`    ${obs.geoCoord.lat.toFixed(4)}°N, ${Math.abs(obs.geoCoord.lng).toFixed(4)}°W`, 14, y);
        y += 6;
      });
      y += 4;
    });

    doc.save(`${selectedAirport?.iataCode}_reports_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  if (!selectedAirport) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20 px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No airport selected</p>
          <button onClick={() => navigate('/')} className="text-primary text-sm font-medium">Go to Hangar</button>
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
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Reports</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{filteredReports.length} reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`touch-target bezel px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${showFilters ? 'border-primary text-primary' : ''}`}
          >
            <Filter size={12} /> Filter
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

      {/* Filters */}
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
                <option value="">All</option>
                <option value="regular">Regular</option>
                <option value="requires_attention">Attention</option>
                <option value="requires_intervention">Intervention</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Severity</label>
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value as SeverityLevel | '')}
                className="w-full bg-muted border-none rounded p-2 text-xs outline-none"
              >
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Element</label>
              <select
                value={filterElement}
                onChange={e => setFilterElement(e.target.value as ElementType | '')}
                className="w-full bg-muted border-none rounded p-2 text-xs outline-none"
              >
                <option value="">All</option>
                <option value="runway">Runway</option>
                <option value="taxiway">Taxiway</option>
                <option value="apron">Apron</option>
                <option value="safety_strip">Safety Strip</option>
                <option value="shoulder">Shoulder</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Date Range</label>
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
            Clear filters
          </button>
        </motion.div>
      )}

      {/* Reports list */}
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
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold">{report.elementIdentifier}</span>
                <StatusBadge status={report.status} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {format(parseISO(report.createdAt), 'dd MMM HH:mm')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Inspector: {report.inspectorName}</p>
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
            <p className="text-sm text-muted-foreground">No reports match the current filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
