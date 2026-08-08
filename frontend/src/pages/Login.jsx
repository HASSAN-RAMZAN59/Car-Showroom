import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CarFront, Lock, Mail, AlertCircle, ArrowRight, Key, ShieldCheck, UserCheck, Sparkles, Check } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DEMO_CREDENTIALS = [
  {
    role: 'ADMIN',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    hoverBorder: 'hover:border-indigo-500/50',
    title: 'System Administrator',
    email: 'admin@showroom.com',
    password: 'AdminPassword123!',
    desc: 'Full access to analytics, audit logs, backup & settings.'
  },
  {
    role: 'MANAGER',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    hoverBorder: 'hover:border-cyan-500/50',
    title: 'Showroom Manager',
    email: 'manager@showroom.com',
    password: 'ManagerPassword123!',
    desc: 'Access to sales, inventory, expenses & payroll management.'
  },
  {
    role: 'EMPLOYEE',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/50',
    title: 'Showroom Staff',
    email: 'staff@showroom.com',
    password: 'StaffPassword123!',
    desc: 'Access to vehicle search, leads CRM & daily tasks.'
  }
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedRole, setCopiedRole] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  const handleSelectDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setCopiedRole(demo.role);
    setTimeout(() => setCopiedRole(null), 1500);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container - Responsive Layout */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-stretch gap-6 relative z-10">
        
        {/* Main Login Card */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            {/* Brand Logo & Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm text-white">
                <CarFront className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Car Showroom ERP</h1>
              <p className="text-xs text-slate-400 mt-1">Enterprise Used Vehicle Management System</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@showroom.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <LoadingSpinner size="sm" label="" />
                ) : (
                  <>
                    <span>Sign In to Showroom ERP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
            Authorized personnel access only. Secure SSL Session.
          </div>
        </div>

        {/* Demo Credentials Side Panel */}
        <div className="w-full md:w-80 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Key className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Demo Logins</h2>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Click any role card below to auto-fill the login credentials instantly.
            </p>

            <div className="space-y-3">
              {DEMO_CREDENTIALS.map((demo) => {
                const isSelected = email === demo.email;
                return (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleSelectDemo(demo)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative group ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                        {demo.role}
                      </span>
                      {copiedRole === demo.role ? (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Auto-filled!
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-600" /> Click to fill
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mb-1">{demo.title}</div>
                    <div className="text-xs font-mono text-slate-600 break-all">{demo.email}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">Pass: {demo.password}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-500 bg-slate-100 p-3 rounded-lg border border-slate-200">
            💡 Tap any account to test different role permissions.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;

