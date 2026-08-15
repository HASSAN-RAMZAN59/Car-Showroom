import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Download, ShieldCheck, AlertCircle, CheckCircle2, Server, FileJson, HardDrive, Upload } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DatabaseBackup = () => {
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
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
      link.download = `showroom_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const now = new Date().toLocaleString();
      setLastBackupTime(now);
      setSuccessMsg(`Backup file success fully aap ke Computer me download ho chuki hai! (${now})`);
    } catch (err) {
      console.error('Database backup export error:', err);
      setError(err.response?.data?.detail || 'Failed to download backup file.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm(`Kya aap "${file.name}" se showroom ka data wapas restore karna chahte hain?`)) {
      return;
    }

    setRestoreLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await axiosInstance.post('/backup/import-json', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMsg(`Backup file "${file.name}" se showroom ka data kamyabi se wapas load/restore ho gaya hai!`);
    } catch (err) {
      console.error('Database restore error:', err);
      setError(err.response?.data?.detail || 'Backup restore karne me masla aaya.');
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Simple Friendly Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Showroom Data Backup & Protection</h1>
        <p className="text-xs text-slate-400 mt-1">Ek click me showroom ka tamaam record save (download) karen ya kisi purane backup se restore karen</p>
      </div>

      {/* Main 2 Cards: Download & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: DOWNLOAD BACKUP */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">1. Download Backup (Save File)</h3>
                <p className="text-xs text-slate-400">Computer me data ki safe file download karen</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Rozana showroom band hone par ye button dabaen. Aap ki gaariyan, accounts, sales aur customer record ki ek choti <b>Backup File</b> computer me download ho jayegi.
            </p>

            {lastBackupTime && (
              <div className="p-2.5 bg-blue-50/60 border border-blue-200/60 rounded-xl text-[11px] text-blue-700 font-semibold">
                Aakhri Backup Download: {lastBackupTime}
              </div>
            )}
          </div>

          <button
            onClick={handleExportBackup}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner size="sm" label="File tayyar ho rahi hai..." />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Showroom Backup File</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 2: RESTORE BACKUP */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">2. Restore Data (Wapas Load Karen)</h3>
                <p className="text-xs text-slate-400">Purani backup file se data wapas layen</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Agar kabhi Naya Computer use karna ho ya purana data wapas chahiye ho, toh apni save ki hui <b>Backup File</b> ko select karke wapas load kar sakte hain.
            </p>
          </div>

          <label className="w-full py-3 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>{restoreLoading ? 'Data Restore Ho Raha Hai...' : 'Select Backup File & Restore'}</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" disabled={restoreLoading} />
          </label>
        </div>

      </div>

      {/* Status Alerts */}
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

      {/* 3 Simple Steps Guide for Non-Technical Staff */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Showroom Data Safe Rakhne Ke 3 Aasan Tareeqay</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-blue-600 block">TAREEQA 1: ROZANA BACKUP DOWNLOAD</span>
            <p className="text-slate-500">Rozana kaam khatam karne par "Download Backup" daba kar file computer me save kar lein.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-blue-600 block">TAREEQA 2: USB YA DRIVE ME SAVE KAREN</span>
            <p className="text-slate-500">Downloaded file ko kisi USB drive ya Google Drive me rakh lein taake record safe rahe.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-blue-600 block">TAREEQA 3: KABHI BHI WAPAS RESTORE KAREN</span>
            <p className="text-slate-500">Computer kharab hone par naye computer me wahi file select karke wapas load kar lein.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseBackup;
