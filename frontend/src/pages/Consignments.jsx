import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RegisterConsignmentModal from '../components/consignments/RegisterConsignmentModal';
import WithdrawConsignmentModal from '../components/consignments/WithdrawConsignmentModal';
import ConsignmentSaleModal from '../components/consignments/ConsignmentSaleModal';
import { Handshake, Car, DollarSign, LogOut, Plus, Search, User, Calendar, Receipt } from 'lucide-react';

const Consignments = () => {
  const [consignments, setConsignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedForWithdraw, setSelectedForWithdraw] = useState(null);
  const [selectedForSale, setSelectedForSale] = useState(null);

  useEffect(() => {
    fetchConsignments();
  }, [statusFilter]);

  const fetchConsignments = async () => {
    setLoading(true);
    try {
      let url = '/consignments/';
      if (statusFilter !== 'ALL') {
        const paramStatus = statusFilter === 'ACTIVE CONSIGNED' ? 'ACTIVE' : statusFilter === 'RETURNED' ? 'RETURNED_TO_OWNER' : statusFilter;
        url = `/consignments/?status=${paramStatus}`;
      }
      const res = await axiosInstance.get(url);
      setConsignments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch consignments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter local search
  const filteredConsignments = consignments.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const car = item.car || {};
    return (
      item.owner_name?.toLowerCase().includes(q) ||
      item.owner_cnic?.toLowerCase().includes(q) ||
      item.owner_phone?.toLowerCase().includes(q) ||
      car.car_number?.toLowerCase().includes(q) ||
      car.make?.toLowerCase().includes(q) ||
      car.model?.toLowerCase().includes(q)
    );
  });

  // Calculate Stat KPIs
  const totalConsigned = consignments.length;
  const activeCount = consignments.filter((c) => c.status === 'ACTIVE').length;

  const totalCommissionEarned = consignments
    .filter((c) => c.status === 'SOLD')
    .reduce((sum, c) => {
      const asking = c.agreed_asking_price || 0;
      const cut = c.commission_type === 'PERCENTAGE' ? (asking * c.commission_value) / 100 : c.commission_value || 0;
      return sum + cut;
    }, 0);
  const returnedCount = consignments.filter((c) => c.status === 'RETURNED_TO_OWNER').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Consignment Sales & Commission Cut</h1>
          <p className="text-xs text-slate-400 mt-1">Manage third-party vehicle deposits, percentage/fixed commissions, and withdrawal returns</p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register Consignment Car</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Consigned Vehicles"
          value={totalConsigned.toString()}
          icon={Handshake}
          color="indigo"
        />
        <StatCard
          title="Active On Showroom Lot"
          value={activeCount.toString()}
          icon={Car}
          color="amber"
        />
        <StatCard
          title="Commission Cut Earned"
          value={`PKR ${totalCommissionEarned.toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Returned To Owners"
          value={returnedCount.toString()}
          icon={LogOut}
          color="rose"
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['ALL', 'ACTIVE CONSIGNED', 'SOLD', 'RETURNED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by owner name, CNIC, car #..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Consignments List Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" label="Loading consignment records..." />
        </div>
      ) : filteredConsignments.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Vehicle Specs</th>
                  <th className="py-3.5 px-4">Owner Profile</th>
                  <th className="py-3.5 px-4">Agreed Commission</th>
                  <th className="py-3.5 px-4">Asking Price</th>
                  <th className="py-3.5 px-4">Deposit Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredConsignments.map((item) => {
                  const car = item.car || {};
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      
                      {/* Vehicle Specs */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100/70 rounded-xl flex items-center justify-center text-blue-700 font-bold shrink-0">
                            <Car className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {car.make} {car.model} ({car.year})
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Reg: <span className="font-semibold text-blue-600">{car.car_number}</span> | Eng: {car.engine_number}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Profile */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.owner_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {item.owner_cnic} • {item.owner_phone}
                          </div>
                        </div>
                      </td>

                      {/* Agreed Commission */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg inline-block">
                          {item.commission_type === 'PERCENTAGE'
                            ? `${item.commission_value}% Cut`
                            : `PKR ${item.commission_value?.toLocaleString()} Fixed`}
                        </div>
                      </td>

                      {/* Asking Price */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        PKR {item.agreed_asking_price?.toLocaleString()}
                      </td>

                      {/* Deposit Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.deposit_date ? new Date(item.deposit_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {item.withdrawal_date && (
                          <div className="text-rose-500 text-[10px]">
                            Withdrawn: {new Date(item.withdrawal_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {item.status === 'ACTIVE' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedForSale(item)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Log Sale</span>
                            </button>

                            <button
                              onClick={() => setSelectedForWithdraw(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-lg transition-all flex items-center gap-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Return</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No actions</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Handshake className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Consignment Vehicles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no consignment vehicles matching your search query or filter selection.
          </p>
        </div>
      )}

      {/* Modals */}
      <RegisterConsignmentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={fetchConsignments}
      />

      <WithdrawConsignmentModal
        isOpen={!!selectedForWithdraw}
        consignment={selectedForWithdraw}
        onClose={() => setSelectedForWithdraw(null)}
        onSuccess={fetchConsignments}
      />

      <ConsignmentSaleModal
        isOpen={!!selectedForSale}
        consignment={selectedForSale}
        onClose={() => setSelectedForSale(null)}
        onSuccess={fetchConsignments}
      />

    </div>
  );
};

export default Consignments;
