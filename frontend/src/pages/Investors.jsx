import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import AddInvestorModal from '../components/financial/AddInvestorModal';
import MapCarInvestmentModal from '../components/financial/MapCarInvestmentModal';
import ProcessPayoutModal from '../components/financial/ProcessPayoutModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { Briefcase, Plus, DollarSign, UserCheck, TrendingUp, Phone, CheckCircle2 } from 'lucide-react';

const Investors = () => {
  const [investors, setInvestors] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddInvestorOpen, setIsAddInvestorOpen] = useState(false);
  const [isMapCarOpen, setIsMapCarOpen] = useState(false);
  const [activePayoutId, setActivePayoutId] = useState(null);

  useEffect(() => {
    fetchInvestorData();
  }, []);

  const fetchInvestorData = async () => {
    setLoading(true);
    try {
      const invRes = await axiosInstance.get('/investors/');
      setInvestors(invRes.data || []);

      const invCarRes = await axiosInstance.get('/investors/investments/all');
      setInvestments(invCarRes.data || []);
    } catch (err) {
      console.error('Failed to fetch investor portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCapital = investors.reduce((sum, i) => sum + (i.total_capital_invested || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investor Engine & Profit Settlement</h1>
          <p className="text-xs text-slate-400 mt-1">Angel investor portfolios, vehicle capital backing, and automated profit settlement</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMapCarOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium text-xs rounded-lg transition-all flex items-center gap-2 shadow-sm"
          >
            <CarIcon className="w-4 h-4 text-blue-600" />
            <span>Map Investment</span>
          </button>

          <button
            onClick={() => setIsAddInvestorOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Investor</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Investor Capital"
          value={`PKR ${(totalCapital / 1000000).toFixed(2)}M`}
          icon={Briefcase}
          color="indigo"
          trend="up"
          trendText="Active Pool Capital"
        />

        <StatCard
          title="Registered Investors"
          value={`${investors.length} Profiles`}
          icon={UserCheck}
          color="cyan"
          trend="up"
          trendText="Angel Backers"
        />

        <StatCard
          title="Vehicle Investments"
          value={`${investments.length} Active Cars`}
          icon={TrendingUp}
          color="emerald"
          trend="up"
          trendText="Backed Inventory"
        />
      </div>

      {/* Investor Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investors.map((inv) => (
          <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-base shadow-sm">
                  {inv.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{inv.full_name}</h3>
                  <p className="text-[11px] font-mono text-slate-400">{inv.cnic}</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{inv.phone}</span>
              </span>
              <span className="font-bold text-blue-600">
                Capital: PKR {inv.total_capital_invested ? inv.total_capital_invested.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Investments Table & Settlement Payout Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-800">Car Investments & Profit Settlements</h3>

        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading vehicle investment mapping..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Investor</th>
                  <th className="py-3.5 px-6">Amount Invested</th>
                  <th className="py-3.5 px-6">Agreed Profit %</th>
                  <th className="py-3.5 px-6">Settled Profit Share</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {investments.length > 0 ? (
                  investments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {inv.investor?.full_name || 'Investor'}
                      </td>

                      <td className="py-4 px-6 font-extrabold text-cyan-600">
                        PKR {inv.investment_amount ? inv.investment_amount.toLocaleString() : (inv.amount_invested ? inv.amount_invested.toLocaleString() : '0')}
                      </td>

                      <td className="py-4 px-6 font-bold text-blue-600">
                        {inv.agreed_profit_percentage}% Profit Share
                      </td>

                      <td className="py-4 px-6 font-extrabold text-emerald-600">
                        PKR {inv.profit_earned ? inv.profit_earned.toLocaleString() : (inv.settled_profit_share ? inv.settled_profit_share.toLocaleString() : '0')}
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge status={inv.status} />
                      </td>

                      <td className="py-4 px-6">
                        {inv.status === 'SETTLED' ? (
                          <button
                            onClick={() => setActivePayoutId(inv.id)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm"
                          >
                            Process Payout
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Vehicle Active</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No car capital investments mapped yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddInvestorModal
        isOpen={isAddInvestorOpen}
        onClose={() => setIsAddInvestorOpen(false)}
        onSuccess={fetchInvestorData}
      />

      <MapCarInvestmentModal
        isOpen={isMapCarOpen}
        onClose={() => setIsMapCarOpen(false)}
        onSuccess={fetchInvestorData}
      />

      {activePayoutId && (
        <ProcessPayoutModal
          isOpen={!!activePayoutId}
          investmentId={activePayoutId}
          onClose={() => setActivePayoutId(null)}
          onSuccess={fetchInvestorData}
        />
      )}
    </div>
  );
};

function CarIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-8 4h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
  );
}

export default Investors;
