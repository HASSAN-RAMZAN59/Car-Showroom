import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Edit, Handshake, Save } from 'lucide-react';

const EditConsignmentModal = ({ isOpen, onClose, consignment, onSuccess }) => {
  const [formData, setFormData] = useState({
    owner_name: '',
    owner_phone: '',
    owner_address: '',
    commission_type: 'PERCENTAGE',
    commission_value: '',
    agreed_asking_price: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (consignment) {
      setFormData({
        owner_name: consignment.owner_name || '',
        owner_phone: consignment.owner_phone || '',
        owner_address: consignment.owner_address || '',
        commission_type: consignment.commission_type || 'PERCENTAGE',
        commission_value: consignment.commission_value || '',
        agreed_asking_price: consignment.agreed_asking_price || '',
        notes: consignment.notes || '',
      });
    }
  }, [consignment]);

  if (!isOpen || !consignment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        owner_name: formData.owner_name,
        owner_phone: formData.owner_phone,
        owner_address: formData.owner_address || null,
        commission_type: formData.commission_type,
        commission_value: parseFloat(formData.commission_value),
        agreed_asking_price: parseFloat(formData.agreed_asking_price),
        notes: formData.notes || null,
      };

      await axiosInstance.put(`/consignments/${consignment.id}`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update consignment agreement:', err);
      setError(err.response?.data?.detail || 'Failed to update consignment terms.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Consignment Agreement</h3>
              <p className="text-xs text-slate-400">Update owner info, asking price, and commission structure</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Full Name</label>
              <input
                type="text"
                required
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Phone</label>
              <input
                type="text"
                required
                value={formData.owner_phone}
                onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Asking Price (PKR)</label>
              <input
                type="number"
                required
                value={formData.agreed_asking_price}
                onChange={(e) => setFormData({ ...formData, agreed_asking_price: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Commission Type</label>
              <select
                value={formData.commission_type}
                onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed PKR Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {formData.commission_type === 'PERCENTAGE' ? 'Rate (%)' : 'Amount (PKR)'}
              </label>
              <input
                type="number"
                required
                value={formData.commission_value}
                onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold text-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Agreement Notes / Terms</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Update Agreement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditConsignmentModal;
