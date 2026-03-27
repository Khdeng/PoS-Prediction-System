import { NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, Smartphone, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import seedData from '../../data/seedData.json';

const navItems = [
  { to: '/pos', label: 'PoS', icon: ShoppingCart },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customer', label: 'Customer', icon: Smartphone },
];

export default function NavBar() {
  const resetDemo = useStore((s) => s.resetDemo);
  const location = useLocation();

  return (
    <nav className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-6 shrink-0 z-50">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <ShoppingCart size={16} className="text-white" />
        </div>
        <span className="font-bold text-base tracking-tight">SuperMart</span>
      </div>

      <div className="flex items-center gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-slate-400 tabular-nums hidden sm:block">
          {new Date().toLocaleDateString('en-HK', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <button
          onClick={() => {
            if (window.confirm('Reset all demo data to initial state?')) {
              resetDemo(seedData);
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </nav>
  );
}
