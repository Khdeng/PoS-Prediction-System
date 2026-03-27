import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

const toasts = [];
let listeners = [];

export function showToast(message, type = 'success') {
  const id = Date.now();
  toasts.push({ id, message, type });
  listeners.forEach((fn) => fn([...toasts]));
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx >= 0) toasts.splice(idx, 1);
    listeners.forEach((fn) => fn([...toasts]));
  }, 3000);
}

export default function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((fn) => fn !== setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2">
      {items.map((toast) => (
        <div
          key={toast.id}
          className="bg-white rounded-lg shadow-lg border border-slate-200 px-4 py-3 flex items-center gap-2.5 min-w-[260px] animate-slide-in-right"
        >
          <CheckCircle size={18} className="text-green-500 shrink-0" />
          <span className="text-sm font-medium text-slate-700 flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
