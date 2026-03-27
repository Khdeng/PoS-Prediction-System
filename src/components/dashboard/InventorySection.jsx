import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { getStockStatus } from '../../store/helpers';
import InventoryCard from './InventoryCard';

export default function InventorySection({ products, categories }) {
  const [collapsed, setCollapsed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('stock-asc');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let items = [...products];

    if (categoryFilter !== 'all') {
      items = items.filter((p) => p.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      items = items.filter((p) => getStockStatus(p.stock, p.forecast) === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
      );
    }

    switch (sortBy) {
      case 'stock-asc': items.sort((a, b) => a.stock - b.stock); break;
      case 'stock-desc': items.sort((a, b) => b.stock - a.stock); break;
      case 'sales-desc': items.sort((a, b) => b.salesToday - a.salesToday); break;
      case 'name': items.sort((a, b) => a.shortName.localeCompare(b.shortName)); break;
    }

    return items;
  }, [products, categoryFilter, statusFilter, sortBy, search]);

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <h2 className="text-base font-semibold">Real-Time Inventory</h2>
        {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-primary w-44"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-primary bg-white"
            >
              <option value="all">All Categories</option>
              {Object.entries(categories).map(([key, cat]) => (
                <option key={key} value={key}>{cat.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-primary bg-white"
            >
              <option value="all">All Status</option>
              <option value="critical">Critical</option>
              <option value="low">Low Stock</option>
              <option value="moderate">Moderate</option>
              <option value="stable">Stable</option>
              <option value="overstocked">Overstocked</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-primary bg-white"
            >
              <option value="stock-asc">Stock: Low → High</option>
              <option value="stock-desc">Stock: High → Low</option>
              <option value="sales-desc">Sales Today: High → Low</option>
              <option value="name">Name: A → Z</option>
            </select>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {filtered.map((product) => (
              <InventoryCard key={product.id} product={product} categories={categories} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No items match your filters</p>
          )}
        </div>
      )}
    </section>
  );
}
