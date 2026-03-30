import { useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { getStockStatus } from '../../store/helpers';
import ProductImage from '../shared/ProductImage';
import StockBadge from '../shared/StockBadge';
import { formatPrice } from '../../store/helpers';

export default function ProductTile({ product, categories }) {
  const addToOrder = useStore((s) => s.addToOrder);
  const currentOrder = useStore((s) => s.currentOrder);
  const [floatKey, setFloatKey] = useState(null);

  const orderItem = currentOrder.find((o) => o.productId === product.id);
  const qtyInCart = orderItem?.qty || 0;
  const status = getStockStatus(product.stock, product.forecast);
  const isSoldOut = status === 'soldout';
  const cat = categories[product.category];

  const handleClick = useCallback(() => {
    if (isSoldOut || qtyInCart >= product.stock) return;
    addToOrder(product.id);
    setFloatKey(Date.now());
  }, [addToOrder, product.id, product.stock, isSoldOut, qtyInCart]);

  return (
    <button
      onClick={handleClick}
      disabled={isSoldOut}
      className={`relative bg-white rounded-xl overflow-hidden text-left transition-all duration-200 group border border-slate-200/60
        ${isSoldOut
          ? 'opacity-40 grayscale cursor-not-allowed'
          : 'shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer'
        }
        ${status === 'critical' ? 'ring-1 ring-red-400/50' : ''}
        ${status === 'low' ? 'ring-1 ring-amber-400/50' : ''}
      `}
      aria-label={`Add ${product.brand} ${product.shortName}, ${formatPrice(product.price)}, ${product.stock} in stock`}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <ProductImage
          product={product}
          categories={categories}
          className="w-full h-full group-hover:scale-[1.04] transition-transform duration-300"
        />
        {/* Category accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${cat?.accent}, ${cat?.accent}88)` }}
        />
        {/* Qty in cart badge */}
        {qtyInCart > 0 && (
          <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-scale-in">
            {qtyInCart}
          </div>
        )}
        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-900/60 backdrop-blur-[2px]">
            <span className="text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/20">Sold Out</span>
          </div>
        )}
      </div>

      {/* Text area */}
      <div className="p-2.5 space-y-1">
        <p className="text-[9px] uppercase tracking-widest text-slate-400 leading-none truncate font-medium">
          {product.brand}
        </p>
        <p className="text-[13px] font-bold leading-tight line-clamp-2 min-h-[2.25rem] text-slate-800">
          {product.shortName}
        </p>
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-sm font-bold tabular-nums text-slate-900">{formatPrice(product.price)}</span>
          <StockBadge stock={product.stock} forecast={product.forecast} />
        </div>
      </div>

      {/* Float +1 animation */}
      {floatKey && (
        <span
          key={floatKey}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 text-blue-500 font-black text-lg pointer-events-none animate-float-up drop-shadow-sm"
          onAnimationEnd={() => setFloatKey(null)}
        >
          +1
        </span>
      )}
    </button>
  );
}
