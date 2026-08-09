import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Handshake, User, Car, DollarSign, Upload, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const initialFormData = {
  // Owner details
  owner_name: '',
  owner_cnic: '',
  owner_phone: '',
  owner_address: '',

  // Vehicle specs
  car_number: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  engine_number: '',
  chassis_number: '',
  mileage: '',

  // Commission settings
  commission_type: 'PERCENTAGE',
  commission_value: '',
  agreed_asking_price: '',
  notes: '',
};

const RegisterConsignmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('owner'); // 'owner', 'vehicle', 'commission'
  const [formData, setFormData] = useState(initialFormData);

  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [carPhotos, setCarPhotos] = useState([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setCnicFront(null);
      setCnicBack(null);
      setCarPhotos([]);
      setError('');
      setActiveTab('owner');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotosChange = (e) => {
    if (e.target.files) {
      setCarPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validations
    if (!formData.owner_name || !formData.owner_cnic || !formData.owner_phone) {
      setError('Owner name, CNIC, and phone number are required.');
      setActiveTab('owner');
      return;
    }
    if (!formData.car_number || !formData.make || !formData.model || !formData.engine_number || !formData.chassis_number) {
      setError('All vehicle specifications (Car #, Make, Model, Engine #, Chassis #) are required.');
      setActiveTab('vehicle');
      return;
    }
    if (!formData.commission_value || !formData.agreed_asking_price) {
      setError('Commission value and asking price are required.');
      setActiveTab('commission');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      if (cnicFront) data.append('cnic_front', cnicFront);
      if (cnicBack) data.append('cnic_back', cnicBack);
      carPhotos.forEach((photo) => {
        data.append('car_photos', photo);
      });

      await axiosInstance.post('/consignments/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register consignment car.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Register Consignment Car</h2>
              <p className="text-xs text-slate-500">Deposit third-party vehicle for showroom commission</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-2">
          {[
            { id: 'owner', label: '1. Owner Details', icon: User },
            { id: 'vehicle', label: '2. Vehicle Specs', icon: Car },
            { id: 'commission', label: '3. Commission & Pricing', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* TAB 1: OWNER DETAILS */}
          {activeTab === 'owner' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    placeholder="e.g. Muhammad Ali"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Owner CNIC *</label>
                  <input
                    type="text"
                    name="owner_cnic"
                    value={formData.owner_cnic}
                    onChange={handleChange}
                    placeholder="e.g. 35202-1234567-1"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="owner_phone"
                    value={formData.owner_phone}
                    onChange={handleChange}
                    placeholder="e.g. 0300-1234567"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="owner_address"
                    value={formData.owner_address}
                    onChange={handleChange}
                    placeholder="e.g. House #12, Gulberg III, Lahore"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* CNIC Uploads */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CNIC Front Copy</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCnicFront(e.target.files[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CNIC Back Copy</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCnicBack(e.target.files[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VEHICLE SPECS */}
          {activeTab === 'vehicle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Car Number / Reg # *</label>
                  <input
                    type="text"
                    name="car_number"
                    value={formData.car_number}
                    onChange={handleChange}
                    placeholder="e.g. LEB-1234"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Make *</label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="e.g. Honda"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g. Civic Oriel"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Year *</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="e.g. Taffeta White"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    placeholder="e.g. 45000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Engine Number *</label>
                  <input
                    type="text"
                    name="engine_number"
                    value={formData.engine_number}
                    onChange={handleChange}
                    placeholder="e.g. R18A123456"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Chassis Number *</label>
                  <input
                    type="text"
                    name="chassis_number"
                    value={formData.chassis_number}
                    onChange={handleChange}
                    placeholder="e.g. NKY-567890"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Car Photos */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-medium text-slate-700 mb-1">Car Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotosChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          )}

          {/* TAB 3: COMMISSION & PRICING */}
          {activeTab === 'commission' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Commission Type *</label>
                  <select
                    name="commission_type"
                    value={formData.commission_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%) Commission</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (PKR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {formData.commission_type === 'PERCENTAGE' ? 'Commission Rate (%) *' : 'Fixed Commission Amount (PKR) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="commission_value"
                    value={formData.commission_value}
                    onChange={handleChange}
                    placeholder={formData.commission_type === 'PERCENTAGE' ? 'e.g. 2.5' : 'e.g. 100000'}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Asking Price (PKR) *</label>
                  <input
                    type="number"
                    name="agreed_asking_price"
                    value={formData.agreed_asking_price}
                    onChange={handleChange}
                    placeholder="e.g. 4500000"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-900"
                  />
                </div>

                {/* Calculation Preview */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col justify-center text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Showroom Estimated Commission:</span>
                    <span className="font-bold text-blue-700">
                      {formData.agreed_asking_price && formData.commission_value
                        ? `PKR ${
                            formData.commission_type === 'PERCENTAGE'
                              ? ((Number(formData.agreed_asking_price) * Number(formData.commission_value)) / 100).toLocaleString()
                              : Number(formData.commission_value).toLocaleString()
                          }`
                        : 'PKR 0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-blue-200">
                    <span>Owner Estimated Payout:</span>
                    <span className="font-bold text-emerald-700">
                      {formData.agreed_asking_price && formData.commission_value
                        ? `PKR ${
                            formData.commission_type === 'PERCENTAGE'
                              ? (Number(formData.agreed_asking_price) - (Number(formData.agreed_asking_price) * Number(formData.commission_value)) / 100).toLocaleString()
                              : (Number(formData.agreed_asking_price) - Number(formData.commission_value)).toLocaleString()
                          }`
                        : 'PKR 0'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deposit Notes & Agreement Terms</label>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Special conditions, token agreement details, owner contact notes..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {activeTab !== 'owner' ? (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'commission' ? 'vehicle' : 'owner')}
                className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium text-xs rounded-lg transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-all"
              >
                Cancel
              </button>

              {activeTab !== 'commission' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'owner' ? 'vehicle' : 'commission')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" label="Registering..." />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterConsignmentModal;
