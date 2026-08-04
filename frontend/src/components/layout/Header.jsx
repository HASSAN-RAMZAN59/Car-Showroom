import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, User as UserIcon, Bell, Sun, Moon } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-slate-900/80 dark:bg-slate-900/80 light:bg-white/90 backdrop-blur-md border-b border-slate-800 dark:border-slate-800 light:border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors">
      <div>
        <h2 className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">Executive Dashboard</h2>
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">Used Car Showroom Enterprise System</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl bg-slate-800 dark:bg-slate-800 light:bg-slate-100 text-amber-400 dark:text-amber-400 light:text-indigo-600 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 transition-all border border-slate-700/50 dark:border-slate-700/50 light:border-slate-300 flex items-center gap-1.5 text-xs font-semibold px-3"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-amber-300">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-indigo-900">Dark Mode</span>
            </>
          )}
        </button>

        {/* Quick Notifications Mock Icon */}
        <button className="p-2 rounded-xl bg-slate-800 dark:bg-slate-800 light:bg-slate-100 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 transition-all relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5 ring-2 ring-slate-900 dark:ring-slate-900 light:ring-white"></span>
        </button>

        {/* User Profile Widget */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-white dark:text-white light:text-slate-900 leading-tight">{user?.full_name || 'Showroom User'}</p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 light:text-slate-500">{user?.email || 'user@carshowroom.com'}</p>
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
