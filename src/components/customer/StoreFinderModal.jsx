import { useEffect, useRef } from 'react';
import { X, Navigation, Clock, MapPin } from 'lucide-react';
import { getStockStatus, STATUS_CONFIG } from '../../store/helpers';
import 'leaflet/dist/leaflet.css';

// Nearby Fusion stores (demo data — real coordinates)
const STORES = [
  {
    id: 'hkust',
    name: 'Fusion — HKUST',
    address: 'LG7, Academic Building, HKUST',
    lat: 22.3363,
    lng: 114.2654,
    hours: '8:30am–12am',
    isCurrentStore: true,
  },
  {
    id: 'cwb',
    name: 'Fusion — Clear Water Bay',
    address: 'Silver Cape Plaza, Clear Water Bay',
    lat: 22.3178,
    lng: 114.2559,
    hours: '8:30am–10pm',
    distanceKm: 2.1,
  },
  {
    id: 'tko-popwalk',
    name: 'Fusion — Tseung Kwan O',
    address: 'G/F Popwalk, 12 Tong Chun St, TKO',
    lat: 22.3072,
    lng: 114.2601,
    hours: '8am–10pm',
    distanceKm: 4.3,
  },
  {
    id: 'saikung',
    name: 'Fusion — Sai Kung',
    address: '3/F, 1A Chui Tong Rd, Sai Kung',
    lat: 22.3812,
    lng: 114.2719,
    hours: '8am–10pm',
    distanceKm: 5.8,
  },
  {
    id: 'hksp',
    name: 'Fusion — Science Park',
    address: '12W, Hong Kong Science Park',
    lat: 22.4268,
    lng: 114.2098,
    hours: '8am–9pm',
    distanceKm: 12.4,
  },
];

// Simulate stock at other stores (random but plausible)
function getSimulatedStock(product, storeId) {
  if (storeId === 'hkust') return product.stock;
  // Use a hash of product id + store id for consistent random
  const hash = (product.id + storeId).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = Math.floor((hash * 17) % 60);
  return base;
}

export default function StoreFinderModal({ product, categories, onClose }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    let map;
    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      map = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([22.3363, 114.2654], 13);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      // Add markers for each store
      STORES.forEach((store) => {
        const stock = getSimulatedStock(product, store.id);
        const status = getStockStatus(stock, product.forecast);
        const config = STATUS_CONFIG[status];
        const isAvailable = stock > 0;

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background: ${store.isCurrentStore ? '#2563EB' : isAvailable ? '#22C55E' : '#94A3B8'};
            color: white;
            border-radius: 50%;
            width: ${store.isCurrentStore ? 36 : 28}px;
            height: ${store.isCurrentStore ? 36 : 28}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${store.isCurrentStore ? 12 : 10}px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${store.isCurrentStore ? '📍' : stock}</div>`,
          iconSize: [store.isCurrentStore ? 36 : 28, store.isCurrentStore ? 36 : 28],
          iconAnchor: [store.isCurrentStore ? 18 : 14, store.isCurrentStore ? 18 : 14],
        });

        const marker = L.marker([store.lat, store.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: Inter, system-ui, sans-serif; min-width: 160px;">
            <p style="font-weight: 700; font-size: 12px; margin: 0 0 4px;">${store.name}</p>
            <p style="font-size: 10px; color: #64748B; margin: 0 0 6px;">${store.address}</p>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: ${config.text}; background: ${config.bg}; padding: 3px 8px; border-radius: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${config.dot};"></span>
              ${stock > 0 ? `${stock} in stock` : 'Sold Out'}
            </div>
          </div>
        `);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [product]);

  const cat = categories[product.category];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[580px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" />
              Find Nearby Stock
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {product.brand} {product.shortName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Map */}
        <div ref={mapRef} className="h-[280px] w-full" />

        {/* Store list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {STORES.map((store) => {
            const stock = getSimulatedStock(product, store.id);
            const status = getStockStatus(stock, product.forecast);
            const config = STATUS_CONFIG[status];
            const isAvailable = stock > 0;

            return (
              <div
                key={store.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  store.isCurrentStore
                    ? 'bg-primary/5 border-primary/20'
                    : isAvailable
                    ? 'bg-white border-slate-100 hover:border-green-200 hover:bg-green-50/30'
                    : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                {/* Stock indicator */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: store.isCurrentStore ? '#2563EB' : isAvailable ? '#22C55E' : '#94A3B8' }}
                >
                  {store.isCurrentStore ? '📍' : stock}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {store.name}
                    {store.isCurrentStore && (
                      <span className="ml-1.5 text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">You're here</span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{store.address}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock size={8} /> {store.hours}
                    </span>
                    {store.distanceKm && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Navigation size={8} /> {store.distanceKm}km
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock badge */}
                <div
                  className="text-[10px] font-semibold px-2 py-1 rounded-lg shrink-0"
                  style={{ backgroundColor: config.bg, color: config.text }}
                >
                  {stock > 0 ? `${stock} in stock` : 'Sold Out'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
