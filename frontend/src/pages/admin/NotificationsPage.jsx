import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../../api';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Wrench,
  Search,
  Filter,
  CheckCheck,
  Calendar,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const NotificationsPage = () => {
  const { notifications, unreadCount, loadNotifications, markAllAsRead, markAsRead } = useNotifications();
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const filterTabs = [
    { key: 'all', label: 'All Alerts' },
    { key: 'return_due', label: 'Upcoming Returns' },
    { key: 'overdue', label: 'Overdue Rentals' },
    { key: 'new_booking', label: 'New Bookings' },
    { key: 'payment_pending', label: 'Payments' },
    { key: 'maintenance', label: 'Maintenance' },
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'return_due':
        return <RotateCcw className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'new_booking':
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      case 'payment_pending':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'maintenance':
      case 'damaged':
        return <Wrench className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationBadgeClass = (type) => {
    switch (type) {
      case 'return_due':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-rose-100 text-rose-800';
      case 'new_booking':
        return 'bg-emerald-100 text-emerald-800';
      case 'payment_pending':
        return 'bg-amber-100 text-amber-800';
      case 'maintenance':
      case 'damaged':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== 'all' && n.notification_type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              Activity &amp; Alerts
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            System Notifications Center
          </h1>
          <p className="text-xs text-slate-500">
            Real-time operational alerts for bookings, overdue fleet, payments, and yard maintenance.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-2xs transition-colors shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {filterTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterType === t.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-400 mt-0.5">No notifications match your current filter.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                !n.is_read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs shrink-0">
                {getNotificationIcon(n.notification_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getNotificationBadgeClass(n.notification_type)}`}>
                      {n.notification_type.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {n.message}
                </p>

                <div className="flex items-center gap-3">
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
