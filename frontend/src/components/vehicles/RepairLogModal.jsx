import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Wrench, DollarSign, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const RepairLogModal = ({ isOpen, car, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    repair_type: 'Denting/Painting',
    vendor_name: '',
    cost: '',
    notes: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !car) return null;

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
      data.append('car_id', car.id);
      data.append('repair_type', formData.repair_type);
      if (formData.vendor_name) data.append('vendor_name', formData.vendor_name);
      data.append('cost', formData.cost);
      if (formData.notes) data.append('notes', formData.notes);
      if (receipt) data.append('receipt', receipt);

      await axiosInstance.post('/repairs/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData({
        repair_type: 'Denting/Painting',
        vendor_name: '',
        cost: '',
        notes: '',
      });
      setReceipt(null);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Repair logging error:', err);
      setError(err.response?.data?.detail || 'Failed to record repair log entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Refurbishment Repair</h3>
              <p className="text-xs text-slate-400">
                {car.make} {car.model} ({car.car_number})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Accumulation Summary */}
        <div className="mx-6 mt-6 p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Accumulated Repair Expenses:</span>
          <span className="font-extrabold text-cyan-400">
            PKR {car.total_repair_cost ? car.total_repair_cost.toLocaleString() : '0'}
          </span>
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Repair Category *
              </label>
              <select
                name="repair_type"
                value={formData.repair_type}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="Denting/Painting">Denting / Painting</option>
                <option value="Mechanical">Mechanical Repair</option>
                <option value="Detailing">Interior & Exterior Detailing</option>
                <option value="Tyres">Tyres & Suspension</option>
                <option value="Electrical">Electrical / Battery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Repair Cost (PKR) *
              </label>
              <input
                type="number"
                name="cost"
                required
                value={formData.cost}
                onChange={handleChange}
                placeholder="e.g. 45000"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Vendor / Workshop Name
            </label>
            <input
              type="text"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleChange}
              placeholder="e.g. Master Motors Workshop"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Detailed Repair Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Replaced front bumper, painted right fender, engine oil & filter service..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Vendor Receipt / Invoice Scan
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceipt(e.target.files[0])}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600/20 file:text-cyan-400 hover:file:bg-cyan-600/30"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" label="" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Repair Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepairLogModal;
