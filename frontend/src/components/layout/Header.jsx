import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Menu, UserCog, ShieldCheck, ChevronDown } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

const Header = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = user?.role === 'ADMIN';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    if (isAdmin) {
      navigate('/users');
    } else {
      navigate('/profile');
    }
    setDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight leading-tight">Executive Dashboard</h2>
          <p className="text-[11px] sm:text-xs text-slate-400">SK Motors Management System</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Role-based Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Profile Widget - Clickable Admin Security Button */}
        <div className="relative pl-2 sm:pl-3 border-l border-slate-200" ref={menuRef}>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleProfileClick}
              title={isAdmin ? "Open Security & User Management" : "Open Security Profile"}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-blue-50/80 transition-all border border-transparent hover:border-blue-200 group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 group-hover:bg-blue-700 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shrink-0 transition-colors">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-white" />}
              </div>

              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                  {user?.full_name || 'Showroom User'}
                </p>
                <p className="text-[10px] font-medium text-slate-400">{user?.email || 'user@carshowroom.com'}</p>
              </div>
            </button>

            {/* Toggle Dropdown Arrow */}
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title="User Account Menu"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* User Account Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.full_name || 'Showroom User'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {user?.role || 'USER'}
                </span>
              </div>

              {isAdmin && (
                <Link
                  to="/users"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                >
                  <UserCog className="w-4 h-4 text-blue-600" />
                  <span>Security & User Management</span>
                </Link>
              )}

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>My Security Profile</span>
              </Link>

              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
