import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Wrench,
  Users,
  FileText,
  RotateCcw,
  UserCheck,
  Truck,
  Settings,
  CreditCard,
  BarChart3,
  Smartphone,
  ChevronRight,
  Send,
  Bell,
  Sliders,
  DollarSign
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { unreadCount } = useNotifications();

  const coreOperations = [
    { label: '1. Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: '2. Products', icon: Package, path: '/admin/products' },
    { label: '3. Inventory / Assets', icon: Wrench, path: '/admin/assets' },
    { label: '4. Customers', icon: Users, path: '/admin/customers' },
    { label: '5. Rental Bookings', icon: FileText, path: '/admin/rentals' },
    { label: '6. Dispatch Fleet', icon: Send, path: '/admin/dispatch' },
    { label: '7. Returns & Inspection', icon: RotateCcw, path: '/admin/returns-inspection' },
  ];

  const financeOperations = [
    { label: '8. Payments & Deposits', icon: CreditCard, path: '/admin/payments' },
    { label: '9. Financial Ledger', icon: DollarSign, path: '/admin/ledger' },
    { label: '10. Suppliers', icon: Truck, path: '/admin/suppliers' },
    { label: '11. Maintenance', icon: Settings, path: '/admin/maintenance' },
  ];

  const adminControls = [
    { label: '12. Reports & Analytics', icon: BarChart3, path: '/admin/reports' },
    { label: '13. Staff Accounts', icon: UserCheck, path: '/admin/staff' },
    { label: '14. Notifications', icon: Bell, path: '/admin/notifications', badge: unreadCount },
    { label: '15. Business Settings', icon: Sliders, path: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full py-4 px-3 overflow-y-auto">
          {/* Section 1: Core Operations */}
          <div className="px-3 mb-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Rental Operations</p>
          </div>
          <nav className="space-y-0.5 mb-4">
            {coreOperations.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-30" />
              </NavLink>
            ))}
          </nav>

          {/* Section 2: Finance & Yard */}
          <div className="px-3 mb-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Finance &amp; Fleet</p>
          </div>
          <nav className="space-y-0.5 mb-4">
            {financeOperations.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-30" />
              </NavLink>
            ))}
          </nav>

          {/* Section 3: Administration & Analytics */}
          <div className="px-3 mb-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Administration &amp; Control</p>
          </div>
          <nav className="space-y-0.5 mb-4">
            {adminControls.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge > 0 ? (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3 h-3 opacity-30" />
                )}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Admin Mode Quick Launcher Box */}
          <div className="mt-auto p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1.5">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Mobile View</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Preview dedicated mobile layout at /admin/mobile
            </p>
            <NavLink
              to="/admin/mobile"
              className="block text-center py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs"
            >
              Open Mobile App View
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};
