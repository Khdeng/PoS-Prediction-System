import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getStockStatus, getRelativeTime } from '../store/helpers';
import SummaryBar from '../components/dashboard/SummaryBar';
import InventorySection from '../components/dashboard/InventorySection';
import ForecastSection from '../components/dashboard/ForecastSection';
import OrderingSection from '../components/dashboard/OrderingSection';
import ToastContainer from '../components/shared/Toast';

export default function DashboardPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const orderHistory = useStore((s) => s.orderHistory);
  const lastUpdated = useStore((s) => s.lastUpdated);

  const stats = useMemo(() => {
    const totalSales = products.reduce((sum, p) => sum + p.salesToday, 0);
    const totalRevenue = products.reduce((sum, p) => sum + p.salesToday * p.price, 0);
    const statusCounts = { stable: 0, moderate: 0, low: 0, critical: 0, soldout: 0, overstocked: 0 };
    products.forEach((p) => {
      const s = getStockStatus(p.stock, p.forecast);
      statusCounts[s]++;
    });
    return { totalSales, totalRevenue, ...statusCounts, total: products.length };
  }, [products]);

  return (
    <div className="flex-1 overflow-y-auto">
      <SummaryBar stats={stats} lastUpdated={lastUpdated} />
      <div className="p-4 space-y-4">
        <InventorySection products={products} categories={categories} />
        <ForecastSection products={products} categories={categories} />
        <OrderingSection products={products} categories={categories} />
      </div>
      <ToastContainer />
    </div>
  );
}
