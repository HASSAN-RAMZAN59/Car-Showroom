import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LogInstallmentPaymentModal from '../components/sales/LogInstallmentPaymentModal';
import CreateInstallmentModal from '../components/sales/CreateInstallmentModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { CalendarCheck, DollarSign, Clock, AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';

const Installments = () => {
  const [overdueList, setOverdueList] = useState([]);
  const [selectedPaymentForLog, setSelectedPaymentForLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstallmentData();
  }, []);

  const fetchInstallmentData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/installments/overdue');
      setOverdueList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch installment monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Flexible Financing & EMI Schedules</h1>
          <p className="text-xs text-slate-400 mt-1">Track monthly customer installment plans, collection schedules, and overdue monitoring</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active EMI Plans"
          value="Automated Schedule"
          icon={CalendarCheck}
          color="indigo"
          trend="up"
          trendText="1 to 10 Months Tenure"
        />

        <StatCard
          title="Monthly Collection Rate"
          value="30 Days Interval"
          icon={DollarSign}
          color="emerald"
          trend="up"
          trendText="Receipt Receipts"
        />

        <StatCard
          title="Overdue Installments"
          value={`${overdueList.length} Items`}
          icon={AlertTriangle}
          color="rose"
          trend="down"
          trendText="Requires Follow-Up"
        />
      </div>

      {/* Overdue Items Monitoring Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Overdue Installments Monitoring</span>
            </h3>
            <p className="text-xs text-slate-400">Installment payments past due date requiring immediate collection</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Checking overdue EMI entries..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Installment #</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Amount Due</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {overdueList.length > 0 ? (
                  overdueList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-white">
                        Installment #{item.installment_number}
                      </td>

                      <td className="py-4 px-6 font-mono text-rose-400 font-semibold">
                        {item.due_date}
                      </td>

                      <td className="py-4 px-6 font-extrabold text-white">
                        PKR {item.amount_due ? item.amount_due.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedPaymentForLog(item)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                        >
                          Log Payment
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No overdue installment payments detected! All collections up to date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPaymentForLog && (
        <LogInstallmentPaymentModal
          isOpen={!!selectedPaymentForLog}
          paymentItem={selectedPaymentForLog}
          onClose={() => setSelectedPaymentForLog(null)}
          onSuccess={fetchInstallmentData}
        />
      )}
    </div>
  );
};

export default Installments;
