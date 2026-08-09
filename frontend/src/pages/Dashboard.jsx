import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Car,
  DollarSign,
  TrendingUp,
  UserCheck,
  PlusCircle,
  ShoppingBag,
  Receipt,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Wallet,
  ShieldCheck,
  Layers,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [totalVehiclesCount, setTotalVehiclesCount] = useState(0);
  const [recentCars, setRecentCars] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [allCarsList, setAllCarsList] = useState([]);
  const [activeLeadsCount, setActiveLeadsCount] = useState(0);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch total vehicle inventory & recent cars list
      const carsRes = await axiosInstance.get('/cars/');
      const allCars = carsRes.data || [];
      setAllCarsList(allCars);
      setTotalVehiclesCount(allCars.length);
      setRecentCars(allCars.slice(0, 5));

      // 2. Fetch active customer leads count
      const leadsRes = await axiosInstance.get('/leads/');
      setActiveLeadsCount(leadsRes.data?.length || 0);

      // 3. Fetch recent sales list
      try {
        const salesRes = await axiosInstance.get('/sales/?limit=50');
        const salesData = salesRes.data || [];
        setRecentSales(salesData);
      } catch (sErr) {
        console.error('Failed to fetch recent sales:', sErr);
      }

      // 4. Fetch financial summary (for ADMIN & MANAGER roles)
      if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        try {
          const finRes = await axiosInstance.get('/analytics/financial-summary');
          setFinancialData(finRes.data);
        } catch (fErr) {
          console.error('Failed to fetch financial summary:', fErr);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" label="Connecting Live Database & Loading Dashboard..." />
      </div>
    );
  }

  const revenue = financialData?.total_sales_revenue || 0;
  const netProfit = financialData?.total_net_showroom_profit || 0;
  const expenses = (financialData?.total_operational_expenses || 0) + (financialData?.total_payroll_expenses || 0);

  // --- Calculate Data for Inventory Distribution Donut Chart ---
  const statusCounts = {
    AVAILABLE: 0,
    BOOKED: 0,
    SOLD: 0,
    CONSIGNMENT: 0,
  };

  allCarsList.forEach((car) => {
    const statusKey = car.status || 'AVAILABLE';
    if (statusCounts[statusKey] !== undefined) {
      statusCounts[statusKey]++;
    } else {
      statusCounts.AVAILABLE++;
    }
  });

  const pieChartData = [
    { name: 'Available In-Stock', value: statusCounts.AVAILABLE, color: '#2563EB' },
    { name: 'Booked / Token', value: statusCounts.BOOKED, color: '#F59E0B' },
    { name: 'Sold Out', value: statusCounts.SOLD, color: '#10B981' },
    { name: 'Consignment Cars', value: statusCounts.CONSIGNMENT, color: '#8B5CF6' },
  ].filter((item) => item.value > 0 || allCarsList.length === 0);

  if (allCarsList.length === 0) {
    pieChartData.push({ name: 'No Vehicles Registered', value: 1, color: '#CBD5E1' });
  }

  // --- Calculate Monthly Sales & Profit Trend Chart Data ---
  const monthlyDataMap = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    monthlyDataMap[label] = { month: label, Sales: 0, Revenue: 0, Profit: 0 };
  }

  recentSales.forEach((sale) => {
    if (sale.sale_date) {
      const sDate = new Date(sale.sale_date);
      const label = `${monthNames[sDate.getMonth()]} ${sDate.getFullYear().toString().slice(-2)}`;
      if (monthlyDataMap[label]) {
        monthlyDataMap[label].Sales += 1;
        monthlyDataMap[label].Revenue += sale.final_sale_price || 0;
        monthlyDataMap[label].Profit += sale.profit_margin || (sale.final_sale_price * 0.08);
      }
    }
  });

  const salesTrendData = Object.values(monthlyDataMap);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="flex items-center gap-2 font-medium" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-bold text-slate-900">
                {entry.name.includes('Revenue') || entry.name.includes('Profit')
                  ? `PKR ${Number(entry.value).toLocaleString()}`
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Live Showroom Stream
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-semibold">
              {user?.role || 'STAFF'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name || 'Showroom Executive'}!
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Real-time vehicle inventory monitoring, live revenue metrics, profitability calculations, and customer CRM inquiry management.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="self-start md:self-auto px-4 py-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-medium rounded-xl flex items-center gap-2 transition-all border border-slate-200 shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
          <span>Refresh Dashboard</span>
        </button>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vehicles Stock"
          value={`${totalVehiclesCount} Cars`}
          icon={Car}
          color="indigo"
          trend="up"
          trendText="Active Inventory"
        />

        <StatCard
          title="Sales Revenue"
          value={`PKR ${revenue.toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          trend="up"
          trendText="Live Database Sum"
        />

        <StatCard
          title="Net Showroom Profit"
          value={`PKR ${netProfit.toLocaleString()}`}
          icon={TrendingUp}
          color="cyan"
          trend={netProfit >= 0 ? 'up' : 'down'}
          trendText="After Expenses & Payroll"
        />

        <StatCard
          title="Active Customer Leads"
          value={`${activeLeadsCount} Leads`}
          icon={UserCheck}
          color="amber"
          trend="up"
          trendText="CRM Inquiries"
        />
      </div>

      {/* Interactive Analytics Charts Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart 1: Sales Revenue & Profit Trend (2 Columns wide) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Revenue & Profit Performance</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Monthly sales revenue stream and net margin trends</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium ml-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Profit
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="Profit" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Vehicle Inventory Status (Donut Chart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Inventory Distribution</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Live stock status & vehicle breakdown</p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900">{totalVehiclesCount}</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Cars</span>
            </div>
          </div>

          {/* Legend list */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold">
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Available Stock
              </span>
              <span className="font-extrabold text-blue-600">{statusCounts.AVAILABLE} Cars</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Booked / Token
              </span>
              <span className="font-extrabold text-amber-600">{statusCounts.BOOKED} Cars</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sold Out
              </span>
              <span className="font-extrabold text-emerald-600">{statusCounts.SOLD} Cars</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Consignment Cars
              </span>
              <span className="font-extrabold text-purple-600">{statusCounts.CONSIGNMENT} Cars</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Operations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Quick Showroom Operations</h3>
          <span className="text-[11px] text-slate-400 font-medium">Fast Access Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigate('/purchases')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-600 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Car className="w-4 h-4 text-blue-600" />
            <span>Buy Vehicle</span>
          </button>

          <button
            onClick={() => navigate('/sales')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-600 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>New Sale</span>
          </button>

          <button
            onClick={() => navigate('/leads')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-600 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Add Customer</span>
          </button>

          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-600 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>Add Expense</span>
          </button>

          <button
            onClick={() => navigate('/investors')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-600 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-purple-600" />
            <span>Investors</span>
          </button>

          <button
            onClick={() => navigate('/database-backup')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-600 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>DB Backup</span>
          </button>
        </div>
      </div>

      {/* Grid of Tables: Recent Inventory & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Table 1: Recent Vehicle Inventory */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Vehicle Inventory</h3>
              <p className="text-xs text-slate-500">Latest cars logged into the showroom system</p>
            </div>
            <button
              onClick={() => navigate('/vehicles')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Make & Model</th>
                  <th className="py-3 px-4">Purchase Price</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recentCars.length > 0 ? (
                  recentCars.map((car) => (
                    <tr key={car.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{car.car_number}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {car.make} {car.model} ({car.year})
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        PKR {car.purchase_price ? car.purchase_price.toLocaleString() : '0'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={car.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No vehicles found in live database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Sales Transactions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Sales Activity</h3>
              <p className="text-xs text-slate-500">Latest completed customer vehicle deals</p>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Sales</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recentSales.slice(0, 5).length > 0 ? (
                  recentSales.slice(0, 5).map((sale) => (
                    <tr key={sale.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600">
                        PKR {sale.final_sale_price ? sale.final_sale_price.toLocaleString() : '0'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">
                        {sale.payment_type}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      No sales completed yet in live database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
