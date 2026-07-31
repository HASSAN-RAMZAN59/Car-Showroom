import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const styles = {
    // Car & Sales statuses
    AVAILABLE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    SOLD: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    RESERVED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    IN_MAINTENANCE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    
    // Payments & Payouts
    PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    OVERDUE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    
    // Investment & CRM Leads
    ACTIVE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    SETTLED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    HOT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    WARM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    COLD: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    CONVERTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const currentStyle = styles[normalized] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide uppercase ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {normalized.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
