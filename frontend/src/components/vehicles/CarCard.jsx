import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { Car as CarIcon, Wrench, ShieldCheck, DollarSign, Calendar, Gauge, Handshake } from 'lucide-react';

const CarCard = ({ car, onLogRepair, onMarkAvailable }) => {
  const purchasePrice = car.purchase_price || 0;
  const repairCost = car.total_repair_cost || 0;
  const totalCostBasis = car.total_cost_basis || (purchasePrice + repairCost);
  const isConsignment = car.is_consignment || car.status?.startsWith('CONSIGNED_');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all duration-200 hover:border-purple-300 hover:shadow-md relative overflow-hidden group">
      {/* Top Banner & Status Badge */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 bg-slate-100 text-blue-600 font-mono text-xs font-bold rounded-lg border border-slate-200">
                {car.car_number}
              </span>
              {isConsignment && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold text-[10px] rounded-md border border-purple-200 flex items-center gap-1">
                  <Handshake className="w-3 h-3" />
                  <span>CONSIGNMENT</span>
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
              <span>Refurbishment Repairs:</span>
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
      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
        <button
          onClick={() => onLogRepair(car)}
          className="flex-1 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Wrench className="w-3.5 h-3.5 text-cyan-600" />
          <span>Log Repair</span>
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
      </div>
    </div>
  );
};

export default CarCard;
