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
    <div className="flex flex-1 overflow-hidden">
      {/* Product area */}
      <div className="flex-1 flex flex-col min-w-0 p-4 gap-3 overflow-hidden">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or scan SKU..."
            className="w-full h-11 pl-9 pr-9 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium transition-all border ${
              activeCategory === 'all'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            All ({categoryCounts.all})
          </button>
          {categoryEntries.map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(activeCategory === key ? 'all' : key)}
              className="shrink-0 h-8 px-3 rounded-full text-xs font-medium transition-all border"
              style={
                activeCategory === key
                  ? { backgroundColor: cat.accent, color: '#fff', borderColor: cat.accent }
                  : { backgroundColor: '#fff', color: cat.textColor, borderColor: cat.accent + '60' }
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
