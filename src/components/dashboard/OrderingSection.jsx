import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus, Truck, CheckCircle, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getStockStatus, STATUS_CONFIG, getSuggestedOrder, formatPrice } from '../../store/helpers';
import { showToast } from '../shared/Toast';

export default function OrderingSection({ products, categories }) {
  const placeOrder = useStore((s) => s.placeOrder);
  const [collapsed, setCollapsed] = useState(false);
  const [autoOrder, setAutoOrder] = useState(false);
  const [orderQtys, setOrderQtys] = useState({});
  const [orderedItems, setOrderedItems] = useState({});
  const [loading, setLoading] = useState({});

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const urgencyOrder = { soldout: 0, critical: 1, low: 2, moderate: 3, stable: 4, overstocked: 5 };
      const aStatus = getStockStatus(a.stock, a.forecast);
      const bStatus = getStockStatus(b.stock, b.forecast);
      return (urgencyOrder[aStatus] ?? 9) - (urgencyOrder[bStatus] ?? 9);
    });
  }, [products]);

  const getQty = (product) => {
    if (orderQtys[product.id] !== undefined) return orderQtys[product.id];
    return getSuggestedOrder(product);
  };

  const setQty = (productId, qty) => {
    setOrderQtys((prev) => ({ ...prev, [productId]: Math.max(0, qty) }));
  };

  const handleOrder = (product) => {
    const qty = getQty(product);
    if (qty <= 0) return;

    setLoading((prev) => ({ ...prev, [product.id]: true }));

    // Simulate delivery delay
    setTimeout(() => {
      placeOrder(product.id, qty);
      setLoading((prev) => ({ ...prev, [product.id]: false }));
      setOrderedItems((prev) => ({ ...prev, [product.id]: true }));
      setOrderQtys((prev) => ({ ...prev, [product.id]: 0 }));
      showToast(`Ordered ${qty} × ${product.shortName}`);

      setTimeout(() => {
        setOrderedItems((prev) => ({ ...prev, [product.id]: false }));
      }, 3000);
    }, 1500);
  };

  const handleBulkOrder = () => {
    const toOrder = sorted.filter((p) => getSuggestedOrder(p) > 0);
    if (toOrder.length === 0) return;

    const totalUnits = toOrder.reduce((sum, p) => sum + getSuggestedOrder(p), 0);
    if (!window.confirm(`Order ${toOrder.length} items totaling ${totalUnits} units?`)) return;

    toOrder.forEach((product, i) => {
      setTimeout(() => handleOrder(product), i * 200);
    });
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <h2 className="text-base font-semibold">Ordering</h2>
        {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Global controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Auto-Order:</span>
              <button
                onClick={() => setAutoOrder(!autoOrder)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  autoOrder ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    autoOrder ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              {autoOrder && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
                  ON
                </span>
              )}
            </label>

            <button
              onClick={handleBulkOrder}
              className="h-8 px-3 text-xs font-medium border border-primary text-primary rounded-md hover:bg-primary-light transition-colors flex items-center gap-1.5"
            >
              <Truck size={13} /> Order All at Forecast
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2 font-semibold min-w-[160px]">Item</th>
                  <th className="px-3 py-2 font-semibold text-center w-20">Current Stock</th>
                  <th className="px-3 py-2 font-semibold text-center w-20">7-Day Forecast</th>
                  <th className="px-3 py-2 font-semibold text-center w-28">Suggested Qty</th>
                  <th className="px-3 py-2 font-semibold text-center w-44">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((product) => {
                  const status = getStockStatus(product.stock, product.forecast);
                  const config = STATUS_CONFIG[status];
                  const sevenDay = product.forecast.slice(0, 7).reduce((a, b) => a + b, 0);
                  const suggested = getSuggestedOrder(product);
                  const qty = getQty(product);
                  const isOrdered = orderedItems[product.id];
                  const isLoading = loading[product.id];

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-slate-100 transition-colors ${
                        isOrdered ? 'bg-green-50' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: config.dot }}
                          />
                          <div>
                            <p className="font-medium">{product.shortName}</p>
                            <p className="text-[10px] text-slate-400">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums font-semibold" style={{ color: config.text }}>
                        {product.stock}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">{sevenDay}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-slate-500">{suggested}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setQty(product.id, qty - 5)}
                            className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-[10px] font-medium"
                          >
                            <Minus size={10} />
                          </button>
                          <input
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(product.id, parseInt(e.target.value) || 0)}
                            className="w-14 h-6 text-center text-xs font-semibold tabular-nums border border-slate-200 rounded focus:outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => setQty(product.id, qty + 5)}
                            className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-[10px] font-medium"
                          >
                            <Plus size={10} />
                          </button>

                          {isOrdered ? (
                            <span className="flex items-center gap-1 text-green-600 font-medium ml-1">
                              <CheckCircle size={14} /> Ordered
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOrder(product)}
                              disabled={qty <= 0 || isLoading}
                              className="h-6 px-2.5 bg-primary text-white rounded text-[10px] font-medium hover:bg-primary-hover disabled:opacity-40 transition-colors flex items-center gap-1 ml-1"
                            >
                              {isLoading ? (
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Truck size={11} />
                              )}
                              Order
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
