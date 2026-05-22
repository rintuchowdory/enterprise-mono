import React from 'react';

type Variant = 'primary' | 'ghost' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({ variant = 'primary', loading, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? <span className="animate-spin mr-2">⟳</span> : null}
      {children}
    </button>
  );
}
