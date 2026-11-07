import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  ShieldCheck,
  FileText,
  AlertCircle,
  CreditCard,
  Edit2,
  Calendar,
  History,
  CheckCircle2,
  Building2,
  Briefcase,
  UserPlus,
  Trash2,
  ChevronRight,
  Receipt
} from 'lucide-react';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [hasDuesFilter, setHasDuesFilter] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('rentals'); // rentals, payments, contacts
  const [rentalHistory, setRentalHistory] = useState([]);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_type: 'individual',
    full_name: '',
    phone_number: '',
    email: '',
    address: '',
    id_proof_type: 'Aadhaar',
    id_proof_number: '',
    notes: '',
    // Company specific
    company_name: '',
    company_type: 'Private Limited',
    gstin: '',
    company_email: '',
    billing_address: '',
    po_number: '',
    credit_limit: 0,
    credit_approved: false,
    payment_terms_days: 15,
    contacts: [],
  });

  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [search, customerTypeFilter, hasDuesFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (customerTypeFilter !== 'all') params.customer_type = customerTypeFilter;
      if (hasDuesFilter) params.has_dues = 'true';

      const res = await customerApi.getCustomers(params);
      setCustomers(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormData({
      customer_type: 'individual',
      full_name: '',
      phone_number: '',
      email: '',
      address: '',
      id_proof_type: 'Aadhaar',
      id_proof_number: '',
      notes: '',
      company_name: '',
      company_type: 'Private Limited',
      gstin: '',
      company_email: '',
      billing_address: '',
      po_number: '',
      credit_limit: 0,
      credit_approved: false,
      payment_terms_days: 15,
      contacts: [],
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customer_type: customer.customer_type || 'individual',
      full_name: customer.full_name || '',
      phone_number: customer.phone_number || '',
      email: customer.email || '',
      address: customer.address || '',
      id_proof_type: customer.id_proof_type || 'Aadhaar',
      id_proof_number: customer.id_proof_number || '',
      notes: customer.notes || '',
      company_name: customer.company_name || '',
      company_type: customer.company_type || 'Private Limited',
      gstin: customer.gstin || '',
      company_email: customer.company_email || '',
      billing_address: customer.billing_address || '',
      po_number: customer.po_number || '',
      credit_limit: customer.credit_limit || 0,
      credit_approved: !!customer.credit_approved,
      payment_terms_days: customer.payment_terms_days || 15,
      contacts: customer.contacts || [],
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleViewDetail = async (customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
    setDetailTab('rentals');
    try {
      setLoadingHistory(true);
      const [histRes, payRes] = await Promise.all([
        customerApi.getCustomerRentalHistory(customer.id),
        customerApi.getCustomerPayments(customer.id),
      ]);
      setRentalHistory(histRes.data || []);
      setPaymentsHistory(payRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddContact = () => {
    setFormData({
      ...formData,
      contacts: [
        ...formData.contacts,
        { name: '', phone: '', email: '', designation: '', is_primary: formData.contacts.length === 0 }
      ]
    });
  };

  const handleRemoveContact = (index) => {
    const updated = [...formData.contacts];
    updated.splice(index, 1);
    setFormData({ ...formData, contacts: updated });
  };

  const handleContactChange = (index, field, value) => {
    const updated = [...formData.contacts];
    updated[index][field] = value;
    setFormData({ ...formData, contacts: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (selectedCustomer) {
        await customerApi.updateCustomer(selectedCustomer.id, formData);
      } else {
        await customerApi.createCustomer(formData);
      }
      setIsFormOpen(false);
      loadCustomers();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.phone_number?.[0] || err.response?.data?.detail || 'Failed to save customer. Please verify all details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              Module 4 &bull; CRM &amp; KYC
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Customer Management</h1>
          <p className="text-xs text-slate-500">
            Maintain verified Individual &amp; Company customer profiles, KYC proof, credit terms, and ledger history.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Customer Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setCustomerTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              customerTypeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Accounts ({customers.length})
          </button>
          <button
            onClick={() => setCustomerTypeFilter('individual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              customerTypeFilter === 'individual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Individual Clients
          </button>
          <button
            onClick={() => setCustomerTypeFilter('company')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              customerTypeFilter === 'company'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🏢 Companies &amp; Corporate
          </button>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors ml-auto sm:ml-2">
            <input
              type="checkbox"
              checked={hasDuesFilter}
              onChange={(e) => setHasDuesFilter(e.target.checked)}
              className="w-3.5 h-3.5 text-rose-600 rounded"
            />
            <span>With Outstanding Dues</span>
          </label>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, GSTIN, company..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500 font-semibold">Loading verified customer accounts...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold text-slate-700">No customers found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try refining your search terms or customer type filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3.5 px-4">Client Name / Business</th>
                  <th className="py-3.5 px-4">Type &bull; KYC / GSTIN</th>
                  <th className="py-3.5 px-4 text-center">Rentals</th>
                  <th className="py-3.5 px-4 text-right">Outstanding Dues</th>
                  <th className="py-3.5 px-4 text-right">Held Deposits</th>
                  <th className="py-3.5 px-4 text-right">Profile Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      {c.customer_type === 'company' && c.company_name ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{c.company_name}</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                              Corp
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Contact: {c.full_name} &bull; <Phone className="w-3 h-3 inline text-slate-400" /> {c.phone_number}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{c.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{c.phone_number}</span>
                            {c.email && <span className="flex items-center gap-1">&bull; <Mail className="w-3 h-3 text-slate-400" />{c.email}</span>}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.customer_type === 'company' ? (
                        <div>
                          <span className="font-semibold text-slate-800">{c.company_type || 'Business Entity'}</span>
                          <p className="text-[11px] font-mono text-purple-700 font-bold">GSTIN: {c.gstin || 'Unregistered'}</p>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-800">{c.id_proof_type}</span>
                          <p className="text-[11px] font-mono text-slate-500">{c.id_proof_number || 'Verified'}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                        {c.total_rentals} ({c.active_rentals} active)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {Number(c.outstanding_dues) > 0 ? (
                        <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md text-xs border border-rose-200">
                          ₹{Number(c.outstanding_dues).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-xs flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ₹0.00
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">
                      ₹{Number(c.held_deposits).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleViewDetail(c)}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        Profile &amp; History
                      </button>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        title="Edit profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedCustomer ? 'Edit Customer Profile' : 'Register New Customer Account'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Customer Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Classification</label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customer_type: 'individual' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.customer_type === 'individual'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Individual Customer</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, customer_type: 'company' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.customer_type === 'company'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Company / Corporate</span>
              </button>
            </div>
          </div>

          {/* Company Specific Fields */}
          {formData.customer_type === 'company' && (
            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-3">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                <Briefcase className="w-4 h-4 text-purple-700" />
                <span>Company Enterprise Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Registered Name *</label>
                  <input
                    type="text"
                    required={formData.customer_type === 'company'}
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                    placeholder="e.g. Larsen &amp; Toubro Heavy Civil"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Entity Type</label>
                  <select
                    value={formData.company_type}
                    onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                    <option value="Limited Liability Partnership">LLP (Partnership)</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Public Limited">Public Limited Ltd</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono uppercase font-bold"
                    placeholder="29ABCDE1234F1Z5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    placeholder="billing@company.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Order (PO) #</label>
                  <input
                    type="text"
                    value={formData.po_number}
                    onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                    placeholder="PO-2026-99"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={formData.payment_terms_days}
                    onChange={(e) => setFormData({ ...formData, payment_terms_days: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Primary Contact Person Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {formData.customer_type === 'company' ? 'Primary Contact Person *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="contact@email.com"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ID Proof Type</label>
              <select
                value={formData.id_proof_type}
                onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Company GSTIN">Company GSTIN</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ID Proof Document #</label>
              <input
                type="text"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                placeholder="XXXX-XXXX-XXXX"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address / Yard Location</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Site 4, Outer Ring Road, Bengaluru"
              />
            </div>
          </div>

          {/* Multiple Company Contacts (Only for Company) */}
          {formData.customer_type === 'company' && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Additional Site / Billing Contacts</span>
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Contact</span>
                </button>
              </div>

              <div className="space-y-2">
                {formData.contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <input
                      type="text"
                      placeholder="Name"
                      value={contact.name}
                      onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={contact.phone}
                      onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                      className="w-32 px-2 py-1 rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Designation"
                      value={contact.designation || ''}
                      onChange={(e) => handleContactChange(idx, 'designation', e.target.value)}
                      className="w-32 px-2 py-1 rounded-lg border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(idx)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="Verified via phone &amp; physical ID check."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : selectedCustomer ? 'Update Profile' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dedicated Customer Profile & History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Customer Profile: ${selectedCustomer.display_name || selectedCustomer.full_name}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Top Quick Profile Stats */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Account Type</span>
                <span className="font-bold text-slate-900 uppercase">
                  {selectedCustomer.customer_type === 'company' ? '🏢 Corporate Account' : '👤 Individual'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Phone</span>
                <span className="font-bold text-slate-900">{selectedCustomer.phone_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Outstanding Dues</span>
                <span className="font-bold text-rose-600">₹{Number(selectedCustomer.outstanding_dues).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Held Security Deposits</span>
                <span className="font-bold text-amber-700">₹{Number(selectedCustomer.held_deposits).toLocaleString()}</span>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setDetailTab('rentals')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  detailTab === 'rentals' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Rental Agreements ({rentalHistory.length})</span>
              </button>

              <button
                onClick={() => setDetailTab('payments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  detailTab === 'payments' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Payments &amp; Receipts ({paymentsHistory.length})</span>
              </button>

              {selectedCustomer.contacts?.length > 0 && (
                <button
                  onClick={() => setDetailTab('contacts')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    detailTab === 'contacts' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Company Contacts ({selectedCustomer.contacts.length})</span>
                </button>
              )}
            </div>

            {/* Content Area */}
            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading transaction records...
              </div>
            ) : detailTab === 'rentals' ? (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-400 font-bold uppercase sticky top-0 bg-white">
                    <tr>
                      <th className="pb-2">Agreement ID</th>
                      <th className="pb-2">Rental Schedule</th>
                      <th className="pb-2">Equipment Items</th>
                      <th className="pb-2 text-right">Total Amount</th>
                      <th className="pb-2 text-right">Outstanding</th>
                      <th className="pb-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rentalHistory.length === 0 ? (
                      <tr><td colSpan={6} className="py-6 text-center text-slate-400">No rental history for this client.</td></tr>
                    ) : (
                      rentalHistory.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold font-mono text-slate-900">{r.rental_id}</td>
                          <td className="py-2.5 text-slate-600">{r.start_date} &rarr; {r.expected_return_date}</td>
                          <td className="py-2.5 text-slate-700 max-w-xs truncate">{r.items_summary}</td>
                          <td className="py-2.5 text-right font-bold">₹{Number(r.total_amount).toLocaleString()}</td>
                          <td className="py-2.5 text-right font-bold text-rose-600">₹{Number(r.outstanding_balance).toLocaleString()}</td>
                          <td className="py-2.5 text-center"><Badge status={r.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : detailTab === 'payments' ? (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-400 font-bold uppercase sticky top-0 bg-white">
                    <tr>
                      <th className="pb-2">Payment ID</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Transaction Type</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentsHistory.length === 0 ? (
                      <tr><td colSpan={6} className="py-6 text-center text-slate-400">No payment transactions recorded.</td></tr>
                    ) : (
                      paymentsHistory.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold font-mono text-slate-900">{p.payment_id}</td>
                          <td className="py-2.5 text-slate-600">{new Date(p.date).toLocaleDateString()}</td>
                          <td className="py-2.5 font-semibold text-slate-800">{p.type}</td>
                          <td className="py-2.5 text-slate-600">{p.method}</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">₹{Number(p.amount).toLocaleString()}</td>
                          <td className="py-2.5 text-center"><Badge status={p.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedCustomer.contacts?.map((contact, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900 text-sm">{contact.name}</p>
                    <p className="text-purple-700 font-semibold text-[11px]">{contact.designation || 'Site Contact'}</p>
                    <div className="mt-2 space-y-1 text-slate-600 text-[11px]">
                      <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {contact.phone}</p>
                      {contact.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {contact.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
