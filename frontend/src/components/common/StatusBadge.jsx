import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const styles = {
    // Consignment statuses
    CONSIGNED_AVAILABLE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    CONSIGNED_SOLD: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    CONSIGNED_RETURNED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    RETURNED_TO_OWNER: 'bg-slate-500/10 text-slate-400 border-slate-500/20',

    // Active & Success statuses
    AVAILABLE: 'badge-active bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PAID: 'badge-active bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    COMPLETED: 'badge-active bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ACTIVE: 'badge-active bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    SETTLED: 'badge-active bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CONVERTED: 'badge-active bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    
    // Sold / Neutral / Draft / Closed
    SOLD: 'badge-neutral bg-slate-500/10 text-slate-400 border-slate-500/20',
    RESERVED: 'badge-neutral bg-amber-500/10 text-amber-400 border-amber-500/20',
    COLD: 'badge-neutral bg-slate-500/10 text-slate-400 border-slate-500/20',
    CLOSED: 'badge-neutral bg-slate-500/10 text-slate-400 border-slate-500/20',

    // Warnings & Maintenance
    IN_MAINTENANCE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    WARM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',

    // Danger & Overdue
    OVERDUE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    HOT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const currentStyle = styles[normalized] || 'badge-neutral bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border tracking-wide uppercase ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80"></span>
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
