import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap
} from 'react-leaflet';
import {
  MapPin,
  Layers,
  AlertTriangle,
  Flame,
  Droplet,
  Calendar,
  Filter,
  Activity,
  Maximize2
} from 'lucide-react';
import { getMapCases } from '../services/api';

const RISK_COLORS = {
  LOW: '#10b981',      // Emerald Green
  MODERATE: '#f59e0b', // Amber Yellow
  HIGH: '#f97316',     // Orange
  CRITICAL: '#ef4444', // Red
};

// Component to dynamically pan the map when a locality is selected
function MapPanController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

const OutbreakMapPage = () => {
  const [markers, setMarkers] = useState([]);
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [mapCenter, setMapCenter] = useState([12.9612, 77.5854]); // Default to Riverbank Slum Hotspot
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const data = await getMapCases();
        if (Array.isArray(data)) {
          setMarkers(data);
        }
      } catch (err) {
        console.error('Failed to load map telemetry', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, []);

  const filteredMarkers = markers.filter((m) => {
    if (selectedRisk === 'ALL') return true;
    return m.riskLevel?.toUpperCase() === selectedRisk;
  });

  // Calculate high-risk cluster stats
  const criticalCount = markers.filter((m) => m.riskLevel === 'CRITICAL').length;
  const highCount = markers.filter((m) => m.riskLevel === 'HIGH').length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Geographic Outbreak Surveillance Map
          </h2>
          <p className="text-xs text-slate-500">
            Interactive GIS coordinate telemetry. Green (Low), Yellow (Moderate), Orange (High), Red (Critical).
          </p>
        </div>

        {/* Risk Level Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedRisk(lvl)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedRisk === lvl
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 relative">
        {/* Map Header Quick Stats Overlay */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Mapped Cases:</span>
            <div className="text-base font-extrabold text-slate-900">{filteredMarkers.length}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
            <span className="text-rose-600 text-[11px] font-bold">Critical Outbreak Pins:</span>
            <div className="text-base font-extrabold text-rose-700">{criticalCount}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <span className="text-amber-600 text-[11px] font-bold">High-Risk Clusters:</span>
            <div className="text-base font-extrabold text-amber-700">{highCount}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-50 border border-brand-200 text-xs">
            <span className="text-brand-700 text-[11px] font-bold">Epizone Hotspot:</span>
            <button
              onClick={() => setMapCenter([12.9612, 77.5854])}
              className="text-xs font-extrabold text-brand-900 hover:underline block text-left truncate"
            >
              Riverbank Slum ↗
            </button>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-200 relative z-10">
          <MapContainer
            center={mapCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapPanController center={mapCenter} />

            {filteredMarkers.map((marker, idx) => {
              const color = RISK_COLORS[marker.riskLevel] || '#10b981';
              const radius = marker.riskLevel === 'CRITICAL' ? 14 : marker.riskLevel === 'HIGH' ? 11 : 8;

              const dateFormatted = new Date(marker.date || Date.now()).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <CircleMarker
                  key={marker.caseId || idx}
                  center={[marker.latitude, marker.longitude]}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.75,
                    weight: marker.riskLevel === 'CRITICAL' ? 3 : 2
                  }}
                  radius={radius}
                >
                  <Popup>
                    <div className="p-3 text-xs font-sans min-w-[200px]">
                      <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-100">
                        <span className="font-mono font-bold text-slate-500 text-[10px]">
                          {marker.caseId}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white uppercase"
                          style={{ backgroundColor: color }}
                        >
                          {marker.riskLevel}
                        </span>
                      </div>

                      <div className="font-extrabold text-slate-900 text-sm mb-1">
                        {marker.locality}
                      </div>

                      <div className="space-y-1 text-slate-700 text-xs my-2">
                        <div>
                          <strong>Active Cases:</strong> {marker.caseCount || 1}
                        </div>
                        <div>
                          <strong>Suspected Disease:</strong> {marker.suspectedDisease || 'Acute Diarrhea'}
                        </div>
                        <div>
                          <strong>Main Symptoms:</strong>{' '}
                          <span className="text-slate-600">
                            {Array.isArray(marker.symptoms) ? marker.symptoms.join(', ') : marker.symptoms}
                          </span>
                        </div>
                        {marker.waterSource && (
                          <div>
                            <strong>Water Source:</strong> {marker.waterSource}
                          </div>
                        )}
                        <div>
                          <strong>Reported Date:</strong> {dateFormatted}
                        </div>
                      </div>

                      {marker.riskLevel === 'CRITICAL' && (
                        <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Emergency response team dispatched</span>
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-md z-[1000] text-xs space-y-2">
            <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Outbreak Risk Legend
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600" />
                <span className="text-slate-700"><strong>Low Risk</strong> (0–30)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600" />
                <span className="text-slate-700"><strong>Moderate Risk</strong> (31–50)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 border border-orange-600" />
                <span className="text-slate-700"><strong>High Risk</strong> (51–75)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 animate-ping" />
                <span className="text-slate-700"><strong>Critical Outbreak</strong> (76–100)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutbreakMapPage;
