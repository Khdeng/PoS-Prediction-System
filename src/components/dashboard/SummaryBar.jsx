import { Package, TrendingUp, Clock, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { formatPrice, getRelativeTime } from '../../store/helpers';

export default function SummaryBar({ stats, lastUpdated }) {
  const metrics = [
    { icon: Package, label: 'Products', value: stats.total, color: 'from-slate-500 to-slate-600', textColor: 'text-slate-700' },
    { icon: CheckCircle, label: 'In Stock', value: stats.stable + stats.moderate, color: 'from-emerald-500 to-green-600', textColor: 'text-emerald-700' },
    { icon: AlertTriangle, label: 'Low', value: stats.low, color: 'from-amber-500 to-orange-500', textColor: 'text-amber-700' },
    { icon: AlertTriangle, label: 'Critical', value: stats.critical + stats.soldout, color: 'from-red-500 to-rose-600', textColor: 'text-red-700', pulse: stats.critical > 0 },
    { icon: TrendingUp, label: 'Sales Today', value: `${stats.totalSales} (${formatPrice(stats.totalRevenue)})`, color: 'from-primary to-blue-600', textColor: 'text-primary' },
    { icon: Clock, label: 'Last Update', value: getRelativeTime(lastUpdated), color: 'from-slate-400 to-slate-500', textColor: 'text-slate-500' },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-2 shadow-md">
      <div className="flex items-center gap-5 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 shrink-0 mr-2">
          <Activity size={14} className="text-primary" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Live</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
        </div>
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`flex items-center gap-2 shrink-0 ${m.pulse ? 'animate-pulse-slow' : ''}`}
          >
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center shadow-sm`}>
              <m.icon size={13} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-none">{m.label}</span>
              <span className="text-sm font-bold tabular-nums text-white leading-tight">
                {m.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
