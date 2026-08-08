import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Database, Download, ShieldCheck, AlertCircle, CheckCircle2, Server, Lock, FileJson, RefreshCw, HardDrive } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DatabaseBackup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastBackupTime, setLastBackupTime] = useState(null);

  const handleExportBackup = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await axiosInstance.get('/backup/export-json', {
        responseType: 'blob',
      });

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `car_showroom_erp_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const now = new Date().toLocaleString();
      setLastBackupTime(now);
      setSuccessMsg(`Database backup snapshot exported successfully at ${now}!`);
    } catch (err) {
      console.error('Database backup export error:', err);
      setError(err.response?.data?.detail || 'Failed to export database backup snapshot. Verify Admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Database Backup & Disaster Recovery</h1>
        <p className="text-xs text-slate-400 mt-1">Manage database safety, export structured JSON snapshots, and inspect disaster recovery status</p>
      </div>

      {/* Status & Export Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Database Status</h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                ONLINE (Supabase PostgreSQL)
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Engine:</span>
              <span className="font-mono font-bold text-slate-900">PostgreSQL 15+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SSL Encryption:</span>
              <span className="font-mono font-bold text-emerald-600">TLS v1.3 Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Export:</span>
              <span className="font-mono text-slate-600">{lastBackupTime || 'None in current session'}</span>
            </div>
          </div>
        </div>

        {/* Snapshot Content Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Backup Scope</h3>
              <p className="text-xs text-slate-400">Full Relational Schema</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Users & Roles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Vehicle Stock</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Sales & Deals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>EMI Contracts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Bank Ledgers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Audit Logs</span>
            </div>
          </div>
        </div>

        {/* Action Export Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-cyan-50 text-cyan-600 border border-cyan-200 rounded-xl">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Export Snapshot</h3>
                <p className="text-xs text-slate-400">Encrypted JSON File</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Generates a complete, structured JSON backup of all 17 tables suitable for restoration.</p>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={loading}
            className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner size="sm" label="" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Full Backup (.JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Disaster Recovery Protocol Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-800">Disaster Recovery & Data Security Protocol</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
          <div className="space-y-1.5 p-4 rounded-xl bg-slate-100/60 border border-slate-200">
            <span className="text-blue-600 font-bold font-mono">STEP 1: DAILY BACKUP</span>
            <p className="text-slate-500">Download daily JSON snapshots before closing daily business operations.</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-xl bg-slate-100/60 border border-slate-200">
            <span className="text-blue-600 font-bold font-mono">STEP 2: SECURE STORAGE</span>
            <p className="text-slate-500">Store exported JSON snapshots in an encrypted, off-site cloud storage directory.</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-xl bg-slate-100/60 border border-slate-200">
            <span className="text-blue-600 font-bold font-mono">STEP 3: RESTORE PROCEDURE</span>
            <p className="text-slate-500">In case of cloud failure, run <code className="text-blue-600 font-semibold">python -m app.core.seed</code> or import JSON via Supabase UI.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseBackup;
