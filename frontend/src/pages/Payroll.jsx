import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import AddEmployeeModal from '../components/workforce/AddEmployeeModal';
import GeneratePayrollModal from '../components/workforce/GeneratePayrollModal';
import ExecuteSalaryPayoutModal from '../components/workforce/ExecuteSalaryPayoutModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { Users, Plus, DollarSign, Calculator, Calendar } from 'lucide-react';

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [isGenPayrollOpen, setIsGenPayrollOpen] = useState(false);
  const [activePayoutPayroll, setActivePayoutPayroll] = useState(null);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const empRes = await axiosInstance.get('/payroll/employees');
      setEmployees(empRes.data || []);

      const payRes = await axiosInstance.get('/payroll/history');
      setPayrolls(payRes.data || []);
    } catch (err) {
      console.error('Failed to fetch payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employees, Dealers & Payroll Engine</h1>
          <p className="text-xs text-slate-400 mt-1">Staff directory, monthly net salary generation, and bank salary payouts</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGenPayrollOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium text-xs rounded-lg transition-all flex items-center gap-2 shadow-sm"
          >
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>Generate Monthly Salary</span>
          </button>

          <button
            onClick={() => setIsAddEmpOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span>Staff Directory</span>
        </h3>

        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading staff directory..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Employee Name</th>
                  <th className="py-3.5 px-6">Designation</th>
                  <th className="py-3.5 px-6">CNIC Number</th>
                  <th className="py-3.5 px-6">Phone Number</th>
                  <th className="py-3.5 px-6">Base Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                          {emp.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{emp.full_name}</span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {emp.designation}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-mono text-slate-400">{emp.cnic}</td>
                      <td className="py-4 px-6 text-slate-600">{emp.phone}</td>
                      <td className="py-4 px-6 font-extrabold text-emerald-600">
                        PKR {emp.base_salary ? emp.base_salary.toLocaleString() : '0'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No employee profiles registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payroll History Ledger */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <span>Payroll History & Salary Payouts</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Period</th>
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Base Salary</th>
                <th className="py-3.5 px-6">Allowances</th>
                <th className="py-3.5 px-6">Deductions</th>
                <th className="py-3.5 px-6">Net Salary</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {payrolls.length > 0 ? (
                payrolls.map((pay) => (
                  <tr key={pay.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-blue-600">
                      Month {pay.pay_period_month ?? pay.month}/{pay.pay_period_year ?? pay.year}
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-900">
                      {pay.employee?.full_name || 'Staff'}
                    </td>

                    <td className="py-4 px-6 text-slate-500 font-semibold">
                      PKR {pay.base_salary ? pay.base_salary.toLocaleString() : '0'}
                    </td>

                    <td className="py-4 px-6 text-emerald-600 font-semibold">
                      +PKR {pay.allowances ? pay.allowances.toLocaleString() : '0'}
                    </td>

                    <td className="py-4 px-6 text-rose-600 font-semibold">
                      -PKR {pay.deductions ? pay.deductions.toLocaleString() : '0'}
                    </td>

                    <td className="py-4 px-6 font-extrabold text-emerald-600">
                      PKR {pay.net_salary ? pay.net_salary.toLocaleString() : '0'}
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={pay.payment_status || pay.status} />
                    </td>

                    <td className="py-4 px-6">
                      {(pay.payment_status || pay.status) === 'PENDING' ? (
                        <button
                          onClick={() => setActivePayoutPayroll(pay)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm"
                        >
                          Pay Salary
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Disbursed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No monthly payroll entries generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={isAddEmpOpen}
        onClose={() => setIsAddEmpOpen(false)}
        onSuccess={fetchPayrollData}
      />

      <GeneratePayrollModal
        isOpen={isGenPayrollOpen}
        employees={employees}
        onClose={() => setIsGenPayrollOpen(false)}
        onSuccess={fetchPayrollData}
      />

      {activePayoutPayroll && (
        <ExecuteSalaryPayoutModal
          isOpen={!!activePayoutPayroll}
          payrollItem={activePayoutPayroll}
          onClose={() => setActivePayoutPayroll(null)}
          onSuccess={fetchPayrollData}
        />
      )}
    </div>
  );
};

export default Payroll;
