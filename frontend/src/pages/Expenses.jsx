import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import LogExpenseModal from '../components/financial/LogExpenseModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DollarSign, Plus, Trash2, Calendar, FileText, Filter } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [totalExpenseSum, setTotalExpenseSum] = useState(0);

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = '/expenses/';
      if (categoryFilter !== 'ALL') {
        url = `/expenses/?category=${categoryFilter}`;
      }
      const res = await axiosInstance.get(url);
      if (Array.isArray(res.data)) {
        setExpenses(res.data);
        setTotalExpenseSum(res.data.reduce((sum, item) => sum + (item.amount || 0), 0));
      } else if (res.data && Array.isArray(res.data.expenses)) {
        setExpenses(res.data.expenses);
        setTotalExpenseSum(res.data.total_expense_amount ?? res.data.expenses.reduce((sum, item) => sum + (item.amount || 0), 0));
      } else {
        setExpenses([]);
        setTotalExpenseSum(0);
      }
    } catch (err) {
      console.error('Failed to fetch daily expenses:', err);
      setExpenses([]);
      setTotalExpenseSum(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record? (Bank deductions will be refunded automatically)')) {
      return;
    }
    try {
      await axiosInstance.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error('Failed to delete expense record:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Daily Showroom Expenses</h1>
          <p className="text-xs text-slate-400 mt-1">Operational expense management, bank auto-deductions, and Cloudinary receipts</p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Expense</span>
        </button>
      </div>

      {/* KPI & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Period Expenses"
          value={`PKR ${totalExpenseSum.toLocaleString()}`}
          icon={DollarSign}
          color="rose"
          trend="up"
          trendText="Filtered Operational Sum"
        />

        <StatCard
          title="Active Expense Logs"
          value={`${expenses.length} Records`}
          icon={FileText}
          color="amber"
          trend="up"
          trendText="Logged Entries"
        />

        <StatCard
          title="Bank Auto-Deductions"
          value="Synchronized"
          icon={DollarSign}
          color="cyan"
          trend="up"
          trendText="Refreshes Balances"
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {['ALL', 'Utilities', 'Food/Tea', 'Maintenance', 'Fuel', 'Marketing', 'Misc'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-slate-300">
          Total Sum: <span className="text-rose-400 font-extrabold text-sm">PKR {totalExpenseSum.toLocaleString()}</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="lg" label="Loading daily expenses ledger..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Expense Title</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Payment Method</th>
                  <th className="py-3.5 px-6">Receipt / Bill</th>
                  <th className="py-3.5 px-6">Date Logged</th>
                  <th className="py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-white">
                        {exp.expense_name}
                        {exp.reason && <p className="text-[11px] font-normal text-slate-400">{exp.reason}</p>}
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {exp.category}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-extrabold text-rose-400">
                        PKR {exp.amount ? exp.amount.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-300">
                        {exp.payment_method}
                      </td>

                      <td className="py-4 px-6">
                        {exp.receipt_url ? (
                          <a
                            href={exp.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-bold rounded-lg transition-all inline-flex items-center gap-1"
                          >
                            <span>📄 View Receipt</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No receipt attached</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-400 font-mono">
                        {exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Expense Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No daily expenses logged for the selected category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LogExpenseModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={fetchExpenses}
      />
    </div>
  );
};

export default Expenses;
