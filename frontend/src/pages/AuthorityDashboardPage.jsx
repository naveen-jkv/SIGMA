import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Droplets,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  getDashboardStats,
  getTrends,
  getSymptoms,
  getLocations,
  getRiskDistribution,
  getAlerts,
  getMapCases
} from '../services/api';

const RISK_COLORS = {
  LOW: '#10b981',      // Emerald Green
  MODERATE: '#f59e0b', // Amber
  HIGH: '#f97316',     // Orange
  CRITICAL: '#ef4444', // Red
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

const AuthorityDashboardPage = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCases: 34,
    casesToday: 4,
    highRiskAreas: 2,
    activeAlerts: 3,
  });

  const [trends, setTrends] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [locations, setLocations] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const [
          statsRes,
          trendsRes,
          symptomsRes,
          locationsRes,
          riskRes,
          alertsRes,
          mapRes
        ] = await Promise.all([
          getDashboardStats(),
          getTrends(),
          getSymptoms(),
          getLocations(),
          getRiskDistribution(),
          getAlerts({ status: 'ACTIVE' }),
          getMapCases()
        ]);

        if (statsRes) setStats(statsRes);
        if (Array.isArray(trendsRes)) setTrends(trendsRes);
        if (Array.isArray(symptomsRes)) setSymptoms(symptomsRes.slice(0, 5));
        if (Array.isArray(locationsRes)) setLocations(locationsRes.slice(0, 5));

        if (riskRes) {
          const formattedRisk = [
            { name: 'Low Risk', value: riskRes.low || 12, color: RISK_COLORS.LOW },
            { name: 'Moderate Risk', value: riskRes.moderate || 7, color: RISK_COLORS.MODERATE },
            { name: 'High Risk', value: riskRes.high || 6, color: RISK_COLORS.HIGH },
            { name: 'Critical Risk', value: riskRes.critical || 9, color: RISK_COLORS.CRITICAL },
          ];
          setRiskData(formattedRisk);
        }

        if (Array.isArray(alertsRes)) setAlerts(alertsRes.slice(0, 4));
        if (Array.isArray(mapRes)) setMapMarkers(mapRes);
      } catch (err) {
        console.error('Authority Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, []);

  return (
    <div className="space-y-6">
      {/* Dashboard Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-brand-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>AI Epidemiological Decision Support Active</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            National Outbreak Surveillance Control
          </h2>
          <p className="text-xs text-slate-500">
            Real-time multi-factor disease tracking, automated anomaly triggers, and geographic clusters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/map')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <span>Full Map View</span>
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Deep Analytics</span>
          </button>
        </div>
      </div>

      {/* --- TOP 4 SHOWCASE KPI STAT CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. TOTAL CASES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Total Cases
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalCases}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-emerald-700">+18%</span>
            <span>vs previous 14d baseline</span>
          </div>
        </div>

        {/* 2. CASES TODAY */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Cases Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.casesToday}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Reports arriving from field workers</span>
          </div>
        </div>

        {/* 3. HIGH RISK AREAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              High-Risk Areas
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
            {stats.highRiskAreas}
          </div>
          <div className="text-xs text-rose-700/90 font-semibold mt-1">
            Riverbank Slum & Old Market
          </div>
        </div>

        {/* 4. ACTIVE ALERTS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Active Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
            {stats.activeAlerts}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Intervention units deployed</span>
          </div>
        </div>
      </div>

      {/* --- SECTION 1: CASE TREND CHART & RISK LEVEL DISTRIBUTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases Over Time (Area Chart - 2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Epidemiological Curve (Cases Over Time)</h3>
              <p className="text-xs text-slate-500">Daily reported cases showing recent outbreak acceleration</p>
            </div>
            <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
              Spike Detected (+260%)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="caseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Cases"
                  stroke="#0891b2"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#caseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk-Level Distribution (Donut Chart - 1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Risk-Level Distribution</h3>
            <p className="text-xs text-slate-500">Case stratification by clinical severity & cluster density</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {riskData.map((r) => (
              <div key={r.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-slate-600 font-medium text-[11px] truncate">{r.name}:</span>
                <span className="font-bold text-slate-900 text-[11px]">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- SECTION 2: INTERACTIVE OUTBREAK MAP & HOTSPOT CLUSTERS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outbreak Mini Map (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Geospatial Outbreak Telemetry (Interactive Map)</span>
              </h3>
              <p className="text-xs text-slate-500">Pinpoints cluster coordinates colored by risk severity</p>
            </div>
            <button
              onClick={() => navigate('/map')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Expand Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Leaflet Map Preview Container */}
          <div className="h-72 w-full rounded-xl overflow-hidden border border-slate-200 relative">
            <MapContainer
              center={[12.9612, 77.5854]}
              zoom={12}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {mapMarkers.map((marker, idx) => {
                const color = RISK_COLORS[marker.riskLevel] || '#10b981';
                const radius = marker.riskLevel === 'CRITICAL' ? 12 : marker.riskLevel === 'HIGH' ? 10 : 7;

                return (
                  <CircleMarker
                    key={marker.caseId || idx}
                    center={[marker.latitude, marker.longitude]}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.7,
                      weight: 2
                    }}
                    radius={radius}
                  >
                    <Popup>
                      <div className="p-3 text-xs font-sans">
                        <div className="font-bold text-slate-900 text-sm mb-1">{marker.locality}</div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                            style={{ backgroundColor: color }}
                          >
                            {marker.riskLevel} Risk
                          </span>
                          <span className="text-slate-500 text-[11px]">{marker.caseId}</span>
                        </div>
                        <div className="text-slate-700 mb-1">
                          <strong>Disease:</strong> {marker.suspectedDisease || 'Acute Diarrhea'}
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          <strong>Symptoms:</strong> {Array.isArray(marker.symptoms) ? marker.symptoms.join(', ') : marker.symptoms}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Map Legend Floating Tag */}
            <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] shadow-sm z-[1000] flex items-center gap-3">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Low</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"/> Mod</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"/> High</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"/> Critical</div>
            </div>
          </div>
        </div>

        {/* Cases by Area & Top Hotspots (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Cases by Locality</h3>
            <p className="text-xs text-slate-500">Cluster volume across monitored wards</p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locations} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis
                  dataKey="locality"
                  type="category"
                  tick={{ fontSize: 10, fill: '#334155' }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#0891b2" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
            <div className="font-bold">Hotspot Epizone:</div>
            <span className="font-mono font-bold text-rose-700">Riverbank Slum (16 cases)</span>
          </div>
        </div>
      </div>

      {/* --- SECTION 3: SYMPTOM DISTRIBUTION & ACTIVE ALERTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Symptom (Bar Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Predominant Clinical Symptoms</h3>
              <p className="text-xs text-slate-500">Distribution of patient presentation indicators</p>
            </div>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symptoms} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="symptom" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#0e7490" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Active Outbreak Alerts Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Active Automated Alerts</span>
              </h3>
              <p className="text-xs text-slate-500">Auto-generated when AI risk score exceeds HIGH/CRITICAL</p>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Manage ({alerts.length})
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-56">
            {alerts.map((a) => (
              <div
                key={a.alertId || a._id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded text-white ${
                        a.riskLevel === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-600'
                      }`}
                    >
                      {a.riskLevel}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{a.location}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{a.alertId}</span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {a.reason}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Recommended response protocol active</span>
            <button
              onClick={() => navigate('/alerts')}
              className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Take Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboardPage;
