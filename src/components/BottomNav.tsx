import { useLocation, useNavigate } from 'react-router-dom';
import { Map, LayoutDashboard, ClipboardList, Plane, ScrollText } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Plane, label: 'Hangar' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
  { path: '/map', icon: Map, label: 'Mapa' },
  { path: '/reports', icon: ClipboardList, label: 'Relatórios' },
  { path: '/ledger', icon: ScrollText, label: 'Ledger' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useAppState();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex items-center justify-between px-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "touch-target flex flex-col items-center gap-0.5 py-2 px-3 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setRole(role === 'inspector' ? 'supervisor' : 'inspector')}
          className="touch-target flex flex-col items-center gap-0.5 py-2 px-3 text-xs text-muted-foreground"
        >
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold font-mono",
            role === 'inspector' ? "border-primary text-primary" : "border-status-attention text-status-attention"
          )}>
            {role === 'inspector' ? 'I' : 'S'}
          </div>
          <span className="font-medium capitalize">{role === 'inspector' ? 'Inspetor' : 'Supervisor'}</span>
        </button>
      </div>
    </nav>
  );
}
