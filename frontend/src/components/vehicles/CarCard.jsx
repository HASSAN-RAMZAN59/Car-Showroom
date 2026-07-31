import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { Car as CarIcon, Wrench, ShieldCheck, DollarSign, Calendar, Gauge } from 'lucide-react';

const CarCard = ({ car, onLogRepair, onMarkAvailable }) => {
  const purchasePrice = car.purchase_price || 0;
  const repairCost = car.total_repair_cost || 0;
  const totalCostBasis = car.total_cost_basis || (purchasePrice + repairCost);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-slate-700 hover:translate-y-[-2px] relative overflow-hidden group">
      {/* Top Banner & Status Badge */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-950 text-indigo-400 font-mono text-xs font-bold rounded-lg border border-slate-800">
                {car.car_number}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {car.year} Model
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1.5 group-hover:text-indigo-400 transition-colors">
              {car.make} {car.model}
            </h3>
          </div>

          <StatusBadge status={car.status} />
        </div>

        {/* Specs Overview */}
        <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span>{car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-slate-700 inline-block" style={{ backgroundColor: car.color?.toLowerCase() || '#64748b' }}></span>
            <span>{car.color || 'Unspecified'}</span>
          </div>
          <div className="col-span-2 font-mono text-[11px] text-slate-400 truncate">
            Eng: {car.engine_number} | Chs: {car.chassis_number}
          </div>
        </div>

        {/* Financial Cost Basis Breakdown */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Purchase Cost:</span>
            <span className="font-semibold text-slate-200">PKR {purchasePrice.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-cyan-400" />
              <span>Refurbishment Repairs:</span>
            </span>
            <span className="font-semibold text-cyan-400">PKR {repairCost.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 font-bold">
            <span className="text-slate-300">Total Cost Basis:</span>
            <span className="text-emerald-400 text-sm">PKR {totalCostBasis.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
        <button
          onClick={() => onLogRepair(car)}
          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          <span>Log Repair</span>
        </button>

        {car.status === 'IN_MAINTENANCE' && (
          <button
            onClick={() => onMarkAvailable(car)}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mark Available</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CarCard;
