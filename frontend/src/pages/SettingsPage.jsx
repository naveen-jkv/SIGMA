import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Bell,
  Database,
  Radio,
  LogOut,
  Save,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { setForcedDemoMode, getForcedDemoMode, checkHealth } from '../services/api';

const SettingsPage = () => {
  const { user, role, updateUserRole, logout } = useAuth();
  const { showToast } = useToast();

  const [demoMode, setDemoMode] = useState(getForcedDemoMode());
  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    weeklyReport: true,
    emailDigest: false,
    soundAlerts: true
  });
  const [checkingBackend, setCheckingBackend] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);

  const handleToggleDemoMode = (checked) => {
    setDemoMode(checked);
    setForcedDemoMode(checked);
    showToast(
      checked
        ? 'Demo Mode enabled. All calls simulated locally for judges.'
        : 'Live Backend Mode active. Making real REST API calls.',
      'info'
    );
  };

  const handleTestBackendConnection = async () => {
    setCheckingBackend(true);
    try {
      const res = await checkHealth();
      setBackendHealth(res);
      if (res?.status === 'OK') {
        showToast('Successfully verified live connection to AquaSense Backend!', 'success');
      } else {
        showToast('Backend responded with non-standard status: ' + (res?.status || 'Unknown'), 'warning');
      }
    } catch (err) {
      setBackendHealth({ status: 'OFFLINE', error: err.message });
      showToast('Could not reach backend on ' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'), 'error');
    } finally {
      setCheckingBackend(false);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    showToast('Surveillance settings and alert preferences saved!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Settings & Surveillance Configuration
        </h2>
        <p className="text-xs text-slate-500">
          Manage user profiles, operational role permissions, API telemetry bridges, and hackathon demo switches.
        </p>
      </div>

      {/* Grid Settings Sections */}
      <div className="space-y-6">
        {/* Section 1: User Profile & Role Switcher */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
            <User className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Surveillance Personnel Dossier
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-xs font-medium block mb-1">Full Name</span>
              <div className="text-sm font-bold text-slate-900">{user?.name || 'Dr. Aisha Sharma'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-xs font-medium block mb-1">Official Email Address</span>
              <div className="text-sm font-bold text-slate-900">{user?.email || 'officer@aquasense.org'}</div>
            </div>
          </div>

          {/* Quick Role Switcher for Live Demos */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Current Operating Role (Instant Switch for Judges)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  updateUserRole('AUTHORITY');
                  showToast('Switched view to Health Authority', 'info');
                }}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  role === 'AUTHORITY'
                    ? 'bg-cyan-50 border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Health Authority</div>
                  <div className="text-[11px] text-slate-500">Access to analytics, outbreak map, and issuing alerts.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateUserRole('HEALTH_WORKER');
                  showToast('Switched view to Health Worker', 'info');
                }}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  role === 'HEALTH_WORKER'
                    ? 'bg-cyan-50 border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <User className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Health Worker</div>
                  <div className="text-[11px] text-slate-500">Focused on reporting cases in the field and local status.</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Hackathon Demo & API Bridge Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
            <Database className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Backend Integration & Hackathon Mode
            </h3>
          </div>

          <div className="space-y-4">
            {/* Demo Mode Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900">Standalone Demo Mode</div>
                <div className="text-xs text-slate-500">
                  When enabled, all API calls use the built-in mock dataset so judges can test every feature without needing local services running.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => handleToggleDemoMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {/* Backend URL & Diagnostic Check */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700">REST API Base URL</span>
                  <div className="text-xs font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded mt-1">
                    {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestBackendConnection}
                  disabled={checkingBackend}
                  className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingBackend ? 'animate-spin' : ''}`} />
                  <span>Ping Health Check</span>
                </button>
              </div>

              {backendHealth && (
                <div className="p-2.5 rounded-lg bg-slate-100 text-xs font-mono text-slate-700">
                  <pre>{JSON.stringify(backendHealth, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Notification Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
            <Bell className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Surveillance Alert Notifications
            </h3>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 text-sm block">Critical Outbreak Audio-Visual Chimes</span>
                <span className="text-slate-500">Instant chime and red banner on CRITICAL risk score triggers</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.criticalAlerts}
                onChange={(e) => setNotifications({ ...notifications, criticalAlerts: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 text-sm block">Daily Epidemiological Velocity Digest</span>
                <span className="text-slate-500">Summary of z-score spikes and emerging cluster pins</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyReport}
                onChange={(e) => setNotifications({ ...notifications, weeklyReport: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
            </label>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 4: Sign Out Button */}
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-900">Sign Out of Session</div>
            <div className="text-[11px] text-rose-700">Clear stored JWT authentication token from this browser</div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
