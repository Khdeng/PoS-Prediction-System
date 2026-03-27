import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'pos-prediction-state';

function loadSeedData() {
  // Dynamic import won't work here; we import synchronously at top
  return null;
}

export const useStore = create(
  persist(
    (set, get) => ({
      products: [],
      categories: {},
      orderHistory: [],
      currentOrder: [],
      lastUpdated: null,
      initialized: false,

      // Initialize store with seed data
      initialize: (seedData) => {
        const state = get();
        if (state.initialized && state.products.length > 0) return;
        set({
          products: seedData.products,
          categories: seedData.categories,
          initialized: true,
          lastUpdated: new Date().toISOString(),
        });
      },

      // Reset to seed data
      resetDemo: (seedData) => {
        set({
          products: seedData.products,
          categories: seedData.categories,
          orderHistory: [],
          currentOrder: [],
          lastUpdated: new Date().toISOString(),
          initialized: true,
        });
      },

      // PoS: Add item to current order
      addToOrder: (productId) => {
        const { products, currentOrder } = get();
        const product = products.find((p) => p.id === productId);
        if (!product || product.stock <= 0) return;

        const existingIdx = currentOrder.findIndex((item) => item.productId === productId);
        const currentQty = existingIdx >= 0 ? currentOrder[existingIdx].qty : 0;

        if (currentQty >= product.stock) return;

        if (existingIdx >= 0) {
          const updated = [...currentOrder];
          updated[existingIdx] = { ...updated[existingIdx], qty: updated[existingIdx].qty + 1 };
          set({ currentOrder: updated });
        } else {
          set({
            currentOrder: [
              ...currentOrder,
              { productId, qty: 1, price: product.price },
            ],
          });
        }
      },

      // PoS: Update quantity in order
      updateOrderQty: (productId, qty) => {
        const { currentOrder } = get();
        if (qty <= 0) {
          set({ currentOrder: currentOrder.filter((item) => item.productId !== productId) });
        } else {
          set({
            currentOrder: currentOrder.map((item) =>
              item.productId === productId ? { ...item, qty } : item,
            ),
          });
        }
      },

      // PoS: Remove item from order
      removeFromOrder: (productId) => {
        set({ currentOrder: get().currentOrder.filter((item) => item.productId !== productId) });
      },

      // PoS: Clear entire order
      clearOrder: () => set({ currentOrder: [] }),

      // PoS: Checkout
      checkout: () => {
        const { products, currentOrder, orderHistory } = get();
        if (currentOrder.length === 0) return;

        const updatedProducts = products.map((product) => {
          const orderItem = currentOrder.find((o) => o.productId === product.id);
          if (!orderItem) return product;
          return {
            ...product,
            stock: Math.max(0, product.stock - orderItem.qty),
            salesToday: product.salesToday + orderItem.qty,
          };
        });

        const order = {
          id: `order_${Date.now()}`,
          items: currentOrder.map((item) => ({ ...item })),
          total: currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0),
          timestamp: new Date().toISOString(),
        };

        set({
          products: updatedProducts,
          currentOrder: [],
          orderHistory: [...orderHistory, order],
          lastUpdated: new Date().toISOString(),
        });

        return order;
      },

      // Dashboard: Adjust stock
      adjustStock: (productId, newStock) => {
        set({
          products: get().products.map((p) =>
            p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p,
          ),
          lastUpdated: new Date().toISOString(),
        });
      },

      // Dashboard: Place order for item (restock)
      placeOrder: (productId, qty) => {
        set({
          products: get().products.map((p) =>
            p.id === productId
              ? { ...p, stock: p.stock + qty, lastOrdered: new Date().toISOString() }
              : p,
          ),
          lastUpdated: new Date().toISOString(),
        });
      },

      // Dashboard: Toggle auto-order for item
      toggleAutoOrder: (productId) => {
        set({
          products: get().products.map((p) =>
            p.id === productId ? { ...p, autoOrder: !p.autoOrder } : p,
          ),
        });
      },

      // Derived: get product by id
      getProduct: (id) => get().products.find((p) => p.id === id),

      // Derived: order total
      getOrderTotal: () =>
        get().currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0),

      // Derived: order item count
      getOrderItemCount: () =>
        get().currentOrder.reduce((sum, item) => sum + item.qty, 0),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        orderHistory: state.orderHistory,
        lastUpdated: state.lastUpdated,
        initialized: state.initialized,
      }),
    },
  ),
);
