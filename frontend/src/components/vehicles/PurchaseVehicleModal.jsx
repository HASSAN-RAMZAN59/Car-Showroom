import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, ShoppingBag, Car, User, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const PurchaseVehicleModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('specs'); // 'specs', 'seller', 'uploads'
  const [formData, setFormData] = useState({
    // Vehicle specs
    car_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    engine_number: '',
    chassis_number: '',
    mileage: '',
    status: 'IN_MAINTENANCE',
    purchase_price: '',

    // Seller profile
    seller_full_name: '',
    seller_cnic: '',
    seller_phone: '',
    seller_address: '',
  });

  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create seller profile first
      const sellerFormData = new FormData();
      sellerFormData.append('full_name', formData.seller_full_name);
      sellerFormData.append('cnic', formData.seller_cnic);
      sellerFormData.append('phone', formData.seller_phone);
      if (formData.seller_address) sellerFormData.append('address', formData.seller_address);
      if (cnicFront) sellerFormData.append('cnic_front', cnicFront);
      if (cnicBack) sellerFormData.append('cnic_back', cnicBack);

      const sellerRes = await axiosInstance.post('/sellers/', sellerFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const sellerId = sellerRes.data.id;

      // 2. Submit vehicle purchase with seller_id
      const carFormData = new FormData();
      carFormData.append('car_number', formData.car_number);
      carFormData.append('make', formData.make);
      carFormData.append('model', formData.model);
      carFormData.append('year', formData.year);
      if (formData.color) carFormData.append('color', formData.color);
      carFormData.append('engine_number', formData.engine_number);
      carFormData.append('chassis_number', formData.chassis_number);
      if (formData.mileage) carFormData.append('mileage', formData.mileage);
      carFormData.append('status', formData.status);
      carFormData.append('purchase_price', formData.purchase_price);
      carFormData.append('seller_id', sellerId);

      if (photos.length > 0) {
        Array.from(photos).forEach((file) => carFormData.append('photos', file));
      }
      if (documents.length > 0) {
        Array.from(documents).forEach((file) => carFormData.append('documents', file));
      }

      await axiosInstance.post('/cars/purchase', carFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Purchase logging error:', err);
      setError(err.response?.data?.detail || 'Failed to record vehicle purchase. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Vehicle Purchase Acquisition</h3>
              <p className="text-xs text-slate-400">Record vehicle specs, seller details, and upload documents</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-3 gap-6 flex-shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'specs' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>1. Vehicle Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('seller')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'seller' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>2. Seller Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('uploads')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'uploads' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>3. Photos & Documents</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    name="car_number"
                    required
                    value={formData.car_number}
                    onChange={handleChange}
                    placeholder="e.g. LEB-9988"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Purchase Price (PKR) *
                  </label>
                  <input
                    type="number"
                    name="purchase_price"
                    required
                    value={formData.purchase_price}
                    onChange={handleChange}
                    placeholder="e.g. 3200000"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Make *</label>
                  <input
                    type="text"
                    name="make"
                    required
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="Honda, Toyota"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Model *</label>
                  <input
                    type="text"
                    name="model"
                    required
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Civic, Corolla"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Model Year *</label>
                  <input
                    type="number"
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Engine No *</label>
                  <input
                    type="text"
                    name="engine_number"
                    required
                    value={formData.engine_number}
                    onChange={handleChange}
                    placeholder="ENG-998877"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Chassis No *</label>
                  <input
                    type="text"
                    name="chassis_number"
                    required
                    value={formData.chassis_number}
                    onChange={handleChange}
                    placeholder="CHS-112233"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    placeholder="75000"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="Black, White, Silver"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Initial Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="IN_MAINTENANCE">IN MAINTENANCE (Refurbishing)</option>
                    <option value="AVAILABLE">AVAILABLE (Showroom Ready)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SELLER */}
          {activeTab === 'seller' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Seller Full Name *</label>
                <input
                  type="text"
                  name="seller_full_name"
                  required
                  value={formData.seller_full_name}
                  onChange={handleChange}
                  placeholder="e.g. Muhammad Ali"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">CNIC Number *</label>
                  <input
                    type="text"
                    name="seller_cnic"
                    required
                    value={formData.seller_cnic}
                    onChange={handleChange}
                    placeholder="42101-9876543-1"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="seller_phone"
                    required
                    value={formData.seller_phone}
                    onChange={handleChange}
                    placeholder="0300-1122334"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Residential Address</label>
                <input
                  type="text"
                  name="seller_address"
                  value={formData.seller_address}
                  onChange={handleChange}
                  placeholder="Gulberg III, Lahore"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">CNIC Front Scan</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCnicFront(e.target.files[0])}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">CNIC Back Scan</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCnicBack(e.target.files[0])}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOADS */}
          {activeTab === 'uploads' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Vehicle High-Res Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPhotos(e.target.files)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30"
                />
                <p className="text-[10px] text-slate-500 mt-1">Upload multiple photos (front, back, interior, engine bay)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Registration & Transfer Documents</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={(e) => setDocuments(e.target.files)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30"
                />
                <p className="text-[10px] text-slate-500 mt-1">Smart card, running page, transfer deed PDFs</p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800 flex-shrink-0">
            <div className="text-xs text-slate-400">
              Tab {activeTab === 'specs' ? '1/3' : activeTab === 'seller' ? '2/3' : '3/3'}
            </div>

            <div className="flex items-center gap-3">
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
                  <span>Log Purchase Acquisition</span>
                </>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseVehicleModal;
