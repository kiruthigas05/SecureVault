import React from 'react';

export type BadgeVariant = 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' | 'indigo';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    sky: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
    indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    slate: 'bg-slate-800 border-slate-700 text-slate-300',
  };

  const dotStyles = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    sky: 'bg-sky-400',
    indigo: 'bg-indigo-400',
    slate: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};
