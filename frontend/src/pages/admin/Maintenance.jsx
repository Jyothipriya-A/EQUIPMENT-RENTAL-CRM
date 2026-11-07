import React, { useState, useEffect } from 'react';
import { maintenanceApi, inventoryApi, authApi } from '../../api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Settings,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wrench,
  User,
  Calendar,
  IndianRupee
} from 'lucide-react';

export const Maintenance = () => {
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completeRecord, setCompleteRecord] = useState(null);

  // Create Form State
  const [formData, setFormData] = useState({
    asset: '',
    maintenance_type: 'Routine Inspection',
    issue_description: '',
    start_date: new Date().toISOString().split('T')[0],
    expected_completion_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    maintenance_cost: '0',
    assigned_staff: '',
    status: 'In Progress',
  });

  // Complete Form State
  const [completeData, setCompleteData] = useState({
    maintenance_cost: '',
    resolution_notes: 'Repairs completed, test run passed with zero load vibrations.',
    asset_condition: 'Good',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    loadAuxData();
  }, []);

  useEffect(() => {
    loadMaintenance();
  }, [search, statusFilter]);

  const loadAuxData = async () => {
    try {
      const [astRes, stfRes] = await Promise.all([
        inventoryApi.getAssets({ page_size: 100 }),
        authApi.getStaff({ page_size: 100 }),
      ]);
      setAssets(astRes.data.results || astRes.data || []);
      setStaffList(stfRes.data.results || stfRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMaintenance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await maintenanceApi.getMaintenances(params);
      setRecords(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      asset: assets[0]?.id || '',
      maintenance_type: 'Routine Inspection',
      issue_description: '',
      start_date: new Date().toISOString().split('T')[0],
      expected_completion_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      maintenance_cost: '500',
      assigned_staff: staffList[0]?.id || '',
      status: 'In Progress',
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await maintenanceApi.createMaintenance(formData);
      setIsCreateOpen(false);
      loadMaintenance();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to create maintenance ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenComplete = (rec) => {
    setCompleteRecord(rec);
    setCompleteData({
      maintenance_cost: rec.maintenance_cost || '0',
      resolution_notes: 'All inspected parts verified, test run successful.',
      asset_condition: 'Good',
    });
    setFormError(null);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await maintenanceApi.completeMaintenance(completeRecord.id, completeData);
      setCompleteRecord(null);
      loadMaintenance();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to complete maintenance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Equipment Maintenance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log workshop repairs, safety calibrations, automatic fleet availability lock, and service expense tracking.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Maintenance Ticket
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ticket ID, serial number, issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading maintenance records...</div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">No maintenance tickets logged.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Ticket ID & Equipment</th>
                    <th className="py-3.5 px-4">Maintenance Type</th>
                    <th className="py-3.5 px-4">Issue Description</th>
                    <th className="py-3.5 px-4">Dates</th>
                    <th className="py-3.5 px-4 text-right">Cost (₹)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900 text-xs">{r.maintenance_id}</p>
                        <p className="font-bold text-slate-800">{r.product_name}</p>
                        <p className="font-mono text-[11px] text-blue-600">{r.asset_serial}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{r.maintenance_type}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{r.issue_description}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {r.start_date} → {r.actual_completion_date || r.expected_completion_date}
                        <p className="text-[10px] text-slate-400">Assigned: {r.assigned_staff_name || 'Workshop Team'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{Number(r.maintenance_cost).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status !== 'Completed' && (
                          <button
                            onClick={() => handleOpenComplete(r)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100">
              {records.map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono font-bold text-xs text-blue-600">{r.maintenance_id}</p>
                      <h4 className="font-bold text-xs text-slate-900 mt-0.5">{r.product_name}</h4>
                      <p className="font-mono text-[11px] text-slate-500">{r.asset_serial}</p>
                    </div>
                    <Badge status={r.status} />
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">{r.issue_description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-900">Cost: ₹{Number(r.maintenance_cost).toLocaleString()}</span>
                    {r.status !== 'Completed' && (
                      <button
                        onClick={() => handleOpenComplete(r)}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Log Ticket Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Equipment Maintenance Ticket"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Placing an asset under maintenance automatically locks its booking status and marks it <strong>Unavailable</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Asset Unit</label>
              <select
                required
                value={formData.asset}
                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.product_name} (SN: {a.serial_number}) - [{a.availability_status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Type</label>
              <select
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="Routine Inspection">Routine Inspection</option>
                <option value="Repair">Repair</option>
                <option value="Parts Replacement">Parts Replacement</option>
                <option value="Cleaning & Calibration">Cleaning & Calibration</option>
                <option value="Emergency Repair">Emergency Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Completion</label>
              <input
                type="date"
                required
                value={formData.expected_completion_date}
                onChange={(e) => setFormData({ ...formData, expected_completion_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.maintenance_cost}
                onChange={(e) => setFormData({ ...formData, maintenance_cost: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Responsible Staff</label>
              <select
                value={formData.assigned_staff}
                onChange={(e) => setFormData({ ...formData, assigned_staff: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="">Unassigned / Workshop Team</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Description & Diagnostics</label>
            <textarea
              rows="2"
              required
              value={formData.issue_description}
              onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="Describe symptoms, damaged parts, or scheduled service..."
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Logging...' : 'Create Ticket & Lock Asset'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Maintenance Modal */}
      <Modal
        isOpen={!!completeRecord}
        onClose={() => setCompleteRecord(null)}
        title={`Complete Maintenance: ${completeRecord?.maintenance_id}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <p className="text-xs text-slate-600">
            Completing this maintenance will return asset <strong>{completeRecord?.asset_serial}</strong> to <strong>Available</strong> fleet status.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Final Actual Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={completeData.maintenance_cost}
              onChange={(e) => setCompleteData({ ...completeData, maintenance_cost: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Updated Asset Condition</label>
            <select
              value={completeData.asset_condition}
              onChange={(e) => setCompleteData({ ...completeData, asset_condition: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution & Service Notes</label>
            <textarea
              rows="2"
              required
              value={completeData.resolution_notes}
              onChange={(e) => setCompleteData({ ...completeData, resolution_notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCompleteRecord(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Finish & Release Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
