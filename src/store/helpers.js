// Stock status helpers
export function getStockStatus(stock, forecast) {
  if (stock === 0) return 'soldout';
  if (stock <= 5) return 'critical';
  if (stock <= 10) return 'low';
  if (stock <= 20) return 'moderate';
  const avgForecast = forecast ? forecast.reduce((a, b) => a + b, 0) / forecast.length : 0;
  if (avgForecast > 0 && stock > avgForecast * 2) return 'overstocked';
  return 'stable';
}

export const STATUS_CONFIG = {
  stable: {
    label: 'In Stock',
    bg: '#DCFCE7',
    text: '#166534',
    border: '#86EFAC',
    dot: '#22C55E',
  },
  moderate: {
    label: 'Moderate',
    bg: '#FEF9C3',
    text: '#854D0E',
    border: '#FDE047',
    dot: '#EAB308',
  },
  low: {
    label: 'Low Stock',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FCD34D',
    dot: '#F59E0B',
  },
  critical: {
    label: 'Critical',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#FCA5A5',
    dot: '#EF4444',
  },
  soldout: {
    label: 'Sold Out',
    bg: '#F1F5F9',
    text: '#64748B',
    border: '#E2E8F0',
    dot: '#94A3B8',
  },
  overstocked: {
    label: 'Overstocked',
    bg: '#DBEAFE',
    text: '#1E40AF',
    border: '#93C5FD',
    dot: '#3B82F6',
  },
};

export function formatPrice(amount) {
  return `$${Number(amount).toFixed(amount % 1 === 0 ? 0 : 1)}`;
}

export function getRelativeTime(isoString) {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function getSuggestedOrder(product) {
  const sevenDayForecast = product.forecast.slice(0, 7).reduce((a, b) => a + b, 0);
  return Math.max(0, sevenDayForecast - product.stock);
}
