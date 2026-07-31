import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Printer, Download, FileText, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const PdfViewerModal = ({ isOpen, saleId, carNumber, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && saleId) {
      fetchPdfStream();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, saleId]);

  const fetchPdfStream = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/sales/${saleId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Failed to stream PDF Sale Deed:', err);
      setError('Failed to generate or load PDF Sale Deed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Sale_Deed_${carNumber || 'Vehicle'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const iframe = document.getElementById('pdf-deed-frame');
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden relative flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Official Vehicle Sale Deed</h3>
              <p className="text-xs text-slate-400">Streamed ReportLab PDF Agreement ({carNumber || 'Vehicle'})</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pdfUrl && (
              <>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Print Deed</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </>
            )}

            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame / Viewer Body */}
        <div className="flex-1 bg-slate-950 p-4 relative overflow-hidden flex items-center justify-center">
          {loading ? (
            <LoadingSpinner size="lg" label="Generating & streaming official PDF Sale Deed..." />
          ) : error ? (
            <div className="p-6 text-center max-w-md bg-slate-900 border border-slate-800 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="text-xs text-rose-300 font-medium mb-4">{error}</p>
              <button
                onClick={fetchPdfStream}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl"
              >
                Retry PDF Load
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe
              id="pdf-deed-frame"
              src={pdfUrl}
              title="Official Sale Deed PDF"
              className="w-full h-full rounded-2xl border border-slate-800 bg-white"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PdfViewerModal;
