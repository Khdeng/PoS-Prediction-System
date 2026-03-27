import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getStockStatus, STATUS_CONFIG } from '../../store/helpers';

function Sparkline({ data, color = '#3B82F6', width = 80, height = 24 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

export default function ForecastSection({ products, categories }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
    );
  }, [products, search]);

  const formatDate = (d) =>
    d.toLocaleDateString('en-HK', { month: 'short', day: 'numeric' });

  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <h2 className="text-base font-semibold">14-Day Forecast</h2>
        {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter items..."
            className="h-8 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-primary w-52"
          />

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 bg-slate-50 z-10 text-left px-3 py-2 font-semibold min-w-[160px]">
                    Item
                  </th>
                  <th className="px-2 py-2 font-semibold text-center bg-primary-light min-w-[56px]">
                    Today
                  </th>
                  {dates.map((d, i) => (
                    <th
                      key={i}
                      className={`px-2 py-2 font-medium text-center min-w-[56px] ${
                        isWeekend(d) ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      {formatDate(d)}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-semibold text-center min-w-[90px]">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const status = getStockStatus(product.stock, product.forecast);
                  const config = STATUS_CONFIG[status];
                  const avg = product.forecast.reduce((a, b) => a + b, 0) / product.forecast.length;
                  const cat = categories[product.category];
                  const isExpanded = expandedRow === product.id;

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(isExpanded ? null : product.id)}
                    >
                      <td className="sticky left-0 bg-white z-10 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: config.dot }}
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.shortName}</p>
                            <p className="text-[10px] text-slate-400">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center font-bold bg-primary-light tabular-nums">
                        {product.salesToday}
                      </td>
                      {product.forecast.map((val, i) => {
                        const ratio = avg > 0 ? val / avg : 1;
                        let cellBg = '';
                        if (ratio > 1.2) cellBg = 'bg-amber-50/60';
                        else if (ratio < 0.8) cellBg = 'bg-blue-50/40';

                        return (
                          <td
                            key={i}
                            className={`px-2 py-2 text-center tabular-nums ${cellBg} ${
                              isWeekend(dates[i]) ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center">
                        <Sparkline data={product.forecast} color={cat?.accent || '#3B82F6'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No items match your filter</p>
          )}
        </div>
      )}
    </section>
  );
}
