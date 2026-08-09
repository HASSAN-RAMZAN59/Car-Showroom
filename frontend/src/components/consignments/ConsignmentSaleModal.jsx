import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Receipt, DollarSign, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const ConsignmentSaleModal = ({ isOpen, consignment, onClose, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [finalSalePrice, setFinalSalePrice] = useState('');
  const [paymentType, setPaymentType] = useState('FULL_PAYMENT');
  const [notes, setNotes] = useState('');

  // New customer quick-add fields if needed
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerCnic, setNewCustomerCnic] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      if (consignment) {
        setFinalSalePrice(consignment.agreed_asking_price || '');
      }
      setSelectedCustomerId('');
      setPaymentType('FULL_PAYMENT');
      setNotes('');
      setError('');
      setIsAddingNewCustomer(false);
      setNewCustomerName('');
      setNewCustomerCnic('');
      setNewCustomerPhone('');
    }
  }, [isOpen, consignment]);

  const fetchCustomers = async () => {
    try {
      const res = await axiosInstance.get('/customers/');
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch customers list:', err);
    }
  };

  if (!isOpen || !consignment) return null;

  const car = consignment.car || {};
  const sellingPriceNum = Number(finalSalePrice) || 0;

  // Calculate live commission cut
  let showroomCommission = 0;
  if (consignment.commission_type === 'PERCENTAGE') {
    showroomCommission = (sellingPriceNum * (consignment.commission_value || 0)) / 100;
  } else {
    showroomCommission = consignment.commission_value || 0;
  }
  const ownerPayout = Math.max(0, sellingPriceNum - showroomCommission);

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let targetCustomerId = selectedCustomerId;

    if (isAddingNewCustomer) {
      if (!newCustomerName || !newCustomerCnic || !newCustomerPhone) {
        setError('New customer name, CNIC, and phone are required.');
        return;
      }
      try {
        const custRes = await axiosInstance.post('/customers/', {
          full_name: newCustomerName,
          cnic: newCustomerCnic,
          phone: newCustomerPhone,
        });
        targetCustomerId = custRes.data.id;
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to create new buyer customer profile.');
        return;
      }
    }

    if (!targetCustomerId) {
      setError('Please select or create a buyer customer.');
      return;
    }

    if (sellingPriceNum <= 0) {
      setError('Final selling price must be greater than PKR 0.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/sales/', {
        car_id: car.id,
        customer_id: targetCustomerId,
        final_sale_price: sellingPriceNum,
        payment_type: paymentType,
        notes: notes,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to log consignment vehicle sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Log Consignment Sale</h2>
              <p className="text-xs text-slate-500">Record final sale and compute showroom commission</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaleSubmit} className="p-6 space-y-4">
          
          {/* Vehicle Info */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 text-sm">{car.make} {car.model} ({car.year})</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-mono font-bold rounded">
                Reg: {car.car_number}
              </span>
            </div>
            <div className="text-slate-600">
              Vehicle Owner: <strong className="text-slate-800">{consignment.owner_name}</strong> ({consignment.owner_phone})
            </div>
            <div className="text-slate-600">
              Agreed Commission: <strong className="text-blue-700">{consignment.commission_type === 'PERCENTAGE' ? `${consignment.commission_value}%` : `PKR ${consignment.commission_value?.toLocaleString()}`}</strong>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection / Creation */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-700">Buyer Customer *</label>
              <button
                type="button"
                onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                {isAddingNewCustomer ? 'Select Existing Customer' : '+ Register New Customer'}
              </button>
            </div>

            {!isAddingNewCustomer ? (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- Select Buyer Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone} - {c.cnic})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Buyer Full Name *"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Buyer CNIC *"
                    value={newCustomerCnic}
                    onChange={(e) => setNewCustomerCnic(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Buyer Phone *"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Payment Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Final Selling Price (PKR) *</label>
              <input
                type="number"
                value={finalSalePrice}
                onChange={(e) => setFinalSalePrice(e.target.value)}
                placeholder="e.g. 4600000"
                required
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="FULL_PAYMENT">Full Payment (Cash / Bank)</option>
                <option value="INSTALLMENT">Installment / EMI</option>
              </select>
            </div>
          </div>

          {/* Real-time Financial Settlement Preview */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>Final Vehicle Sale Price:</span>
              <span className="font-bold text-slate-900 text-sm">PKR {sellingPriceNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-blue-200">
              <span className="flex items-center gap-1 font-semibold text-blue-800">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                Showroom Commission Earned:
              </span>
              <span className="font-bold text-blue-700 text-sm">PKR {showroomCommission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-blue-200">
              <span>Net Owner Payout:</span>
              <span className="font-bold text-emerald-700 text-sm">PKR {ownerPayout.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Sale Notes</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sale deed reference, warranty terms..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" label="Processing Sale..." />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Complete Sale</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ConsignmentSaleModal;
