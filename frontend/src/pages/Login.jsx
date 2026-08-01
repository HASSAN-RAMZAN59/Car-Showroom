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
    email: 'admin@carshowroom.com',
    password: 'SecurePassword123!',
    desc: 'Full access to analytics, audit logs, backup & settings.'
  },
  {
    role: 'MANAGER',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    hoverBorder: 'hover:border-cyan-500/50',
    title: 'Showroom Manager',
    email: 'manager@carshowroom.com',
    password: 'SecurePassword123!',
    desc: 'Access to sales, inventory, expenses & payroll management.'
  },
  {
    role: 'EMPLOYEE',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/50',
    title: 'Showroom Staff',
    email: 'employee@carshowroom.com',
    password: 'SecurePassword123!',
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container - Responsive Layout */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-stretch gap-6 relative z-10">
        
        {/* Main Login Card */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
          <div>
            {/* Brand Logo & Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                <CarFront className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Car Showroom ERP</h1>
              <p className="text-xs text-slate-400 mt-1">Enterprise Used Vehicle Management System</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@carshowroom.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-800/80 pt-6">
            Authorized personnel access only. Secure SSL Session.
          </div>
        </div>

        {/* Demo Credentials Side Panel */}
        <div className="w-full md:w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Key className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">Demo Logins</h2>
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
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative group ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
                        : `bg-slate-950/60 border-slate-800/80 ${demo.hoverBorder} hover:bg-slate-800/50`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${demo.badgeColor}`}>
                        {demo.role}
                      </span>
                      {copiedRole === demo.role ? (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Auto-filled!
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" /> Click to fill
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white mb-1">{demo.title}</div>
                    <div className="text-xs font-mono text-slate-300 break-all">{demo.email}</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">Pass: {demo.password}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
            💡 Tap any account to test different role permissions.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;

