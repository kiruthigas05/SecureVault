import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  KeyRound,
  Wand2,
  Gauge,
  ShieldAlert,
  History,
  Settings,
  Shield,
  X,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { theme, toggleTheme } = useTheme();
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/vault', label: 'Vault', icon: KeyRound },
    { to: '/share-secret', label: 'One-Time Secret', icon: Flame },
    { to: '/password-generator', label: 'Password Generator', icon: Wand2 },
    { to: '/password-analyzer', label: 'Password Analyzer', icon: Gauge },
    { to: '/security', label: 'Security', icon: ShieldAlert },
    { to: '/activity', label: 'Activity', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];


  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-navy-950 font-bold" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-white font-mono">
            Secure<span className="text-emerald-400">Vault</span>
          </span>
        </NavLink>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-400 hover:text-slate-200 hover:border-emerald-500/40 transition-all duration-200 group"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400 group-hover:-rotate-12 transition-transform duration-200" />
            )}
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </span>
          <span className={`w-8 h-4 rounded-full transition-colors duration-300 flex items-center px-0.5 ${theme === 'light' ? 'bg-emerald-500' : 'bg-slate-700'}`}>
            <span className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${theme === 'light' ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="sv-sidebar hidden lg:block w-64 border-r shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="sv-sidebar relative w-64 max-w-[80vw] border-r h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
