import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Building2, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const SplitPaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const [saleId, setSaleId] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [paymentRows, setPaymentRows] = useState([
    { amount: '', payment_method: 'BANK_TRANSFER', bank_account_id: '', reference_number: '', notes: '' },
  ]);
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

  const handleAddRow = () => {
    setPaymentRows((prev) => [
      ...prev,
      { amount: '', payment_method: 'BANK_TRANSFER', bank_account_id: '', reference_number: '', notes: '' },
    ]);
  };

  const handleRemoveRow = (index) => {
    setPaymentRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setPaymentRows((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const totalSplitAmount = paymentRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!saleId.trim()) {
      setError('Please provide a valid Sale Transaction ID.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const formattedPayments = paymentRows.map((row) => ({
        amount: parseFloat(row.amount),
        payment_method: row.payment_method,
        bank_account_id: row.payment_method === 'BANK_TRANSFER' && row.bank_account_id ? row.bank_account_id : null,
        reference_number: row.reference_number || null,
        notes: row.notes || null,
      }));

      await axiosInstance.post('/bank/transactions/split-sale', {
        sale_id: saleId,
        payments: formattedPayments,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Split payment settlement error:', err);
      setError(err.response?.data?.detail || 'Failed to record multi-bank split payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Multi-Bank Split Payment</h3>
              <p className="text-xs text-slate-400">Settle single sale invoice using Bank A + Bank B + Cash</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Target Sale Transaction UUID *</label>
            <input
              type="text"
              required
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              placeholder="Paste sale UUID (e.g. e92909ac-6bc2-47a3-afa2-2b1c38b15ffe)"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
            />
          </div>

          {/* Dynamic Payment Rows */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Split Payment Rows</span>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg text-xs font-semibold flex items-center gap-1 border border-indigo-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            {paymentRows.map((row, idx) => (
              <div key={idx} className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Payment Line #{idx + 1}</span>
                  {paymentRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Amount (PKR) *</label>
                    <input
                      type="number"
                      required
                      value={row.amount}
                      onChange={(e) => handleRowChange(idx, 'amount', e.target.value)}
                      placeholder="e.g. 1500000"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Method *</label>
                    <select
                      value={row.payment_method}
                      onChange={(e) => handleRowChange(idx, 'payment_method', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="CASH">CASH</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>

                  {row.payment_method === 'BANK_TRANSFER' && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Bank Account *</label>
                      <select
                        required
                        value={row.bank_account_id}
                        onChange={(e) => handleRowChange(idx, 'bank_account_id', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      >
                        <option value="">Select Bank</option>
                        {bankAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.bank_name} ({acc.account_title.slice(0, 15)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total Calculation */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Total Split Amount Combined:</span>
            <span className="text-sm font-extrabold text-emerald-400">PKR {totalSplitAmount.toLocaleString()}</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800 flex-shrink-0">
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
                <span>Process Split Settlement</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SplitPaymentModal;
