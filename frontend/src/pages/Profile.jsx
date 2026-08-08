import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { User as UserIcon, Mail, Phone, ShieldCheck, Key, CheckCircle, Clock, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Profile = () => {
  const { user, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccessMsg('Your password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.response?.data?.detail || 'Failed to update password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Security Profile</h1>
        <p className="text-xs text-slate-400 mt-1">Manage your active credentials, assigned permissions, and system access role</p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm space-y-8">
        {/* Header Avatar & Identity */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-200">
          <div className="w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-sm">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-10 h-10" />}
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h2 className="text-base font-semibold text-slate-800">{user?.full_name || 'Showroom Executive'}</h2>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Account Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">{user?.email || 'N/A'}</p>
          </div>
        </div>

        {/* User Attributes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2.5 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Assigned RBAC Role</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-lg font-bold text-slate-900">{user?.role || 'EMPLOYEE'}</span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
                Level Permissions
              </span>
            </div>
          </div>

          <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2.5 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <Phone className="w-4 h-4 text-cyan-600" />
              <span>Phone Contact</span>
            </div>
            <p className="text-lg font-bold text-slate-900 pt-1">{user?.phone || 'Not Specified'}</p>
          </div>

          <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2.5 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Corporate Email Address</span>
            </div>
            <p className="text-base font-bold text-slate-900 pt-1">{user?.email || 'N/A'}</p>
          </div>

          <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2.5 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Registration Date</span>
            </div>
            <p className="text-base font-bold text-slate-900 pt-1">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
            </p>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-800">Update Account Password</h4>
              <p className="text-xs text-slate-400">Change your individual login password for security</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" label="" /> : <span>Update Password</span>}
              </button>
            </div>
          </form>
        </div>

        {/* Security & JWT Session Details */}
        <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-800">JWT Access Session Token</h4>
              <p className="text-xs text-slate-400">Cryptographically signed bearer authentication token</p>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-500 truncate shadow-sm">
            {token ? `Bearer ${token}` : 'No active token found'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
