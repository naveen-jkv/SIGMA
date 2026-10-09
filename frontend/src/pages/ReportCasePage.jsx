import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Droplet,
  User,
  Activity,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import { createCase } from '../services/api';
import { useToast } from '../hooks/useToast';

const SYMPTOM_OPTIONS = [
  'Watery Diarrhea',
  'Vomiting',
  'Severe Dehydration',
  'Abdominal Cramps',
  'High Fever',
  'Nausea',
  'Bloody Stool',
  'Lethargy',
  'Muscle Cramps',
  'Headache'
];

const DISEASE_OPTIONS = [
  'Cholera',
  'Acute Gastroenteritis',
  'Typhoid',
  'Dysentery',
  'Hepatitis A',
  'Unspecified Diarrheal Illness'
];

const WATER_SOURCES = [
  'Municipal Tap Water',
  'Flooded Riverbank Tap',
  'Contaminated Open Well',
  'Community Borewell',
  'Broken Municipal Pipeline',
  'Industrial Worker Tanker',
  'River / Lake Surface Water',
  'Packaged / RO Water'
];

const INITIAL_FORM_STATE = {
  age: '',
  gender: 'MALE',
  symptoms: ['Watery Diarrhea', 'Vomiting'],
  suspectedDisease: 'Cholera',
  symptomDate: new Date().toISOString().split('T')[0],
  severity: 'HIGH',
  district: 'Central Metro',
  locality: 'Riverbank Slum Colony',
  latitude: 12.9613,
  longitude: 77.5855,
  waterSource: 'Flooded Riverbank Tap',
  waterQualityConcern: true,
  flooding: true,
  similarCasesNearby: 8,
};

const ReportCasePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSymptomToggle = (symptom) => {
    setFormData((prev) => {
      const exists = prev.symptoms.includes(symptom);
      const updated = exists
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom];
      return { ...prev, symptoms: updated };
    });
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setSubmittedResult(null);
    showToast('Form cleared', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.age || isNaN(formData.age)) {
      showToast('Please enter a valid patient age', 'error');
      return;
    }
    if (formData.symptoms.length === 0) {
      showToast('Please select at least one presenting symptom', 'error');
      return;
    }
    if (!formData.locality) {
      showToast('Please specify the patient locality / ward', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        age: Number(formData.age),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        similarCasesNearby: Number(formData.similarCasesNearby || 0),
        waterQualityConcern: Boolean(formData.waterQualityConcern),
        flooding: Boolean(formData.flooding),
      };

      const result = await createCase(payload);

      if (result?.success) {
        setSubmittedResult(result);
        showToast('Clinical case reported successfully!', 'success');

        if (result.alertGenerated) {
          showToast(`🚨 High Outbreak Risk (${result.risk?.score}/100) — Automatic Public Health Alert Dispatched!`, 'warning', 6000);
        }
      } else {
        showToast(result?.error || 'Failed to submit case report', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.error || 'Network error submitting case', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & Clinical Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Report Clinical Case
          </h2>
          <p className="text-xs text-slate-500">
            Submit field epidemiologic data. Triggers automatic Python AI risk evaluation and localized alert generation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Form</span>
        </button>
      </div>

      {/* Success Modal / Result Banner if Case was submitted */}
      {submittedResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 shadow-sm text-emerald-900">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-emerald-950">
                  Case {submittedResult.case?.caseId} Recorded Successfully
                </h3>
                <p className="text-xs text-emerald-800">
                  Transmitted to surveillance database in {submittedResult.case?.locality}.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSubmittedResult(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>

          {/* AI Risk Score Pill & Alert Status */}
          <div className="mt-4 pt-3 border-t border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-500 font-medium">Outbreak Risk Score:</span>
              <div className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>{submittedResult.risk?.score} / 100</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white ${
                    submittedResult.risk?.level === 'CRITICAL'
                      ? 'bg-rose-600'
                      : submittedResult.risk?.level === 'HIGH'
                      ? 'bg-amber-600'
                      : 'bg-emerald-600'
                  }`}
                >
                  {submittedResult.risk?.level}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-500 font-medium">Automatic Alert Generated:</span>
              <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                {submittedResult.alertGenerated ? (
                  <span className="text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    YES (Public Alert Dispatched)
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    NO (Normal Threshold)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-500 font-medium">AI Clinical Reasoning:</span>
              <div className="text-xs text-slate-700 mt-1 line-clamp-2">
                {submittedResult.risk?.reason || 'Baseline calculation active'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => navigate('/cases')}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
            >
              View Cases List
            </button>
            <button
              onClick={() => setSubmittedResult(null)}
              className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold"
            >
              Submit Another Case
            </button>
          </div>
        </div>
      )}

      {/* Main Report Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-8">
        {/* Section 1: Patient Information */}
        <div>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
            <User className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Patient Demographics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="e.g. 34"
                min="0"
                max="120"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other / Unspecified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Presentation & Symptoms */}
        <div>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
            <Activity className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Clinical Case Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Suspected Disease / Category
              </label>
              <select
                name="suspectedDisease"
                value={formData.suspectedDisease}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white"
              >
                {DISEASE_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Symptom Onset
              </label>
              <input
                type="date"
                name="symptomDate"
                value={formData.symptomDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Severity
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white font-semibold"
              >
                <option value="LOW">LOW (Mild symptoms, stable vitals)</option>
                <option value="MODERATE">MODERATE (Frequent vomiting/cramps)</option>
                <option value="HIGH">HIGH (Severe dehydration, fever)</option>
                <option value="CRITICAL">CRITICAL (Shock / hypovolemic crisis)</option>
              </select>
            </div>
          </div>

          {/* Presenting Symptoms Pill Multi-Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Presenting Symptoms (Select all that apply) <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => {
                const isSelected = formData.symptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {symptom}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Geographic Location */}
        <div>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
            <MapPin className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Geospatial Location
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                District / Administrative Region <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                placeholder="e.g. Central Metro"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Area / Ward / Locality <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleInputChange}
                placeholder="e.g. Riverbank Slum Colony"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="text-emerald-600 font-bold">✓ Automated Geospatial Tagging:</span>
            <span>Coordinates are automatically mapped based on locality & ward</span>
          </div>
        </div>

        {/* Section 4: Environmental Risk Indicators */}
        <div>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
            <Droplet className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              4. Environmental & Exposure Indicators
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Drinking Water Source
              </label>
              <select
                name="waterSource"
                value={formData.waterSource}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white"
              >
                {WATER_SOURCES.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Number of Similar Cases in Neighborhood (Cluster count)
              </label>
              <input
                type="number"
                name="similarCasesNearby"
                value={formData.similarCasesNearby}
                onChange={handleInputChange}
                min="0"
                placeholder="e.g. 8"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Environmental Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="waterQualityConcern"
                checked={formData.waterQualityConcern}
                onChange={handleInputChange}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Water Quality Concern Reported</div>
                <div className="text-[11px] text-slate-500">Odor, turbidity, discoloration, or taste alteration</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="flooding"
                checked={formData.flooding}
                onChange={handleInputChange}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Recent Flooding / Waterlogging</div>
                <div className="text-[11px] text-slate-500">Surface runoff or sewer overflow in the past 7 days</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Case submission automatically feeds into real-time analytics.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-1/2 sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-glow-teal flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit Case Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReportCasePage;
