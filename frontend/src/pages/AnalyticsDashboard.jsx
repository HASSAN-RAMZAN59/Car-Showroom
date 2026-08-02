import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  ShieldCheck,
  Search,
  Calendar,
  Car,
  Users,
  Filter,
  RefreshCw,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Receipt,
  Building2,
  CheckCircle2,
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [financialData, setFinancialData] = useState(null);
  const [agingData, setAgingData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // Global Date Range Filters for Financial Analysis
  const [preset, setPreset] = useState('ALL'); // 'ALL', 'THIS_MONTH', 'LAST_30', 'THIS_YEAR'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Inventory search & aging tab filter
  const [agingFilter, setAgingFilter] = useState('ALL'); // 'ALL', 'SLOW_30', 'CRITICAL_60'
  const [inventorySearch, setInventorySearch] = useState('');

  // Audit Log search & filter
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchFinancialSummary();
    fetchInventoryAging();
    fetchAuditLogs();
  }, []);

  const fetchFinancialSummary = async (customStart = startDate, customEnd = endDate) => {
    setLoading(true);
    try {
      let url = '/analytics/financial-summary';
      const params = [];
      if (customStart) params.push(`start_date=${encodeURIComponent(customStart)}`);
      if (customEnd) params.push(`end_date=${encodeURIComponent(customEnd)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await axiosInstance.get(url);
      setFinancialData(res.data);
    } catch (err) {
      console.error('Failed to fetch financial summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryAging = async () => {
    try {
      const res = await axiosInstance.get('/analytics/inventory-aging');
      setAgingData(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory aging:', err);
    }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      let url = '/audit/logs?limit=100';
      if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;

      const res = await axiosInstance.get(url);
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Quick Preset Selector Handler
  const handlePresetChange = (presetKey) => {
    setPreset(presetKey);
    const now = new Date();
    let start = '';
    let end = '';

    if (presetKey === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = firstDay.toISOString();
    } else if (presetKey === 'LAST_30') {
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      start = thirtyDaysAgo.toISOString();
    } else if (presetKey === 'THIS_YEAR') {
      const firstYearDay = new Date(now.getFullYear(), 0, 1);
      start = firstYearDay.toISOString();
    }

    setStartDate(start ? start.slice(0, 10) : '');
    setEndDate(end ? end.slice(0, 10) : '');
    fetchFinancialSummary(start, end);
  };

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    setPreset('CUSTOM');
    fetchFinancialSummary(startDate ? `${startDate}T00:00:00Z` : '', endDate ? `${endDate}T23:59:59Z` : '');
  };

  // Filtered inventory vehicles
  const vehiclesList = agingData?.vehicles || [];
  const filteredVehicles = vehiclesList.filter((v) => {
    const days = v.days_in_stock ?? 0;
    const matchesSearch =
      v.car_number.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      v.make.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      v.model.toLowerCase().includes(inventorySearch.toLowerCase());

    if (!matchesSearch) return false;
    if (agingFilter === 'SLOW_30') return days >= 30 && days < 60;
    if (agingFilter === 'CRITICAL_60') return days >= 60;
    return true;
  });

  const revenue = financialData?.total_sales_revenue || 0;
  const cost = financialData?.total_car_purchase_cost || 0;
  const grossProfit = financialData?.total_gross_profit || 0;
  const expenses = financialData?.total_operational_expenses || 0;
  const payroll = financialData?.total_payroll_expenses || 0;
  const netProfit = financialData?.total_net_showroom_profit || 0;

  return (
    <div className="space-y-8">
      {/* Header & Global Time Range Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">Executive Financial &amp; Operational Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic P&amp;L reporting, showroom stock turnover, and live security audit trails
          </p>
        </div>

        {/* Dynamic Preset & Custom Date Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => handlePresetChange('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                preset === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handlePresetChange('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                preset === 'THIS_MONTH' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePresetChange('LAST_30')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                preset === 'LAST_30' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePresetChange('THIS_YEAR')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                preset === 'THIS_YEAR' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Year
            </button>
          </div>

          <form onSubmit={handleApplyCustomDates} className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all border border-slate-700"
            >
              Apply
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" label="Computing Dynamic Showroom Financial Summary..." />
        </div>
      ) : (
        <>
          {/* Executive P&L Financial Cards (6 Core Metrics) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Sales Revenue"
              value={`PKR ${revenue.toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              trend="up"
              trendText="Live Database Sum"
            />

            <StatCard
              title="Cost Basis (COGS)"
              value={`PKR ${cost.toLocaleString()}`}
              icon={Car}
              color="indigo"
              trend="up"
              trendText="Purchase & Repairs"
            />

            <StatCard
              title="Gross Profit"
              value={`PKR ${grossProfit.toLocaleString()}`}
              icon={TrendingUp}
              color="cyan"
              trend="up"
              trendText="Revenue - COGS"
            />

            <StatCard
              title="Daily Expenses"
              value={`PKR ${expenses.toLocaleString()}`}
              icon={Receipt}
              color="amber"
              trend="down"
              trendText="Operational Costs"
            />

            <StatCard
              title="Payroll Paid"
              value={`PKR ${payroll.toLocaleString()}`}
              icon={Users}
              color="rose"
              trend="down"
              trendText="Staff Salaries"
            />

            <StatCard
              title="Net Showroom Profit"
              value={`PKR ${netProfit.toLocaleString()}`}
              icon={BarChart3}
              color="emerald"
              trend={netProfit >= 0 ? 'up' : 'down'}
              trendText="Net Bottom-Line"
            />
          </div>

          {/* Visual Profit & Loss Distribution Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-400" />
                  <span>Showroom Financial Allocation Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400">Proportional comparison of revenue, capital cost, operational expenses, and net profit</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Vehicle Cost Basis (COGS)</span>
                  <span className="text-indigo-400 font-mono">
                    {revenue > 0 ? ((cost / revenue) * 100).toFixed(1) : '0'}% of Revenue
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${revenue > 0 ? Math.min(100, (cost / revenue) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Operational Expenses &amp; Payroll</span>
                  <span className="text-amber-400 font-mono">
                    {revenue > 0 ? (((expenses + payroll) / revenue) * 100).toFixed(1) : '0'}% of Revenue
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${revenue > 0 ? Math.min(100, ((expenses + payroll) / revenue) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Net Showroom Profit Margin</span>
                  <span className="text-emerald-400 font-mono">
                    {revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0'}% Margin
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${revenue > 0 ? Math.min(100, Math.max(0, (netProfit / revenue) * 100)) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Showroom Inventory Stock Aging & Risk Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Inventory Stock Aging Audit</span>
            </h3>
            <p className="text-xs text-slate-400">Track parked stock duration to minimize capital lockup and identify slow-moving cars</p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Unsold Vehicles</span>
              <span className="text-white font-extrabold">{agingData?.total_unsold_vehicles || 0} Units</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Capital Locked</span>
              <span className="text-emerald-400 font-extrabold">
                PKR {((agingData?.total_capital_locked || 0) / 100000).toFixed(1)}L
              </span>
            </div>
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <span className="block text-[10px]">Slow (&gt;30 Days)</span>
              <span className="font-extrabold">{agingData?.slow_moving_30_days_count || 0} Cars</span>
            </div>
            <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
              <span className="block text-[10px]">Critical (&gt;60 Days)</span>
              <span className="font-extrabold">{agingData?.slow_moving_60_days_count || 0} Cars</span>
            </div>
          </div>
        </div>

        {/* Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold w-full sm:w-auto">
            <button
              onClick={() => setAgingFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                agingFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Unsold Vehicles ({vehiclesList.length})
            </button>
            <button
              onClick={() => setAgingFilter('SLOW_30')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                agingFilter === 'SLOW_30' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              &gt; 30 Days ({agingData?.slow_moving_30_days_count || 0})
            </button>
            <button
              onClick={() => setAgingFilter('CRITICAL_60')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                agingFilter === 'CRITICAL_60' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              &gt; 60 Days ({agingData?.slow_moving_60_days_count || 0})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search vehicle stock..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        {/* Stock Aging Table */}
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
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((item) => {
                  const days = item.days_in_stock ?? 0;
                  const isHighRisk = days >= 60;
                  const isModerateRisk = days >= 30;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white">{item.car_number}</td>

                      <td className="py-4 px-6 font-semibold text-slate-200">
                        {item.make} {item.model} ({item.year}) {item.color ? `• ${item.color}` : ''}
                      </td>

                      <td className="py-4 px-6 font-extrabold text-emerald-400">
                        PKR {item.purchase_price ? item.purchase_price.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6 font-mono text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-6 font-extrabold">
                        <span className={isHighRisk ? 'text-rose-400' : isModerateRisk ? 'text-amber-400' : 'text-emerald-400'}>
                          {days} Days
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                            isHighRisk
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : isModerateRisk
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {isHighRisk
                            ? 'CRITICAL (&gt;60 Days)'
                            : isModerateRisk
                            ? 'SLOW MOVING (&gt;30 Days)'
                            : 'FRESH STOCK (&lt;30 Days)'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No vehicles found matching current aging criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-Time Operational System Audit Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Real-Time Operational Audit Logs</span>
            </h3>
            <p className="text-xs text-slate-400">Security event logging, staff transactions, and database state modifications</p>
          </div>

          {/* Filter form */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter action (e.g. CREATE, SELL)..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500"
              />
            </div>

            <button
              onClick={fetchAuditLogs}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1 transition-all shadow-md shadow-indigo-600/20"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Logs</span>
            </button>
          </div>
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
