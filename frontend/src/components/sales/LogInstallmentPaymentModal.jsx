import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const LogInstallmentPaymentModal = ({ isOpen, paymentItem, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount_paid: paymentItem ? paymentItem.amount_due : '',
    payment_method: 'CASH',
    bank_account_id: '',
    transaction_reference: '',
    notes: '',
  });
  const [bankAccounts, setBankAccounts] = useState([]);
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
      if (res.data && res.data.length > 0) {
        setFormData((prev) => ({ ...prev, bank_account_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch bank accounts:', err);
    }
  };

  if (!isOpen || !paymentItem) return null;

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
        amount_paid: parseFloat(formData.amount_paid),
        payment_method: formData.payment_method,
        bank_account_id: formData.payment_method === 'BANK_TRANSFER' ? formData.bank_account_id || null : null,
        transaction_reference: formData.transaction_reference,
        notes: formData.notes,
      };

      await axiosInstance.post(`/installments/pay/${paymentItem.id}`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Installment payment logging error:', err);
      setError(err.response?.data?.detail || 'Failed to log installment payment receipt.');
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
              <h3 className="text-base font-bold text-white">Log Monthly EMI Payment</h3>
              <p className="text-xs text-slate-400">Installment #{paymentItem.installment_number} • Due: {paymentItem.due_date}</p>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Amount Received (PKR) *
            </label>
            <input
              type="number"
              name="amount_paid"
              required
              value={formData.amount_paid}
              onChange={handleChange}
              placeholder="e.g. 400000"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-extrabold text-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="CASH">CASH Payment</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            {formData.payment_method === 'BANK_TRANSFER' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Credit Bank Account
                </label>
                <select
                  name="bank_account_id"
                  value={formData.bank_account_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank_name} ({acc.account_number.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Transaction Ref / Cheque No
            </label>
            <input
              type="text"
              name="transaction_reference"
              value={formData.transaction_reference}
              onChange={handleChange}
              placeholder="e.g. TXN-998877 or Cheque #1029"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Notes</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Month 1 installment payment receipt"
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
                <span>Log Payment Receipt</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogInstallmentPaymentModal;
