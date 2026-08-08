import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import CarCard from '../components/vehicles/CarCard';
import SmartSearchInput from '../components/vehicles/SmartSearchInput';
import PurchaseVehicleModal from '../components/vehicles/PurchaseVehicleModal';
import RepairLogModal from '../components/vehicles/RepairLogModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Car, ShoppingBag, Filter, Plus } from 'lucide-react';

const Inventory = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCarForRepair, setSelectedCarForRepair] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  useEffect(() => {
    fetchCars();
  }, [statusFilter]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      let url = '/cars/';
      if (statusFilter !== 'ALL') {
        url = `/cars/?status=${statusFilter}`;
      }
      const res = await axiosInstance.get(url);
      setCars(res.data || []);
    } catch (err) {
      console.error('Failed to fetch car inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCarFromSearch = (selectedCar) => {
    if (selectedCar) {
      setCars([selectedCar]);
    } else {
      fetchCars();
    }
  };

  const handleMarkAvailable = async (car) => {
    try {
      await axiosInstance.patch(`/repairs/cars/${car.id}/status`, {
        status: 'AVAILABLE',
      });
      fetchCars();
    } catch (err) {
      console.error('Failed to update vehicle status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Showroom Vehicle Inventory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage live vehicle stock, refurbishment expenses, and status transitions</p>
        </div>

        <button
          onClick={() => setIsPurchaseModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Log Vehicle Purchase</span>
        </button>
      </div>

      {/* Filter Tabs & Auto-Complete Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['ALL', 'AVAILABLE', 'IN_MAINTENANCE', 'RESERVED', 'SOLD'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Smart Auto-Complete Search Input */}
        <div className="w-full md:w-96">
          <SmartSearchInput onSelectCar={handleSelectCarFromSearch} />
        </div>
      </div>

      {/* Vehicles Cards Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" label="Loading vehicle inventory..." />
        </div>
      ) : cars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onLogRepair={(targetCar) => setSelectedCarForRepair(targetCar)}
              onMarkAvailable={handleMarkAvailable}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Vehicles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no vehicles matching the selected status or search filter.
          </p>
        </div>
      )}

      {/* Modals */}
      <PurchaseVehicleModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={fetchCars}
      />

      {selectedCarForRepair && (
        <RepairLogModal
          isOpen={!!selectedCarForRepair}
          car={selectedCarForRepair}
          onClose={() => setSelectedCarForRepair(null)}
          onSuccess={fetchCars}
        />
      )}
    </div>
  );
};

export default Inventory;
