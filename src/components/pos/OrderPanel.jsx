import { useState } from 'react';
import { ShoppingCart, Minus, Plus, X, CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatPrice } from '../../store/helpers';
import ProductImage from '../shared/ProductImage';
import { showToast } from '../shared/Toast';

export default function OrderPanel() {
  const currentOrder = useStore((s) => s.currentOrder);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const updateOrderQty = useStore((s) => s.updateOrderQty);
  const removeFromOrder = useStore((s) => s.removeFromOrder);
  const clearOrder = useStore((s) => s.clearOrder);
  const checkout = useStore((s) => s.checkout);
  const [showSuccess, setShowSuccess] = useState(false);

  const orderTotal = currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = currentOrder.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = () => {
    if (currentOrder.length === 0) return;
    const order = checkout();
    setShowSuccess(true);
    showToast(`Order completed — ${formatPrice(order.total)}`);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const handleClear = () => {
    if (currentOrder.length === 0) return;
    if (window.confirm('Clear all items from the order?')) {
      clearOrder();
    }
  };

  return (
    <div className="w-[300px] shrink-0 bg-white border-l border-slate-200/60 flex flex-col">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={15} className="text-slate-500" />
          <span className="font-bold text-sm text-slate-800">Current Order</span>
          {itemCount > 0 && (
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {itemCount}
            </span>
          )}
        </div>
        {currentOrder.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[11px] text-slate-400 hover:text-red-500 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Order items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <CheckCircle size={48} className="text-emerald-500 animate-scale-in" />
            <p className="text-sm font-semibold text-emerald-700">Order Complete!</p>
          </div>
        ) : currentOrder.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 px-4">
            <ShoppingCart size={36} strokeWidth={1} />
            <p className="text-xs text-center text-slate-400">Tap a product to add it to the order</p>
          </div>
        ) : (
          currentOrder.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return null;
            return (
              <OrderLineItem
                key={item.productId}
                item={item}
                product={product}
                categories={categories}
                onUpdateQty={updateOrderQty}
                onRemove={removeFromOrder}
              />
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200/60 p-4 space-y-3 bg-gradient-to-t from-slate-50/80 to-white">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{itemCount} items</span>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total</p>
            <span className="text-xl font-black tabular-nums text-slate-900">{formatPrice(orderTotal)}</span>
          </div>
        </div>
        <button
          onClick={handleCheckout}
          disabled={currentOrder.length === 0}
          className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-[0.98] text-sm shadow-lg shadow-blue-500/25 disabled:shadow-none"
        >
          Checkout — {formatPrice(orderTotal)}
        </button>
      </div>
    </div>
  );
}

function OrderLineItem({ item, product, categories, onUpdateQty, onRemove }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/80 border border-slate-100/80 animate-slide-in-right hover:bg-slate-50 transition-colors">
      <ProductImage
        product={product}
        categories={categories}
        className="w-8 h-8 rounded-lg shrink-0"
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 truncate">{product.brand}</p>
        <p className="text-[11px] font-bold truncate text-slate-800">{product.shortName}</p>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onUpdateQty(item.productId, item.qty - 1)}
          className="w-5 h-5 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"
        >
          <Minus size={10} />
        </button>
        <span className="w-5 text-center text-[11px] font-bold tabular-nums">{item.qty}</span>
        <button
          onClick={() => onUpdateQty(item.productId, item.qty + 1)}
          disabled={item.qty >= product.stock}
          className="w-5 h-5 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all disabled:opacity-30"
        >
          <Plus size={10} />
        </button>
      </div>
      <span className="text-[11px] font-bold tabular-nums w-12 text-right text-slate-700">
        {formatPrice(item.price * item.qty)}
      </span>
      <button
        onClick={() => onRemove(item.productId)}
        className="text-slate-300 hover:text-red-500 active:scale-90 transition-all"
      >
        <X size={12} />
      </button>
    </div>
  );
}
