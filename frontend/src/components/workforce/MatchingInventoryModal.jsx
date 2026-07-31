import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import StatusBadge from '../common/StatusBadge';
import { X, Car, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const MatchingInventoryModal = ({ isOpen, lead, onClose }) => {
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

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Smart Inventory Matcher</h3>
              <p className="text-xs text-slate-400">
                Matching cars for {lead.customer_name} (Budget: PKR {lead.budget_min?.toLocaleString() || '0'} - {lead.budget_max?.toLocaleString() || 'Any'})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="md" label="Searching matching inventory stock..." />
            </div>
          ) : matchingCars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchingCars.map((car) => (
                <div key={car.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-xs font-mono font-bold">
                      {car.car_number}
                    </span>
                    <StatusBadge status={car.status} />
                  </div>

                  <h4 className="text-sm font-bold text-white">
                    {car.make} {car.model} ({car.year})
                  </h4>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400">Purchase Price:</span>
                    <span className="font-bold text-emerald-400">
                      PKR {car.purchase_price ? car.purchase_price.toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              No matching vehicle stock found within lead's budget and preference criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingInventoryModal;
