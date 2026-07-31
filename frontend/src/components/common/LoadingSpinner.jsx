import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', label = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-4">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-indigo-500 animate-spin`} />
      {label && <p className="text-xs font-medium text-slate-400 tracking-wide">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
