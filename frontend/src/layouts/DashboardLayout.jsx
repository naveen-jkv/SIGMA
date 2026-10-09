import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  PlusCircle,
  FileText,
  MapPin,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Shield,
  User,
  Menu,
  X,
  Droplets
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { checkHealth, getAlerts } from '../services/api';

const DashboardLayout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [backendStatus, setBackendStatus] = useState('CHECKING'); // 'CONNECTED', 'OFFLINE', 'DEMO'

  const isWorker = role === 'HEALTH_WORKER';

  useEffect(() => {
    let isMounted = true;
    const fetchStatusAndAlerts = async () => {
      try {
        const health = await checkHealth();
        if (!isMounted) return;
        if (health?.status === 'OK') {
          setBackendStatus('CONNECTED');
        } else if (health?.status === 'DEMO_MODE') {
          setBackendStatus('DEMO');
        } else {
          setBackendStatus('OFFLINE');
        }

        const alerts = await getAlerts({ status: 'ACTIVE' });
        if (isMounted && Array.isArray(alerts)) {
          setActiveAlertsCount(alerts.length);
        }
      } catch (err) {
        if (isMounted) setBackendStatus('OFFLINE');
      }
    };

    fetchStatusAndAlerts();
    const interval = setInterval(fetchStatusAndAlerts, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-Specific Navigation Menus
  const navItems = isWorker
    ? [
        {
          name: 'Worker Dashboard',
          path: '/worker/dashboard',
          icon: Activity
        },
        {
          name: 'Report Case',
          path: '/report-case',
          icon: PlusCircle
        },
        {
          name: 'My Reports',
          path: '/cases',
          icon: FileText
        },
        {
          name: 'Notifications',
          path: '/alerts',
          icon: Bell,
          badge: activeAlertsCount
        },
        {
          name: 'Settings',
          path: '/settings',
          icon: Settings
        }
      ]
    : [
        {
          name: 'Authority Dashboard',
          path: '/authority/dashboard',
          icon: Activity
        },
        {
          name: 'Outbreak Map',
          path: '/map',
          icon: MapPin
        },
        {
          name: 'Analytics',
          path: '/analytics',
          icon: BarChart3
        },
        {
          name: 'Alerts',
          path: '/alerts',
          icon: Bell,
          badge: activeAlertsCount
        },
        {
          name: 'Case Reports',
          path: '/cases',
          icon: FileText
        },
        {
          name: 'Settings',
          path: '/settings',
          icon: Settings
        }
      ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/worker/dashboard') || path.includes('/worker-dashboard')) return 'Health Worker Dashboard';
    if (path.includes('/authority/dashboard') || path.includes('/authority-dashboard')) return 'Surveillance Authority Dashboard';
    if (path.includes('/report-case')) return 'Clinical Case Intake';
    if (path.includes('/cases')) return isWorker ? 'My Case Reports' : 'Surveillance Case Registry';
    if (path.includes('/map')) return 'Epidemiological Outbreak Map';
    if (path.includes('/analytics')) return 'Predictive Outbreak Analytics';
    if (path.includes('/alerts')) return isWorker ? 'Health Advisories & Alerts' : 'Alert Management Command';
    if (path.includes('/settings')) return 'System Settings';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* --- Sidebar Desktop --- */}
      <aside className="hidden md:flex md:w-64 flex-col bg-navy-900 border-r border-slate-800 text-slate-300 z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-navy-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-glow-teal text-white">
              <Droplets className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-white font-bold text-lg tracking-tight flex items-center gap-1.5">
                AQUASENSE
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                Early Warning System
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {isWorker ? 'Health Worker Portal' : 'Authority Surveillance'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path.includes('worker') && location.pathname.includes('worker')) ||
              (item.path.includes('authority') && location.pathname.includes('authority'));

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive: navActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    navActive
                      ? 'bg-brand-500 text-white shadow-glow-teal font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold transition-transform ${
                      isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Live System Status Indicator in Sidebar */}
        <div className="p-3 mx-3 mb-2 rounded-xl bg-slate-850/80 border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-[11px]">System Status</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'CONNECTED'
                    ? 'bg-emerald-400 animate-ping'
                    : backendStatus === 'DEMO'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span
                className={`font-semibold text-[11px] ${
                  backendStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {backendStatus === 'CONNECTED' ? 'Backend Live' : 'Demo Active'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Surveillance telemetry and decision support active.
          </p>
        </div>

        {/* Authenticated User Card */}
        <div className="p-4 border-t border-slate-800 bg-navy-950/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-cyan-400 shrink-0 font-bold">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-semibold text-white truncate">
                  {user?.name || (isWorker ? 'Health Worker' : 'Surveillance Officer')}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      isWorker
                        ? 'bg-teal-950 text-teal-300 border border-teal-800/50'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
                    }`}
                  >
                    {isWorker ? 'Health Worker' : 'Health Authority'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- Mobile Sidebar Overlay --- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-72 bg-navy-900 border-r border-slate-800 text-slate-300 z-10 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Droplets className="w-6 h-6 text-cyan-400" />
                <span className="text-white font-bold text-lg">AQUASENSE</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-2 flex-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'bg-brand-500 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{user?.name || 'User'}</div>
                <div className="text-xs text-cyan-400">
                  {isWorker ? 'Health Worker' : 'Health Authority'}
                </div>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                National Epidemiological Surveillance
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Role Status Indicator in Header (NO switcher buttons) */}
          <div className="flex items-center space-x-3">
            {/* Clear Role View Indicator badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold select-none shadow-sm bg-slate-50 border-slate-200 text-slate-700">
              {isWorker ? (
                <>
                  <User className="w-3.5 h-3.5 text-brand-600" />
                  <span className="font-bold text-brand-700">Health Worker View</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="font-bold text-slate-800">Authority View</span>
                </>
              )}
            </div>

            {/* Quick Action: Report Case (Available to Health Workers) */}
            {isWorker && (
              <button
                onClick={() => navigate('/report-case')}
                className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm transition-all shadow-glow-teal"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report Case</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/70">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
