import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Installments from './pages/Installments';
import Expenses from './pages/Expenses';
import Banking from './pages/Banking';
import Investors from './pages/Investors';
import Payroll from './pages/Payroll';
import Leads from './pages/Leads';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import DatabaseBackup from './pages/DatabaseBackup';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes for All Authenticated Users */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/vehicles" element={<Inventory />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/installments" element={<Installments />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/leads" element={<Leads />} />
              </Route>
            </Route>

            {/* Protected Routes for ADMIN and MANAGER */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
              <Route element={<Layout />}>
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/bank" element={<Banking />} />
                <Route path="/investors" element={<Investors />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
              </Route>
            </Route>

            {/* Protected Routes for ADMIN only */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<Layout />}>
                <Route path="/users" element={<UserManagement />} />
                <Route path="/backup" element={<DatabaseBackup />} />
              </Route>
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
