import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { Car as CarIcon, Wrench, ShieldCheck, DollarSign, Calendar, Gauge, Handshake, Trash2, Camera, Edit } from 'lucide-react';
import VehicleAssetsModal from './VehicleAssetsModal';

const CarCard = ({ car, onLogRepair, onMarkAvailable, onDeleteCar, onEditCar }) => {

  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
  const purchasePrice = car.purchase_price || 0;
  const repairCost = car.total_repair_cost || 0;
  const totalCostBasis = car.total_cost_basis || (purchasePrice + repairCost);
  const isConsignment = car.is_consignment || car.status?.startsWith('CONSIGNED_');

  const photosCount = car.car_photos_urls?.length || 0;
  const docsCount = car.registration_docs_urls?.length || 0;
  const totalAssetsCount = photosCount + docsCount;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all duration-200 hover:border-blue-300 hover:shadow-md relative overflow-hidden group">
        {/* Top Banner & Status Badge */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-mono text-xs font-extrabold rounded-lg border border-blue-300 shadow-xs flex items-center gap-1">
                  <CarIcon className="w-3.5 h-3.5 text-blue-700" />
                  <span>{car.car_number}</span>
                </span>
                {isConsignment && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-[10px] rounded-md border border-blue-200 flex items-center gap-1">
                    <Handshake className="w-3 h-3" />
                    <span>PARK & SELL</span>
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium">
                  {car.year} Model
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-800 mt-1.5 group-hover:text-blue-600 transition-colors">
                {car.make} {car.model}
              </h3>
            </div>

            <StatusBadge status={car.status} />
          </div>

          {/* Specs Overview */}
          <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-200/80 text-slate-600">
            <div className="flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span>{car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block" style={{ backgroundColor: car.color?.toLowerCase() || '#64748b' }}></span>
              <span>{car.color || 'Unspecified'}</span>
            </div>
            <div className="col-span-2 font-mono text-[11px] text-slate-400 truncate">
              Eng: {car.engine_number} | Chs: {car.chassis_number}
            </div>
          </div>

          {/* Financial Cost Basis Breakdown */}
          <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Purchase Cost:</span>
              <span className="font-semibold text-slate-700">PKR {purchasePrice.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-cyan-600" />
                <span>Extra Car Work / Charges:</span>
              </span>
              <span className="font-semibold text-cyan-600">PKR {repairCost.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 font-bold">
              <span className="text-slate-700">Total Cost Basis:</span>
              <span className="text-emerald-600 text-sm">PKR {totalCostBasis.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col gap-2">
          {/* View Photos & Docs Button */}
          <button
            onClick={() => setIsAssetsModalOpen(true)}
            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>View Photos & Documents ({totalAssetsCount})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLogRepair(car)}
              className="flex-1 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-600" />
              <span>Add Car Charges</span>
            </button>

            {car.status === 'IN_MAINTENANCE' && (
              <button
                onClick={() => onMarkAvailable(car)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>Mark Available</span>
              </button>
            )}

            {onEditCar && (
              <button
                onClick={() => onEditCar(car)}
                className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-lg transition-all"
                title="Edit Vehicle Specs & Pricing"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {onDeleteCar && (
              <button
                onClick={() => onDeleteCar(car)}
                className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 rounded-lg transition-all"
                title="Delete Vehicle from Inventory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Vehicle Assets Gallery Modal */}
      <VehicleAssetsModal
        isOpen={isAssetsModalOpen}
        onClose={() => setIsAssetsModalOpen(false)}
        car={car}
      />
    </>
  );
};

export default CarCard;


