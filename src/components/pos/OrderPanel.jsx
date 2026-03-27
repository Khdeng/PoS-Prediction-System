import { useState } from 'react';
import { ShoppingCart, Trash2, Minus, Plus, X, CheckCircle } from 'lucide-react';
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
    <div className="w-[320px] shrink-0 bg-white border-l border-slate-200 flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-slate-600" />
          <span className="font-semibold text-sm">Current Order</span>
          {itemCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </div>
        {currentOrder.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Order items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <CheckCircle size={48} className="text-green-500 animate-scale-in" />
            <p className="text-sm font-medium text-green-700">Order Complete!</p>
          </div>
        ) : currentOrder.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 px-4">
            <ShoppingCart size={40} strokeWidth={1} />
            <p className="text-sm text-center text-slate-400">Tap a product to add it to the order</p>
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
      <div className="border-t border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Items: {itemCount}</span>
          <span className="text-slate-500">Subtotal</span>
        </div>
        <div className="flex items-center justify-end">
          <span className="text-2xl font-bold tabular-nums">{formatPrice(orderTotal)}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={currentOrder.length === 0}
          className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors active:scale-[0.98] text-sm"
        >
          Checkout — {formatPrice(orderTotal)}
        </button>
      </div>
    </div>
  );
}

function OrderLineItem({ item, product, categories, onUpdateQty, onRemove }) {
  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 animate-slide-in-right">
      <ProductImage
        product={product}
        categories={categories}
        className="w-9 h-9 rounded shrink-0"
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400 truncate">{product.brand}</p>
        <p className="text-xs font-medium truncate">{product.shortName}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQty(item.productId, item.qty - 1)}
          className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="w-6 text-center text-xs font-semibold tabular-nums">{item.qty}</span>
        <button
          onClick={() => onUpdateQty(item.productId, item.qty + 1)}
          disabled={item.qty >= product.stock}
          className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-30"
        >
          <Plus size={12} />
        </button>
      </div>
      <span className="text-xs font-semibold tabular-nums w-14 text-right">
        {formatPrice(item.price * item.qty)}
      </span>
      <button
        onClick={() => onRemove(item.productId)}
        className="text-slate-300 hover:text-red-500 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
