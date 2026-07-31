import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Building2, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const CreateBankAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    account_title: '',
    bank_name: '',
    account_number: '',
    current_balance: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        account_title: formData.account_title,
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        current_balance: parseFloat(formData.current_balance) || 0.0,
      };

      await axiosInstance.post('/bank/accounts', payload);
      setFormData({
        account_title: '',
        bank_name: '',
        account_number: '',
        current_balance: '',
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create bank account error:', err);
      setError(err.response?.data?.detail || 'Failed to register showroom bank account.');
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
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Showroom Bank Account</h3>
              <p className="text-xs text-slate-400">Register corporate bank account for ledger tracking</p>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Account Title *</label>
            <input
              type="text"
              name="account_title"
              required
              value={formData.account_title}
              onChange={handleChange}
              placeholder="e.g. Meezan Showroom Operations"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Bank Name *</label>
            <input
              type="text"
              name="bank_name"
              required
              value={formData.bank_name}
              onChange={handleChange}
              placeholder="e.g. Meezan Bank / HBL / Faysal Bank"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Account / IBAN Number *</label>
            <input
              type="text"
              name="account_number"
              required
              value={formData.account_number}
              onChange={handleChange}
              placeholder="PK12MEZN00011122233344"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Opening Balance (PKR)</label>
            <input
              type="number"
              name="current_balance"
              value={formData.current_balance}
              onChange={handleChange}
              placeholder="e.g. 5000000"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold text-emerald-400"
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" label="" /> : <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Create Bank Account</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBankAccountModal;
