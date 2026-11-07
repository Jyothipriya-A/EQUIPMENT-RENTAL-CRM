import React, { useState, useEffect } from 'react';
import { authApi } from '../../api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  KeyRound,
  Edit2,
  Lock,
  Mail,
  Phone,
  Building,
  UserX,
  AlertCircle
} from 'lucide-react';

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    role: 'front_desk',
    employee_id: '',
    department: 'Front Desk',
    is_active: true,
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStaff();
  }, [search, roleFilter]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const res = await authApi.getStaff(params);
      setStaffList(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedStaff(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      role: 'front_desk',
      employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      department: 'Operations',
      is_active: true,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      email: staff.email,
      username: staff.username,
      password: '',
      phone: staff.phone || '',
      role: staff.role,
      employee_id: staff.staff_profile?.employee_id || '',
      department: staff.staff_profile?.department || 'Operations',
      is_active: staff.is_active,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (selectedStaff) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // keep existing password if empty
        await authApi.updateStaff(selectedStaff.id, payload);
      } else {
        await authApi.createStaff(formData);
      }
      setIsFormOpen(false);
      loadStaff();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to save staff user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (staff) => {
    if (window.confirm(`Are you sure you want to ${staff.is_active ? 'deactivate' : 'activate'} this staff member?`)) {
      try {
        await authApi.updateStaff(staff.id, { is_active: !staff.is_active });
        loadStaff();
      } catch (err) {
        alert(err.response?.data?.detail || 'Error toggling account status.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Team Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user credentials, role permissions (Admin, Front Desk, Operations), and account status.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
        >
          <option value="">All Staff Roles</option>
          <option value="admin">Administrator</option>
          <option value="front_desk">Front Desk Staff</option>
          <option value="operations">Operations Staff</option>
        </select>
      </div>

      {/* Staff Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading staff directory...</div>
        ) : staffList.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">No staff members found.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4">Employee ID & Dept</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4 text-center">Account Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                            {s.first_name ? s.first_name[0] : s.username[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{s.full_name}</p>
                            <p className="text-[11px] text-slate-500">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={s.role} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-mono font-semibold text-slate-800">{s.staff_profile?.employee_id || 'N/A'}</span>
                        <p className="text-[11px] text-slate-400">{s.staff_profile?.department || 'Operations'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{s.phone || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                          title="Edit Details / Reset Password"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 ${s.is_active ? 'text-slate-400 hover:text-rose-600' : 'text-emerald-600'}`}
                          title={s.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {staffList.map((s) => (
                <div key={s.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{s.full_name}</h4>
                      <p className="text-[11px] text-slate-500">{s.email}</p>
                    </div>
                    <Badge status={s.role} />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-mono text-slate-500">{s.staff_profile?.employee_id}</span>
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600"
                    >
                      Edit Account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedStaff ? `Edit Staff: ${selectedStaff.full_name}` : 'Create Staff Account'}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                disabled={!!selectedStaff}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value, username: e.target.value.split('@')[0] })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="+91 98000 00000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="front_desk">Front Desk Staff</option>
                <option value="operations">Operations Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Front Desk / Yard"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {selectedStaff ? 'Reset Password (Leave blank to keep current)' : 'Account Password'}
              </label>
              <input
                type="password"
                required={!selectedStaff}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder={selectedStaff ? 'Enter new password only if changing' : 'Min 6 characters'}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Active Account (Enabled for login)</span>
              </label>
            </div>
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
              {submitting ? 'Saving...' : selectedStaff ? 'Update Staff Member' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
