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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vehicle Purchase Acquisitions</h1>
          <p className="text-xs text-slate-400 mt-1">Audit log of all car purchases, seller records, and initial cost basis</p>
        </div>

        <button
          onClick={() => setIsPurchaseModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all"
        >
          <span>Buy Car</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="lg" label="Loading vehicle purchases ledger..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {purchases.length > 0 ? (
                  purchases.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 flex items-center gap-2">
                        <Car className="w-4 h-4 text-blue-600" />
                        <span>{item.car_number}</span>
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {item.make} {item.model}
                      </td>

                      <td className="py-4 px-6">
                        {item.seller ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              <span>{item.seller.full_name}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              CNIC: {item.seller.cnic}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold rounded-md">
                                📎 CNIC Scanned
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-md">
                                📄 Docs Uploaded
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Direct Acquisition</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-500">
                        {item.year} • {item.mileage ? `${item.mileage.toLocaleString()} km` : 'N/A'}
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-600">
                        PKR {item.purchase_price ? item.purchase_price.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6 font-bold text-cyan-600">
                        PKR {item.total_repair_cost ? item.total_repair_cost.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="py-4 px-6 text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
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
