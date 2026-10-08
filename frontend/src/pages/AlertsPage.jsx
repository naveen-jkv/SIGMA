import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Filter,
  MapPin,
  FileCheck,
  Check,
  X,
  Droplet
} from 'lucide-react';
import { getAlerts, updateAlertStatus, createAlert } from '../services/api';
import { useToast } from '../hooks/useToast';

const AlertsPage = () => {
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Manual Alert Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlertForm, setNewAlertForm] = useState({
    location: '',
    riskLevel: 'HIGH',
    caseCount: 5,
    reason: '',
    recommendedAction: ''
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getAlerts();
      if (Array.isArray(data)) {
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (alertId, newStatus) => {
    try {
      const res = await updateAlertStatus(alertId, newStatus);
      if (res?.success) {
        setAlerts((prev) =>
          prev.map((a) => (a._id === alertId || a.alertId === alertId ? { ...a, status: newStatus } : a))
        );
        showToast(`Alert marked as ${newStatus}`, 'success');
      }
    } catch (err) {
      showToast('Failed to update alert status', 'error');
    }
  };

  const handleCreateAlertSubmit = async (e) => {
    e.preventDefault();
    if (!newAlertForm.location || !newAlertForm.reason) {
      showToast('Please provide an alert location and reason', 'error');
      return;
    }

    try {
      const res = await createAlert(newAlertForm);
      if (res?.success) {
        showToast('Public Health Alert published successfully!', 'success');
        setShowCreateModal(false);
        setNewAlertForm({
          location: '',
          riskLevel: 'HIGH',
          caseCount: 5,
          reason: '',
          recommendedAction: ''
        });
        fetchAlerts();
      }
    } catch (err) {
      showToast('Failed to publish alert', 'error');
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status?.toUpperCase() === statusFilter;
  });

  const getRiskPill = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white font-extrabold';
      case 'HIGH':
        return 'bg-amber-600 text-white font-bold';
      case 'MODERATE':
        return 'bg-yellow-500 text-white font-semibold';
      default:
        return 'bg-emerald-600 text-white font-semibold';
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'ACKNOWLEDGED':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Outbreak Alert Center
          </h2>
          <p className="text-xs text-slate-500">
            Automated notifications dispatched by AI risk scoring models, with clinical intervention tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Issue Manual Alert</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-1.5">
          {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 pr-3 font-medium hidden sm:block">
          Total Alerts: <strong className="text-slate-800">{filteredAlerts.length}</strong>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No alerts match the selected status filter.
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            const dateStr = new Date(alt.createdAt || Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const isCritical = alt.riskLevel === 'CRITICAL';

            return (
              <div
                key={alt.alertId || alt._id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-card transition-all ${
                  isCritical ? 'border-rose-300 ring-1 ring-rose-200/70' : 'border-slate-200/80'
                }`}
              >
                {/* Top Alert Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider ${getRiskPill(alt.riskLevel)}`}>
                      {alt.riskLevel} RISK
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] border ${getStatusPill(alt.status)}`}>
                      STATUS: {alt.status}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {alt.alertId}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Detected {dateStr}</span>
                  </div>
                </div>

                {/* Middle Info Body */}
                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <h3 className="text-base font-extrabold text-slate-900">
                        {alt.location}
                      </h3>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      Cluster Size: <strong>{alt.caseCount} Cases</strong>
                    </div>
                  </div>

                  {/* Epidemiological Reason */}
                  <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 block mb-0.5">Epidemiological Trigger Reason:</strong>
                    {alt.reason}
                  </div>

                  {/* Public Health Action */}
                  <div className="text-xs text-cyan-950 bg-cyan-50/80 p-3.5 rounded-xl border border-cyan-200/80 leading-relaxed">
                    <strong className="text-cyan-900 block mb-0.5">Recommended Public Health Intervention:</strong>
                    {alt.recommendedAction}
                  </div>
                </div>

                {/* Bottom Action Buttons for Health Authorities */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-[11px] text-slate-400">
                    Authority Protocol: Update response stage
                  </span>

                  <div className="flex items-center gap-2">
                    {alt.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(alt._id || alt.alertId, 'ACKNOWLEDGED')}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Mark as Reviewed</span>
                      </button>
                    )}

                    {alt.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateStatus(alt._id || alt.alertId, 'RESOLVED')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark as Resolved</span>
                      </button>
                    )}

                    {alt.status === 'RESOLVED' && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Outbreak Contained & Cleared
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Alert Trigger Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-800">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Issue Surveillance Alert</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlertSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / Locality <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAlertForm.location}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, location: e.target.value })}
                  placeholder="e.g. Sector 4 Industrial Colony"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Risk Classification
                  </label>
                  <select
                    value={newAlertForm.riskLevel}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, riskLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white font-bold"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MODERATE">MODERATE</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Cluster Size
                  </label>
                  <input
                    type="number"
                    value={newAlertForm.caseCount}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, caseCount: Number(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trigger Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={newAlertForm.reason}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, reason: e.target.value })}
                  rows={2}
                  placeholder="e.g. Water sampling revealed high bacterial contamination in municipal secondary line..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recommended Action
                </label>
                <textarea
                  value={newAlertForm.recommendedAction}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, recommendedAction: e.target.value })}
                  rows={2}
                  placeholder="e.g. Issue public boil-water notice, dispatch chlorine tablets, flush pipelines..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
                >
                  Dispatch Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
