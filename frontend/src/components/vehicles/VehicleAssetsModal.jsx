import React, { useState } from 'react';
import { X, Camera, FileText, CreditCard, ExternalLink, Image as ImageIcon, Download } from 'lucide-react';

const VehicleAssetsModal = ({ isOpen, onClose, car }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('photos');

  if (!isOpen || !car) return null;

  const photos = car.car_photos_urls || [];
  const docs = car.registration_docs_urls || [];
  const seller = car.seller || {};
  const cnicFront = seller.cnic_front_url;
  const cnicBack = seller.cnic_back_url;

  const totalAssetsCount = photos.length + docs.length + (cnicFront ? 1 : 0) + (cnicBack ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  {car.make} {car.model} ({car.year})
                </h2>
                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 font-mono text-xs font-semibold rounded-md">
                  {car.car_number}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vehicle Photos, Registration Documents & Seller Verification Scans ({totalAssetsCount} files)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-xs rounded-t-lg border-b-2 transition-all ${
              activeTab === 'photos'
                ? 'border-blue-600 text-blue-600 bg-white font-semibold shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Car Photos ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-xs rounded-t-lg border-b-2 transition-all ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-600 bg-white font-semibold shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Registration Documents ({docs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('seller')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-xs rounded-t-lg border-b-2 transition-all ${
              activeTab === 'seller'
                ? 'border-blue-600 text-blue-600 bg-white font-semibold shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Seller CNIC Scans ({(cnicFront ? 1 : 0) + (cnicBack ? 1 : 0)})</span>
          </button>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* TAB 1: VEHICLE PHOTOS */}
          {activeTab === 'photos' && (
            <div>
              {photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer aspect-video flex items-center justify-center bg-slate-100"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img
                        src={url}
                        alt={`Car Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/600x400?text=Image+Load+Error';
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="px-3 py-1 bg-white/90 text-slate-900 font-medium text-xs rounded-lg shadow flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Full</span>
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/70 text-white text-[10px] rounded font-mono">
                        Photo #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">No Vehicle Photos Uploaded</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No pictures were attached when logging this vehicle purchase.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REGISTRATION DOCUMENTS */}
          {activeTab === 'docs' && (
            <div>
              {docs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {docs.map((url, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800">Registration Document #{idx + 1}</h4>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                            {url.split('/').pop()}
                          </p>
                        </div>
                      </div>

                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium text-xs rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Doc</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">No Registration Documents Uploaded</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No registration papers or file scans were uploaded for this vehicle.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SELLER CNIC SCANS */}
          {activeTab === 'seller' && (
            <div className="space-y-4">
              {seller.full_name ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Seller: {seller.full_name}</h4>
                    <p className="text-xs text-slate-500">CNIC: {seller.cnic} | Phone: {seller.phone}</p>
                  </div>
                </div>
              ) : null}

              {(cnicFront || cnicBack) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cnicFront && (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
                      <span className="text-xs font-semibold text-slate-700 block">CNIC Front Scan</span>
                      <div
                        className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group relative"
                        onClick={() => setSelectedImage(cnicFront)}
                      >
                        <img src={cnicFront} alt="CNIC Front" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                          Zoom CNIC
                        </div>
                      </div>
                    </div>
                  )}

                  {cnicBack && (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
                      <span className="text-xs font-semibold text-slate-700 block">CNIC Back Scan</span>
                      <div
                        className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group relative"
                        onClick={() => setSelectedImage(cnicBack)}
                      >
                        <img src={cnicBack} alt="CNIC Back" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                          Zoom CNIC
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">No CNIC Scans Uploaded</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No CNIC front or back images were attached for the seller.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            Close Viewer
          </button>
        </div>
      </div>

      {/* FULL IMAGE LIGHTBOX OVERLAY */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
              <span>Close Fullscreen</span>
            </button>
            <img
              src={selectedImage}
              alt="Enlarged Asset"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <a
              href={selectedImage}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Open Original Cloudinary URL</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleAssetsModal;
