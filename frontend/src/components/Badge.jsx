import React from 'react';

const statusStyles = {
  // Rentals
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Reserved: 'bg-blue-50 text-blue-700 border-blue-200',
  Confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Dispatched: 'bg-amber-50 text-amber-700 border-amber-200',
  'Partially Returned': 'bg-purple-50 text-purple-700 border-purple-200',
  Returned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Overdue: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
  Cancelled: 'bg-gray-100 text-gray-500 border-gray-200',

  // Asset Statuses
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rented: 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Maintenance': 'bg-orange-50 text-orange-700 border-orange-200',
  Damaged: 'bg-rose-50 text-rose-700 border-rose-200',
  Retired: 'bg-zinc-100 text-zinc-600 border-zinc-200',

  // Asset Conditions
  Excellent: 'bg-teal-50 text-teal-700 border-teal-200',
  Good: 'bg-blue-50 text-blue-700 border-blue-200',
  Fair: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Needs Repair': 'bg-orange-50 text-orange-700 border-orange-200',

  // Roles
  admin: 'bg-purple-100 text-purple-800 border-purple-200 font-semibold',
  front_desk: 'bg-blue-100 text-blue-800 border-blue-200',
  operations: 'bg-emerald-100 text-emerald-800 border-emerald-200',

  // Payments / Ledger
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-rose-50 text-rose-700 border-rose-200',
  Debit: 'bg-rose-50 text-rose-700 border-rose-200',
  Credit: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Held: 'bg-amber-50 text-amber-700 border-amber-200',
  'Fully Refunded': 'bg-slate-100 text-slate-700 border-slate-200',
};

export const Badge = ({ status, children, className = '' }) => {
  const label = children || status;
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
};
