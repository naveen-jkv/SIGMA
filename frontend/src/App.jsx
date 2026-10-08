import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import AuthorityDashboardPage from './pages/AuthorityDashboardPage';
import WorkerDashboardPage from './pages/WorkerDashboardPage';
import ReportCasePage from './pages/ReportCasePage';
import CasesPage from './pages/CasesPage';
import OutbreakMapPage from './pages/OutbreakMapPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading AQUASENSE Surveillance Engine...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root index redirect according to user role
const RootRedirect = () => {
  const { role } = useAuth();
  if (role === 'HEALTH_WORKER') {
    return <Navigate to="/worker-dashboard" replace />;
  }
  return <Navigate to="/authority-dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Surveillance Portal Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RootRedirect />} />
              <Route path="authority-dashboard" element={<AuthorityDashboardPage />} />
              <Route path="worker-dashboard" element={<WorkerDashboardPage />} />
              <Route path="report-case" element={<ReportCasePage />} />
              <Route path="cases" element={<CasesPage />} />
              <Route path="map" element={<OutbreakMapPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
