import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import ProductTile from '../components/pos/ProductTile';
import OrderPanel from '../components/pos/OrderPanel';
import ToastContainer from '../components/shared/Toast';

export default function PosPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearch('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() => {
    let items = products;
    if (activeCategory !== 'all') {
      items = items.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
    }
    return items;
  }, [products, activeCategory, search]);

  const categoryEntries = Object.entries(categories);
  const categoryCounts = useMemo(() => {
    const counts = { all: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-50/50">
      {/* Product area */}
      <div className="flex-1 flex flex-col min-w-0 p-4 gap-3 overflow-hidden">
        {/* Search */}
        <div className="relative group">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or scan SKU..."
            className="w-full h-10 pl-10 pr-9 bg-white border border-slate-200/80 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 h-7 px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            All ({categoryCounts.all})
          </button>
          {categoryEntries.map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(activeCategory === key ? 'all' : key)}
              className="shrink-0 h-7 px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 shadow-sm"
              style={
                activeCategory === key
                  ? { background: `linear-gradient(135deg, ${cat.accent}, ${cat.accent}dd)`, color: '#fff', boxShadow: `0 4px 12px ${cat.accent}40` }
                  : { backgroundColor: '#fff', color: cat.textColor, border: `1px solid ${cat.accent}30` }
              }
            >
              {cat.label} ({categoryCounts[key] || 0})
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <Search size={40} strokeWidth={1} />
              <p className="text-sm">No items match &ldquo;{search}&rdquo;</p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('all'); }}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {filtered.map((product) => (
                <ProductTile key={product.id} product={product} categories={categories} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order panel */}
      <OrderPanel />
      <ToastContainer />
    </div>
  );
}
