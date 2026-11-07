import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api';
import { Modal } from '../../components/Modal';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const CustomerRegistration = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    address: '',
    id_proof_type: 'Aadhaar',
    id_proof_number: '',
    notes: 'Walk-in front desk registration',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerApi.getCustomers({ search });
      setCustomers(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await customerApi.createCustomer(formData);
      setIsRegisterOpen(false);
      loadCustomers();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to register customer. Phone number must be unique.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewHistory = async (c) => {
    setSelectedCustomer(c);
    setLoadingHistory(true);
    try {
      const res = await customerApi.getCustomerRentalHistory(c.id);
      setRentalHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Front Desk Customer Registration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick KYC registration, verify ID proofs, check prior customer performance, and review pending balances.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              full_name: '',
              phone_number: '',
              email: '',
              address: '',
              id_proof_type: 'Aadhaar',
              id_proof_number: '',
              notes: 'Front desk registration',
            });
            setFormError(null);
            setIsRegisterOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Quick Customer Onboarding
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, Aadhaar, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Customer Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center text-xs text-slate-500">Loading directory...</div>
        ) : customers.length === 0 ? (
          <div className="col-span-full py-20 text-center text-xs text-slate-400">No customers found.</div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{c.full_name}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {c.phone_number}
                    </p>
                  </div>
                  {Number(c.outstanding_dues) > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                      Due: ₹{Number(c.outstanding_dues).toLocaleString()}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      Clear
                    </span>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <p className="text-slate-600">ID: <strong className="text-slate-800">{c.id_proof_type}</strong> ({c.id_proof_number})</p>
                  {c.address && <p className="text-slate-500 text-[11px] truncate">Address: {c.address}</p>}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{c.total_rentals} past contracts</span>
                <button
                  onClick={() => handleViewHistory(c)}
                  className="font-bold text-blue-600 hover:text-blue-800"
                >
                  View History
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Quick Customer Registration"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Company Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                placeholder="+91 98..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                placeholder="client@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">KYC ID Type</label>
              <select
                value={formData.id_proof_type}
                onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Company GSTIN">Company GSTIN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID Number</label>
              <input
                type="text"
                required
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 uppercase"
                placeholder="XXXX-XXXX-XXXX"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Rental History: ${selectedCustomer?.full_name}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading history...</div>
          ) : rentalHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No previous rental contracts.</p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {rentalHistory.map((r) => (
                <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900">{r.rental_id} • {r.items_summary}</p>
                    <p className="text-[11px] text-slate-500">{r.start_date} → {r.expected_return_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{Number(r.total_amount).toLocaleString()}</p>
                    <p className="text-[10px] text-rose-600 font-semibold">Bal: ₹{Number(r.outstanding_balance).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
