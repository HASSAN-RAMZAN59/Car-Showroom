import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors">
      <div>
        <h2 className="text-base font-semibold text-slate-800 tracking-tight">Executive Dashboard</h2>
        <p className="text-xs text-slate-400">Used Car Showroom Enterprise System</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Role-based Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Profile Widget */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-white" />}
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.full_name || 'Showroom User'}</p>
            <p className="text-[10px] font-medium text-slate-400">{user?.email || 'user@carshowroom.com'}</p>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Log Out Session"
            className="p-2 ml-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
