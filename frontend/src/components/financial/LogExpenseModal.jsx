import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, DollarSign, Upload, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const LogExpenseModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    expense_name: '',
    category: 'Utilities',
    amount: '',
    reason: '',
    payment_method: 'CASH',
    bank_account_id: '',
  });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts();
    }
  }, [isOpen]);

  const fetchBankAccounts = async () => {
    try {
      const res = await axiosInstance.get('/bank/accounts');
      setBankAccounts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch bank accounts:', err);
    }
  };

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
      const data = new FormData();
      data.append('expense_name', formData.expense_name);
      data.append('category', formData.category);
      data.append('amount', formData.amount);
      if (formData.reason) data.append('reason', formData.reason);
      data.append('payment_method', formData.payment_method);
      if (formData.payment_method === 'BANK_TRANSFER' && formData.bank_account_id) {
        data.append('bank_account_id', formData.bank_account_id);
      }
      if (receipt) data.append('receipt', receipt);

      await axiosInstance.post('/expenses/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData({
        expense_name: '',
        category: 'Utilities',
        amount: '',
        reason: '',
        payment_method: 'CASH',
        bank_account_id: '',
      });
      setReceipt(null);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Log expense error:', err);
      setError(err.response?.data?.detail || 'Failed to record daily expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Daily Showroom Expense</h3>
              <p className="text-xs text-slate-400">Utilities, Office Tea, Maintenance, or Fuel expenses</p>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Expense Name *</label>
            <input
              type="text"
              name="expense_name"
              required
              value={formData.expense_name}
              onChange={handleChange}
              placeholder="e.g. Showroom Electricity Bill, Office Tea"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="Utilities">Utilities (Electricity, Water, Internet)</option>
                <option value="Food/Tea">Food / Refreshments / Tea</option>
                <option value="Maintenance">Showroom Maintenance</option>
                <option value="Fuel">Fuel & Generator</option>
                <option value="Marketing">Marketing & Banners</option>
                <option value="Misc">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                name="amount"
                required
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 15000"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold text-rose-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="CASH">CASH Payment</option>
                <option value="BANK_TRANSFER">BANK TRANSFER (Auto-Deduct)</option>
              </select>
            </div>

            {formData.payment_method === 'BANK_TRANSFER' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Target Bank Account *</label>
                <select
                  name="bank_account_id"
                  required
                  value={formData.bank_account_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-semibold"
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank_name} - PKR {acc.current_balance?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Reason / Explanation</label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="e.g. Monthly utility payment for July"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Bill / Receipt Image</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceipt(e.target.files[0])}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-600/20 file:text-rose-400 hover:file:bg-rose-600/30"
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
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" label="" /> : <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Expense Entry</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogExpenseModal;
