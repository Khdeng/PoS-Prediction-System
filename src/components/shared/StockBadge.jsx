import { AlertTriangle } from 'lucide-react';
import { getStockStatus, STATUS_CONFIG } from '../../store/helpers';

export default function StockBadge({ stock, forecast, showCount = true, variant = 'default' }) {
  const status = getStockStatus(stock, forecast);
  const config = STATUS_CONFIG[status];

  const isCustomer = variant === 'customer';

  let label;
  if (status === 'soldout') {
    label = 'Sold Out';
  } else if (isCustomer) {
    if (stock > 10) label = `${stock} In Stock`;
    else if (stock > 3) label = `Only ${stock} left`;
    else label = `Only ${stock} left — hurry!`;
  } else {
    label = showCount ? `${stock} left` : config.label;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold leading-none rounded-full
        ${isCustomer ? 'px-2.5 py-1.5 w-full justify-center' : 'px-2 py-1'}
        ${status === 'critical' ? 'animate-pulse-slow' : ''}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        ...(isCustomer && { borderRadius: 0 }),
      }}
    >
      {(status === 'low' || status === 'critical') && <AlertTriangle size={10} />}
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.dot }}
      />
      {label}
    </span>
  );
}
