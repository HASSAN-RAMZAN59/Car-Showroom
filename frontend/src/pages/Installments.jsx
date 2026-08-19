import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LogInstallmentPaymentModal from '../components/sales/LogInstallmentPaymentModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { CalendarCheck, DollarSign, AlertTriangle, Car, User, ChevronDown, ChevronUp, CheckCircle2, Trash2 } from 'lucide-react';

const Installments = () => {
  const [plans, setPlans] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [selectedPaymentForLog, setSelectedPaymentForLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstallmentData();
  }, []);

  const fetchInstallmentData = async () => {
    setLoading(true);
    try {
      const plansRes = await axiosInstance.get('/installments/');
      setPlans(plansRes.data || []);
      const overdueRes = await axiosInstance.get('/installments/overdue');
      setOverdueList(overdueRes.data || []);
    } catch (err) {
      console.error('Failed to fetch installment monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandPlan = (planId) => {
    setExpandedPlanId((prev) => (prev === planId ? null : planId));
  };

  const handleDeleteInstallmentPayment = async (pay) => {
    if (!window.confirm(`Are you sure you want to revert payment collection for Installment #${pay.installment_number}?`)) {
      return;
    }
    try {
      await axiosInstance.delete(`/installments/payments/${pay.id}`);
      fetchInstallmentData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to revert installment payment');
    }
  };

  const handleDeleteInstallmentPlan = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete the entire financing contract for vehicle ${plan.sale?.car?.car_number || ''}? This will delete all associated installment schedules.`)) {
      return;
    }
    try {
      await axiosInstance.delete(`/installments/plan/${plan.id}`);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete financing contract');
    }
  };

  // KPI aggregates
  const totalContracts = plans.length;
  let totalFinancedCapital = 0;
  let totalCollectedBalance = 0;

  plans.forEach((p) => {
    totalFinancedCapital += p.financed_amount || 0;
    if (p.payments) {
      p.payments.forEach((pay) => {
        if (pay.status === 'PAID') {
          totalCollectedBalance += pay.amount_paid || pay.amount_due || 0;
        }
      });
    }
  });

  const totalRemainingBalance = Math.max(0, totalFinancedCapital - totalCollectedBalance);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Flexible Financing & EMI Schedules</h1>
          <p className="text-xs text-slate-400 mt-1">Track monthly customer installment plans, collection schedules, and overdue monitoring</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Financing Contracts"
          value={`${totalContracts} Active Contracts`}
          icon={CalendarCheck}
          color="indigo"
          trend="up"
          trendText="Automated Schedules"
        />

        <StatCard
          title="Outstanding Financed Capital"
          value={`PKR ${(totalRemainingBalance / 100000).toFixed(1)} Lakh`}
          icon={DollarSign}
          color="emerald"
          trend="up"
          trendText={`Collected: PKR ${(totalCollectedBalance / 100000).toFixed(1)}L`}
        />

        <StatCard
          title="Overdue EMI Items"
          value={`${overdueList.length} Items`}
          icon={AlertTriangle}
          color="rose"
          trend="down"
          trendText="Requires Urgent Action"
        />
      </div>

      {/* Main Section: Active Installment Contracts */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              <span>Active Customer Installment Contracts</span>
            </h3>
            <p className="text-xs text-slate-400">All customer vehicle sales backed by monthly installment plans</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="lg" label="Loading customer financing plans..." />
          </div>
        ) : plans.length > 0 ? (
          <div className="space-y-4">
            {plans.map((plan) => {
              const isExpanded = expandedPlanId === plan.id;
              const car = plan.sale?.car;
              const customer = plan.sale?.customer;

              let planPaid = 0;
              if (plan.payments) {
                plan.payments.forEach((p) => {
                  if (p.status === 'PAID') planPaid += p.amount_paid || p.amount_due || 0;
                });
              }
              const planRemaining = Math.max(0, plan.financed_amount - planPaid);

              return (
                <div key={plan.id} className="border border-slate-200 bg-slate-100/50 rounded-xl overflow-hidden shadow-sm">
                  {/* Plan Summary Row */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-xs font-bold">
                          {car?.car_number || 'VEHICLE'}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {car ? `${car.make} ${car.model} (${car.year})` : 'Financed Vehicle'}
                        </h4>
                        <StatusBadge status={plan.status} />
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Buyer: {customer?.full_name || 'Customer'} ({customer?.phone || 'N/A'})</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Price / Down</span>
                        <span className="font-bold text-slate-900">
                          PKR {(plan.total_amount || 0).toLocaleString()} (Down: PKR {(plan.down_payment || 0).toLocaleString()})
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Monthly EMI</span>
                        <span className="font-bold text-emerald-600">
                          PKR {(plan.monthly_installment_amount || 0).toLocaleString()} / mo ({plan.duration_months} Mos)
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Balance Remaining</span>
                        <span className="font-bold text-rose-600">
                          PKR {planRemaining.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpandPlan(plan.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-lg font-medium flex items-center gap-1 transition-all shadow-sm"
                        >
                          <span>{isExpanded ? 'Hide Schedule' : 'View Schedule & Collect'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        <button
                          onClick={() => handleDeleteInstallmentPlan(plan)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-slate-200"
                          title="Delete Entire Financing Contract"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Monthly Schedule Table */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-200 bg-white">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                        Monthly Payment Schedule ({plan.payments?.length || 0} Installments)
                      </h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4">#</th>
                              <th className="py-2.5 px-4">Due Date</th>
                              <th className="py-2.5 px-4">Amount Due</th>
                              <th className="py-2.5 px-4">Paid Date</th>
                              <th className="py-2.5 px-4">Status</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {plan.payments && plan.payments.length > 0 ? (
                              plan.payments.map((pay) => (
                                <tr key={pay.id} className="hover:bg-blue-50/40 transition-colors">
                                  <td className="py-3 px-4 font-bold text-slate-900">
                                    Installment #{pay.installment_number}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-600">
                                    {pay.due_date}
                                  </td>
                                  <td className="py-3 px-4 font-extrabold text-emerald-600">
                                    PKR {pay.amount_due ? pay.amount_due.toLocaleString() : '0'}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-400">
                                    {pay.payment_date ? new Date(pay.payment_date).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="py-3 px-4">
                                    <StatusBadge status={pay.status} />
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {pay.status !== 'PAID' ? (
                                      <button
                                        onClick={() => setSelectedPaymentForLog(pay)}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium rounded-lg transition-all shadow-sm"
                                      >
                                        Receive Payment
                                      </button>
                                    ) : (
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                                        </span>
                                        <button
                                          onClick={() => handleDeleteInstallmentPayment(pay)}
                                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                          title="Revert Payment Collection"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-4 text-center text-slate-400">
                                  No monthly entries found for this plan.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No active vehicle installment financing contracts found in the live database.
          </div>
        )}
      </div>

      {/* Overdue Monitoring Section */}
      {overdueList.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Overdue Installments Alert ({overdueList.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Installment #</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Amount Due</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {overdueList.map((item) => (
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
                        Collect EMI
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
