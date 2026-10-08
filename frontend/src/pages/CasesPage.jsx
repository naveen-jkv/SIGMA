import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  MapPin,
  Calendar,
  AlertTriangle,
  Eye,
  CheckCircle2,
  X,
  Droplet
} from 'lucide-react';
import { getCases, updateCase } from '../services/api';
import { useToast } from '../hooks/useToast';

const CasesPage = () => {
  const { showToast } = useToast();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'

  // Selected Case for Modal View
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await getCases();
      if (Array.isArray(data)) {
        setCases(data);
      }
    } catch (err) {
      console.error('Failed to load cases', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      const res = await updateCase(caseId, { status: newStatus });
      if (res?.success) {
        setCases((prev) =>
          prev.map((c) => (c._id === caseId || c.caseId === caseId ? { ...c, status: newStatus } : c))
        );
        if (selectedCase && (selectedCase._id === caseId || selectedCase.caseId === caseId)) {
          setSelectedCase((prev) => ({ ...prev, status: newStatus }));
        }
        showToast(`Case status updated to ${newStatus}`, 'success');
      }
    } catch (e) {
      showToast('Failed to update case status', 'error');
    }
  };

  // Distinct localities for dropdown
  const localities = Array.from(new Set(cases.map((c) => c.locality).filter(Boolean)));

  // Filter & Search logic
  const filteredCases = cases
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (c.caseId && c.caseId.toLowerCase().includes(q)) ||
        (c.locality && c.locality.toLowerCase().includes(q)) ||
        (c.suspectedDisease && c.suspectedDisease.toLowerCase().includes(q));

      const matchesLocation = locationFilter === 'ALL' || c.locality === locationFilter;
      const matchesSeverity = severityFilter === 'ALL' || c.severity?.toUpperCase() === severityFilter;
      const matchesRisk = riskFilter === 'ALL' || c.riskLevel?.toUpperCase() === riskFilter;

      return matchesSearch && matchesLocation && matchesSeverity && matchesRisk;
    })
    .sort((a, b) => {
      const dateA = new Date(a.symptomDate || a.reportedDate || a.createdAt);
      const dateB = new Date(b.symptomDate || b.reportedDate || b.createdAt);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

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

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
      case 'SEVERE':
        return 'text-rose-600 font-bold';
      case 'HIGH':
        return 'text-amber-600 font-semibold';
      case 'MODERATE':
        return 'text-yellow-600 font-medium';
      default:
        return 'text-slate-600 font-medium';
    }
  };

  const exportCSV = () => {
    const headers = ['Case ID,Reported Date,Locality,Disease,Severity,Risk Level,Risk Score,Status\n'];
    const rows = filteredCases.map(
      (c) =>
        `"${c.caseId}","${c.reportedDate || c.createdAt}","${c.locality}","${c.suspectedDisease}","${c.severity}","${c.riskLevel}","${c.riskScore}","${c.status}"`
    );
    const blob = new Blob([...headers, rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquasense_cases_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Exported CSV dataset', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Surveillance Case Registry
          </h2>
          <p className="text-xs text-slate-500">
            Search, filter, and inspect clinical reports across all monitored water basins and districts.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-brand-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, area, or disease..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">All Locations</option>
              {localities.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">Low Severity</option>
              <option value="MODERATE">Moderate Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="CRITICAL">Critical Severity</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk (0-30)</option>
              <option value="MODERATE">Moderate Risk (31-50)</option>
              <option value="HIGH">High Risk (51-75)</option>
              <option value="CRITICAL">Critical Risk (76-100)</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Sort Toggle */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900">{filteredCases.length}</strong> of{' '}
            <strong className="text-slate-900">{cases.length}</strong> total registered cases
          </div>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-brand-600 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Main Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Case ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Locality / Region</th>
                <th className="py-3.5 px-4">Disease & Symptoms</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No cases match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const dateStr = new Date(c.symptomDate || c.reportedDate || c.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <tr
                      key={c.caseId || c._id}
                      onClick={() => setSelectedCase(c)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-brand-600">
                        {c.caseId}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{c.locality}</div>
                        <div className="text-[10px] text-slate-400">{c.district}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{c.suspectedDisease || 'Acute Diarrhea'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {Array.isArray(c.symptoms) ? c.symptoms.join(', ') : c.symptoms}
                        </div>
                      </td>
                      <td className={`py-3 px-4 ${getSeverityBadge(c.severity)}`}>
                        {c.severity}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getRiskBadge(c.riskLevel)}`}>
                          {c.riskLevel} ({c.riskScore || 0})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedCase(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                          title="View Case Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Case Investigation File
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-mono">
                  {selectedCase.caseId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Risk Level Badge Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-medium">Outbreak Risk Score:</span>
                  <div className="text-lg font-extrabold text-slate-900">
                    {selectedCase.riskScore} / 100
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRiskBadge(selectedCase.riskLevel)}`}>
                  {selectedCase.riskLevel} RISK
                </span>
              </div>

              {/* Grid Demographics */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px]">Patient Age & Gender:</span>
                  <div className="font-semibold text-slate-800">{selectedCase.age} yrs • {selectedCase.gender}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Suspected Disease:</span>
                  <div className="font-semibold text-slate-800">{selectedCase.suspectedDisease}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Area / Locality:</span>
                  <div className="font-semibold text-slate-800">{selectedCase.locality}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Coordinates:</span>
                  <div className="font-mono text-slate-800">{selectedCase.latitude}, {selectedCase.longitude}</div>
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Symptoms Recorded:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(selectedCase.symptoms) ? selectedCase.symptoms : [selectedCase.symptoms]).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Environmental Exposure */}
              <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500 text-[11px] font-bold">Environmental Factors:</div>
                <div className="text-slate-700">Drinking Source: <strong>{selectedCase.waterSource || 'Municipal'}</strong></div>
                <div className="text-slate-700">Water Quality Concern: <strong>{selectedCase.waterQualityConcern ? 'Yes (Reported)' : 'No'}</strong></div>
                <div className="text-slate-700">Flooding in Area: <strong>{selectedCase.flooding ? 'Yes (Surface inundation)' : 'No'}</strong></div>
                <div className="text-slate-700">Cluster Size: <strong>{selectedCase.similarCasesNearby || 0} similar cases nearby</strong></div>
              </div>

              {/* Status Update Dropdown */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-slate-600 font-medium">Investigation Status:</span>
                <select
                  value={selectedCase.status}
                  onChange={(e) => handleStatusChange(selectedCase._id || selectedCase.caseId, e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="REPORTED">REPORTED</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 text-right">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesPage;
