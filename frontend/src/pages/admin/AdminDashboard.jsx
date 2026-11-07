import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../../api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { AgreementModal } from '../../components/AgreementModal';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  Wrench,
  Users,
  FileText,
  AlertTriangle,
  Calendar,
  IndianRupee,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  RotateCcw,
  Percent,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Phone,
  BarChart3,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRentalId, setSelectedRentalId] = useState(null);
  const [viewMode, setViewMode] = useState('simple'); // 'simple' or 'analytics'
  const [chartView, setChartView] = useState('revenue'); // 'revenue' or 'count'
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading rental CRM dashboard...</p>
      </div>
    );
  }

  if (!stats) return null;

  const maxRevenue = Math.max(...(stats.revenue_chart?.map((d) => d.revenue) || [1000]), 1000);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Mode Toggle (Simple View vs Advanced Analytics) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">Logged in as {user?.first_name || user?.email}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Rental Business Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Everything you need to manage equipment, customers, revenue, and staff.
          </p>
        </div>

        {/* View Switcher & Quick Tips Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>{showTips ? 'Hide Tips' : 'Admin Tips'}</span>
          </button>

          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('simple')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'simple'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simple View
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'analytics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Advanced Analytics
            </button>
          </div>
        </div>
      </div>

      {/* 2. Admin Quick Guidance Tips (Collapsible) */}
      {showTips && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-3xl p-5 animate-fadeIn">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>New Admin Quick Guide:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
            <div className="bg-white p-3 rounded-xl border border-blue-100">
              <strong className="text-blue-900 block mb-0.5">1. Manage Products:</strong>
              Define equipment types, set daily/weekly/monthly rental charges, and required deposits.
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100">
              <strong className="text-blue-900 block mb-0.5">2. Track Physical Assets:</strong>
              Assign individual serial numbers to physical machines to prevent double-booking.
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100">
              <strong className="text-blue-900 block mb-0.5">3. View Payments & Deposits:</strong>
              Security deposits are held in a segregated account and returned upon inspection.
            </div>
          </div>
        </div>
      )}

      {/* 3. Core 4 Big Health KPI Cards (Easy to understand for any beginner) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Month's Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{stats.monthly_revenue.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Operational rental revenue</span>
          </div>
        </div>

        {/* Card 2: Active Rentals */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Rentals</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats.active_rentals}
          </p>
          <div className="mt-2 text-[11px] font-semibold text-blue-700">
            <span>{stats.todays_bookings} bookings made today</span>
          </div>
        </div>

        {/* Card 3: Ready Equipment */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available In Yard</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats.available_assets}
          </p>
          <div className="mt-2 text-[11px] font-semibold text-indigo-700">
            <span>Ready for immediate booking</span>
          </div>
        </div>

        {/* Card 4: Overdue Alert */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue for Return</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600">
            {stats.overdue_rentals}
          </p>
          <div className="mt-2 text-[11px] font-semibold text-rose-700">
            <span>Follow-up needed with clients</span>
          </div>
        </div>
      </div>

      {/* 4. Simple Quick Actions for Beginner Admins */}
      <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
          Quick Management Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/products"
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Products & Rates</p>
              <p className="text-[10px] text-slate-500">Edit equipment prices</p>
            </div>
          </Link>

          <Link
            to="/admin/assets"
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Physical Assets</p>
              <p className="text-[10px] text-slate-500">Track serial numbers</p>
            </div>
          </Link>

          <Link
            to="/admin/staff"
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Staff Accounts</p>
              <p className="text-[10px] text-slate-500">Add or manage team</p>
            </div>
          </Link>

          <Link
            to="/admin/reports"
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Export Reports</p>
              <p className="text-[10px] text-slate-500">Download CSV / PDF</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Conditional Rendering: Advanced Analytics Charts vs Simple View */}
      {viewMode === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Revenue & Booking Trends Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Revenue & Booking Trends</h3>
                <p className="text-xs text-slate-500">Daily collections over the last 14 days</p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setChartView('revenue')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    chartView === 'revenue' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Revenue (₹)
                </button>
                <button
                  onClick={() => setChartView('count')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    chartView === 'count' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Bookings Count
                </button>
              </div>
            </div>

            {/* SVG Bar Chart */}
            <div className="h-64 w-full flex items-end gap-2 sm:gap-3 pt-6 pb-2">
              {stats.revenue_chart?.map((item, idx) => {
                const val = chartView === 'revenue' ? item.revenue : item.rentals_count;
                const maxVal = chartView === 'revenue' ? maxRevenue : Math.max(...stats.revenue_chart.map((x) => x.rentals_count), 5);
                const heightPct = Math.max(8, (val / maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md font-medium shadow-md pointer-events-none z-10 whitespace-nowrap">
                      {chartView === 'revenue' ? `₹${item.revenue.toLocaleString()}` : `${item.rentals_count} bookings`}
                    </div>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        item.revenue > 0
                          ? 'bg-blue-600 group-hover:bg-blue-500'
                          : 'bg-slate-100 group-hover:bg-slate-200'
                      }`}
                    ></div>

                    <span className="text-[10px] font-medium text-slate-400 rotate-45 sm:rotate-0 mt-1 truncate">
                      {item.date.split(' ')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Stats: Utilization & Financial Balance */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Fleet Utilization"
              value={`${stats.product_utilization_pct}%`}
              subtext={`${stats.currently_rented_assets} of ${stats.total_physical_assets} assets rented`}
              icon={Percent}
              color="purple"
            />
            <StatCard
              title="Pending Receivables"
              value={`₹${stats.pending_payments.toLocaleString()}`}
              subtext="Unpaid rental balances"
              icon={Clock}
              color="amber"
            />
            <StatCard
              title="Security Deposits Held"
              value={`₹${stats.security_deposits_held.toLocaleString()}`}
              subtext="Held in liability escrow"
              icon={ShieldAlert}
              color="indigo"
            />
            <StatCard
              title="Total Registered Clients"
              value={stats.total_customers}
              subtext={`${stats.total_products} unique equipment types`}
              icon={Users}
              color="blue"
            />
          </div>
        </div>
      )}

      {/* 6. Action-Required Section: Overdue Returns & Upcoming Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Alerts Box */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Overdue Equipment</h3>
                  <p className="text-[11px] text-slate-500">Immediate return required</p>
                </div>
              </div>
              <Link to="/admin/rentals?status=Overdue" className="text-xs font-bold text-rose-600 hover:text-rose-800">
                View All ({stats.overdue_alerts?.length || 0})
              </Link>
            </div>

            <div className="space-y-2.5">
              {stats.overdue_alerts?.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-600">Great news! No overdue rentals.</p>
                </div>
              ) : (
                stats.overdue_alerts?.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="p-3 bg-rose-50/70 rounded-2xl border border-rose-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{alert.rental_id}</span>
                        <span className="text-rose-700 font-bold bg-rose-200/70 px-2 py-0.5 rounded-full text-[10px]">
                          {alert.days_overdue} days late
                        </span>
                      </div>
                      <p className="text-slate-800 font-bold mt-1">{alert.customer_name}</p>
                      <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {alert.phone}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRentalId(alert.id)}
                      className="px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:text-blue-600 border border-slate-200 text-xs font-bold shadow-2xs"
                    >
                      Agreement
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            to="/admin/returns-inspection"
            className="mt-4 block text-center py-2.5 px-3 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Process Return & Calculate Late Fee
          </Link>
        </div>

        {/* Most Rented Equipment */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Most Popular Equipment</h3>
                <p className="text-[11px] text-slate-500">Highest customer rental demand</p>
              </div>
              <Link to="/admin/products" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                Fleet Catalog
              </Link>
            </div>

            <div className="space-y-2.5">
              {stats.most_rented_equipment?.slice(0, 4).map((p, idx) => (
                <div key={p.id} className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{p.name}</h4>
                      <p className="text-[11px] text-slate-500">{p.category} &bull; ₹{p.rate}/day</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {p.rent_count} bookings
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/admin/rentals"
            className="mt-4 block text-center py-2.5 px-3 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            View All Rental Agreements
          </Link>
        </div>
      </div>

      {/* 7. Recent Transactions Table */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Customer Bookings</h3>
            <p className="text-xs text-slate-500">Latest contracts generated across all desks</p>
          </div>
          <Link to="/admin/rentals" className="text-xs font-bold text-blue-600 hover:text-blue-800">
            View All ({stats.recent_transactions?.length || 0}) &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">Agreement ID</th>
                <th className="pb-3 px-3">Customer</th>
                <th className="pb-3 px-3">Booking Date</th>
                <th className="pb-3 px-3 text-right">Total Charge</th>
                <th className="pb-3 px-3 text-center">Status</th>
                <th className="pb-3 px-3 text-right">Agreement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_transactions?.slice(0, 6).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {r.rental_id}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{r.customer_name}</td>
                  <td className="py-3 px-3 text-slate-500">{r.date}</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">₹{r.total_amount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-center">
                    <Badge status={r.status} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedRentalId(r.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      View PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agreement Modal */}
      <AgreementModal
        isOpen={!!selectedRentalId}
        onClose={() => setSelectedRentalId(null)}
        rentalId={selectedRentalId}
      />
    </div>
  );
};
