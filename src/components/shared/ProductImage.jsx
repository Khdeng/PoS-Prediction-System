import { useState } from 'react';

// Category-specific emoji/icon for richer fallbacks
const CATEGORY_ICONS = {
  beverages: '\u{1F964}',     // cup with straw
  dairy: '\u{1F95B}',         // glass of milk
  snacks: '\u{1F36B}',        // chocolate bar
  noodles_rice: '\u{1F35C}',  // steaming bowl
  canned_cooking: '\u{1F96B}', // canned food
  frozen: '\u{2744}\uFE0F',   // snowflake
  bakery: '\u{1F950}',        // croissant
};

export default function ProductImage({ product, categories, className = '', size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const cat = categories[product.category];
  const icon = CATEGORY_ICONS[product.category] || '\u{1F6D2}';
  const initial = product.brand?.charAt(0) || '?';

  if (!product.image || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-0.5 ${className}`}
        style={{
          background: `linear-gradient(145deg, ${cat?.color || '#F1F5F9'}ee, ${cat?.color || '#F1F5F9'}88)`,
        }}
      >
        <span
          className="select-none leading-none"
          style={{ fontSize: size === 'sm' ? 14 : size === 'lg' ? 40 : 24 }}
        >
          {icon}
        </span>
        <span
          className="font-bold opacity-20 select-none leading-none"
          style={{
            fontSize: size === 'sm' ? 8 : size === 'lg' ? 20 : 11,
            color: cat?.textColor || '#64748B',
          }}
        >
          {initial}
        </span>
      </div>
    );
  }

  return (
    <img
      src={product.image}
      alt={`${product.brand} ${product.shortName}`}
      className={`object-contain bg-white ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  );
}
