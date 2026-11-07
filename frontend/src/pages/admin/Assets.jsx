import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  History,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  ShieldCheck,
  MapPin,
  Calendar
} from 'lucide-react';

export const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [assetHistory, setAssetHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    asset_id: '',
    product: '',
    serial_number: '',
    supplier: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: '',
    current_condition: 'Excellent',
    availability_status: 'Available',
    location: 'Main Depot - Bay A1',
    notes: '',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAuxData();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [search, statusFilter, conditionFilter]);

  const loadAuxData = async () => {
    try {
      const [prodRes, supRes] = await Promise.all([
        inventoryApi.getProducts({ page_size: 100 }),
        inventoryApi.getSuppliers({ page_size: 100 }),
      ]);
      setProducts(prodRes.data.results || prodRes.data || []);
      setSuppliers(supRes.data.results || supRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (conditionFilter) params.condition = conditionFilter;

      const res = await inventoryApi.getAssets(params);
      setAssets(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedAsset(null);
    setFormData({
      asset_id: `AST-${Date.now().toString().slice(-4)}`,
      product: products[0]?.id || '',
      serial_number: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      supplier: suppliers[0]?.id || '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: '25000',
      current_condition: 'Excellent',
      availability_status: 'Available',
      location: 'Depot Central - Bay 1',
      notes: 'New asset unit inducted into rental fleet.',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      asset_id: asset.asset_id,
      product: asset.product,
      serial_number: asset.serial_number,
      supplier: asset.supplier || '',
      purchase_date: asset.purchase_date || '',
      purchase_cost: asset.purchase_cost || '0',
      current_condition: asset.current_condition,
      availability_status: asset.availability_status,
      location: asset.location,
      notes: asset.notes || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (selectedAsset) {
        await inventoryApi.updateAsset(selectedAsset.id, formData);
      } else {
        await inventoryApi.createAsset(formData);
      }
      setIsFormOpen(false);
      loadAssets();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to save asset. Verify serial number is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewHistory = async (asset) => {
    setSelectedAsset(asset);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await inventoryApi.getAssetHistory(asset.id);
      setAssetHistory(res.data);
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Physical Asset Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track individual physical equipment units, serial numbers, locations, and service history.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Individual Asset
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by serial number, asset ID, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
            <option value="Reserved">Reserved</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Damaged">Damaged</option>
            <option value="Retired">Retired</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="">All Conditions</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Needs Repair">Needs Repair</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>
      </div>

      {/* Assets Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading asset units...</div>
        ) : assets.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No physical assets found.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Asset ID / Serial No</th>
                    <th className="py-3.5 px-4">Equipment Model</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4 text-center">Condition</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((ast) => (
                    <tr key={ast.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold font-mono text-slate-900 text-xs">{ast.asset_id}</p>
                        <p className="font-mono text-[11px] text-blue-600 font-semibold">{ast.serial_number}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{ast.product_name}</p>
                        <p className="text-[11px] text-slate-400">{ast.product_code} • {ast.product_category}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {ast.location}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ast.supplier_name || 'Direct Procurement'}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={ast.current_condition} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={ast.availability_status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleViewHistory(ast)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                          title="View Rental & Service History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ast)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {assets.map((ast) => (
                <div key={ast.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono font-black text-xs text-blue-600">{ast.serial_number}</p>
                      <h4 className="font-bold text-xs text-slate-900 mt-0.5">{ast.product_name}</h4>
                    </div>
                    <Badge status={ast.availability_status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                    <div>Condition: <Badge status={ast.current_condition} /></div>
                    <div>Location: <span className="font-medium text-slate-700">{ast.location}</span></div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-mono text-slate-400">{ast.asset_id}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewHistory(ast)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1"
                      >
                        <History className="w-3.5 h-3.5" /> History
                      </button>
                      <button
                        onClick={() => handleOpenEdit(ast)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Asset Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedAsset ? `Edit Asset: ${selectedAsset.serial_number}` : 'Register Physical Asset'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Product</label>
              <select
                required
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.product_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Serial Number</label>
              <input
                type="text"
                required
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-mono"
                placeholder="e.g. SN-BOSCH-99214"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Tag / ID</label>
              <input
                type="text"
                required
                value={formData.asset_id}
                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-mono"
                placeholder="e.g. AST-0105"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="">None / Direct Procurement</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Condition</label>
              <select
                value={formData.current_condition}
                onChange={(e) => setFormData({ ...formData, current_condition: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Availability Status</label>
              <select
                value={formData.availability_status}
                onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="Available">Available (Ready to Rent)</option>
                <option value="Reserved">Reserved</option>
                <option value="Rented">Rented</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Damaged">Damaged</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Depot / Yard Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="e.g. Depot Central - Bay B2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="Maintenance guidelines or accessory details..."
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
              {submitting ? 'Saving...' : selectedAsset ? 'Update Asset' : 'Register Asset'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Asset History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Asset History: ${selectedAsset?.serial_number}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {loadingHistory ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading history logs...</div>
          ) : assetHistory ? (
            <>
              {/* Asset Snapshot */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Product</span>
                  <p className="font-bold text-slate-900 truncate">{assetHistory.asset.product_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Status</span>
                  <div className="mt-0.5"><Badge status={assetHistory.asset.availability_status} /></div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Condition</span>
                  <div className="mt-0.5"><Badge status={assetHistory.asset.current_condition} /></div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Location</span>
                  <p className="font-medium text-slate-800">{assetHistory.asset.location}</p>
                </div>
              </div>

              {/* Past Rentals */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Rental Deployments ({assetHistory.rental_history?.length || 0})
                </h4>
                {assetHistory.rental_history?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No rental records yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {assetHistory.rental_history.map((r, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-900">{r.rental_id} • {r.customer_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {r.start_date} to {r.expected_return_date}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge status={r.status} />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Dispatched: {r.condition_on_dispatch} | Return: {r.condition_on_return || 'Pending'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Maintenance */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Service & Maintenance History ({assetHistory.maintenance_history?.length || 0})
                </h4>
                {assetHistory.maintenance_history?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">Clean service record. No maintenance issues.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {assetHistory.maintenance_history.map((m, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-900">{m.maintenance_id} • {m.type}</p>
                          <p className="text-[11px] text-slate-500">{m.issue}</p>
                        </div>
                        <div className="text-right">
                          <Badge status={m.status} />
                          <p className="text-[11px] font-bold text-slate-700 mt-0.5">₹{m.cost}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
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
