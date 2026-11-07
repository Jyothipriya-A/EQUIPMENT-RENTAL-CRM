import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import {
  LayoutDashboard,
  CalendarPlus,
  Search,
  Truck,
  RotateCcw,
  Users,
  CreditCard
} from 'lucide-react';

export const OperationsLayout = () => {
  const opsNavItems = [
    { label: 'Desk Home', icon: LayoutDashboard, path: '/operations/dashboard' },
    { label: '1. New Booking', icon: CalendarPlus, path: '/operations/new-booking' },
    { label: '2. Dispatch', icon: Truck, path: '/operations/dispatch' },
    { label: '3. Return & Inspect', icon: RotateCcw, path: '/operations/returns' },
    { label: 'Fleet Availability', icon: Search, path: '/operations/availability' },
    { label: 'Add / View Customer', icon: Users, path: '/operations/customers' },
    { label: 'Counter Billing', icon: CreditCard, path: '/operations/billing' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      {/* Top Operations Workflow Bar */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
            {opsNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
