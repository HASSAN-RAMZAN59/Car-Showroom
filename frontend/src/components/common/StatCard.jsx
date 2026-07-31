import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, trendText, color = 'indigo' }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/20',
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700 hover:translate-y-[-2px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-white">{value}</h3>
          {trendText && (
            <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendText}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3.5 rounded-xl ${scheme.bg} ${scheme.text} ${scheme.border} border shadow-inner`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
