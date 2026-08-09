import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  ShoppingBag,
  Receipt,
  CalendarCheck,
  Building2,
  DollarSign,
  Briefcase,
  Users,
  UserCheck,
  BarChart3,
  Database,
  CarFront,
  Handshake,
  User,
  UserCog
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'EMPLOYEE';

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'My Security Profile',
      path: '/profile',
      icon: User,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Team Management',
      path: '/users',
      icon: UserCog,
      roles: ['ADMIN'],
    },
    {
      label: 'Vehicles Inventory',
      path: '/vehicles',
      icon: Car,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Consignment Sales',
      path: '/consignments',
      icon: Handshake,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Vehicle Purchases',
      path: '/purchases',
      icon: ShoppingBag,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      label: 'Sales & Invoicing',
      path: '/sales',
      icon: Receipt,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Installment Plans',
      path: '/installments',
      icon: CalendarCheck,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Multi-Bank Ledger',
      path: '/bank',
      icon: Building2,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      label: 'Daily Expenses',
      path: '/expenses',
      icon: DollarSign,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Investors Engine',
      path: '/investors',
      icon: Briefcase,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      label: 'Employees & Payroll',
      path: '/payroll',
      icon: Users,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      label: 'Customer Leads CRM',
      path: '/leads',
      icon: UserCheck,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Analytics & Audits',
      path: '/analytics',
      icon: BarChart3,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      label: 'Database Backup',
      path: '/backup',
      icon: Database,
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl text-white flex items-center justify-center shadow-sm shrink-0">
          <CarFront className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-wider text-slate-900 leading-none">SK MOTORS</h1>

        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-all duration-150 ${isActive
                  ? 'active bg-blue-100 text-blue-800 font-semibold border-l-4 border-blue-600 shadow-sm'
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-l-4 border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Role Badge */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Access Level:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {role}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
