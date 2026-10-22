import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { ShieldCheck, ShieldAlert, LogOut, Menu, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sv-nav h-16 border-b sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AES-256-GCM Vault</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user?.mfaEnabled ? (
          <Badge variant="emerald" dot>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2FA Protected</span>
            <span className="sm:hidden">2FA</span>
          </Badge>
        ) : (
          <Badge variant="amber" dot>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2FA Disabled</span>
            <span className="sm:hidden">No 2FA</span>
          </Badge>
        )}

        {/* User Info */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserCheck className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.name}</p>
            <p className="text-[11px] text-slate-400 leading-tight truncate max-w-[140px]">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          icon={<LogOut className="w-4 h-4 text-slate-400 hover:text-rose-400 transition-colors" />}
          className="text-xs text-slate-400 hover:text-rose-300"
        >
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};
