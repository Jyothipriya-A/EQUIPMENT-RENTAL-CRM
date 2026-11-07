import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reportApi, rentalApi } from '../../api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { AgreementModal } from '../../components/AgreementModal';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarPlus,
  Search,
  Truck,
  RotateCcw,
  Users,
  CreditCard,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  FileText,
  ArrowRight,
  HelpCircle,
  Phone,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const OperationsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentRentals, setRecentRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  useEffect(() => {
    loadOpsData();
  }, []);

  const loadOpsData = async () => {
    try {
      setLoading(true);
      const [statsRes, rentalsRes] = await Promise.all([
        reportApi.getDashboardStats(),
        rentalApi.getRentals({ page_size: 8 }),
      ]);
      setStats(statsRes.data);
      setRecentRentals(rentalsRes.data.results || rentalsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearchSubmit = (e) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    // Redirect to rentals list or filter
    navigate(`/operations/dispatch?search=${encodeURIComponent(quickSearch.trim())}`);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading front desk operations...</p>
      </div>
    );
  }

  // Filter rentals by quick search if typed on dashboard
  const filteredRentals = recentRentals.filter((r) => {
    if (!quickSearch.trim()) return true;
    const q = quickSearch.toLowerCase();
    return (
      r.rental_id?.toLowerCase().includes(q) ||
      r.customer_details?.full_name?.toLowerCase().includes(q) ||
      r.customer_details?.phone_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Friendly Staff Greeting & Universal Fast Search */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
        {/* Soft Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Front Desk Counter &bull; Logged in as {user?.first_name || user?.username || 'Staff'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              What would you like to do?
            </h1>
            <p className="text-blue-100/90 text-sm mt-1 max-w-xl">
              Choose an action below to serve a customer, check equipment, or handle returns.
            </p>
          </div>

          {/* How Rental Works Helper Button */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="self-start md:self-center flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-all shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>{showGuide ? 'Hide Simple Guide' : 'Beginner Rental Guide'}</span>
          </button>
        </div>

        {/* Universal Quick Search Bar */}
        <form onSubmit={handleQuickSearchSubmit} className="mt-6 relative max-w-2xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search customer name, phone number, or agreement ID (e.g. RENT-2026)..."
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium shadow-inner border border-transparent focus:outline-hidden focus:ring-4 focus:ring-blue-400/40"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Find Contract
          </button>
        </form>
      </div>

      {/* 2. Interactive Beginner Guide (Collapsible) */}
      {showGuide && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 transition-all animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-3">
            <Info className="w-5 h-5 text-amber-600" />
            <span>How The Rental Lifecycle Works in 3 Simple Steps:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-2">1</div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Book or Reserve</h4>
              <p className="text-slate-600 leading-relaxed">
                Click <strong>"New Rental Booking"</strong>. Select or register the customer, choose the tools, specify dates, collect advance payment/deposit, and generate the rental agreement.
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center mb-2">2</div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Hand Over Equipment</h4>
              <p className="text-slate-600 leading-relaxed">
                When the customer arrives at the yard, click <strong>"Dispatch Equipment"</strong>. Match the serial numbers, ensure condition is good, and hand over the equipment.
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mb-2">3</div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Receive & Refund</h4>
              <p className="text-slate-600 leading-relaxed">
                When tools are returned, click <strong>"Return & Inspection"</strong>. Inspect for any damage or late days (auto-calculated) and refund the security deposit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Primary 4-Step Action Cards (Big, clear, numbered for beginners) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-slate-800">Frequent Counter Tasks</h2>
          <span className="text-xs text-slate-500 font-medium">Click any card to start</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: New Booking */}
          <Link
            to="/operations/new-booking"
            className="group relative bg-white p-5 rounded-3xl border-2 border-blue-500/40 hover:border-blue-600 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
              Step 1 &bull; Most Common
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-4 group-hover:scale-105 transition-transform">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                New Rental Booking
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Customer wants to rent tools? Pick items, set dates, and create contract.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
              <span>Start Booking Wizard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 2: Dispatch */}
          <Link
            to="/operations/dispatch"
            className="group relative bg-white p-5 rounded-3xl border border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
              Step 2
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 mb-4 group-hover:scale-105 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                Dispatch Equipment
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Customer is here to pick up? Match serials and hand over tools.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>Hand Over Fleet</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 3: Return */}
          <Link
            to="/operations/returns"
            className="group relative bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
              Step 3
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 mb-4 group-hover:scale-105 transition-transform">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                Return & Inspection
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Customer brought equipment back? Check condition & refund deposit.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Process Return</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 4: Register Customer */}
          <Link
            to="/operations/customers"
            className="group relative bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Quick Setup
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                Add New Customer
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                First-time client? Save their phone, Aadhaar / ID, and KYC details.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>Register (60 secs)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Secondary Quick Tools Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/operations/availability"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">Check Equipment Availability</h4>
              <p className="text-[11px] text-slate-500">Pick any dates to see which tools are ready in yard</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/operations/billing"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">Counter Payments & Receipts</h4>
              <p className="text-[11px] text-slate-500">Collect pending dues via Cash, UPI, or Card</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* 5. Live Yard Status (Clean & Simple Visual Numbers) */}
      {stats && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-sm text-slate-900">Today's Fleet Status</h3>
              <p className="text-xs text-slate-500">Overview of what is in yard vs out with customers</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                🟢 Ready to Rent
              </span>
              <p className="text-2xl font-black text-emerald-700">{stats.available_assets}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Physical assets available in yard</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                🟡 Out on Site
              </span>
              <p className="text-2xl font-black text-amber-700">{stats.active_rentals}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Currently rented to customers</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">
                🔵 Booked Today
              </span>
              <p className="text-2xl font-black text-blue-700">{stats.todays_bookings}</p>
              <p className="text-[11px] text-blue-600 mt-0.5">New contracts created today</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-1">
                🔴 Overdue for Return
              </span>
              <p className="text-2xl font-black text-rose-700">{stats.overdue_rentals}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">Past return date (call customer)</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Active Bookings & Overdue Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Rentals Table with simple one-click actions */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Current Rentals & Contracts</h3>
              <p className="text-xs text-slate-500">Recent rental agreements made at the counter</p>
            </div>
            <Link
              to="/operations/new-booking"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              + New Rental
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Agreement #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Rental Duration</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRentals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No matching rentals found.
                    </td>
                  </tr>
                ) : (
                  filteredRentals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {r.rental_id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{r.customer_details?.full_name}</p>
                        <p className="text-[11px] text-slate-500">{r.customer_details?.phone_number}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <p className="font-medium">{r.rental_start_date} to {r.expected_return_date}</p>
                        <p className="text-[11px] text-slate-400">{r.rental_duration_days} days</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={r.rental_status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedAgreementId(r.id)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View / Print Rental Agreement PDF"
                        >
                          Agreement
                        </button>
                        {['Confirmed', 'Dispatched', 'Overdue'].includes(r.rental_status) && (
                          <Link
                            to="/operations/returns"
                            className="px-2.5 py-1 text-xs font-bold rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            Return
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Alerts / Needs Attention Box */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Needs Follow-Up</h3>
                <p className="text-[11px] text-slate-500">Overdue equipment to call back</p>
              </div>
            </div>

            <div className="space-y-2.5 mt-4">
              {stats?.overdue_alerts?.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-600">No overdue items!</p>
                  <p className="text-[11px]">All tools returned on time.</p>
                </div>
              ) : (
                stats?.overdue_alerts?.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="p-3 bg-rose-50/70 rounded-2xl border border-rose-200/80 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold font-mono text-slate-900">{alert.rental_id}</span>
                      <span className="font-bold text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded-full text-[10px]">
                        {alert.days_overdue}d Overdue
                      </span>
                    </div>
                    <p className="text-slate-900 font-bold mt-1.5">{alert.customer_name}</p>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {alert.phone}
                      </span>
                      <Link
                        to="/operations/returns"
                        className="font-bold text-rose-700 hover:underline"
                      >
                        Check-in &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            to="/operations/returns"
            className="mt-4 block text-center py-2.5 px-3 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-xs"
          >
            Open Returns & Late Fee Desk
          </Link>
        </div>
      </div>

      {/* Agreement Modal */}
      <AgreementModal
        isOpen={!!selectedAgreementId}
        onClose={() => setSelectedAgreementId(null)}
        rentalId={selectedAgreementId}
      />
    </div>
  );
};
