import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Search, Car, User, Wrench, X, Loader2 } from 'lucide-react';

const SmartSearchInput = ({ onSelectCar, placeholder = "Search plate, make, engine, chassis..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      searchCars(query);
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCars = async (searchTerm) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/search/cars?query=${encodeURIComponent(searchTerm || '')}`);
      setResults(res.data || []);
    } catch (err) {
      console.error('Smart auto-complete search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    searchCars(query);
  };

  const handleSelect = (car) => {
    setQuery(`${car.make} ${car.model} (${car.car_number})`);
    setIsOpen(false);
    if (onSelectCar) {
      onSelectCar(car);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    searchCars('');
    if (onSelectCar) {
      onSelectCar(null);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm cursor-pointer"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3 top-2.5" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Auto-Complete Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {results.map((car) => {
                const isConsignment = car.status === 'CONSIGNED_AVAILABLE';
                return (
                  <div
                    key={car.id}
                    onClick={() => handleSelect(car)}
                    className="p-3 hover:bg-blue-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {car.make} {car.model}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-[11px] font-extrabold rounded-md border border-blue-300 shadow-xs">
                            {car.car_number}
                          </span>
                          {isConsignment ? (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[9px] rounded border border-amber-200 uppercase">
                              PARK & SELL
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded border border-emerald-200 uppercase">
                              INVENTORY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          Eng: {car.engine_number} | Chs: {car.chassis_number}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600">
                        PKR {(car.total_cost_basis || car.purchase_price || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-cyan-600 font-medium">
                        Extra Charges: PKR {(car.total_repair_cost || 0).toLocaleString()}
                      </p>
                      {(car.seller?.full_name || car.seller_name) && (
                        <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{car.seller?.full_name || car.seller_name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No available vehicles found {query ? `matching "${query}"` : 'in showroom or consignment'}.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchInput;
