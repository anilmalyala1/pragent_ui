import React from 'react';

const Button = ({ children, className = '', ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-lg border border-[#e0e0e0] bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-white shadow-sm transition dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
