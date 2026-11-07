import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../api';
import { Modal } from '../../components/Modal';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  Edit2,
  Package,
  Wrench
} from 'lucide-react';

export const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    address: '',
    company_details: '',
    notes: '',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getSuppliers({ search });
      setSuppliers(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      phone_number: '',
      email: '',
      address: '',
      company_details: 'Authorized OEM Equipment Vendor',
      notes: '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setSelectedSupplier(sup);
    setFormData({
      name: sup.name,
      contact_person: sup.contact_person || '',
      phone_number: sup.phone_number,
      email: sup.email || '',
      address: sup.address || '',
      company_details: sup.company_details || '',
      notes: sup.notes || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (selectedSupplier) {
        await inventoryApi.updateSupplier(selectedSupplier.id, formData);
      } else {
        await inventoryApi.createSupplier(formData);
      }
      setIsFormOpen(false);
      loadSuppliers();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to save supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers & OEMs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Equipment procurement vendors, original equipment manufacturers, and warranty service providers.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier name, contact person, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center text-xs text-slate-500">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full py-20 text-center text-xs text-slate-400">No suppliers found.</div>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{s.name}</h3>
                      <p className="text-[11px] text-slate-500">{s.contact_person || 'Procurement Desk'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.phone_number}</span>
                  </p>
                  {s.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </p>
                  )}
                  {s.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-600 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" />
                  {s.supplied_assets_count || 0} Assets In Fleet
                </span>
                <span className="text-[10px] text-slate-400">Verified OEM</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Supplier Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="e.g. JCB India Equipment Ltd"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Key Account Representative"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="+91 ..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="sales@vendor.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Office / Works Address</label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : selectedSupplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
