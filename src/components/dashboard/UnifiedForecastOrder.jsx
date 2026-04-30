import { useState, useMemo } from 'react';
import { Minus, Plus, Truck, CheckCircle, Search, ChevronRight, ChevronDown, TrendingUp, BarChart3, Package, Settings, X, Send, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getStockStatus, STATUS_CONFIG, getSuggestedOrder, formatPrice } from '../../store/helpers';
import { showToast } from '../shared/Toast';
import ProductImage from '../shared/ProductImage';

/* ── Mini chart components ────────────────────────────────── */

function Sparkline({ data, color = '#3B82F6', width = 72, height = 22 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function AreaChart({ pastData, futureData, pastEstData, color, pastDates, futureDates }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const all = [...pastData, ...futureData];
  const allEst = pastEstData ? [...pastEstData, ...futureData] : null;
  const max = Math.max(...all, ...(pastEstData || []), 1);
  const W = 500;
  const H = 115;
  const pad = { top: 6, bottom: 22, left: 6, right: 6 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const total = all.length;
  const splitIdx = pastData.length;

  const allDates = [...(pastDates || []), ...(futureDates || [])];
  const isWeekendDay = (d) => d && (d.getDay() === 0 || d.getDay() === 6);
  const fmtDay = (d) => d ? d.toLocaleDateString('en-HK', { weekday: 'short' }) : '';
  const fmtDate = (d) => d ? d.toLocaleDateString('en-HK', { day: 'numeric', month: 'short' }) : '';

  const getPoint = (val, i) => ({
    x: pad.left + (total > 1 ? (i / (total - 1)) * chartW : chartW / 2),
    y: pad.top + chartH - (val / max) * chartH,
  });

  const allPts = all.map((v, i) => getPoint(v, i));
  const allEstPts = allEst ? allEst.map((v, i) => getPoint(v, i)) : null;
  const pastPts = allPts.slice(0, splitIdx);
  const futurePts = allPts.slice(splitIdx - 1);
  const pastEstPts = allEstPts ? allEstPts.slice(0, splitIdx) : null;

  const pastLine = pastPts.map((p) => `${p.x},${p.y}`).join(' ');
  const futureLine = futurePts.map((p) => `${p.x},${p.y}`).join(' ');
  const pastEstLine = pastEstPts ? pastEstPts.map((p) => `${p.x},${p.y}`).join(' ') : null;

  const lastPast = pastPts[pastPts.length - 1];
  const pastArea = `${pastLine} ${lastPast.x},${pad.top + chartH} ${pastPts[0].x},${pad.top + chartH}`;
  const labelY = H - 4;

  const estColor = '#94A3B8';

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      onMouseLeave={() => setHoverIdx(null)}
      className="select-none"
    >
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((r) => (
        <line key={r} x1={pad.left} x2={W - pad.right} y1={pad.top + chartH * (1 - r)} y2={pad.top + chartH * (1 - r)} stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="4 4" />
      ))}
      <line x1={pad.left} x2={W - pad.right} y1={pad.top + chartH} y2={pad.top + chartH} stroke="#E2E8F0" strokeWidth="0.5" />

      {/* Today divider */}
      <line x1={lastPast.x} y1={pad.top} x2={lastPast.x} y2={pad.top + chartH} stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="3 3" />

      {/* Past area fill */}
      <polygon points={pastArea} fill={`url(#grad-${color.replace('#', '')})`} />

      {/* Past estimated line (dashed grey) — behind actual */}
      {pastEstLine && (
        <polyline fill="none" stroke={estColor} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3" opacity="0.6" points={pastEstLine} />
      )}

      {/* Past actual line (solid, coloured) */}
      <polyline fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" points={pastLine} />
      {/* Future forecast line (dashed, coloured) */}
      <polyline fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 3" opacity="0.5" points={futureLine} />

      {/* X-axis labels */}
      {allPts.map((p, i) => {
        const d = allDates[i];
        const wkend = isWeekendDay(d);
        const isPast = i < splitIdx;
        const isToday = i === splitIdx - 1;
        return (
          <text
            key={`label-${i}`}
            x={p.x}
            y={labelY}
            textAnchor="middle"
            fontSize="6.5"
            fontWeight={isToday ? 'bold' : wkend ? '600' : 'normal'}
            fill={isToday ? '#3B82F6' : wkend ? '#F59E0B' : isPast ? '#94A3B8' : '#CBD5E1'}
          >
            {isToday ? 'Today' : fmtDay(d)}
          </text>
        );
      })}

      {/* Estimated dots (past only) */}
      {pastEstPts && pastEstPts.map((p, i) => (
        <circle key={`est-${i}`} cx={p.x} cy={p.y} r={1.8} fill="white" stroke={estColor} strokeWidth="1.2" opacity="0.7" />
      ))}

      {/* Hover crosshair + tooltip */}
      {hoverIdx !== null && (() => {
        const p = allPts[hoverIdx];
        const actual = all[hoverIdx];
        const estimated = allEst ? allEst[hoverIdx] : null;
        const isPast = hoverIdx < splitIdx;
        const tooltipH = isPast && estimated != null ? 38 : 24;
        return (
          <>
            <line x1={p.x} y1={pad.top} x2={p.x} y2={pad.top + chartH} stroke={color} strokeWidth="1" opacity="0.25" />
            <circle cx={p.x} cy={p.y} r={4.5} fill="white" stroke={color} strokeWidth="2" />
            <g transform={`translate(${Math.min(Math.max(p.x, 40), W - 40)}, ${Math.max(p.y - 34, 6)})`}>
              <rect x={-36} y={-12} width={72} height={tooltipH} rx={5} fill="#0F172A" opacity="0.92" />
              <text x={0} y={-1} textAnchor="middle" fill="#94A3B8" fontSize="7">{fmtDate(allDates[hoverIdx])}</text>
              <text x={isPast && estimated != null ? -4 : 0} y={10} textAnchor={isPast && estimated != null ? 'end' : 'middle'} fill="white" fontSize="9.5" fontWeight="bold">{actual}</text>
              {isPast && estimated != null && (
                <>
                  <text x={0} y={10} textAnchor="middle" fill="#64748B" fontSize="8"> | </text>
                  <text x={4} y={10} textAnchor="start" fill={estColor} fontSize="9.5">{estimated}</text>
                  <text x={0} y={21} textAnchor="middle" fill="#64748B" fontSize="6.5">actual | est.</text>
                </>
              )}
            </g>
          </>
        );
      })()}

      {/* Dots + hover targets */}
      {allPts.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={hoverIdx === i ? 0 : i < splitIdx ? 2 : 1.8}
            fill={i < splitIdx ? color : 'white'}
            stroke={color}
            strokeWidth={i < splitIdx ? 0 : 1.5}
          />
          <circle cx={p.x} cy={p.y} r={14} fill="transparent" onMouseEnter={() => setHoverIdx(i)} style={{ cursor: 'pointer' }} />
        </g>
      ))}
    </svg>
  );
}

/* ── Auto-Order Config Panel ──────────────────────────────── */

function AutoOrderConfigPanel({ config, onChange, onClose, accent, product }) {
  return (
    <div className="mb-3 bg-white border border-slate-200 rounded-xl shadow-lg p-3 relative animate-fade-in">
      <button onClick={onClose} className="absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center hover:bg-slate-100 transition-colors">
        <X size={11} className="text-slate-400" />
      </button>

      <div className="flex items-center gap-1.5 mb-2.5">
        <Settings size={11} className="text-primary" />
        <p className="text-[11px] font-bold text-slate-700">Auto-Order Configuration</p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div>
          <p className="text-[10px] font-semibold text-slate-700">Enable Auto-Ordering</p>
          <p className="text-[9px] text-slate-400">Automatically place orders based on rules below</p>
        </div>
        <button
          onClick={() => onChange({ enabled: !config.enabled })}
          className={`relative w-9 h-[18px] rounded-full transition-all duration-300 overflow-hidden ${config.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-md transition-transform duration-300 ${config.enabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
        </button>
      </div>

      <div className={`space-y-3 transition-opacity ${config.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        {/* Rule selector */}
        <div>
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ordering Rule</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => onChange({ rule: 'threshold' })}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-semibold border transition-all ${
                config.rule === 'threshold' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Stock Threshold
            </button>
            <button
              onClick={() => onChange({ rule: 'forecast' })}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-semibold border transition-all ${
                config.rule === 'forecast' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Forecast-Based
            </button>
          </div>
        </div>

        {config.rule === 'threshold' ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] text-slate-500 mb-1">Order when stock ≤</p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={config.thresholdStock}
                  onChange={(e) => onChange({ thresholdStock: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full h-6 text-center text-[10px] font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                />
                <span className="text-[9px] text-slate-400 shrink-0">units</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 mb-1">Order quantity</p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={config.thresholdQty}
                  onChange={(e) => onChange({ thresholdQty: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full h-6 text-center text-[10px] font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                />
                <span className="text-[9px] text-slate-400 shrink-0">units</span>
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-[9px] text-slate-400 bg-slate-50 rounded-lg px-2 py-1.5">
                When stock drops to <strong>{config.thresholdStock}</strong> or below, order <strong>{config.thresholdQty}</strong> units automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] text-slate-500 mb-1">Order lead time</p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={config.leadDays}
                  onChange={(e) => onChange({ leadDays: Math.max(1, Math.min(7, parseInt(e.target.value) || 1)) })}
                  className="w-full h-6 text-center text-[10px] font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                />
                <span className="text-[9px] text-slate-400 shrink-0">days ahead</span>
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <p className="text-[9px] text-slate-400 bg-slate-50 rounded-lg px-2 py-1.5">
                Orders forecasted demand <strong>{config.leadDays}d</strong> before needed.
              </p>
            </div>
          </div>
        )}

        {/* Notification preference */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div>
            <p className="text-[10px] font-semibold text-slate-700">Silent mode</p>
            <p className="text-[9px] text-slate-400">Skip confirmation toast when auto-ordering</p>
          </div>
          <button
            onClick={() => onChange({ silent: !config.silent })}
            className={`relative w-9 h-[18px] rounded-full transition-all duration-300 overflow-hidden ${config.silent ? 'bg-slate-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-md transition-transform duration-300 ${config.silent ? 'translate-x-[18px]' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Layout constant ──────────────────────────────────────── */

const COL_GRID = 'grid grid-cols-[minmax(130px,1.4fr)_48px_44px_40px_40px_72px_40px_52px_minmax(130px,1fr)]';

/* ── Main component ───────────────────────────────────────── */

export default function UnifiedForecastOrder({ products, categories }) {
  const placeOrder = useStore((s) => s.placeOrder);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderQtys, setOrderQtys] = useState({});
  const [daysQtys, setDaysQtys] = useState({});
  const [orderedItems, setOrderedItems] = useState({});
  const [loading, setLoading] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);
  // Per-day orders: { [productId]: { [dayIdx]: { qty, sent, confirmed } } }
  const [dayOrders, setDayOrders] = useState({});
  // Auto-order config: { [productId]: { enabled, rule, thresholdStock, thresholdQty, leadDays, silent } }
  const [autoConfigs, setAutoConfigs] = useState({});
  const [autoConfigOpen, setAutoConfigOpen] = useState(null); // productId of open popup

  const today = new Date();
  const futureDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    return d;
  });
  const pastDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const formatDate = (d) => d.toLocaleDateString('en-HK', { month: 'short', day: 'numeric' });
  const formatDay = (d) => d.toLocaleDateString('en-HK', { weekday: 'short' });
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

  const sorted = useMemo(() => {
    const urgencyOrder = { soldout: 0, critical: 1, low: 2, moderate: 3, stable: 4, overstocked: 5 };
    let items = [...products];
    if (categoryFilter !== 'all') items = items.filter((p) => p.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    items.sort((a, b) => (urgencyOrder[getStockStatus(a.stock, a.forecast)] ?? 9) - (urgencyOrder[getStockStatus(b.stock, b.forecast)] ?? 9));
    return items;
  }, [products, search, categoryFilter]);

  const getQty = (product) => orderQtys[product.id] !== undefined ? orderQtys[product.id] : getSuggestedOrder(product);
  const setQty = (productId, qty) => setOrderQtys((prev) => ({ ...prev, [productId]: Math.max(0, qty) }));
  const getDays = (productId) => daysQtys[productId] ?? '';
  const setDays = (product, days) => {
    const d = Math.max(0, parseInt(days) || 0);
    setDaysQtys((prev) => ({ ...prev, [product.id]: d || '' }));
    if (d > 0) {
      // Sum the next d days of forecast directly
      const total = product.forecast.slice(0, d).reduce((a, b) => a + b, 0);
      setQty(product.id, total);
    }
  };

  const handleOrder = (product) => {
    const qty = getQty(product);
    if (qty <= 0) return;
    setLoading((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      placeOrder(product.id, qty);
      setLoading((prev) => ({ ...prev, [product.id]: false }));
      setOrderedItems((prev) => ({ ...prev, [product.id]: true }));
      setOrderQtys((prev) => ({ ...prev, [product.id]: 0 }));
      showToast(`Ordered ${qty} × ${product.shortName}`);
      setTimeout(() => setOrderedItems((prev) => ({ ...prev, [product.id]: false })), 3000);
    }, 1500);
  };

  const getDayOrder = (productId, dayIdx) =>
    dayOrders[productId]?.[dayIdx] || { qty: 0, sent: false };

  const setDayOrderQty = (productId, dayIdx, qty) =>
    setDayOrders((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [dayIdx]: { ...getDayOrder(productId, dayIdx), qty: Math.max(0, qty), sent: false } },
    }));

  const sendDayOrder = (product, dayIdx, forecastQty) => {
    const order = getDayOrder(product.id, dayIdx);
    const qty = order.qty || forecastQty;
    setDayOrders((prev) => ({
      ...prev,
      [product.id]: { ...prev[product.id], [dayIdx]: { qty, sent: true } },
    }));
    showToast(`Scheduled ${qty} × ${product.shortName} for ${formatDate(futureDates[dayIdx])}`);
  };

  const modifyDayOrder = (productId, dayIdx) =>
    setDayOrders((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [dayIdx]: { ...getDayOrder(productId, dayIdx), sent: false } },
    }));

  const getAutoConfig = (productId) =>
    autoConfigs[productId] || { enabled: false, rule: 'threshold', thresholdStock: 10, thresholdQty: 30, leadDays: 1, silent: false };

  const setAutoConfig = (productId, updates) =>
    setAutoConfigs((prev) => ({ ...prev, [productId]: { ...getAutoConfig(productId), ...updates } }));

  const handleBulkOrder = () => {
    const toOrder = sorted.filter((p) => getSuggestedOrder(p) > 0);
    if (toOrder.length === 0) return;
    const totalUnits = toOrder.reduce((sum, p) => sum + getSuggestedOrder(p), 0);
    if (!window.confirm(`Order ${toOrder.length} items totaling ${totalUnits} units?`)) return;
    toOrder.forEach((product, i) => setTimeout(() => handleOrder(product), i * 200));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-1">
          <BarChart3 size={15} className="text-primary" />
          <h2 className="text-sm font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Forecast & Ordering</h2>
        </div>
        <div className="relative group">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter..."
            className="h-7 pl-7 pr-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-36 transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-7 px-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
        >
          <option value="all">All Categories</option>
          {Object.entries(categories).map(([key, cat]) => (
            <option key={key} value={key}>{cat.label}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleBulkOrder}
            className="h-7 px-3 text-[11px] font-semibold bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:shadow-md hover:shadow-primary/25 active:scale-[0.97] transition-all flex items-center gap-1.5"
          >
            <Truck size={12} /> Bulk Order
          </button>
        </div>
      </div>

      {/* ── Sticky header ───────────────────────────────── */}
      <div className={`${COL_GRID} shrink-0 bg-slate-50/80 border-b border-slate-200/60 text-[10px] font-semibold text-slate-500 uppercase tracking-wider`}>
        <div className="px-3 py-1.5">Item</div>
        <div className="px-1 py-1.5 text-center">Stock</div>
        <div className="px-1 py-1.5 text-center bg-primary/5 text-primary">Today</div>
        <div className="px-1 py-1.5 text-center">3d</div>
        <div className="px-1 py-1.5 text-center">7d</div>
        <div className="px-1 py-1.5 text-center">Trend</div>
        <div className="px-1 py-1.5 text-center">Sugg.</div>
        <div className="px-1 py-1.5 text-center">Days</div>
        <div className="px-1 py-1.5 text-center">Order</div>
      </div>

      {/* ── Scrollable rows ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sorted.map((product) => {
          const status = getStockStatus(product.stock, product.forecast);
          const config = STATUS_CONFIG[status];
          const cat = categories[product.category];
          const threeDay = product.forecast.slice(0, 3).reduce((a, b) => a + b, 0);
          const sevenDay = product.forecast.slice(0, 7).reduce((a, b) => a + b, 0);
          const suggested = getSuggestedOrder(product);
          const qty = getQty(product);
          const isOrdered = orderedItems[product.id];
          const isLoading = loading[product.id];
          const isExpanded = expandedRow === product.id;

          // Past sales data — replace last entry with live salesToday
          const rawHistory = product.salesHistory || Array(7).fill(0);
          const salesHistory = [...rawHistory.slice(0, 6), product.salesToday];
          // Estimated past: use forecast[7..13] as "what was predicted for last week"
          const pastEstimated = product.forecast.slice(7, 14);
          const pastTotal = salesHistory.reduce((a, b) => a + b, 0);
          const avgPast = pastTotal / 7;
          const avgForecast = sevenDay / 7;
          const trendPct = avgPast > 0 ? ((avgForecast - avgPast) / avgPast * 100) : 0;

          return (
            <div key={product.id}>
              {/* ── Row ─────────────────────────────────── */}
              <div
                className={`${COL_GRID} items-center text-xs border-b border-slate-100/80 cursor-pointer transition-all duration-150 ${
                  isOrdered ? 'bg-green-50/80' : isExpanded ? 'bg-primary/[0.03]' : 'hover:bg-slate-50/60'
                }`}
                onClick={() => setExpandedRow(isExpanded ? null : product.id)}
              >
                {/* Item */}
                <div className="px-3 py-2 flex items-center gap-1.5 min-w-0">
                  <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight size={10} className="shrink-0 text-slate-400" />
                  </span>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.dot, boxShadow: `0 0 0 2px white, 0 0 0 3px ${config.dot}40` }} />
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-slate-800">{product.shortName}</p>
                    <p className="text-[9px] text-slate-400 truncate">{product.brand}</p>
                  </div>
                </div>
                {/* Stock */}
                <div className="px-1 py-2 text-center tabular-nums font-bold" style={{ color: config.text }}>
                  {product.stock}
                </div>
                {/* Today */}
                <div className="px-1 py-2 text-center tabular-nums font-bold bg-primary/5 text-primary">
                  {product.salesToday}
                </div>
                {/* 3d */}
                <div className="px-1 py-2 text-center tabular-nums text-slate-600">{threeDay}</div>
                {/* 7d */}
                <div className="px-1 py-2 text-center tabular-nums text-slate-600">{sevenDay}</div>
                {/* Trend */}
                <div className="px-1 py-2 flex items-center justify-center">
                  <Sparkline data={product.forecast} color={cat?.accent || '#3B82F6'} />
                </div>
                {/* Suggested */}
                <div className={`px-1 py-2 text-center tabular-nums font-semibold ${suggested > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {suggested}
                </div>
                {/* Days */}
                <div className="px-1 py-2 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    value={getDays(product.id)}
                    onChange={(e) => setDays(product, e.target.value)}
                    placeholder="d"
                    min="0"
                    className="w-10 h-5 text-center text-[11px] font-bold tabular-nums border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-slate-300"
                  />
                </div>
                {/* Order controls */}
                <div className="px-2 py-2 flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setQty(product.id, qty - 5)}
                    className="w-5 h-5 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 active:scale-90 transition-all"
                  >
                    <Minus size={9} />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(product.id, parseInt(e.target.value) || 0)}
                    className="w-11 h-5 text-center text-[11px] font-bold tabular-nums border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    onClick={() => setQty(product.id, qty + 5)}
                    className="w-5 h-5 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 active:scale-90 transition-all"
                  >
                    <Plus size={9} />
                  </button>
                  {isOrdered ? (
                    <CheckCircle size={16} className="text-green-500 shrink-0 animate-scale-in" />
                  ) : (
                    <button
                      onClick={() => handleOrder(product)}
                      disabled={qty <= 0 || isLoading}
                      className="h-5 px-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-md text-[10px] font-semibold hover:shadow-md hover:shadow-primary/25 disabled:opacity-30 disabled:shadow-none active:scale-95 transition-all flex items-center gap-0.5 shrink-0"
                    >
                      {isLoading ? (
                        <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Truck size={10} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Expanded detail panel ───────────────── */}
              {isExpanded && (
                <div className="animate-fade-in border-b border-slate-200/80 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/50">
                  <div className="px-4 py-3 flex gap-4">
                    {/* Left: Product card */}
                    <div className="shrink-0 flex flex-col items-center gap-2 w-[100px]">
                      <ProductImage
                        product={product}
                        categories={categories}
                        className="w-16 h-16 rounded-xl shadow-sm"
                        size="md"
                      />
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-700">{product.shortName}</p>
                        <p className="text-[9px] text-slate-400">{product.brand}</p>
                        <p className="text-xs font-bold text-primary mt-0.5">{formatPrice(product.price)}</p>
                      </div>
                      <span
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
                      >
                        {config.label}
                      </span>
                    </div>

                    {/* Center: Combined chart */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-4">
                          <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <TrendingUp size={12} className="text-primary" />
                            Sales & Forecast
                          </h4>
                          <div className="flex items-center gap-3 text-[9px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-[2px] rounded" style={{ backgroundColor: cat?.accent || '#3B82F6' }} />
                              Actual
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-[2px] rounded border-t-[2px] border-dashed border-slate-400" />
                              Estimated
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-[2px] rounded border-t-[2px] border-dashed" style={{ borderColor: cat?.accent || '#3B82F6' }} />
                              Forecast
                            </span>
                          </div>
                        </div>
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          trendPct > 5 ? 'bg-red-50 text-red-600' : trendPct < -5 ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {trendPct > 0 ? '↑' : trendPct < 0 ? '↓' : '→'} {Math.abs(trendPct).toFixed(0)}% vs last week
                        </div>
                      </div>

                      <AreaChart
                        pastData={salesHistory}
                        futureData={product.forecast.slice(0, 7)}
                        pastEstData={pastEstimated}
                        pastDates={pastDates}
                        futureDates={futureDates.slice(0, 7)}
                        color={cat?.accent || '#3B82F6'}
                      />

                      {/* Day labels are rendered inside the SVG */}
                    </div>

                    {/* Right: Key metrics */}
                    <div className="shrink-0 w-[140px] flex flex-col gap-1.5">
                      <div className="bg-white rounded-lg border border-slate-100 p-2 shadow-sm">
                        <p className="text-[9px] text-slate-400 font-medium">Past 7 Days</p>
                        <p className="text-lg font-black tabular-nums text-slate-800">{pastTotal}</p>
                        <p className="text-[9px] text-slate-400">avg {avgPast.toFixed(1)}/day</p>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-100 p-2 shadow-sm">
                        <p className="text-[9px] text-slate-400 font-medium">Next 7 Days</p>
                        <p className="text-lg font-black tabular-nums" style={{ color: cat?.accent || '#3B82F6' }}>{sevenDay}</p>
                        <p className="text-[9px] text-slate-400">avg {avgForecast.toFixed(1)}/day</p>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-100 p-2 shadow-sm">
                        <p className="text-[9px] text-slate-400 font-medium flex items-center gap-1"><Package size={9} /> Stock Runway</p>
                        <p className="text-lg font-black tabular-nums text-slate-800">
                          {avgForecast > 0 ? `${Math.floor(product.stock / avgForecast)}d` : '∞'}
                        </p>
                        <p className="text-[9px] text-slate-400">at forecast rate</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Daily breakdown + per-day ordering */}
                  <div className="px-4 pb-3 border-t border-slate-100 pt-3">
                    {/* Section header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Daily Schedule</p>
                        <span className="text-[9px] text-slate-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: cat?.accent, opacity: 0.7 }} /> Actual
                          <span className="w-2 h-2 rounded-sm inline-block ml-1" style={{ backgroundColor: cat?.accent, opacity: 0.3 }} /> Forecast
                        </span>
                      </div>
                      {/* Current stock pill */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border" style={{ color: config.text, backgroundColor: config.bg, borderColor: config.border }}>
                          Stock: {product.stock}
                        </span>
                        {/* Auto-order config button */}
                        <button
                          onClick={() => setAutoConfigOpen(autoConfigOpen === product.id ? null : product.id)}
                          className={`flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                            getAutoConfig(product.id).enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Settings size={9} />
                          Auto-Order {getAutoConfig(product.id).enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Auto-order config popup */}
                    {autoConfigOpen === product.id && (
                      <AutoOrderConfigPanel
                        config={getAutoConfig(product.id)}
                        onChange={(updates) => setAutoConfig(product.id, updates)}
                        onClose={() => setAutoConfigOpen(null)}
                        accent={cat?.accent || '#3B82F6'}
                        product={product}
                      />
                    )}

                    <div className="flex gap-[3px] overflow-x-auto">
                      {/* Past days */}
                      {salesHistory.map((val, i) => {
                        const maxVal = Math.max(...salesHistory, ...product.forecast.slice(0, 7));
                        const barH = maxVal > 0 ? (val / maxVal) * 28 : 0;
                        return (
                          <div key={`past-${i}`} className="flex flex-col items-center gap-0.5 flex-1 min-w-[32px]">
                            <span className="text-[8px] font-bold tabular-nums text-slate-600">{val}</span>
                            <div className="w-full h-7 bg-slate-100 rounded-sm overflow-hidden flex items-end">
                              <div className="w-full rounded-sm transition-all" style={{ height: barH, backgroundColor: cat?.accent || '#3B82F6', opacity: 0.7 }} />
                            </div>
                            <span className={`text-[7px] ${isWeekend(pastDates[i]) ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                              {formatDate(pastDates[i])}
                            </span>
                          </div>
                        );
                      })}

                      <div className="w-px bg-slate-300 mx-1 shrink-0 self-stretch" />

                      {/* Future days with ordering */}
                      {product.forecast.slice(0, 7).map((val, i) => {
                        const maxVal = Math.max(...salesHistory, ...product.forecast.slice(0, 7));
                        const barH = maxVal > 0 ? (val / maxVal) * 28 : 0;
                        const dayOrder = getDayOrder(product.id, i);
                        const isSent = dayOrder.sent;
                        const inputQty = dayOrder.qty || val;

                        return (
                          <div key={`fut-${i}`} className={`flex flex-col items-center gap-0.5 flex-1 min-w-[44px] rounded-md pb-1 ${isSent ? 'bg-emerald-50/60' : ''}`}>
                            <span className="text-[8px] font-bold tabular-nums text-slate-400">{val}</span>
                            <div className="w-full h-7 bg-slate-100 rounded-sm overflow-hidden flex items-end">
                              <div className="w-full rounded-sm transition-all" style={{ height: barH, backgroundColor: cat?.accent || '#3B82F6', opacity: 0.35 }} />
                            </div>
                            <span className={`text-[7px] ${isWeekend(futureDates[i]) ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                              {formatDate(futureDates[i])}
                            </span>

                            {/* Order input + send */}
                            {isSent ? (
                              <div className="flex flex-col items-center gap-0.5 w-full px-0.5">
                                <span className="text-[8px] font-bold text-emerald-600 tabular-nums">{dayOrder.qty} ordered</span>
                                <button
                                  onClick={() => modifyDayOrder(product.id, i)}
                                  className="w-full text-[7px] text-slate-400 hover:text-primary flex items-center justify-center gap-0.5 transition-colors"
                                >
                                  <RotateCcw size={7} /> Modify
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-0.5 w-full px-0.5">
                                <input
                                  type="number"
                                  value={inputQty}
                                  onChange={(e) => setDayOrderQty(product.id, i, parseInt(e.target.value) || 0)}
                                  className="w-full h-5 text-center text-[9px] font-bold tabular-nums border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                                <button
                                  onClick={() => sendDayOrder(product, i, val)}
                                  className="w-full h-4 text-[7px] font-bold rounded flex items-center justify-center gap-0.5 transition-all"
                                  style={{ backgroundColor: `${cat?.accent}20`, color: cat?.accent }}
                                >
                                  <Send size={7} /> Send
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Search size={24} className="mb-2 opacity-40" />
            <p className="text-sm">No items match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
