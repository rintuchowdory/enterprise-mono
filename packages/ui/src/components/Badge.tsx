import React from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-slate-700 text-slate-200',
  success: 'bg-emerald-900/50 text-emerald-400',
  warning: 'bg-orange-900/50 text-orange-400',
  danger: 'bg-red-900/50 text-red-400',
  info: 'bg-sky-900/50 text-sky-400',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
