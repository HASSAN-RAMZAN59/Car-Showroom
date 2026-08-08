import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Search,
  Car,
  Receipt,
  Users,
  RefreshCw,
  FileText,
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('REPORTS'); // 'REPORTS' or 'AUDITS'
  const [financialData, setFinancialData] = useState(null);
  const [agingData, setAgingData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // Time preset filter
  const [preset, setPreset] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  useEffect(() => {
    fetchFinancialSummary();
    fetchInventoryAging();
    fetchAuditLogs();
  }, []);

  const fetchFinancialSummary = async (start = '', end = '') => {
    setLoading(true);
    try {
      let url = '/analytics/financial-summary';
      const params = [];
      if (start) params.push(`start_date=${encodeURIComponent(start)}`);
      if (end) params.push(`end_date=${encodeURIComponent(end)}`);
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
      const res = await axiosInstance.get('/audit/logs?limit=100');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handlePresetChange = (key) => {
    setPreset(key);
    const now = new Date();
    let start = '';
    if (key === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = firstDay.toISOString();
    } else if (key === 'THIS_YEAR') {
      const firstYearDay = new Date(now.getFullYear(), 0, 1);
      start = firstYearDay.toISOString();
    }
    fetchFinancialSummary(start, '');
  };

  const revenue = financialData?.total_sales_revenue || 0;
  const cost = financialData?.total_car_purchase_cost || 0;
  const grossProfit = financialData?.total_gross_profit || 0;
  const expenses = (financialData?.total_operational_expenses || 0) + (financialData?.total_payroll_expenses || 0);
  const netProfit = financialData?.total_net_showroom_profit || 0;

  const filteredLogs = auditLogs.filter((log) => {
    if (!auditSearch) return true;
    const term = auditSearch.toLowerCase();
    const action = (log.action || '').toLowerCase();
    const userName = (log.user?.full_name || '').toLowerCase();
    const userEmail = (log.user?.email || '').toLowerCase();
    return action.includes(term) || userName.includes(term) || userEmail.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Showroom Reports & Activity</h1>
          <p className="text-xs text-slate-400 mt-1">Simple profit & loss reporting and system activity logs</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'REPORTS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Profit & Sales</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDITS')}
            className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'AUDITS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Activity Logs</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFIT & SALES REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          {/* Quick Date Range Filter */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Filter Period:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                onClick={() => handlePresetChange('ALL')}
                className={`px-3 py-1 rounded-md transition-all ${
                  preset === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handlePresetChange('THIS_MONTH')}
                className={`px-3 py-1 rounded-md transition-all ${
                  preset === 'THIS_MONTH' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handlePresetChange('THIS_YEAR')}
                className={`px-3 py-1 rounded-md transition-all ${
                  preset === 'THIS_YEAR' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                This Year
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner size="lg" label="Loading financial summary..." />
            </div>
          ) : (
            <>
              {/* 4 Clean Executive Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Sales Revenue"
                  value={`PKR ${revenue.toLocaleString()}`}
                  icon={DollarSign}
                  color="emerald"
                  trend="up"
                  trendText="Total Sales Income"
                />

                <StatCard
                  title="Car Cost (COGS)"
                  value={`PKR ${cost.toLocaleString()}`}
                  icon={Car}
                  color="indigo"
                  trend="up"
                  trendText="Purchases & Repairs"
                />

                <StatCard
                  title="Expenses & Salaries"
                  value={`PKR ${expenses.toLocaleString()}`}
                  icon={Receipt}
                  color="amber"
                  trend="down"
                  trendText="Total Operations"
                />

                <StatCard
                  title="Net Profit"
                  value={`PKR ${netProfit.toLocaleString()}`}
                  icon={TrendingUp}
                  color="emerald"
                  trend={netProfit >= 0 ? 'up' : 'down'}
                  trendText="Final Net Profit"
                />
              </div>

              {/* Profit & Loss Simple Summary Table */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Showroom Financial Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Financial Item</th>
                        <th className="py-3 px-4 text-right">Amount (PKR)</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-900">Total Sales Revenue</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">PKR {revenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-semibold">Income</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-slate-700">Minus: Car Purchase & Repairs Cost</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">PKR {cost.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-slate-500">Cost</td>
                      </tr>
                      <tr className="bg-blue-50/40">
                        <td className="py-3 px-4 font-bold text-blue-900">Equals: Showroom Gross Profit</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">PKR {grossProfit.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-blue-700 font-semibold">Gross Margin</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-slate-700">Minus: Operational Expenses & Salaries</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">PKR {expenses.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-rose-600 font-semibold">Deductions</td>
                      </tr>
                      <tr className="bg-emerald-50/50">
                        <td className="py-3 px-4 font-extrabold text-emerald-900">Final Net Showroom Profit</td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 text-sm">PKR {netProfit.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-bold">Bottom Line</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: SYSTEM ACTIVITY LOGS (AUDITS) */}
      {activeTab === 'AUDITS' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">System Activity Logs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Track user actions, sales entries, and security operations</p>
            </div>

            {/* Simple Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 z-10 pointer-events-none" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search staff name or action..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
              />
            </div>
          </div>

          {logsLoading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner size="md" label="Loading activity logs..." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Action Done</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-500">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {log.user?.full_name || 'System / Admin'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-blue-600">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-mono text-[11px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-400">
                        No activity logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
