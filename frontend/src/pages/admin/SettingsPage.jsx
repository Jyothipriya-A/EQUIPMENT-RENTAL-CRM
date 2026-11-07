import React, { useState, useEffect } from 'react';
import { settingsApi } from '../../api';
import {
  Building2,
  Percent,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sliders,
  DollarSign,
  FileText
} from 'lucide-react';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    company_name: 'EquipRent Pro Heavy Tools Ltd.',
    phone: '+91 98765 43210',
    email: 'support@rentalcrm.com',
    address: 'Plot 42, Industrial Area Phase II, Bengaluru, Karnataka 560058',
    gstin: '29ABCDE1234F1Z5',
    currency: 'INR (₹)',
    currency_symbol: '₹',
    default_tax_rate: 18.0,
    default_late_fee_per_day: 500.0,
    default_security_deposit_pct: 25.0,
    grace_period_hours: 2,
    require_kyc: true,
    max_advance_booking_days: 90,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsApi.getSettings();
      setSettings((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await settingsApi.updateSettings({
        ...settings,
        default_tax_rate: parseFloat(settings.default_tax_rate) || 0,
        default_late_fee_per_day: parseFloat(settings.default_late_fee_per_day) || 0,
        default_security_deposit_pct: parseFloat(settings.default_security_deposit_pct) || 0,
        grace_period_hours: parseInt(settings.grace_period_hours, 10) || 0,
        max_advance_booking_days: parseInt(settings.max_advance_booking_days, 10) || 30,
      });
      setSettings((prev) => ({ ...prev, ...res.data }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update system settings. Make sure you are an administrator.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading business settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
            System Administration
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Business Settings &amp; Rental Rates
          </h1>
          <p className="text-xs text-slate-500">
            Configure enterprise billing info, default late fees, taxes, and system rules.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Profile */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Enterprise Profile</h2>
              <p className="text-[11px] text-slate-500">Printed on all customer rental agreements &amp; payment receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Store Name</label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN / Business Tax Number</label>
              <input
                type="text"
                name="gstin"
                value={settings.gstin}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Contact Phone</label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Support Email</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Yard / Dispatch Center Address</label>
              <textarea
                rows={2}
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Rental Rates & Taxes */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Rental Rates &amp; Policy Defaults</h2>
              <p className="text-[11px] text-slate-500">Auto-filled in the booking wizard when creating new agreements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default GST / Tax Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  name="default_tax_rate"
                  value={settings.default_tax_rate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Late Fee (₹ / Day)</label>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  name="default_late_fee_per_day"
                  value={settings.default_late_fee_per_day}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium pl-8"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Security Deposit Ratio (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  name="default_security_deposit_pct"
                  value={settings.default_security_deposit_pct}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Return Grace Period (Hours)</label>
              <input
                type="number"
                name="grace_period_hours"
                value={settings.grace_period_hours}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">Hours before late fee triggers</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Advance Booking (Days)</label>
              <input
                type="number"
                name="max_advance_booking_days"
                value={settings.max_advance_booking_days}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency Standard</label>
              <input
                type="text"
                disabled
                value="Indian Rupee (₹ INR)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Operations & Verification Rules */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Security &amp; Workflow Rules</h2>
              <p className="text-[11px] text-slate-500">Business compliance and automated fleet locking controls</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">Mandatory KYC Proof Before Dispatch</span>
                <span className="text-slate-500 text-[11px]">Require Aadhaar, Driving License, or GSTIN on customer record</span>
              </div>
              <input
                type="checkbox"
                name="require_kyc"
                checked={settings.require_kyc}
                onChange={handleChange}
                className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={loadSettings}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
