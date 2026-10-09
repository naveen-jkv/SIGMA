import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, normalizeRole } from './hooks/useAuth';
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

// Reusable App Layout
export const AppLayout = DashboardLayout;

// Protected Route Guard: guarantees valid authentication before rendering
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white text-sm">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-slate-300 font-medium">Verifying AQUASENSE Surveillance Credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role Guard: strictly restricts access according to verified user role
export const RoleGuard = ({ allowedRoles, children }) => {
  const { role, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white text-sm">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-slate-300 font-medium">Authorizing Permissions...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = normalizeRole(role);
  if (!allowedRoles.includes(currentRole)) {
    // Redirect to the user's authorized home dashboard
    if (currentRole === 'HEALTH_WORKER') {
      return <Navigate to="/worker/dashboard" replace />;
    }
    return <Navigate to="/authority/dashboard" replace />;
  }

  return children;
};

// Root index redirect according to verified user role
const RootRedirect = () => {
  const { role } = useAuth();
  const currentRole = normalizeRole(role);
  if (currentRole === 'HEALTH_WORKER') {
    return <Navigate to="/worker/dashboard" replace />;
  }
  return <Navigate to="/authority/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Surveillance Portal Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RootRedirect />} />

              {/* Health Worker Dedicated Routes */}
              <Route
                path="worker/dashboard"
                element={
                  <RoleGuard allowedRoles={['HEALTH_WORKER']}>
                    <WorkerDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="worker-dashboard"
                element={<Navigate to="/worker/dashboard" replace />}
              />
              <Route
                path="report-case"
                element={
                  <RoleGuard allowedRoles={['HEALTH_WORKER']}>
                    <ReportCasePage />
                  </RoleGuard>
                }
              />

              {/* Health Authority Dedicated Routes */}
              <Route
                path="authority/dashboard"
                element={
                  <RoleGuard allowedRoles={['HEALTH_AUTHORITY']}>
                    <AuthorityDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="authority-dashboard"
                element={<Navigate to="/authority/dashboard" replace />}
              />
              <Route
                path="map"
                element={
                  <RoleGuard allowedRoles={['HEALTH_AUTHORITY']}>
                    <OutbreakMapPage />
                  </RoleGuard>
                }
              />
              <Route
                path="analytics"
                element={
                  <RoleGuard allowedRoles={['HEALTH_AUTHORITY']}>
                    <AnalyticsPage />
                  </RoleGuard>
                }
              />

              {/* Role-Aware Shared Routes */}
              <Route path="cases" element={<CasesPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="notifications" element={<Navigate to="/alerts" replace />} />
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
