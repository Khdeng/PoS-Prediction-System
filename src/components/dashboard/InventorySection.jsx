import { useState, useMemo } from 'react';
import { Search, Package } from 'lucide-react';
import { getStockStatus } from '../../store/helpers';
import InventoryCard from './InventoryCard';

export default function InventorySection({ products, categories }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let items = [...products];
    if (categoryFilter !== 'all') items = items.filter((p) => p.category === categoryFilter);
    if (statusFilter !== 'all') items = items.filter((p) => getStockStatus(p.stock, p.forecast) === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    items.sort((a, b) => a.stock - b.stock);
    return items;
  }, [products, categoryFilter, statusFilter, search]);

  return (
    <div className="flex flex-col min-h-0 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
      {/* Header + Filters */}
      <div className="shrink-0 px-3 py-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 space-y-1.5">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-primary" />
          <h2 className="text-sm font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Inventory</h2>
          <span className="ml-auto text-[10px] font-medium text-slate-400 tabular-nums">{filtered.length} items</span>
        </div>
        <div className="relative group">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full h-7 pl-7 pr-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 h-6 px-1.5 text-[10px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
          >
            <option value="all">All Cat.</option>
            {Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 h-6 px-1.5 text-[10px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
          >
            <option value="all">All Status</option>
            <option value="critical">Critical</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="stable">Stable</option>
            <option value="overstocked">Over</option>
          </select>
        </div>
      </div>

      {/* Scrollable card area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.map((product) => (
          <InventoryCard key={product.id} product={product} categories={categories} />
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-6 text-slate-400">
            <Package size={20} className="mb-1 opacity-40" />
            <p className="text-[11px]">No matches</p>
          </div>
        )}
      </div>
    </div>
  );
}
