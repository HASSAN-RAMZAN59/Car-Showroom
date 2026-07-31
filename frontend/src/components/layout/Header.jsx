import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Executive Dashboard</h2>
        <p className="text-xs text-slate-400">Used Car Showroom Enterprise System</p>
      </div>

      <div className="flex items-center gap-5">
        {/* Quick Notifications Mock Icon */}
        <button className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5 ring-2 ring-slate-900"></span>
        </button>

        {/* User Profile Widget */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-white leading-tight">{user?.full_name || 'Showroom User'}</p>
            <p className="text-[10px] font-medium text-slate-400">{user?.email || 'user@carshowroom.com'}</p>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Log Out Session"
            className="p-2 ml-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
