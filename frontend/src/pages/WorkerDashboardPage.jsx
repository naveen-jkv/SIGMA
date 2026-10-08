import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Droplet,
  Users,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { getDashboardStats, getCases, getAlerts } from '../services/api';

const WorkerDashboardPage = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCases: 0,
    casesToday: 0,
    highRiskCases: 0,
    activeAlerts: 0
  });
  const [recentCases, setRecentCases] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, casesData, alertsData] = await Promise.all([
          getDashboardStats(),
          getCases(),
          getAlerts({ status: 'ACTIVE' })
        ]);

        if (statsData) {
          const highRiskCount = Array.isArray(casesData)
            ? casesData.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length
            : 0;

          setStats({
            totalCases: statsData.totalCases || (Array.isArray(casesData) ? casesData.length : 0),
            casesToday: statsData.casesToday || 4,
            highRiskCases: highRiskCount,
            activeAlerts: statsData.activeAlerts || (Array.isArray(alertsData) ? alertsData.length : 0)
          });
        }

        if (Array.isArray(casesData)) {
          setRecentCases(casesData.slice(0, 6));
        }

        if (Array.isArray(alertsData)) {
          setAlerts(alertsData.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load worker dashboard telemetry', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getRiskBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 font-medium';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Prominent CTA */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-brand-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Field Surveillance Unit Active
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Community Health Worker Portal
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">
            Report patient symptoms immediately to trigger real-time AI cluster analysis and alert public health authorities before outbreaks escalate.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <button
            onClick={() => navigate('/report-case')}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-navy-950 font-bold text-sm shadow-glow-teal flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="w-5 h-5 text-navy-950" />
            <span>Report New Case</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Cases Reported</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-brand-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalCases}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>All monitored sectors</span>
          </div>
        </div>

        {/* Cases Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Cases Today</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.casesToday}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span>Last 24-hour window</span>
          </div>
        </div>

        {/* High Risk Cases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">High-Risk Cases</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
            {stats.highRiskCases}
          </div>
          <div className="text-xs text-rose-700/80 font-medium mt-1">
            Requires urgent hydration & isolation
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Outbreak Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
            {stats.activeAlerts}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Intervention teams notified</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Cases & Current Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submitted Cases (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Field Reports</h3>
              <p className="text-xs text-slate-500">Latest cases recorded across local wards</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Locality</th>
                  <th className="py-3 px-4">Disease / Symptoms</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCases.map((c) => (
                  <tr key={c.caseId || c._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {c.caseId}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.locality}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{c.suspectedDisease || 'Acute Diarrhea'}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {Array.isArray(c.symptoms) ? c.symptoms.join(', ') : c.symptoms}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {c.severity}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getRiskBadge(c.riskLevel)}`}>
                        {c.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Current Alerts & Surveillance Tips (1 Column) */}
        <div className="space-y-6">
          {/* Active Alerts Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Active Public Alerts</span>
              </h3>
              <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                {alerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">
                  No critical alerts active at this moment.
                </div>
              ) : (
                alerts.map((alt) => (
                  <div
                    key={alt.alertId || alt._id}
                    className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-rose-900">{alt.location}</span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white">
                        {alt.riskLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-snug line-clamp-2">
                      {alt.reason}
                    </p>
                    <div className="mt-2 text-[11px] font-semibold text-brand-700 bg-white/80 p-2 rounded-lg border border-slate-200/60">
                      💡 {alt.recommendedAction}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => navigate('/alerts')}
              className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors text-center block"
            >
              Open Alerts Management
            </button>
          </div>

          {/* Clinical Surveillance Quick Guidelines */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-brand-200 rounded-2xl p-5 text-slate-800">
            <h4 className="font-bold text-sm text-brand-900 flex items-center gap-1.5 mb-2">
              <Droplet className="w-4 h-4 text-brand-600" />
              <span>Surveillance Protocol</span>
            </h4>
            <ul className="text-xs space-y-2 text-slate-700">
              <li className="flex items-start gap-1.5">
                <span className="text-brand-600 font-bold">•</span>
                <span>Flag cases with <strong>Watery Diarrhea + Dehydration</strong> as potential Cholera immediately.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand-600 font-bold">•</span>
                <span>Note any tap discoloration or pipe fractures under Environmental Information.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand-600 font-bold">•</span>
                <span>Advise immediate ORS administration while waiting for clinic transport.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboardPage;
