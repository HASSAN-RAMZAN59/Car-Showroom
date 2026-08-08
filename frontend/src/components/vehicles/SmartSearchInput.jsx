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
      if (query.trim().length >= 2) {
        searchCars(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

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
      const res = await axiosInstance.get(`/search/cars?query=${encodeURIComponent(searchTerm)}`);
      setResults(res.data || []);
      setIsOpen(true);
    } catch (err) {
      console.error('Smart auto-complete search error:', err);
    } finally {
      setLoading(false);
    }
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
    setResults([]);
    setIsOpen(false);
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
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3 top-2.5" />
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Auto-Complete Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {results.map((car) => (
                <div
                  key={car.id}
                  onClick={() => handleSelect(car)}
                  className="p-3 hover:bg-blue-50/70 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {car.make} {car.model}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded border border-slate-200">
                          {car.car_number}
                        </span>
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
                      Repairs: PKR {(car.total_repair_cost || 0).toLocaleString()}
                    </p>
                    {(car.seller?.full_name || car.seller_name) && (
                      <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{car.seller?.full_name || car.seller_name}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No vehicles found matching "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchInput;
