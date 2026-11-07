import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Wrench,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck,
  Building2
} from 'lucide-react';

export const Login = ({ initialPortal = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Determine active portal: check initialPortal prop, pathname, or query param
  const getInitialPortal = () => {
    if (initialPortal) return initialPortal;
    if (location.pathname.includes('/admin/login')) return 'admin';
    if (location.pathname.includes('/staff/login')) return 'staff';
    const params = new URLSearchParams(location.search);
    if (params.get('portal') === 'staff') return 'staff';
    return 'admin'; // default to admin or first portal
  };

  const [activePortal, setActivePortal] = useState(getInitialPortal);
  const [email, setEmail] = useState(activePortal === 'admin' ? 'admin@rentalcrm.com' : 'staff@rentalcrm.com');
  const [password, setPassword] = useState(activePortal === 'admin' ? 'Admin@123' : 'Staff@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // When switching portals, update default demo credentials and clear errors
  const handleSwitchPortal = (portal) => {
    setActivePortal(portal);
    setError(null);
    if (portal === 'admin') {
      setEmail('admin@rentalcrm.com');
      setPassword('Admin@123');
    } else {
      setEmail('staff@rentalcrm.com');
      setPassword('Staff@123');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      
      // Role-based portal validation
      if (activePortal === 'admin' && user.role !== 'admin' && !user.is_superuser) {
        setError('Access Denied: This account does not have Admin privileges. Please switch to the "Staff & Front Desk" portal tab.');
        setLoading(false);
        return;
      }

      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (activePortal === 'admin' || user.role === 'admin' || user.is_admin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/operations/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
        activePortal === 'admin' ? 'bg-purple-600/20' : 'bg-blue-600/20'
      }`}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-300 ${
            activePortal === 'admin'
              ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 shadow-purple-500/30'
              : 'bg-gradient-to-tr from-blue-700 to-cyan-600 shadow-blue-500/30'
          }`}>
            {activePortal === 'admin' ? <Shield className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-white tracking-tight">
              EQUIP<span className={activePortal === 'admin' ? 'text-purple-400' : 'text-blue-400'}>RENT</span> PRO
            </h1>
            <p className="text-xs text-slate-400 font-medium">Equipment & Tool Rental CRM System</p>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white shadow-2xl rounded-3xl border border-slate-100 overflow-hidden">
          {/* Separate Portal Selector Tabs */}
          <div className="grid grid-cols-2 bg-slate-100/90 p-1.5 border-b border-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchPortal('admin')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all ${
                activePortal === 'admin'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchPortal('staff')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all ${
                activePortal === 'staff'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Staff / Front Desk</span>
            </button>
          </div>

          <div className="py-7 px-6 sm:px-10">
            {/* Header Description for Selected Portal */}
            <div className="mb-6">
              {activePortal === 'admin' ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 mb-1.5">
                    <Shield className="w-3 h-3" />
                    <span>Executive Access</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Admin Sign In</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Access inventory management, staff accounts, financial ledgers, and executive analytics.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 mb-1.5">
                    <KeyRound className="w-3 h-3" />
                    <span>Front Desk & Operations</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Staff Sign In</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Access the rental counter, live fleet availability, bookings, dispatches, and returns.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activePortal === 'admin' ? "admin@rentalcrm.com" : "staff@rentalcrm.com"}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 ${
                  activePortal === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {loading ? 'Authenticating...' : `Sign In to ${activePortal === 'admin' ? 'Admin Portal' : 'Staff Desk'}`}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Quick 1-Click Demo Fill for Current Portal */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Demo Fast Fill
                </span>
                <span className="text-[10px] text-slate-400">Click to fill test credentials</span>
              </div>

              {activePortal === 'admin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@rentalcrm.com');
                    setPassword('Admin@123');
                    setError(null);
                  }}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                      <Shield className="w-3.5 h-3.5 text-purple-700" />
                      <span>Admin Credentials</span>
                    </div>
                    <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                      admin@rentalcrm.com &bull; Admin@123
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                    Auto-Fill
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEmail('staff@rentalcrm.com');
                    setPassword('Staff@123');
                    setError(null);
                  }}
                  className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                      <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                      <span>Staff Credentials</span>
                    </div>
                    <p className="text-[11px] text-blue-700 font-medium mt-0.5">
                      staff@rentalcrm.com &bull; Staff@123
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                    Auto-Fill
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          EquipRent Pro CRM &bull; Technical Assessment System
        </p>
      </div>
    </div>
  );
};
