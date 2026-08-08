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
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Financial & Operational Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic P&L reporting, showroom stock turnover, and live security audit trails
          </p>
        </div>

        {/* Dynamic Preset & Custom Date Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => handlePresetChange('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                preset === 'ALL' ? 'bg-blue-600 text-white shadow-sm font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handlePresetChange('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                preset === 'THIS_MONTH' ? 'bg-blue-600 text-white shadow-sm font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePresetChange('LAST_30')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                preset === 'LAST_30' ? 'bg-blue-600 text-white shadow-sm font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePresetChange('THIS_YEAR')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                preset === 'THIS_YEAR' ? 'bg-blue-600 text-white shadow-sm font-medium' : 'text-slate-600 hover:text-slate-900'
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
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-all shadow-sm"
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
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <span>Showroom Financial Allocation Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400">Proportional comparison of revenue, capital cost, operational expenses, and net profit</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Vehicle Cost Basis (COGS)</span>
                  <span className="text-blue-600 font-mono">
                    {revenue > 0 ? ((cost / revenue) * 100).toFixed(1) : '0'}% of Revenue
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${revenue > 0 ? Math.min(100, (cost / revenue) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Operational Expenses & Payroll</span>
                  <span className="text-amber-600 font-mono">
                    {revenue > 0 ? (((expenses + payroll) / revenue) * 100).toFixed(1) : '0'}% of Revenue
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${revenue > 0 ? Math.min(100, ((expenses + payroll) / revenue) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Net Showroom Profit Margin</span>
                  <span className="text-emerald-600 font-mono">
                    {revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0'}% Margin
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
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
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Inventory Stock Aging Audit</span>
            </h3>
            <p className="text-xs text-slate-400">Track parked stock duration to minimize capital lockup and identify slow-moving cars</p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[10px]">Unsold Vehicles</span>
              <span className="text-slate-900 font-bold">{agingData?.total_unsold_vehicles || 0} Units</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[10px]">Capital Locked</span>
              <span className="text-emerald-600 font-bold">
                PKR {((agingData?.total_capital_locked || 0) / 100000).toFixed(1)}L
              </span>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
              <span className="block text-[10px]">Slow (&gt;30 Days)</span>
              <span className="font-bold">{agingData?.slow_moving_30_days_count || 0} Cars</span>
            </div>
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              <span className="block text-[10px]">Critical (&gt;60 Days)</span>
              <span className="font-bold">{agingData?.slow_moving_60_days_count || 0} Cars</span>
            </div>
          </div>
        </div>

        {/* Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium w-full sm:w-auto">
            <button
              onClick={() => setAgingFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                agingFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Unsold Vehicles ({vehiclesList.length})
            </button>
            <button
              onClick={() => setAgingFilter('SLOW_30')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                agingFilter === 'SLOW_30' ? 'bg-amber-600 text-white shadow-sm font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              &gt; 30 Days ({agingData?.slow_moving_30_days_count || 0})
            </button>
            <button
              onClick={() => setAgingFilter('CRITICAL_60')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                agingFilter === 'CRITICAL_60' ? 'bg-rose-600 text-white shadow-sm font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              &gt; 60 Days ({agingData?.slow_moving_60_days_count || 0})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vehicle stock..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Stock Aging Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Registration</th>
                <th className="py-3.5 px-6">Vehicle Make & Model</th>
                <th className="py-3.5 px-6">Purchase Price</th>
                <th className="py-3.5 px-6">Acquired Date</th>
                <th className="py-3.5 px-6">Days in Showroom</th>
                <th className="py-3.5 px-6">Aging Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((item) => {
                  const days = item.days_in_stock ?? 0;
                  const isHighRisk = days >= 60;
                  const isModerateRisk = days >= 30;

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">{item.car_number}</td>

                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {item.make} {item.model} ({item.year}) {item.color ? `• ${item.color}` : ''}
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-600">
                        PKR {item.purchase_price ? item.purchase_price.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6 font-mono text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-6 font-extrabold">
                        <span className={isHighRisk ? 'text-rose-600' : isModerateRisk ? 'text-amber-600' : 'text-emerald-600'}>
                          {days} Days
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isHighRisk
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isModerateRisk
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isHighRisk
                            ? 'CRITICAL (>60 Days)'
                            : isModerateRisk
                            ? 'SLOW MOVING (>30 Days)'
                            : 'FRESH STOCK (<30 Days)'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No vehicles found matching current aging criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-Time Operational System Audit Logs */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Real-Time Operational Audit Logs</span>
            </h3>
            <p className="text-xs text-slate-400">Security event logging, staff transactions, and database state modifications</p>
          </div>

          {/* Filter form */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter action (e.g. CREATE, SELL)..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
              />
            </div>

            <button
              onClick={fetchAuditLogs}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-1 transition-all shadow-sm"
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
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">User / Actor</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Target Entity</th>
                  <th className="py-3.5 px-6">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-400">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {log.user ? `${log.user.full_name} (${log.user.email})` : 'System / Automated'}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-blue-600">
                        {log.action}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600">
                        {log.entity_type ? `${log.entity_type} [${log.entity_id ? log.entity_id.slice(0, 8) : 'N/A'}]` : 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
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
