import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getStockStatus, getRelativeTime } from '../store/helpers';
import SummaryBar from '../components/dashboard/SummaryBar';
import InventorySection from '../components/dashboard/InventorySection';
import UnifiedForecastOrder from '../components/dashboard/UnifiedForecastOrder';
import ToastContainer from '../components/shared/Toast';

export default function DashboardPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <SummaryBar stats={stats} lastUpdated={lastUpdated} />
      <div className="flex-1 flex gap-3 p-3 min-h-0">
        {/* Left: Inventory sidebar */}
        <div className="w-72 shrink-0 flex flex-col min-h-0">
          <InventorySection products={products} categories={categories} />
        </div>
        {/* Right: Unified Forecast + Ordering */}
        <UnifiedForecastOrder products={products} categories={categories} />
      </div>
      <ToastContainer />
    </div>
  );
}
