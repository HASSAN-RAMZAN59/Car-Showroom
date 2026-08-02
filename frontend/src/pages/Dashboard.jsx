import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
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
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [totalVehiclesCount, setTotalVehiclesCount] = useState(0);
  const [recentCars, setRecentCars] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
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
      setTotalVehiclesCount(allCars.length);
      setRecentCars(allCars.slice(0, 5));

      // 2. Fetch active customer leads count
      const leadsRes = await axiosInstance.get('/leads/');
      setActiveLeadsCount(leadsRes.data?.length || 0);

      // 3. Fetch recent sales list
      try {
        const salesRes = await axiosInstance.get('/sales/?limit=5');
        setRecentSales(salesRes.data || []);
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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Live Showroom Stream
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.full_name || 'Showroom Executive'}!
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Real-time vehicle inventory monitoring, live revenue metrics, profitability calculations, and customer CRM inquiry management.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="self-start md:self-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all border border-slate-700 shadow-md"
        >
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          <span>Refresh Dashboard</span>
        </button>
      </div>

      {/* KPI Stat Cards Grid (100% Dynamic Database Values) */}
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
          trendText="After Expenses &amp; Payroll"
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

      {/* Quick Action Operations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Operations</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/purchases')}
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            <span>Purchase Vehicle</span>
          </button>

          <button
            onClick={() => navigate('/sales')}
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Log New Sale</span>
          </button>

          <button
            onClick={() => navigate('/leads')}
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Add Customer Lead</span>
          </button>

          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Grid of Tables: Recent Inventory & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Table 1: Recent Vehicle Inventory */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Recent Vehicle Inventory</h3>
              <p className="text-xs text-slate-400">Latest cars logged into the showroom system</p>
            </div>
            <button
              onClick={() => navigate('/vehicles')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All Inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Make &amp; Model</th>
                  <th className="py-3 px-4">Purchase Price</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentCars.length > 0 ? (
                  recentCars.map((car) => (
                    <tr key={car.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{car.car_number}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {car.make} {car.model} ({car.year})
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        PKR {car.purchase_price ? car.purchase_price.toLocaleString() : '0'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={car.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No vehicles found in live database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Sales Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Recent Sales Activity</h3>
              <p className="text-xs text-slate-400">Latest completed customer vehicle deals</p>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All Sales</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-400">
                        PKR {sale.final_sale_price ? sale.final_sale_price.toLocaleString() : '0'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-400">
                        {sale.payment_type}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
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
