import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import SmartSearchInput from '../vehicles/SmartSearchInput';
import { X, Briefcase, Car, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const MapCarInvestmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [investors, setInvestors] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [formData, setFormData] = useState({
    investor_id: '',
    amount_invested: '',
    agreed_profit_percentage: '50',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInvestors();
    }
  }, [isOpen]);

  const fetchInvestors = async () => {
    try {
      const res = await axiosInstance.get('/investors/');
      setInvestors(res.data || []);
    } catch (err) {
      console.error('Failed to fetch investors:', err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCar) {
      setError('Please select a vehicle using the auto-complete search.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        investor_id: formData.investor_id,
        car_id: selectedCar.id,
        investment_amount: parseFloat(formData.amount_invested),
        agreed_profit_percentage: parseFloat(formData.agreed_profit_percentage),
      };

      await axiosInstance.post('/investors/investment', payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Map car investment error:', err);
      setError(err.response?.data?.detail || 'Failed to map capital investment to vehicle.');
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
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Map Capital Investment to Vehicle</h3>
              <p className="text-xs text-slate-400">Back vehicle inventory with investor capital and profit %</p>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Select Investor *</label>
            <select
              name="investor_id"
              required
              value={formData.investor_id}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="">Choose Investor Profile</option>
              {investors.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.full_name} ({inv.cnic})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Select Vehicle Stock *</label>
            <SmartSearchInput onSelectCar={(car) => setSelectedCar(car)} placeholder="Search plate or vehicle model..." />
            {selectedCar && (
              <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-bold text-white">
                <span>{selectedCar.make} {selectedCar.model} ({selectedCar.car_number})</span>
                <span className="text-emerald-400">Cost: PKR {selectedCar.purchase_price?.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Capital Invested (PKR) *</label>
              <input
                type="number"
                name="amount_invested"
                required
                value={formData.amount_invested}
                onChange={handleChange}
                placeholder="e.g. 2000000"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold text-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Profit Share % *</label>
              <input
                type="number"
                name="agreed_profit_percentage"
                required
                value={formData.agreed_profit_percentage}
                onChange={handleChange}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
              />
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
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" label="" /> : <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Map Car Investment</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MapCarInvestmentModal;
