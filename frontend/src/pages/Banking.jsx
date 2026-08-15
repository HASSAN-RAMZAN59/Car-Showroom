import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import CreateBankAccountModal from '../components/financial/CreateBankAccountModal';
import SplitPaymentModal from '../components/financial/SplitPaymentModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SmartSearchInput from '../components/vehicles/SmartSearchInput';
import { Building2, Plus, DollarSign, ArrowUpRight, ArrowDownLeft, Car, Search, Trash2 } from 'lucide-react';

const Banking = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [carTransactions, setCarTransactions] = useState([]);
  const [selectedCarForAudit, setSelectedCarForAudit] = useState(null);
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts', 'carAudit'
  const [loading, setLoading] = useState(true);

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountTransactions(selectedAccount);
    }
  }, [selectedAccount]);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/bank/accounts');
      setBankAccounts(res.data || []);
      if (res.data && res.data.length > 0 && !selectedAccount) {
        setSelectedAccount(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch bank accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTransactions = async (accId) => {
    try {
      const res = await axiosInstance.get(`/bank/accounts/${accId}/ledger`);
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch account transactions:', err);
    }
  };

  const handleSelectCarAudit = async (car) => {
    setSelectedCarForAudit(car);
    if (car) {
      try {
        const res = await axiosInstance.get(`/bank/car/${car.id}/transactions`);
        setCarTransactions(res.data || []);
      } catch (err) {
        console.error('Failed to fetch car financial audit trail:', err);
      }
    } else {
      setCarTransactions([]);
    }
  };

  const handleDeleteAccount = async (acc, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to deactivate bank account "${acc.bank_name} - ${acc.account_title}"?`)) {
      return;
    }
    try {
      await axiosInstance.delete(`/bank/accounts/${acc.id}`);
      setBankAccounts((prev) => prev.filter((a) => a.id !== acc.id));
      if (selectedAccount === acc.id) {
        setSelectedAccount('');
        setTransactions([]);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to deactivate bank account');
    }
  };

  const handleDeleteTransaction = async (tx) => {
    if (!window.confirm(`Are you sure you want to delete transaction of PKR ${tx.amount?.toLocaleString()}? This will automatically reverse the bank balance impact.`)) {
      return;
    }
    try {
      await axiosInstance.delete(`/bank/transactions/${tx.id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
      setCarTransactions((prev) => prev.filter((t) => t.id !== tx.id));
      fetchBankAccounts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete transaction');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Multi-Bank Ledger & Split Payments</h1>
          <p className="text-xs text-slate-400 mt-1">Corporate bank accounts, real-time balance tracking, and vehicle transaction audit trail</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSplitPaymentOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium text-xs rounded-lg transition-all shadow-sm"
          >
            <span>Split Payment</span>
          </button>

          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all"
          >
            <span>Add Bank</span>
          </button>
        </div>
      </div>

      {/* Live Bank Accounts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bankAccounts.map((acc) => (
          <div
            key={acc.id}
            onClick={() => setSelectedAccount(acc.id)}
            className={`bg-white border rounded-xl p-6 shadow-sm cursor-pointer transition-all duration-200 relative group ${
              selectedAccount === acc.id
                ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50'
                : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{acc.bank_name}</p>
                <h3 className="text-base font-semibold text-slate-800 mt-1">{acc.account_title}</h3>
                <p className="text-[11px] font-mono text-slate-400 mt-1">{acc.account_number}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDeleteAccount(acc, e)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Deactivate Bank Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Live Current Balance:</span>
              <span className="text-lg font-bold text-emerald-600">
                PKR {acc.current_balance ? acc.current_balance.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-100/50 px-6 pt-3 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'accounts' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Account Audit Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('carAudit')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'carAudit' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Vehicle Financial Audit Trail</span>
          </button>
        </div>

        {/* TAB 1: Account Audit Ledger */}
        {activeTab === 'accounts' && (
          <div className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-800">Bank Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-6">Transaction Type</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Reference ID</th>
                    <th className="py-3.5 px-6">Notes</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-4 px-6 font-bold flex items-center gap-2">
                          {tx.transaction_type === 'CREDIT' ? (
                            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-rose-600" />
                          )}
                          <span className={tx.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.transaction_type}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-extrabold text-slate-900">
                          PKR {tx.amount ? tx.amount.toLocaleString() : '0'}
                        </td>

                        <td className="py-4 px-6 font-mono text-slate-500">
                          {tx.reference_number || 'N/A'}
                        </td>

                        <td className="py-4 px-6 text-slate-600">
                          {tx.notes || 'N/A'}
                        </td>

                        <td className="py-4 px-6 font-mono text-slate-400">
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No transaction ledger entries recorded for this bank account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Car Audit Trail */}
        {activeTab === 'carAudit' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Select Vehicle for Financial Audit Trail
              </label>
              <div className="max-w-md">
                <SmartSearchInput onSelectCar={handleSelectCarAudit} placeholder="Search plate or vehicle model..." />
              </div>
            </div>

            {selectedCarForAudit && (
              <div className="p-4 bg-slate-100/60 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  Audit Trail: {selectedCarForAudit.make} {selectedCarForAudit.model} ({selectedCarForAudit.car_number})
                </span>
                <span className="text-emerald-600 font-bold">
                  Cost Basis: PKR {selectedCarForAudit.total_cost_basis?.toLocaleString() || '0'}
                </span>
              </div>
            )}

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-6">Payment Method</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Bank Account</th>
                    <th className="py-3.5 px-6">Reference No</th>
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {carTransactions.length > 0 ? (
                    carTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-blue-600">{tx.payment_method}</td>
                        <td className="py-4 px-6 font-extrabold text-emerald-600">
                          PKR {tx.amount ? tx.amount.toLocaleString() : '0'}
                        </td>
                        <td className="py-4 px-6 text-slate-700">
                          {tx.bank_account ? `${tx.bank_account.bank_name} (${tx.bank_account.account_title})` : 'CASH'}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-500">{tx.reference_number || 'N/A'}</td>
                        <td className="py-4 px-6 font-mono text-slate-400">
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        {selectedCarForAudit
                          ? 'No linked split payment transactions recorded for this vehicle.'
                          : 'Select a vehicle using search input to inspect financial transactions.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateBankAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onSuccess={fetchBankAccounts}
      />

      <SplitPaymentModal
        isOpen={isSplitPaymentOpen}
        onClose={() => setIsSplitPaymentOpen(false)}
        onSuccess={fetchBankAccounts}
      />
    </div>
  );
};

export default Banking;

