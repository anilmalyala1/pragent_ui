import React from 'react';

const Button = ({ children, className = '', ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-white/10 transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
