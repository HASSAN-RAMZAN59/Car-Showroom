import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import PurchaseVehicleModal from '../components/vehicles/PurchaseVehicleModal';
import VehicleAssetsModal from '../components/vehicles/VehicleAssetsModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { ShoppingBag, Plus, Car, User, Calendar, DollarSign, Trash2, Camera } from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedCarForAssets, setSelectedCarForAssets] = useState(null);

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

  const handleDeletePurchase = async (car) => {
    if (!window.confirm(`Are you sure you want to delete purchase record for vehicle ${car.car_number}?`)) {
      return;
    }
    try {
      await axiosInstance.delete(`/cars/${car.id}`);
      setPurchases((prev) => prev.filter((item) => item.id !== car.id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete vehicle purchase record');
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
                  <th className="py-3.5 px-6">Seller & Verification</th>
                  <th className="py-3.5 px-6">Year & Mileage</th>
                  <th className="py-3.5 px-6">Purchase Cost</th>
                  <th className="py-3.5 px-6">Refurbishment Cost</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Acquired Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {purchases.length > 0 ? (
                  purchases.map((item) => {
                    const photosCount = item.car_photos_urls?.length || 0;
                    const docsCount = item.registration_docs_urls?.length || 0;
                    const totalAssetsCount = photosCount + docsCount;

                    return (
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
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                <button
                                  onClick={() => setSelectedCarForAssets(item)}
                                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1"
                                >
                                  <Camera className="w-3 h-3 text-blue-600" />
                                  <span>View Assets ({totalAssetsCount})</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedCarForAssets(item)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 text-[10px] font-medium rounded-md transition-all flex items-center gap-1"
                            >
                              <Camera className="w-3 h-3" />
                              <span>View Assets ({totalAssetsCount})</span>
                            </button>
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

                        <td className="py-4 px-6 text-right flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedCarForAssets(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Vehicle Photos & Assets"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Purchase Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
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

      {selectedCarForAssets && (
        <VehicleAssetsModal
          isOpen={!!selectedCarForAssets}
          car={selectedCarForAssets}
          onClose={() => setSelectedCarForAssets(null)}
        />
      )}
    </div>
  );
};

export default Purchases;

