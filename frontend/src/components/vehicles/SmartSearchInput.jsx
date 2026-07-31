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
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin absolute right-3 top-3" />
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Auto-Complete Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {results.map((car) => (
                <div
                  key={car.id}
                  onClick={() => handleSelect(car)}
                  className="p-3.5 hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {car.make} {car.model}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] font-bold rounded">
                          {car.car_number}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Eng: {car.engine_number} | Chs: {car.chassis_number}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-emerald-400">
                      PKR {car.purchase_price ? car.purchase_price.toLocaleString() : '0'}
                    </p>
                    {car.seller_name && (
                      <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{car.seller_name}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              No vehicles found matching "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchInput;
