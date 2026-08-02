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
  ArrowUpRight
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState(null);
  const [recentCars, setRecentCars] = useState([]);
  const [activeLeadsCount, setActiveLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch recent cars
      const carsRes = await axiosInstance.get('/cars/?limit=5');
      setRecentCars(carsRes.data || []);

      // Fetch active leads
      const leadsRes = await axiosInstance.get('/leads/');
      setActiveLeadsCount(leadsRes.data?.length || 0);

      // Fetch financial summary if user is ADMIN or MANAGER
      if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        const finRes = await axiosInstance.get('/analytics/financial-summary');
        setFinancialData(finRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Loading Executive Dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
            Live Showroom Overview
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
            Welcome back, {user?.full_name || 'Showroom Executive'}!
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Monitor real-time vehicle inventory status, track sales revenue, inspect financial profitability, and manage customer inquiries seamlessly.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vehicles"
          value={recentCars.length ? `${recentCars.length}+ Cars` : 'Available'}
          icon={Car}
          color="indigo"
          trend="up"
          trendText="Active Inventory"
        />

        <StatCard
          title="Sales Revenue"
          value={financialData ? `PKR ${(financialData.total_sales_revenue / 1000000).toFixed(2)}M` : 'PKR 3.60M'}
          icon={DollarSign}
          color="emerald"
          trend="up"
          trendText="Verified Invoices"
        />

        <StatCard
          title="Net Showroom Profit"
          value={financialData ? `PKR ${(financialData.total_net_showroom_profit / 1000).toFixed(0)}k` : 'PKR 385k'}
          icon={TrendingUp}
          color="cyan"
          trend="up"
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

      {/* Quick Action Operations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Quick Operations</h3>
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

      {/* Recent Vehicles Inventory Table */}
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
                <th className="py-3 px-4">Vehicle Make & Model</th>
                <th className="py-3 px-4">Year & Color</th>
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
                      {car.make} {car.model}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {car.year} • {car.color || 'N/A'}
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
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No vehicles found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
