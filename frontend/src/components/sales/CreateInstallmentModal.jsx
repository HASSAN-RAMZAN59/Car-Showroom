import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, CalendarCheck, DollarSign, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const CreateInstallmentModal = ({ isOpen, sale, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    down_payment: '',
    duration_months: '6',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !sale) return null;

  const totalSalePrice = sale.final_sale_price || 0;
  const downPayment = parseFloat(formData.down_payment) || 0;
  const durationMonths = parseInt(formData.duration_months, 10) || 6;
  const financedAmount = Math.max(0, totalSalePrice - downPayment);
  const monthlyEmi = durationMonths > 0 ? (financedAmount / durationMonths) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (downPayment >= totalSalePrice) {
      setError('Down payment cannot be equal to or greater than total sale price.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        sale_id: sale.id,
        down_payment: downPayment,
        duration_months: durationMonths,
      };

      await axiosInstance.post('/installments/plan', payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Installment plan creation error:', err);
      setError(err.response?.data?.detail || 'Failed to create installment financing plan.');
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
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Financing Installment Plan</h3>
              <p className="text-xs text-slate-400">Total Price: PKR {totalSalePrice.toLocaleString()}</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Down Payment (PKR) *
              </label>
              <input
                type="number"
                name="down_payment"
                required
                value={formData.down_payment}
                onChange={handleChange}
                placeholder="e.g. 1200000"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold text-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Tenure Duration *
              </label>
              <select
                name="duration_months"
                value={formData.duration_months}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
              >
                <option value="1">1 Month</option>
                <option value="2">2 Months</option>
                <option value="3">3 Months</option>
                <option value="4">4 Months</option>
                <option value="5">5 Months</option>
                <option value="6">6 Months (Half-Year)</option>
                <option value="8">8 Months</option>
                <option value="10">10 Months</option>
              </select>
            </div>
          </div>

          {/* Computed Summary */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Total Vehicle Price:</span>
              <span className="font-semibold text-white">PKR {totalSalePrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Financed Amount:</span>
              <span className="font-semibold text-indigo-400">PKR {financedAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800 font-bold">
              <span>Estimated Monthly EMI ({durationMonths} Mos):</span>
              <span className="text-emerald-400 text-sm">PKR {monthlyEmi.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
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
                <span>Generate EMI Schedule</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInstallmentModal;
