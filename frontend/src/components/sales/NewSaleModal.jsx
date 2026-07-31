import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import SmartSearchInput from '../vehicles/SmartSearchInput';
import { X, Receipt, DollarSign, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const NewSaleModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [formData, setFormData] = useState({
    customer_full_name: '',
    customer_cnic: '',
    customer_phone: '',
    customer_address: '',
    final_sale_price: '',
    payment_type: 'FULL_PAYMENT',
    notes: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const totalCostBasis = selectedCar ? (selectedCar.total_cost_basis || selectedCar.purchase_price || 0) : 0;
  const sellingPrice = parseFloat(formData.final_sale_price) || 0;
  const netProfit = sellingPrice - totalCostBasis;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCar) {
      setError('Please select a vehicle to sell using the auto-complete search.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. Create customer profile
      const custRes = await axiosInstance.post('/customers/', {
        full_name: formData.customer_full_name,
        cnic: formData.customer_cnic,
        phone: formData.customer_phone,
        address: formData.customer_address,
      });
      const customerId = custRes.data.id;

      // 2. Submit sale transaction
      const salePayload = {
        car_id: selectedCar.id,
        customer_id: customerId,
        final_sale_price: sellingPrice,
        payment_type: formData.payment_type,
        notes: formData.notes,
      };

      const saleRes = await axiosInstance.post('/sales/', salePayload);
      onSuccess(saleRes.data); // Pass created sale data back to parent
      onClose();
    } catch (err) {
      console.error('Sale registration error:', err);
      setError(err.response?.data?.detail || 'Failed to complete vehicle sale transaction.');
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
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Register Vehicle Sale Transaction</h3>
              <p className="text-xs text-slate-400">Calculate net profit margin, generate sale deed, and update status</p>
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

          {/* Vehicle Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Select Vehicle to Sell *
            </label>
            <SmartSearchInput onSelectCar={(car) => setSelectedCar(car)} placeholder="Search plate or vehicle model..." />

            {selectedCar && (
              <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    {selectedCar.make} {selectedCar.model} ({selectedCar.car_number})
                  </span>
                  <span className="font-mono text-slate-400 font-semibold">Eng: {selectedCar.engine_number}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Purchase Price: PKR {selectedCar.purchase_price?.toLocaleString() || '0'}</span>
                  <span>Repairs: PKR {selectedCar.total_repair_cost?.toLocaleString() || '0'}</span>
                  <span className="font-bold text-emerald-400">
                    Cost Basis: PKR {totalCostBasis.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Customer Profile Section */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Customer / Buyer Profile</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Buyer Full Name *</label>
              <input
                type="text"
                name="customer_full_name"
                required
                value={formData.customer_full_name}
                onChange={handleChange}
                placeholder="e.g. Usman Tariq"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CNIC Number *</label>
                <input
                  type="text"
                  name="customer_cnic"
                  required
                  value={formData.customer_cnic}
                  onChange={handleChange}
                  placeholder="35202-1234567-3"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="text"
                  name="customer_phone"
                  required
                  value={formData.customer_phone}
                  onChange={handleChange}
                  placeholder="0321-4455667"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Residential Address</label>
              <input
                type="text"
                name="customer_address"
                value={formData.customer_address}
                onChange={handleChange}
                placeholder="DHA Phase 5, Lahore"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* Pricing & Profit Calculator */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Pricing & Payment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Final Sale Price (PKR) *</label>
                <input
                  type="number"
                  name="final_sale_price"
                  required
                  value={formData.final_sale_price}
                  onChange={handleChange}
                  placeholder="e.g. 3600000"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-extrabold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="FULL_PAYMENT">FULL PAYMENT (Cash / Bank Transfer)</option>
                  <option value="INSTALLMENT">INSTALLMENT (Financed Plan)</option>
                </select>
              </div>
            </div>

            {/* Live Net Profit Indicator */}
            {selectedCar && sellingPrice > 0 && (
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                  netProfit >= 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-bold">Estimated Net Profit Margin:</span>
                </div>
                <span className="text-sm font-extrabold">PKR {netProfit.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800 flex-shrink-0">
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
                <span>Complete Sale & Generate Deed</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSaleModal;
