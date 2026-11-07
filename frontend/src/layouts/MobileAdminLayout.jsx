import React, { useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Wrench,
  FileText,
  Menu,
  X,
  RotateCcw,
  Users,
  UserCheck,
  Truck,
  Settings,
  CreditCard,
  BarChart3,
  Monitor,
  ChevronRight,
  Bell,
  Send,
  Sliders,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const MobileAdminLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // Primary bottom navigation tabs
  const primaryTabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/admin/mobile' },
    { label: 'Rentals', icon: FileText, path: '/admin/mobile/rentals' },
    { label: 'Assets', icon: Wrench, path: '/admin/mobile/assets' },
    { label: 'Payments', icon: CreditCard, path: '/admin/mobile/payments' },
  ];

  // All 15 modules in drawer menu
  const drawerItems = [
    { label: '1. Dashboard', icon: LayoutDashboard, path: '/admin/mobile' },
    { label: '2. Products', icon: Package, path: '/admin/mobile/products' },
    { label: '3. Inventory / Assets', icon: Wrench, path: '/admin/mobile/assets' },
    { label: '4. Customers', icon: Users, path: '/admin/mobile/customers' },
    { label: '5. Rental Bookings', icon: FileText, path: '/admin/mobile/rentals' },
    { label: '6. Dispatch Fleet', icon: Send, path: '/admin/mobile/dispatch' },
    { label: '7. Returns & Inspection', icon: RotateCcw, path: '/admin/mobile/returns-inspection' },
    { label: '8. Payments & Deposits', icon: CreditCard, path: '/admin/mobile/payments' },
    { label: '9. Financial Ledger', icon: DollarSign, path: '/admin/mobile/ledger' },
    { label: '10. Suppliers', icon: Truck, path: '/admin/mobile/suppliers' },
    { label: '11. Maintenance', icon: Settings, path: '/admin/mobile/maintenance' },
    { label: '12. Reports & Analytics', icon: BarChart3, path: '/admin/mobile/reports' },
    { label: '13. Staff Accounts', icon: UserCheck, path: '/admin/mobile/staff' },
    { label: '14. Notifications', icon: Bell, path: '/admin/mobile/notifications', badge: unreadCount },
    { label: '15. Business Settings', icon: Sliders, path: '/admin/mobile/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-20 select-none">
      {/* Mobile App Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">
              ER
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">EquipRent Admin</h1>
              <p className="text-[10px] text-blue-400 font-medium">Mobile Application Mode</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/mobile/notifications"
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </Link>

            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white border border-slate-700"
              title="Switch to Desktop Admin layout"
            >
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>Desktop</span>
            </Link>

            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 p-3 sm:p-4 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      {/* App-like Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16">
          {primaryTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/admin/mobile'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`
              }
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] leading-none">{tab.label}</span>
            </NavLink>
          ))}

          {/* More Drawer Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 font-medium"
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </div>
            <span className="text-[10px] leading-none">Modules</span>
          </button>
        </div>
      </nav>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">All 15 Admin Modules</p>
                <p className="text-xs text-slate-400">Signed in as {user?.first_name || user?.username}</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {drawerItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin/mobile'}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 ? (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  )}
                </NavLink>
              ))}

              <div className="pt-4 mt-2 border-t border-slate-100 space-y-1">
                <Link
                  to="/operations/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span>Front Desk Operations Desk</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50"
                >
                  <span>Switch to Desktop View</span>
                  <Monitor className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
