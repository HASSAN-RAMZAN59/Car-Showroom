import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import StatusBadge from '../common/StatusBadge';
import { X, Car, Phone, MessageSquare, ShoppingCart, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const MatchingInventoryModal = ({ isOpen, lead, onClose, onSelectCarForSale }) => {
  const [matchingCars, setMatchingCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && lead) {
      fetchMatchingCars();
    }
  }, [isOpen, lead]);

  const fetchMatchingCars = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/leads/${lead.id}/matching-inventory`);
      setMatchingCars(res.data || []);
    } catch (err) {
      console.error('Failed to fetch matching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (car) => {
    if (!lead?.phone) return;
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('92')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `92${cleanPhone.slice(1)}`
      : `92${cleanPhone}`;

    const text = `Assalam-o-Alaikum ${lead.customer_name}, SK MOTORS has a matching vehicle available for you: ${car.make} ${car.model} (${car.year} Model), Reg #: ${car.car_number}. Price: PKR ${(car.total_cost_basis || car.purchase_price || 0).toLocaleString()}. Please let us know if you'd like to inspect it at our showroom!`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Smart Stock Matcher</h3>
              <p className="text-xs text-slate-500">
                Matching Inventory for <span className="font-semibold text-slate-800">{lead.customer_name}</span> ({lead.preferred_make || 'Any Make'} {lead.preferred_model || ''} • Budget: PKR {lead.budget_max ? lead.budget_max.toLocaleString() : 'Open'})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-white">
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="md" label="Searching matching showroom & consignment stock..." />
            </div>
          ) : matchingCars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchingCars.map((car) => {
                const isConsignment = car.status === 'CONSIGNED_AVAILABLE';
                const totalPrice = car.total_cost_basis || car.purchase_price || 0;

                return (
                  <div key={car.id} className="p-4 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl space-y-3 shadow-xs transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-mono text-xs font-extrabold rounded-lg border border-blue-300 shadow-xs flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-blue-700" />
                          <span>{car.car_number}</span>
                        </span>
                        {isConsignment ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded border border-amber-200 uppercase">
                            PARK & SELL
                          </span>
                        ) : (
                          <StatusBadge status={car.status} />
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {car.make} {car.model} ({car.year})
                      </h4>

                      <div className="text-xs text-slate-500 font-mono space-y-0.5">
                        <p>Eng: {car.engine_number} | Chs: {car.chassis_number}</p>
                        <p>Color: {car.color || 'N/A'} • Mileage: {car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-semibold">
                        <span className="text-slate-500">Price / Value:</span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          PKR {totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleWhatsApp(car)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                        title="Send WhatsApp details to customer lead"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                          title="Call Lead"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              No matching vehicle stock found within lead's criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingInventoryModal;
