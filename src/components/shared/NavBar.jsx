import { NavLink } from 'react-router-dom';
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

  return (
    <nav className="h-12 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 flex items-center px-4 gap-6 shrink-0 z-50 border-b border-white/5">
      <div className="flex items-center gap-2.5 mr-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-glow-sm">
          <ShoppingCart size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight text-white">HKUST Fusion</span>
      </div>

      <div className="flex items-center gap-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-[11px] text-slate-500 tabular-nums hidden sm:block">
          {new Date().toLocaleDateString('en-HK', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <button
          onClick={() => {
            if (window.confirm('Reset all demo data to initial state?')) {
              resetDemo(seedData);
            }
          }}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>
    </nav>
  );
}
