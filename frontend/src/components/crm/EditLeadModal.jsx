import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Edit, User, Save } from 'lucide-react';
import { ALL_MAKES_LIST, getModelsForMake } from '../../utils/carData';

const EditLeadModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    budget_min: '',
    budget_max: '',
    preferred_make: '',
    preferred_model: '',
    status: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lead) {
      setFormData({
        customer_name: lead.customer_name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        budget_min: lead.budget_min || '',
        budget_max: lead.budget_max || '',
        preferred_make: lead.preferred_make || '',
        preferred_model: lead.preferred_model || '',
        status: lead.status || 'HOT',
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email || null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        preferred_make: formData.preferred_make || null,
        preferred_model: formData.preferred_model || null,
        status: formData.status,
      };

      await axiosInstance.put(`/leads/${lead.id}`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update CRM lead details:', err);
      setError(err.response?.data?.detail || 'Failed to update lead information.');
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
              <h3 className="text-base font-bold text-white">Edit Customer Lead ({lead.customer_name})</h3>
              <p className="text-xs text-slate-400">Update contact info, budget range, and vehicle preferences</p>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name</label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lifecycle Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="HOT">🔥 HOT Lead</option>
                <option value="WARM">☀️ WARM Lead</option>
                <option value="COLD">❄️ COLD Lead</option>
                <option value="CONVERTED">✅ CONVERTED</option>
                <option value="CLOSED">❌ CLOSED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Make</label>
              <input
                type="text"
                list="edit-lead-makes"
                value={formData.preferred_make}
                onChange={(e) => setFormData({ ...formData, preferred_make: e.target.value })}
                placeholder="Select or Type Make (Toyota, Honda...)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <datalist id="edit-lead-makes">
                {ALL_MAKES_LIST.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Model</label>
              <input
                type="text"
                list="edit-lead-models"
                value={formData.preferred_model}
                onChange={(e) => setFormData({ ...formData, preferred_model: e.target.value })}
                placeholder="Select or Type Model (Corolla, Civic...)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <datalist id="edit-lead-models">
                {getModelsForMake(formData.preferred_make).map((mod) => (
                  <option key={mod} value={mod} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Budget (PKR)</label>
              <input
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Budget (PKR)</label>
              <input
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-emerald-600"
              />
            </div>
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
              <span>{loading ? 'Saving...' : 'Update Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeadModal;
