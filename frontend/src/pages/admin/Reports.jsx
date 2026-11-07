import React, { useState, useEffect } from 'react';
import { reportApi, inventoryApi, customerApi } from '../../api';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  IndianRupee,
  Percent,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';

export const Reports = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [revRes, prodRes] = await Promise.all([
        reportApi.getRevenueReport(params),
        inventoryApi.getProducts({ page_size: 100 }),
      ]);
      setRevenueData(revRes.data);
      setProducts(prodRes.data.results || prodRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = (type) => {
    window.open(reportApi.getExportCsvUrl(type), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Fleet Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready reporting, date-filtered collections, payment mode breakdowns, and CSV data exports.
          </p>
        </div>

        {/* CSV Export Dropdown / Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCsv('rentals')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Rentals (CSV)
          </button>
          <button
            onClick={() => handleExportCsv('revenue')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Revenue (CSV)
          </button>
          <button
            onClick={() => handleExportCsv('assets')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            Assets (CSV)
          </button>
          <button
            onClick={() => handleExportCsv('customers')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            Customer Dues (CSV)
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          Filter Period:
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Revenue Summary Cards */}
      {revenueData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Inflow Collected</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">₹{revenueData.total_collected.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1">Gross receipts before deposit refunds</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deposit Refunds Disbursed</span>
            <h3 className="text-2xl font-black text-rose-600 mt-1">₹{revenueData.total_refunded.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1">Refunded deposits to clients post-inspection</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Retained Revenue</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">₹{revenueData.net_revenue.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1">Net operational revenue recognized</p>
          </div>
        </div>
      )}

      {/* Breakdowns Grid */}
      {revenueData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Payment Method */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Inflow By Payment Method</h3>
            <div className="space-y-3">
              {Object.entries(revenueData.by_method || {}).map(([method, amt]) => {
                const total = revenueData.total_collected || 1;
                const pct = Math.round((amt / total) * 100);
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{method}</span>
                      <span className="font-bold text-slate-900">₹{amt.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Transaction Type */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Inflow By Transaction Type</h3>
            <div className="space-y-3">
              {Object.entries(revenueData.by_type || {}).map(([tType, amt]) => {
                const total = revenueData.total_collected || 1;
                const pct = Math.round((amt / total) * 100);
                return (
                  <div key={tType} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{tType}</span>
                      <span className="font-bold text-slate-900">₹{amt.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fleet Utilization Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Fleet Asset Utilization By Product
          </h3>
          <span className="text-xs text-slate-500">Real-time status across entire inventory</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Total Units</th>
                <th className="py-3 px-4 text-center">Rented Units</th>
                <th className="py-3 px-4 text-center">Available Units</th>
                <th className="py-3 px-4 text-right">Utilization (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const util = p.total_assets > 0 ? Math.round((p.rented_assets / p.total_assets) * 100) : 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{p.category_name}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-800">{p.total_assets}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-amber-600">{p.rented_assets}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-600">{p.available_assets}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`font-bold ${util > 50 ? 'text-blue-600' : 'text-slate-500'}`}>
                        {util}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
