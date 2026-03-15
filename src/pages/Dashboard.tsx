import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, AlertOctagon, Clock, ArrowRight } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import { format, parseISO, isThisWeek } from 'date-fns';
import RegulationsPanel from '@/components/RegulationsPanel';
import NewsFeed from '@/components/NewsFeed';

export default function Dashboard() {
  const { selectedAirport, reports, role } = useAppState();
  const navigate = useNavigate();

  const airportReports = useMemo(() =>
    reports.filter(r => r.airportId === selectedAirport?.id),
    [reports, selectedAirport]
  );

  const weeklyCount = useMemo(() =>
    airportReports.filter(r => isThisWeek(parseISO(r.createdAt))).length,
    [airportReports]
  );

  const severityCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    airportReports.forEach(r => {
      r.observations.forEach(obs => {
        if (r.status !== 'regular') counts[obs.severity]++;
      });
    });
    return counts;
  }, [airportReports]);

  if (!selectedAirport) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20 px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No airport selected</p>
          <button onClick={() => navigate('/')} className="text-primary text-sm font-medium">
            Go to Hangar
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Inspections This Week', value: weeklyCount, icon: CheckCircle, color: 'text-status-regular' },
    { label: 'Critical', value: severityCounts.critical, icon: AlertOctagon, color: 'text-severity-critical' },
    { label: 'High', value: severityCounts.high, icon: AlertTriangle, color: 'text-severity-high' },
    { label: 'Medium / Low', value: severityCounts.medium + severityCounts.low, icon: Clock, color: 'text-severity-medium' },
  ];

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold">{selectedAirport.iataCode}</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Dashboard</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{selectedAirport.name}</p>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{format(new Date(), 'dd MMM yyyy HH:mm')}</span>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="instrument-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</span>
            </div>
            <span className="font-mono text-2xl font-bold">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => navigate('/map')}
          className="flex-1 bezel p-3 text-sm font-medium flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform"
        >
          Open Map <ArrowRight size={14} />
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="flex-1 bezel p-3 text-sm font-medium flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform"
        >
          View Reports <ArrowRight size={14} />
        </button>
      </div>

      {/* Recent Reports Timeline */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Recent Reports</h2>
        <div className="space-y-2">
          {airportReports.slice(0, 8).map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="instrument-card flex items-center gap-3"
            >
              <div className={`w-1 h-10 rounded-full ${
                report.status === 'regular' ? 'bg-status-regular'
                : report.status === 'requires_attention' ? 'bg-status-attention'
                : 'bg-status-intervention'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold">{report.elementIdentifier}</span>
                  <StatusBadge status={report.status} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{report.inspectorName}</span>
                  <span className="text-border">·</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {format(parseISO(report.createdAt), 'dd MMM HH:mm')}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                {report.observations.map(obs => (
                  <SeverityBadge key={obs.id} severity={obs.severity} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
