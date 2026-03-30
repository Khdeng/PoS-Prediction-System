import { useState } from 'react';
import { TrendingUp, ArrowUpDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getStockStatus, STATUS_CONFIG, formatPrice } from '../../store/helpers';
import ProductImage from '../shared/ProductImage';

export default function InventoryCard({ product, categories }) {
  const adjustStock = useStore((s) => s.adjustStock);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustValue, setAdjustValue] = useState(product.stock);

  const status = getStockStatus(product.stock, product.forecast);
  const config = STATUS_CONFIG[status];
  const cat = categories[product.category];
  const stockPercent = product.initialStock > 0
    ? Math.min(100, Math.round((product.stock / product.initialStock) * 100))
    : 0;

  const handleSaveAdjust = () => {
    adjustStock(product.id, adjustValue);
    setShowAdjust(false);
  };

  const quickAdjust = (delta) => {
    const newVal = Math.max(0, product.stock + delta);
    adjustStock(product.id, newVal);
    setAdjustValue(newVal);
  };

  return (
    <div
      className="bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md group"
      style={{ borderLeftWidth: 3, borderLeftColor: cat?.accent }}
    >
      <div className="p-2.5 space-y-2">
        {/* Header */}
        <div className="flex items-start gap-2">
          <ProductImage
            product={product}
            categories={categories}
            className="w-9 h-9 rounded-lg shrink-0 shadow-sm"
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">{product.brand}</p>
            <p className="text-[11px] font-bold truncate text-slate-800">{product.shortName}</p>
          </div>
        </div>

        {/* Stock count + bar */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tabular-nums" style={{ color: config.text }}>
            {product.stock}
          </span>
          <div className="flex-1">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${stockPercent}%`, backgroundColor: config.dot }}
              />
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                <TrendingUp size={8} /> {product.salesToday} today
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: config.dot }} />
                <span className="text-[9px] font-semibold" style={{ color: config.text }}>{config.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Adjust button / popover */}
        {!showAdjust ? (
          <button
            onClick={() => { setShowAdjust(true); setAdjustValue(product.stock); }}
            className="w-full h-6 text-[10px] font-medium text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg border border-transparent hover:border-primary/20 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
          >
            <ArrowUpDown size={10} /> Adjust
          </button>
        ) : (
          <div className="space-y-1.5 p-1.5 bg-slate-50 rounded-lg animate-fade-in">
            <div className="flex items-center justify-center gap-1">
              {[-10, -5, -1].map((d) => (
                <button
                  key={d}
                  onClick={() => quickAdjust(d)}
                  className="h-5 px-1.5 text-[9px] font-semibold bg-white border border-slate-200 rounded-md hover:bg-red-50 hover:border-red-200 hover:text-red-600 active:scale-95 transition-all"
                >
                  {d}
                </button>
              ))}
              <input
                type="number"
                value={adjustValue}
                onChange={(e) => setAdjustValue(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 h-5 text-center text-[10px] font-bold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {[+1, +5, +10].map((d) => (
                <button
                  key={d}
                  onClick={() => quickAdjust(d)}
                  className="h-5 px-1.5 text-[9px] font-semibold bg-white border border-slate-200 rounded-md hover:bg-green-50 hover:border-green-200 hover:text-green-600 active:scale-95 transition-all"
                >
                  +{d}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setShowAdjust(false)}
                className="flex-1 h-5 text-[9px] font-medium border border-slate-200 rounded-md hover:bg-slate-100 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjust}
                className="flex-1 h-5 text-[9px] font-semibold bg-gradient-to-r from-primary to-blue-600 text-white rounded-md hover:shadow-md active:scale-95 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
