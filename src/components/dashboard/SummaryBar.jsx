import { Package, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatPrice, getRelativeTime } from '../../store/helpers';

export default function SummaryBar({ stats, lastUpdated }) {
  const metrics = [
    { icon: Package, label: 'Products', value: stats.total, color: 'text-slate-600' },
    { icon: CheckCircle, label: 'In Stock', value: stats.stable + stats.moderate, color: 'text-green-600' },
    { icon: AlertTriangle, label: 'Low', value: stats.low, color: 'text-amber-600' },
    { icon: AlertTriangle, label: 'Critical', value: stats.critical + stats.soldout, color: 'text-red-600', pulse: stats.critical > 0 },
    { icon: TrendingUp, label: 'Sales Today', value: `${stats.totalSales} (${formatPrice(stats.totalRevenue)})`, color: 'text-primary' },
    { icon: Clock, label: 'Last Update', value: getRelativeTime(lastUpdated), color: 'text-slate-500' },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`flex items-center gap-2 shrink-0 ${m.pulse ? 'animate-pulse-slow' : ''}`}
          >
            <m.icon size={15} className={m.color} />
            <div className="flex items-baseline gap-1.5">
              <span className={`text-sm font-semibold tabular-nums ${m.color}`}>
                {m.value}
              </span>
              <span className="text-[11px] text-slate-400">{m.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
