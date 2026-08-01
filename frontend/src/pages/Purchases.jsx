import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import PurchaseVehicleModal from '../components/vehicles/PurchaseVehicleModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { ShoppingBag, Plus, Car, User, Calendar, DollarSign } from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/cars/');
      setPurchases(res.data || []);
    } catch (err) {
      console.error('Failed to fetch vehicle purchases ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Vehicle Purchase Acquisitions</h1>
          <p className="text-xs text-slate-400 mt-1">Audit log of all car purchases, seller records, and initial cost basis</p>
        </div>

        <button
          onClick={() => setIsPurchaseModalOpen(true)}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Vehicle Acquisition</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="lg" label="Loading vehicle purchases ledger..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Registration</th>
                  <th className="py-3.5 px-6">Vehicle Make & Model</th>
                  <th className="py-3.5 px-6">Seller & Documents</th>
                  <th className="py-3.5 px-6">Year & Mileage</th>
                  <th className="py-3.5 px-6">Purchase Cost</th>
                  <th className="py-3.5 px-6">Refurbishment Cost</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Acquired Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {purchases.length > 0 ? (
                  purchases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white flex items-center gap-2">
                        <Car className="w-4 h-4 text-indigo-400" />
                        <span>{item.car_number}</span>
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-200">
                        {item.make} {item.model}
                      </td>

                      <td className="py-4 px-6">
                        {item.seller ? (
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{item.seller.full_name}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              CNIC: {item.seller.cnic}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold rounded-md">
                                📎 CNIC Scanned
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold rounded-md">
                                📄 Docs Uploaded
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Direct Acquisition</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-400">
                        {item.year} • {item.mileage ? `${item.mileage.toLocaleString()} km` : 'N/A'}
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-400">
                        PKR {item.purchase_price ? item.purchase_price.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6 font-bold text-cyan-400">
                        PKR {item.total_repair_cost ? item.total_repair_cost.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="py-4 px-6 text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No vehicle purchase acquisitions logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PurchaseVehicleModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={fetchPurchases}
      />
    </div>
  );
};

export default Purchases;
