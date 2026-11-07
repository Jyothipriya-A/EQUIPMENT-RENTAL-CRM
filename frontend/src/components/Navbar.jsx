import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Smartphone,
  Monitor,
  LayoutDashboard,
  LogOut,
  User,
  Menu,
  X,
  Wrench,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Badge } from './Badge';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOpsPortal = location.pathname.startsWith('/operations');
  const isMobileAdmin = location.pathname.startsWith('/admin/mobile');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left: Brand and Hamburger */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to={isAdmin ? "/admin/dashboard" : "/operations/dashboard"} className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">EQUIP<span className="text-blue-600">RENT</span></span>
              <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded">PRO CRM</span>
            </div>
          </Link>
        </div>

        {/* Center: Portal Switchers */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isOpsPortal && !isMobileAdmin
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Admin Portal
            </Link>
          )}

          <Link
            to="/operations/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isOpsPortal
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Operations Desk
          </Link>

          {isAdmin && (
            <Link
              to="/admin/mobile"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isMobileAdmin
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile Admin
            </Link>
          )}
        </div>

        {/* Right: Notifications & User profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Admin switcher button visible on small screens */}
          {isAdmin && (
            <Link
              to="/admin/mobile"
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
              title="Mobile Admin View"
            >
              <Smartphone className="w-5 h-5 text-blue-600" />
            </Link>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications right now
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.is_read) markAsRead(n.id);
                          if (n.link) navigate(n.link);
                          setShowNotifications(false);
                        }}
                        className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                          !n.is_read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                {user?.first_name ? user.first_name[0] : user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{user?.full_name || user?.username}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1.5">
                    <Badge status={user?.role} />
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to={isAdmin ? "/admin/dashboard" : "/operations/dashboard"}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/staff"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Staff Accounts
                    </Link>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
