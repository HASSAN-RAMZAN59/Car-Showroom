import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import AddLeadModal from '../components/workforce/AddLeadModal';
import LogFollowupModal from '../components/workforce/LogFollowupModal';
import MatchingInventoryModal from '../components/workforce/MatchingInventoryModal';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { UserCheck, Plus, Phone, Mail, Car, Search, Filter, MessageSquare } from 'lucide-react';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [selectedLeadForFollowup, setSelectedLeadForFollowup] = useState(null);
  const [selectedLeadForMatch, setSelectedLeadForMatch] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let url = '/leads/';
      if (statusFilter !== 'ALL') {
        url = `/leads/?status=${statusFilter}`;
      }
      const res = await axiosInstance.get(url);
      setLeads(res.data || []);
    } catch (err) {
      console.error('Failed to fetch CRM customer leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await axiosInstance.patch(`/leads/${leadId}/status`, { status: newStatus });
      fetchLeads();
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer CRM & Buyer Leads</h1>
          <p className="text-xs text-slate-400 mt-1">Lead pipeline, follow-up call history, and smart inventory budget matcher</p>
        </div>

        <button
          onClick={() => setIsAddLeadOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-2 overflow-x-auto shadow-sm">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        {['ALL', 'HOT', 'WARM', 'COLD', 'CONVERTED', 'CLOSED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Leads Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="lg" label="Loading customer leads CRM..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Customer Inquiry</th>
                  <th className="py-3.5 px-6">Contact Info</th>
                  <th className="py-3.5 px-6">Budget Range</th>
                  <th className="py-3.5 px-6">Preferred Vehicle</th>
                  <th className="py-3.5 px-6">Pipeline Status</th>
                  <th className="py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {lead.customer_name}
                        {lead.notes && <p className="text-[11px] font-normal text-slate-400">{lead.notes}</p>}
                      </td>

                      <td className="py-4 px-6 text-slate-600 font-mono">
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lead.phone}</span>
                        </p>
                        {lead.email && (
                          <p className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.email}</span>
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-600">
                        PKR {lead.budget_min ? (lead.budget_min / 100000).toFixed(1) + 'L' : '0'} -{' '}
                        {lead.budget_max ? (lead.budget_max / 100000).toFixed(1) + 'L' : 'Any'}
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {lead.preferred_make || 'Any Make'} {lead.preferred_model || ''}
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                        >
                          <option value="HOT">HOT</option>
                          <option value="WARM">WARM</option>
                          <option value="COLD">COLD</option>
                          <option value="CONVERTED">CONVERTED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedLeadForFollowup(lead)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium rounded-lg transition-all flex items-center gap-1 shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                            <span>Follow-up</span>
                          </button>

                          <button
                            onClick={() => setSelectedLeadForMatch(lead)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-medium rounded-lg transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Car className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Match Stock</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No customer leads found matching filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={fetchLeads}
      />

      {selectedLeadForFollowup && (
        <LogFollowupModal
          isOpen={!!selectedLeadForFollowup}
          lead={selectedLeadForFollowup}
          onClose={() => setSelectedLeadForFollowup(null)}
          onSuccess={fetchLeads}
        />
      )}

      {selectedLeadForMatch && (
        <MatchingInventoryModal
          isOpen={!!selectedLeadForMatch}
          lead={selectedLeadForMatch}
          onClose={() => setSelectedLeadForMatch(null)}
        />
      )}
    </div>
  );
};

export default Leads;
