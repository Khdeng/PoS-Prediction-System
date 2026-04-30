import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, ShoppingCart, MapPin, Shuffle, Bookmark, BookmarkCheck, X, Clock, Users, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getRelativeTime, formatPrice, getStockStatus } from '../store/helpers';
import ProductImage from '../components/shared/ProductImage';
import StockBadge from '../components/shared/StockBadge';
import StoreFinderModal from '../components/customer/StoreFinderModal';

function usePhoneToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

function PhoneToastContainer({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div className="absolute top-16 left-3 right-3 z-50 flex flex-col gap-1.5 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="bg-slate-900/90 text-white rounded-xl px-3 py-2.5 flex items-start gap-2 shadow-lg animate-slide-in-right backdrop-blur-sm">
          <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold leading-snug">{t.message}</p>
        </div>
      ))}
    </div>
  );
}

const SIMILAR_ITEMS = {
  item_001: ['item_059'],
  item_059: ['item_001'],
  item_006: ['item_060'],
  item_060: ['item_006'],
  item_009: ['item_061'],
  item_061: ['item_009'],
  item_017: ['item_065'],
  item_065: ['item_017'],
  item_027: ['item_062'],
  item_029: ['item_062'],
  item_062: ['item_027', 'item_029'],
  item_035: ['item_063'],
  item_063: ['item_035'],
  item_038: ['item_064'],
  item_040: ['item_064'],
  item_064: ['item_038', 'item_040'],
  item_054: ['item_066'],
  item_052: ['item_066'],
  item_066: ['item_052', 'item_054'],
};

// Deterministic fake "others watching" count per product (excludes current user)
function getWatcherCount(productId, isWatched = false) {
  const hash = productId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = (hash % 15) + 3;
  return isWatched ? base + 1 : base;
}

// Format 3-hour expiry display
function getExpiryText(createdAt) {
  if (!createdAt) return null;
  const expiresAt = new Date(new Date(createdAt).getTime() + 3 * 60 * 60 * 1000);
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CustomerPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const lastUpdated = useStore((s) => s.lastUpdated);
  const watchlist = useStore((s) => s.watchlist);
  const watchlistLastStock = useStore((s) => s.watchlistLastStock);
  const [finderProduct, setFinderProduct] = useState(null);
  const { toasts, show: showPhoneToast } = usePhoneToast();

  // Fire notifications whenever watchlistLastStock differs from current stock
  // This covers both: navigating back to this page AND live changes in same session
  const processedRef = useRef(null);
  useEffect(() => {
    if (products.length === 0 || processedRef.current === lastUpdated) return;
    processedRef.current = lastUpdated;
    products.forEach((p) => {
      if (!watchlist.includes(p.id)) return;
      const lastStock = watchlistLastStock[p.id];
      if (lastStock === undefined || lastStock === p.stock) return;
      const status = getStockStatus(p.stock, p.forecast);
      if (p.stock === 0) {
        showPhoneToast(`${p.shortName} is now out of stock`);
      } else if (status === 'critical' || status === 'low') {
        showPhoneToast(`${p.shortName} — only ${p.stock} left now`);
      }
    });
  }, [lastUpdated, products, watchlist, watchlistLastStock]);

  return (
    <div className="flex-1 flex items-start justify-center bg-gradient-to-b from-slate-100 to-slate-200 p-8 overflow-y-auto">
      {/* Phone frame */}
      <div className="relative">
        <div className="w-[393px] bg-[#1A1A1A] rounded-[48px] p-[12px] shadow-[0_25px_50px_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.10)]">
          {/* Dynamic island */}
          <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-full z-20" />

          {/* Screen */}
          <div className="w-full h-[810px] bg-white rounded-[40px] overflow-hidden flex flex-col relative">
            <PhoneToastContainer toasts={toasts} />
            <PhoneContent
              products={products}
              categories={categories}
              lastUpdated={lastUpdated}
              onFindNearby={setFinderProduct}
            />
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">Customer View — as seen on mobile</p>
      </div>

      {finderProduct && (
        <StoreFinderModal
          product={finderProduct}
          categories={categories}
          onClose={() => setFinderProduct(null)}
        />
      )}
    </div>
  );
}

function PhoneContent({ products, categories, lastUpdated, onFindNearby }) {
  const [search, setSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const scrollRef = useRef(null);
  const cardRefs = useRef({});

  const watchlist = useStore((s) => s.watchlist);
  const watchlistCreatedAt = useStore((s) => s.watchlistCreatedAt);
  const clearWatchlist = useStore((s) => s.clearWatchlist);

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

  const watchedProducts = useMemo(
    () => watchlist.map((id) => products.find((p) => p.id === id)).filter(Boolean),
    [watchlist, products]
  );

  const expiryText = getExpiryText(watchlistCreatedAt);

  const navigateToProduct = (productId) => {
    // Ensure the product's category section is expanded
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCollapsedSections((prev) => ({ ...prev, [product.category]: false }));
    setHighlightId(productId);
    // Scroll after next paint so the section is visible
    setTimeout(() => {
      const el = cardRefs.current[productId];
      if (el && scrollRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => setHighlightId(null), 1500);
    }, 50);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="pt-14 px-5 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-primary" />
          <span className="font-bold text-lg tracking-tight flex-1">HKUST Fusion</span>
          {/* Watchlist button */}
          <button
            onClick={() => setShowWatchlist((v) => !v)}
            className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bookmark size={18} className={watchlist.length > 0 ? 'text-primary fill-primary/20' : 'text-slate-400'} />
            {watchlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {watchlist.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
          <span className="text-[11px] text-slate-500">Live Menu</span>
        </div>
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
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
                <button
                  onClick={() => toggleSection(catKey)}
                  className="w-full flex items-center gap-2 mb-2"
                >
                  <div className="w-[3px] h-4 rounded-full" style={{ backgroundColor: cat?.accent }} />
                  <span className="text-[13px] font-semibold flex-1 text-left">{cat?.label}</span>
                  <span className="text-[10px] text-slate-400">({availableCount})</span>
                  {isCollapsed ? <ChevronRight size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {items.map((product) => (
                      <CustomerItemCard
                        key={product.id}
                        product={product}
                        products={products}
                        categories={categories}
                        onFindNearby={onFindNearby}
                        onNavigate={navigateToProduct}
                        isHighlighted={highlightId === product.id}
                        cardRef={(el) => { cardRefs.current[product.id] = el; }}
                      />
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
          Updated {getRelativeTime(lastUpdated)} · {products.length} items
        </p>
      </div>

      {/* Watchlist panel — slides up from bottom inside phone */}
      {showWatchlist && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end rounded-[40px] overflow-hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowWatchlist(false)} />

          {/* Panel */}
          <div className="relative bg-white rounded-t-[24px] max-h-[70%] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-8 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Panel header */}
            <div className="px-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <BookmarkCheck size={14} className="text-primary" />
                  My Watchlist
                  {watchlist.length > 0 && (
                    <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      {watchlist.length}
                    </span>
                  )}
                </h3>
                {/* System message */}
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock size={9} />
                  {watchlist.length > 0 && expiryText
                    ? `Clears in ${expiryText} · Demo: auto-clears every 3 hours`
                    : 'Demo: watchlist auto-clears every 3 hours'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {watchlist.length > 0 && (
                  <button
                    onClick={clearWatchlist}
                    className="text-[10px] text-slate-400 hover:text-red-500 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowWatchlist(false)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Watchlist items */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {watchedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
                  <Bookmark size={28} strokeWidth={1} />
                  <p className="text-xs text-slate-400 text-center">
                    Tap the bookmark on any product to watch its stock
                  </p>
                </div>
              ) : (
                watchedProducts.map((p) => {
                  const status = getStockStatus(p.stock, p.forecast);
                  const isSoldOut = status === 'soldout';
                  const isLow = status === 'critical' || status === 'low';
                  const watcherCount = getWatcherCount(p.id, true);

                  return (
                    <WatchlistItem
                      key={p.id}
                      product={p}
                      categories={categories}
                      isSoldOut={isSoldOut}
                      isLow={isLow}
                      watcherCount={watcherCount}
                      onFindNearby={() => {
                        setShowWatchlist(false);
                        onFindNearby(p);
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WatchlistItem({ product, categories, isSoldOut, isLow, watcherCount, onFindNearby }) {
  const toggleWatchlist = useStore((s) => s.toggleWatchlist);

  return (
    <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
      isSoldOut ? 'bg-slate-50 border-slate-200' : isLow ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'
    }`}>
      <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 ${isSoldOut ? 'opacity-50 grayscale' : ''}`}>
        <ProductImage product={product} categories={categories} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-800 truncate">{product.shortName}</p>
        <p className="text-[10px] text-slate-400">{formatPrice(product.price)}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <StockBadge stock={product.stock} forecast={product.forecast} variant="default" showCount />
          {(isLow || isSoldOut) && (
            <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
              <Users size={8} />
              {watcherCount} watching
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={() => toggleWatchlist(product.id)}
          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <X size={11} className="text-slate-400" />
        </button>
        {(isLow || isSoldOut) && (
          <button
            onClick={onFindNearby}
            className="text-[9px] font-semibold text-primary flex items-center gap-0.5"
          >
            <MapPin size={8} />
            Nearby
          </button>
        )}
      </div>
    </div>
  );
}

function CustomerItemCard({ product, products, categories, onFindNearby, onNavigate, isHighlighted, cardRef }) {
  const [showSimilar, setShowSimilar] = useState(false);
  const watchlist = useStore((s) => s.watchlist);
  const toggleWatchlist = useStore((s) => s.toggleWatchlist);

  const status = getStockStatus(product.stock, product.forecast);
  const isSoldOut = status === 'soldout';
  const isLow = status === 'critical' || status === 'low';
  const isWatched = watchlist.includes(product.id);
  const watcherCount = getWatcherCount(product.id, isWatched);

  const similarProducts = useMemo(() => {
    const ids = SIMILAR_ITEMS[product.id] || [];
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  }, [product.id, products]);

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-[10px] overflow-hidden shadow-sm transition-all ${
        isHighlighted ? 'ring-2 ring-primary shadow-md' : status === 'critical' ? 'ring-1 ring-red-200' : status === 'low' ? 'ring-1 ring-amber-200' : ''
      }`}
    >
      {/* Image with bookmark button */}
      <div className={`relative aspect-[4/3] ${isSoldOut ? 'opacity-50' : ''}`}>
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
        {/* Bookmark button */}
        <button
          onClick={() => toggleWatchlist(product.id)}
          className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
            isWatched ? 'bg-primary text-white shadow-sm' : 'bg-white/80 text-slate-400 hover:bg-white hover:text-primary'
          }`}
        >
          <Bookmark size={11} className={isWatched ? 'fill-white' : ''} />
        </button>
      </div>

      {/* Info */}
      <div className={`px-2.5 pt-2 pb-0 ${isSoldOut ? 'opacity-50' : ''}`}>
        <p className="text-[9px] uppercase tracking-wider text-slate-400">{product.brand}</p>
        <p className="text-[12px] font-semibold leading-tight line-clamp-2 min-h-[2rem]">{product.shortName}</p>
        <p className="text-[13px] font-semibold mt-0.5">{formatPrice(product.price)}</p>
      </div>

      {/* Badge + watchers */}
      <div className="mt-1.5">
        <StockBadge stock={product.stock} forecast={product.forecast} variant="customer" />
        {isLow && !isSoldOut && (
          <p className="text-[9px] text-slate-400 text-center mt-0.5 flex items-center justify-center gap-1">
            <Users size={8} />
            {watcherCount} people watching
          </p>
        )}
      </div>

      {/* Action buttons */}
      {(isSoldOut || isLow) && (
        <div className="px-2 pb-2 pt-1 flex gap-1">
          <button
            onClick={() => onFindNearby(product)}
            className="flex-1 h-7 text-[10px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <MapPin size={10} />
            Nearby
          </button>
          {similarProducts.length > 0 && (
            <button
              onClick={() => setShowSimilar((v) => !v)}
              className={`flex-1 h-7 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                showSimilar
                  ? 'text-violet-700 bg-violet-100'
                  : 'text-violet-600 bg-violet-50 hover:bg-violet-100'
              }`}
            >
              <Shuffle size={10} />
              Similar
            </button>
          )}
        </div>
      )}

      {/* Similar items panel */}
      {showSimilar && similarProducts.length > 0 && (
        <div className="border-t border-slate-100 px-2 pb-2 pt-1.5 space-y-1.5">
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Similar items</p>
          {similarProducts.map((sim) => {
            const simStatus = getStockStatus(sim.stock, sim.forecast);
            const simAvailable = simStatus !== 'soldout';
            return (
              <button
                key={sim.id}
                onClick={() => { setShowSimilar(false); onNavigate(sim.id); }}
                className="w-full flex items-center gap-2 hover:bg-slate-50 rounded-lg p-0.5 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                  <ProductImage product={sim} categories={categories} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[10px] font-semibold text-slate-700 truncate">{sim.shortName}</p>
                  <p className="text-[10px] text-slate-400">{formatPrice(sim.price)}</p>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    simAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {simAvailable ? `${sim.stock} left` : 'Out'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
