import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, Phone, ShieldCheck, Key, CheckCircle, Clock } from 'lucide-react';

const Profile = () => {
  const { user, token } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">User Security Profile</h1>
        <p className="text-xs text-slate-400 mt-1">Manage your active credentials, assigned permissions, and system access role</p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
        {/* Header Avatar & Identity */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-10 h-10" />}
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h2 className="text-xl font-bold text-white">{user?.full_name || 'Showroom Executive'}</h2>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Account Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">{user?.email || 'N/A'}</p>
          </div>
        </div>

        {/* User Attributes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Assigned RBAC Role</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-lg font-extrabold text-white">{user?.role || 'EMPLOYEE'}</span>
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold">
                Level Permissions
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>Phone Contact</span>
            </div>
            <p className="text-lg font-extrabold text-white pt-1">{user?.phone || 'Not Specified'}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Corporate Email Address</span>
            </div>
            <p className="text-base font-bold text-white pt-1">{user?.email || 'N/A'}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Registration Date</span>
            </div>
            <p className="text-base font-bold text-white pt-1">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
            </p>
          </div>
        </div>

        {/* Security & JWT Session Details */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">JWT Access Session Token</h4>
              <p className="text-xs text-slate-400">Cryptographically signed bearer authentication token</p>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-400 truncate">
            {token ? `Bearer ${token}` : 'No active token found'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
