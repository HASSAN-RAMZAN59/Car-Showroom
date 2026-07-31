import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Database, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const BackupExportWidget = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

      setSuccessMsg('Complete database JSON backup downloaded successfully!');
    } catch (err) {
      console.error('Database backup export error:', err);
      setError('Failed to export database backup snapshot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Automated One-Click Database Backup</h3>
          <p className="text-xs text-slate-400">Stream complete system snapshot (Users, Inventory, Sales, Bank Ledgers, Audit Logs)</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <button
        onClick={handleExportBackup}
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {loading ? (
          <LoadingSpinner size="sm" label="" />
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export Full Database Backup (JSON)</span>
          </>
        )}
      </button>
    </div>
  );
};

export default BackupExportWidget;
