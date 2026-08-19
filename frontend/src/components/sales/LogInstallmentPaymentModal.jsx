import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const LogInstallmentPaymentModal = ({ isOpen, paymentItem, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount_paid: paymentItem ? paymentItem.amount_due : '',
    payment_method: 'CASH',
    transaction_reference: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Receive Monthly Payment</h3>
              <p className="text-xs text-slate-500">Installment #{paymentItem.installment_number} • Due: {paymentItem.due_date}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Amount Received (PKR) *
            </label>
            <input
              type="number"
              name="amount_paid"
              required
              value={formData.amount_paid}
              onChange={handleChange}
              placeholder="e.g. 400000"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 shadow-sm"
            >
              <option value="CASH">CASH Payment</option>
              <option value="CHEQUE">CHEQUE / Online Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Transaction Ref / Slip No.
            </label>
            <input
              type="text"
              name="transaction_reference"
              value={formData.transaction_reference}
              onChange={handleChange}
              placeholder="Transaction reference or receipt number"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Payment notes..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" label="" /> : <span className="text-white">Receive Payment</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogInstallmentPaymentModal;
