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
      className="bg-white rounded-lg border overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: 3, borderLeftColor: cat?.accent }}
    >
      <div className="p-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          <ProductImage
            product={product}
            categories={categories}
            className="w-10 h-10 rounded-md shrink-0"
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">{product.brand}</p>
            <p className="text-xs font-semibold truncate">{product.shortName}</p>
            <span
              className="inline-block mt-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: cat?.color, color: cat?.textColor }}
            >
              {cat?.label}
            </span>
          </div>
        </div>

        {/* Stock count */}
        <div className="text-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color: config.text }}>
            {product.stock}
          </span>
          <p className="text-[10px] text-slate-400">available</p>
        </div>

        {/* Stock bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${stockPercent}%`, backgroundColor: config.dot }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 flex items-center gap-1">
            <TrendingUp size={11} />
            Sales Today: <strong className="text-slate-700">{product.salesToday}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.dot }} />
            <span style={{ color: config.text }}>{config.label}</span>
          </span>
        </div>

        {/* Adjust button / popover */}
        {!showAdjust ? (
          <button
            onClick={() => { setShowAdjust(true); setAdjustValue(product.stock); }}
            className="w-full h-7 text-[11px] font-medium text-slate-500 hover:text-primary hover:bg-primary-light rounded-md border border-slate-200 hover:border-primary/30 transition-colors flex items-center justify-center gap-1"
          >
            <ArrowUpDown size={11} /> Adjust Stock
          </button>
        ) : (
          <div className="space-y-2 p-2 bg-slate-50 rounded-md">
            <div className="flex items-center justify-center gap-1.5">
              {[-10, -5, -1].map((d) => (
                <button
                  key={d}
                  onClick={() => quickAdjust(d)}
                  className="h-6 px-2 text-[10px] font-medium bg-white border border-slate-200 rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                >
                  {d}
                </button>
              ))}
              <input
                type="number"
                value={adjustValue}
                onChange={(e) => setAdjustValue(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 h-6 text-center text-xs font-semibold border border-slate-300 rounded focus:outline-none focus:border-primary"
              />
              {[+1, +5, +10].map((d) => (
                <button
                  key={d}
                  onClick={() => quickAdjust(d)}
                  className="h-6 px-2 text-[10px] font-medium bg-white border border-slate-200 rounded hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors"
                >
                  +{d}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowAdjust(false)}
                className="flex-1 h-6 text-[10px] font-medium border border-slate-200 rounded hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjust}
                className="flex-1 h-6 text-[10px] font-medium bg-primary text-white rounded hover:bg-primary-hover transition-colors"
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
