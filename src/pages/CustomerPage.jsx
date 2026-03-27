import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, ShoppingCart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getRelativeTime, formatPrice, getStockStatus } from '../store/helpers';
import ProductImage from '../components/shared/ProductImage';
import StockBadge from '../components/shared/StockBadge';

export default function CustomerPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const lastUpdated = useStore((s) => s.lastUpdated);

  return (
    <div className="flex-1 flex items-start justify-center bg-gradient-to-b from-slate-100 to-slate-200 p-8 overflow-y-auto">
      {/* Phone frame */}
      <div className="relative">
        {/* Phone bezel */}
        <div className="w-[393px] bg-[#1A1A1A] rounded-[48px] p-[12px] shadow-[0_25px_50px_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.10)]">
          {/* Dynamic island */}
          <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-full z-20" />

          {/* Screen */}
          <div className="w-full h-[810px] bg-white rounded-[40px] overflow-hidden flex flex-col">
            <PhoneContent
              products={products}
              categories={categories}
              lastUpdated={lastUpdated}
            />
          </div>
        </div>

        {/* Label */}
        <p className="text-center text-xs text-slate-400 mt-4">Customer View — as seen on mobile</p>
      </div>
    </div>
  );
}

function PhoneContent({ products, categories, lastUpdated }) {
  const [search, setSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});

  const categoryOrder = ['beverages', 'snacks', 'dairy', 'bakery', 'noodles_rice', 'canned_cooking', 'frozen'];

  const filteredByCategory = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = search.trim()
      ? products.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
      : products;

    const grouped = {};
    categoryOrder.forEach((catKey) => {
      const items = filtered.filter((p) => p.category === catKey);
      if (items.length > 0) grouped[catKey] = items;
    });
    return grouped;
  }, [products, search]);

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalItems = products.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pt-14 px-5 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-primary" />
          <span className="font-bold text-lg tracking-tight">SuperMart</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
          <span className="text-[11px] text-slate-500">Live Menu</span>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full h-9 pl-8 pr-3 bg-slate-100 rounded-full text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {Object.keys(filteredByCategory).length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-slate-400 gap-2">
            <Search size={32} strokeWidth={1} />
            <p className="text-xs">No items match your search</p>
          </div>
        ) : (
          Object.entries(filteredByCategory).map(([catKey, items]) => {
            const cat = categories[catKey];
            const isCollapsed = collapsedSections[catKey];
            const availableCount = items.filter((p) => p.stock > 0).length;

            return (
              <div key={catKey}>
                {/* Category header */}
                <button
                  onClick={() => toggleSection(catKey)}
                  className="w-full flex items-center gap-2 mb-2"
                >
                  <div className="w-[3px] h-4 rounded-full" style={{ backgroundColor: cat?.accent }} />
                  <span className="text-[13px] font-semibold flex-1 text-left">{cat?.label}</span>
                  <span className="text-[10px] text-slate-400">({availableCount})</span>
                  {isCollapsed ? <ChevronRight size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </button>

                {/* Items grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {items.map((product) => (
                      <CustomerItemCard key={product.id} product={product} categories={categories} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400">
          Updated {getRelativeTime(lastUpdated)} · {totalItems} items
        </p>
      </div>
    </div>
  );
}

function CustomerItemCard({ product, categories }) {
  const status = getStockStatus(product.stock, product.forecast);
  const isSoldOut = status === 'soldout';
  const cat = categories[product.category];

  return (
    <div
      className={`bg-white rounded-[10px] overflow-hidden shadow-sm transition-all ${
        isSoldOut ? 'opacity-50' : ''
      } ${
        status === 'critical' ? 'ring-1 ring-red-200' : ''
      } ${
        status === 'low' ? 'ring-1 ring-amber-200' : ''
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <ProductImage
          product={product}
          categories={categories}
          className={`w-full h-full ${isSoldOut ? 'grayscale' : ''}`}
        />
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-white text-[10px] font-bold uppercase tracking-[0.1em]">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 pt-2 pb-0">
        <p className="text-[9px] uppercase tracking-wider text-slate-400">{product.brand}</p>
        <p className="text-[12px] font-semibold leading-tight line-clamp-2 min-h-[2rem]">{product.shortName}</p>
        <p className="text-[13px] font-semibold mt-0.5">{formatPrice(product.price)}</p>
      </div>

      {/* Badge */}
      <div className="mt-1.5">
        <StockBadge stock={product.stock} forecast={product.forecast} variant="customer" />
      </div>
    </div>
  );
}
