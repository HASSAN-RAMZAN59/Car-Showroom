import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import BackupExportWidget from '../components/analytics/BackupExportWidget';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BarChart3, TrendingUp, DollarSign, Clock, ShieldAlert, Calendar, Car } from 'lucide-react';

const Analytics = () => {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState(null);
  const [agingCars, setAgingCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const finRes = await axiosInstance.get('/analytics/financial-summary');
      setFinancialData(finRes.data);

      const agingRes = await axiosInstance.get('/analytics/inventory-aging');
      setAgingCars(agingRes.data?.vehicles || []);
    } catch (err) {
      console.error('Failed to fetch financial analytics & aging data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Loading Executive Financial Analytics & Reports..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Financial Analytics & Audit Reports</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time P&L financial summary, slow-moving inventory aging, and system backups</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales Revenue"
          value={financialData ? `PKR ${(financialData.total_sales_revenue / 1000000).toFixed(2)}M` : 'PKR 0.0M'}
          icon={DollarSign}
          color="emerald"
          trend="up"
          trendText="Verified Invoices"
        />

        <StatCard
          title="Total Vehicle Cost Basis"
          value={financialData ? `PKR ${(financialData.total_cost_basis / 1000000).toFixed(2)}M` : 'PKR 0.0M'}
          icon={Car}
          color="indigo"
          trend="up"
          trendText="Purchase + Repairs"
        />

        <StatCard
          title="Gross Sales Profit"
          value={financialData ? `PKR ${(financialData.total_gross_profit / 1000).toFixed(0)}k` : 'PKR 0k'}
          icon={TrendingUp}
          color="cyan"
          trend="up"
          trendText="Revenue - Cost Basis"
        />

        <StatCard
          title="Net Showroom Profit"
          value={financialData ? `PKR ${(financialData.total_net_showroom_profit / 1000).toFixed(0)}k` : 'PKR 0k'}
          icon={BarChart3}
          color="emerald"
          trend="up"
          trendText="After Expenses & Payroll"
        />
      </div>

      {/* Inventory Aging Table (>30 & >60 Days) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Inventory Stock Aging Audit (&gt;30 &amp; &gt;60 Days)</span>
            </h3>
            <p className="text-xs text-slate-400">Slow-moving stock identification for price adjustment or promotional priority</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Registration</th>
                <th className="py-3.5 px-6">Vehicle Make & Model</th>
                <th className="py-3.5 px-6">Purchase Price</th>
                <th className="py-3.5 px-6">Acquired Date</th>
                <th className="py-3.5 px-6">Days in Showroom</th>
                <th className="py-3.5 px-6">Aging Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {agingCars.length > 0 ? (
                agingCars.map((item) => {
                  const days = item.days_in_stock ?? item.days_in_showroom ?? 0;
                  const isHighRisk = days > 60;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white">{item.car_number}</td>

                      <td className="py-4 px-6 font-semibold text-slate-200">
                        {item.make} {item.model} ({item.year})
                      </td>

                      <td className="py-4 px-6 font-extrabold text-emerald-400">
                        PKR {item.purchase_price ? item.purchase_price.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6 font-mono text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-6 font-extrabold">
                        <span className={isHighRisk ? 'text-rose-400' : 'text-amber-400'}>{days} Days</span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                            isHighRisk
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {isHighRisk ? 'CRITICAL (&gt;60 Days)' : 'SLOW MOVING (&gt;30 Days)'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No slow-moving vehicles (&gt;30 days) detected in showroom stock! Inventory turnaround is healthy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Backup Export Widget */}
      {user?.role === 'ADMIN' && <BackupExportWidget />}
    </div>
  );
};

export default Analytics;
