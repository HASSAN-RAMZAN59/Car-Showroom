import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const ProcessPayoutModal = ({ isOpen, investmentId, onClose, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !investmentId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        transaction_reference: null,
        notes: notes || null,
      };

      await axiosInstance.post(`/investors/payout/${investmentId}`, payload);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Process investor payout error:', err);
      setError(err.response?.data?.detail || 'Failed to process investor profit payout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Process Investor Settlement Payout</h3>
              <p className="text-xs text-slate-400">Payout principal capital + settled profit share</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Settlement Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Final settlement payout for vehicle sale"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" label="" /> : <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Execute Investor Payout</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessPayoutModal;
