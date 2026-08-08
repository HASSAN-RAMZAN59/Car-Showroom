import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import NewSaleModal from '../components/sales/NewSaleModal';
import TokenBookingModal from '../components/sales/TokenBookingModal';
import PdfViewerModal from '../components/sales/PdfViewerModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { Receipt, Plus, CalendarCheck, FileText, TrendingUp, DollarSign, Calendar } from 'lucide-react';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [activePdfSale, setActivePdfSale] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/sales/');
      setSales(res.data || []);
    } catch (err) {
      console.error('Failed to fetch sales transaction ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaleSuccess = (createdSale) => {
    fetchSales();
    if (createdSale && createdSale.id) {
      setActivePdfSale(createdSale);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales & Invoicing Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">Vehicle sales contracts, net profit accounting, and official PDF Sale Deeds</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium text-xs rounded-lg transition-all flex items-center gap-2 shadow-sm"
          >
            <CalendarCheck className="w-4 h-4 text-amber-600" />
            <span>Advance Token</span>
          </button>

          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Vehicle Sale</span>
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="lg" label="Loading sales transaction ledger..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Sale ID</th>
                  <th className="py-3.5 px-6">Final Selling Price</th>
                  <th className="py-3.5 px-6">Total Cost Basis</th>
                  <th className="py-3.5 px-6">Net Profit Margin</th>
                  <th className="py-3.5 px-6">Payment Type</th>
                  <th className="py-3.5 px-6">Sale Date</th>
                  <th className="py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {sales.length > 0 ? (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 uppercase">
                        #{sale.id.slice(0, 8)}
                      </td>

                      <td className="py-4 px-6 font-extrabold text-emerald-600">
                        PKR {sale.final_sale_price ? sale.final_sale_price.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-500">
                        PKR {sale.total_cost_basis ? sale.total_cost_basis.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6 font-extrabold text-cyan-600">
                        PKR {sale.net_profit ? sale.net_profit.toLocaleString() : '0'}
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge status={sale.payment_type} />
                      </td>

                      <td className="py-4 px-6 text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <button
                          onClick={() => setActivePdfSale(sale)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Sale Deed</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No sales transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSuccess={handleSaleSuccess}
      />

      <TokenBookingModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSuccess={fetchSales}
      />

      {activePdfSale && (
        <PdfViewerModal
          isOpen={!!activePdfSale}
          saleId={activePdfSale.id}
          carNumber={activePdfSale.car?.car_number || 'Vehicle'}
          onClose={() => setActivePdfSale(null)}
        />
      )}
    </div>
  );
};

export default Sales;
