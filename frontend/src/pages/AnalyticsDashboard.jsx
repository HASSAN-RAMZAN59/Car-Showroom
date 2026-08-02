import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BarChart3, TrendingUp, DollarSign, Clock, ShieldCheck, Search, Calendar, Car, Users, Filter, RefreshCw } from 'lucide-react';

const AnalyticsDashboard = () => {
  const [financialData, setFinancialData] = useState(null);
  const [agingCars, setAgingCars] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Audit Logs filters & pagination
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
    fetchAuditLogs();
  }, []);

  const fetchAnalyticsData = async () => {
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

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      let url = '/audit/logs?limit=50';
      if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;
      if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;

      const res = await axiosInstance.get(url);
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleApplyLogFilters = (e) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" label="Loading Financial Analytics & Operational System Audits..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Financial Analytics &amp; Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time P&amp;L analysis, inventory stock aging warnings, and live system action logs</p>
        </div>
        <button
          onClick={() => {
            fetchAnalyticsData();
            fetchAuditLogs();
          }}
          className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Financial P&L KPI Cards Grid */}
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
          value={financialData ? `PKR ${(financialData.total_car_purchase_cost / 1000000).toFixed(2)}M` : 'PKR 0.0M'}
          icon={Car}
          color="indigo"
          trend="up"
          trendText="Cost of Goods Sold"
        />

        <StatCard
          title="Gross Profit Margin"
          value={financialData ? `PKR ${(financialData.total_gross_profit / 100000).toFixed(1)} Lakh` : 'PKR 0 Lakh'}
          icon={TrendingUp}
          color="cyan"
          trend="up"
          trendText="Revenue - Cost Basis"
        />

        <StatCard
          title="Net Showroom Profit"
          value={financialData ? `PKR ${(financialData.total_net_showroom_profit / 100000).toFixed(1)} Lakh` : 'PKR 0 Lakh'}
          icon={BarChart3}
          color="emerald"
          trend="up"
          trendText="After Expenses &amp; Payroll"
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
            <p className="text-xs text-slate-400">Slow-moving vehicle stock warnings for price adjustment or promotional priority</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Registration</th>
                <th className="py-3.5 px-6">Vehicle Make &amp; Model</th>
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

      {/* System Operational Audit Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Real-Time Operational Audit Logs</span>
            </h3>
            <p className="text-xs text-slate-400">Security event logging, staff transactions, and database state modifications</p>
          </div>

          {/* Filter form */}
          <form onSubmit={handleApplyLogFilters} className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by Action..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500"
              />
            </div>

            <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </form>
        </div>

        {logsLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Fetching live security audit logs..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">User / Actor</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Target Entity</th>
                  <th className="py-3.5 px-6">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-400">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {log.user ? `${log.user.full_name} (${log.user.email})` : 'System / Automated'}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-indigo-400">
                        {log.action}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">
                        {log.entity_type ? `${log.entity_type} [${log.entity_id ? log.entity_id.slice(0, 8) : 'N/A'}]` : 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No system audit log entries found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
