import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import SmartSearchInput from '../vehicles/SmartSearchInput';
import { X, CalendarCheck, DollarSign, User, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const TokenBookingModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [activeTokens, setActiveTokens] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_cnic: '',
    customer_phone: '',
    token_amount: '',
    expiry_days: '7',
    is_refundable: true,
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchActiveTokens();
    }
  }, [isOpen]);

  const fetchActiveTokens = async () => {
    try {
      const res = await axiosInstance.get('/token_bookings/');
      setActiveTokens(res.data || []);
    } catch (err) {
      console.error('Failed to fetch token bookings:', err);
    }
  };

  const handleDeleteToken = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel/delete this token booking? The vehicle will be unreserved and set to AVAILABLE.')) {
      return;
    }
    try {
      await axiosInstance.delete(`/token_bookings/${bookingId}`);
      setActiveTokens((prev) => prev.filter((b) => b.id !== bookingId));
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel token booking');
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCar) {
      setError('Please select a vehicle to reserve using the search input.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. Get or create customer profile
      let customerId;
      try {
        const custSearch = await axiosInstance.get(`/customers/?query=${encodeURIComponent(formData.customer_cnic)}`);
        if (custSearch.data && custSearch.data.length > 0) {
          customerId = custSearch.data[0].id;
        } else {
          const custFormData = new FormData();
          custFormData.append('full_name', formData.customer_name);
          custFormData.append('cnic', formData.customer_cnic);
          custFormData.append('phone', formData.customer_phone);
          const custRes = await axiosInstance.post('/customers/', custFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          customerId = custRes.data.id;
        }
      } catch (custErr) {
        const custSearch = await axiosInstance.get(`/customers/?query=${encodeURIComponent(formData.customer_cnic)}`);
        if (custSearch.data && custSearch.data.length > 0) {
          customerId = custSearch.data[0].id;
        } else {
          throw custErr;
        }
      }

      // Calculate expiry date
      const days = parseInt(formData.expiry_days, 10) || 7;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const payload = {
        car_id: selectedCar.id,
        customer_id: customerId,
        advance_amount: parseFloat(formData.token_amount),
        expiry_date: expiryDate.toISOString(),
        is_refundable: formData.is_refundable,
        notes: formData.notes,
      };

      await axiosInstance.post('/token_bookings/', payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Token booking error:', err);
      setError(err.response?.data?.detail || 'Failed to record advance token booking.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in max-h-screen overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Advance Token Reservations</h3>
              <p className="text-xs text-slate-400">Reserve vehicle stock and log advance buyer deposit</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Active Tokens List */}
        {activeTokens.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Reservations ({activeTokens.length})
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {activeTokens.map((t) => (
                <div key={t.id} className="p-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-400">{t.car?.make} {t.car?.model} ({t.car?.car_number})</span>
                    <span className="text-slate-400 block text-[10px]">Buyer: {t.customer?.full_name} • PKR {t.advance_amount?.toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteToken(t.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Cancel Token Reservation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vehicle Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Select Vehicle to Reserve *
            </label>
            <SmartSearchInput
              onSelectCar={(car) => setSelectedCar(car)}
              placeholder="Type car plate or model to select..."
            />
            {selectedCar && (
              <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-white">
                  {selectedCar.make} {selectedCar.model} ({selectedCar.car_number})
                </span>
                <span className="text-emerald-400 font-bold">
                  PKR {selectedCar.purchase_price ? selectedCar.purchase_price.toLocaleString() : '0'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              name="customer_name"
              required
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="e.g. Usman Tariq"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">CNIC Number *</label>
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Phone Number *</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Token Amount (PKR) *</label>
              <input
                type="number"
                name="token_amount"
                required
                value={formData.token_amount}
                onChange={handleChange}
                placeholder="e.g. 50000"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold text-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Expiry Validity</label>
              <select
                name="expiry_days"
                value={formData.expiry_days}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="3">3 Days</option>
                <option value="7">7 Days (Standard)</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_refundable"
              name="is_refundable"
              checked={formData.is_refundable}
              onChange={handleChange}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="is_refundable" className="text-xs text-slate-300 font-medium">
              Token Amount is Fully Refundable upon cancellation
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" label="" /> : <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Reserve & Log Token</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TokenBookingModal;

