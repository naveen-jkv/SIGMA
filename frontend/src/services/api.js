/**
 * AQUASENSE - Centralized API Service
 * Interacts with the Node.js Express backend (http://localhost:5000/api)
 * with transparent mock fallback for zero-setup demo mode.
 */

import axios from 'axios';
import {
  INITIAL_MOCK_STATS,
  INITIAL_MOCK_CASES,
  INITIAL_MOCK_ALERTS,
  MOCK_TRENDS,
  MOCK_SYMPTOMS,
  MOCK_LOCATIONS,
  MOCK_RISK_DISTRIBUTION,
  MOCK_ANOMALY_INFO
} from './mockData';

const resolveBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  // 1. Explicit production or custom URL (e.g., https://api.aquasense.app/api)
  if (envUrl && !envUrl.includes('YOUR_COMPUTER_IP')) {
    return envUrl;
  }
  // 2. Browser runtime detection: works on localhost and mobile device on same LAN
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000/api`;
    }
  }
  return 'http://localhost:5000/api';
};

const BASE_URL = resolveBaseUrl();

// Create Axios client
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aquasense_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized for expired/invalid tokens
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.config && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('aquasense_token');
        localStorage.removeItem('aquasense_user');
      }
    }
    return Promise.reject(error);
  }
);

// In-memory mutable state for mock fallback mode
let localCases = [...INITIAL_MOCK_CASES];
let localAlerts = [...INITIAL_MOCK_ALERTS];
let isDemoModeForced = false;

export const setForcedDemoMode = (val) => {
  isDemoModeForced = val;
  localStorage.setItem('aquasense_demo_mode', val ? 'true' : 'false');
};

export const getForcedDemoMode = () => {
  return isDemoModeForced || localStorage.getItem('aquasense_demo_mode') === 'true';
};

// Check if backend is reachable
export const checkHealth = async () => {
  if (getForcedDemoMode()) {
    return { status: 'DEMO_MODE', service: 'AQUASENSE Demo Engine' };
  }
  try {
    const res = await apiClient.get('/health');
    return res.data;
  } catch (err) {
    return { status: 'OFFLINE', error: err.message };
  }
};

// --- Authentication APIs ---

export const login = async (credentials) => {
  const res = await apiClient.post('/auth/login', {
    email: credentials.email,
    password: credentials.password
  });
  if (res.data?.token) {
    localStorage.setItem('aquasense_token', res.data.token);
    localStorage.setItem('aquasense_user', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const register = async (userData) => {
  const res = await apiClient.post('/auth/register', userData);
  if (res.data?.token) {
    localStorage.setItem('aquasense_token', res.data.token);
    localStorage.setItem('aquasense_user', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const getMe = async () => {
  const token = localStorage.getItem('aquasense_token');
  if (!token) return { success: false, user: null };
  const res = await apiClient.get('/auth/me');
  if (res.data?.user) {
    localStorage.setItem('aquasense_user', JSON.stringify(res.data.user));
  }
  return res.data;
};

// --- Case Management APIs ---

export const getCases = async (params = {}) => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get('/cases', { params });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Backend /cases failed, falling back to mock dataset');
    }
  }

  // Filter mock cases if params provided
  let filtered = [...localCases];
  if (params.locality) {
    filtered = filtered.filter(c => c.locality.toLowerCase().includes(params.locality.toLowerCase()));
  }
  if (params.riskLevel) {
    filtered = filtered.filter(c => c.riskLevel.toUpperCase() === params.riskLevel.toUpperCase());
  }
  if (params.severity) {
    filtered = filtered.filter(c => c.severity.toUpperCase() === params.severity.toUpperCase());
  }
  if (params.status) {
    filtered = filtered.filter(c => c.status.toUpperCase() === params.status.toUpperCase());
  }
  return filtered;
};

export const getCaseById = async (id) => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get(`/cases/${id}`);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn(`Backend /cases/${id} failed, checking mock store`);
    }
  }
  return localCases.find(c => c._id === id || c.caseId === id) || null;
};

export const createCase = async (caseData) => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.post('/cases', caseData);
      return res.data;
    } catch (err) {
      console.warn('Backend /cases POST failed, evaluating case locally in Demo Mode');
    }
  }

  // Transparent Client-Side Outbreak Risk Calculation for Demo Mode
  const isSurge = caseData.severity === 'CRITICAL' || (caseData.similarCasesNearby && Number(caseData.similarCasesNearby) >= 8);
  const score = isSurge ? Math.floor(82 + Math.random() * 14) : Math.floor(25 + Math.random() * 45);
  let level = 'LOW';
  if (score >= 76) level = 'CRITICAL';
  else if (score >= 51) level = 'HIGH';
  else if (score >= 31) level = 'MODERATE';

  const newCase = {
    _id: `c_${Date.now()}`,
    caseId: `CASE-${Date.now().toString().slice(-6)}`,
    ...caseData,
    riskScore: score,
    riskLevel: level,
    status: 'REPORTED',
    reportedDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  localCases.unshift(newCase);

  let alertGenerated = false;
  let alert = null;

  if (level === 'CRITICAL' || level === 'HIGH') {
    alertGenerated = true;
    alert = {
      _id: `a_${Date.now()}`,
      alertId: `ALT-${Date.now().toString().slice(-6)}`,
      location: caseData.locality || 'Unknown Sector',
      riskLevel: level,
      caseCount: (Number(caseData.similarCasesNearby) || 1) + 1,
      createdAt: new Date().toISOString(),
      reason: `Outbreak cluster warning: Rapid report of ${caseData.suspectedDisease || 'Acute Gastrointestinal Disease'} with ${level} risk.`,
      recommendedAction: `URGENT: Deploy rapid response team to ${caseData.locality}. Distribute chlorine purification tablets and issue boiling advisory.`,
      status: 'ACTIVE'
    };
    localAlerts.unshift(alert);
  }

  return {
    success: true,
    case: newCase,
    risk: {
      score,
      level,
      reason: isSurge ? "Rapid increase in similar cases detected in dense cluster" : "Case activity evaluated against baseline",
    },
    alertGenerated,
    alert,
    isMock: true
  };
};

export const updateCase = async (id, updateData) => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.put(`/cases/${id}`, updateData);
      return res.data;
    } catch (err) {
      console.warn(`Backend /cases/${id} update failed, applying locally`);
    }
  }
  const idx = localCases.findIndex(c => c._id === id || c.caseId === id);
  if (idx !== -1) {
    localCases[idx] = { ...localCases[idx], ...updateData };
    return { success: true, data: localCases[idx] };
  }
  return { success: false, error: 'Case not found' };
};

export const deleteCase = async (id) => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.delete(`/cases/${id}`);
      return res.data;
    } catch (err) {
      console.warn(`Backend /cases/${id} delete failed, deleting locally`);
    }
  }
  localCases = localCases.filter(c => c._id !== id && c.caseId !== id);
  return { success: true, message: 'Case removed' };
};

// --- Dashboard & Analytics APIs ---

export const getDashboardStats = async () => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    } catch (err) {
      console.warn('Backend /dashboard/stats failed, using mock stats');
    }
  }

  // Derive dynamic stats from local cases & alerts
  const totalCases = localCases.length;
  const activeAlerts = localAlerts.filter(a => a.status === 'ACTIVE').length;
  const highRiskLocalities = new Set(
    localCases.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').map(c => c.locality)
  );

  return {
    totalCases,
    casesToday: Math.min(totalCases, 4),
    highRiskAreas: highRiskLocalities.size || 2,
    activeAlerts
  };
};

export const getTrends = async () => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get('/analytics/trends');
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Backend /analytics/trends failed, using mock trends');
    }
  }
  return MOCK_TRENDS;
};

export const getSymptoms = async () => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get('/analytics/symptoms');
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Backend /analytics/symptoms failed, using mock symptoms');
    }
  }
  return MOCK_SYMPTOMS;
};

export const getLocations = async () => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get('/analytics/locations');
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Backend /analytics/locations failed, using mock locations');
    }
  }
  return MOCK_LOCATIONS;
};

export const getRiskDistribution = async () => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get('/analytics/risk');
      return res.data;
    } catch (err) {
      console.warn('Backend /analytics/risk failed, using mock risk distribution');
    }
  }
  return MOCK_RISK_DISTRIBUTION;
};

export const getAnomalies = async () => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get('/analytics/anomalies');
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('Backend /analytics/anomalies failed, using mock anomaly info');
    }
  }
  return MOCK_ANOMALY_INFO;
};

// --- Map APIs ---

export const getMapCases = async () => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get('/map/cases');
      return res.data;
    } catch (err) {
      console.warn('Backend /map/cases failed, using mock map points');
    }
  }

  // Format local cases for Leaflet map markers
  return localCases.map(c => ({
    caseId: c.caseId,
    latitude: Number(c.latitude),
    longitude: Number(c.longitude),
    locality: c.locality,
    caseCount: 1,
    riskLevel: c.riskLevel,
    symptoms: c.symptoms,
    suspectedDisease: c.suspectedDisease,
    date: c.symptomDate || c.reportedDate,
    severity: c.severity,
    waterSource: c.waterSource
  }));
};

// --- Alert APIs ---

export const getAlerts = async (params = {}) => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.get('/alerts', { params });
      return res.data?.data || res.data;
    } catch (err)
      {
      console.warn('Backend /alerts failed, using mock alerts');
    }
  }

  let list = [...localAlerts];
  if (params.status) {
    list = list.filter(a => a.status.toUpperCase() === params.status.toUpperCase());
  }
  return list;
};

export const createAlert = async (alertData) => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.post('/alerts', alertData);
      return res.data;
    } catch (err) {
      console.warn('Backend /alerts POST failed, creating locally');
    }
  }
  const newAlert = {
    _id: `a_${Date.now()}`,
    alertId: `ALT-${Date.now().toString().slice(-6)}`,
    ...alertData,
    createdAt: new Date().toISOString(),
    status: alertData.status || 'ACTIVE'
  };
  localAlerts.unshift(newAlert);
  return { success: true, data: newAlert };
};

export const updateAlertStatus = async (id, status) => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.put(`/alerts/${id}/status`, { status });
      return res.data;
    } catch (err) {
      console.warn(`Backend /alerts/${id}/status failed, updating locally`);
    }
  }
  const idx = localAlerts.findIndex(a => a._id === id || a.alertId === id);
  if (idx !== -1) {
    localAlerts[idx].status = status.toUpperCase();
    return { success: true, data: localAlerts[idx] };
  }
  return { success: false, error: 'Alert not found' };
};

export const deleteAlert = async (id) => {
  if (!getForcedDemoMode()) {
    try {
      const res = await apiClient.delete(`/alerts/${id}`);
      return res.data;
    } catch (err) {
      console.warn(`Backend /alerts/${id} delete failed, deleting locally`);
    }
  }
  localAlerts = localAlerts.filter(a => a._id !== id && a.alertId !== id);
  return { success: true, message: 'Alert removed' };
};

export default {
  login,
  register,
  getMe,
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  getDashboardStats,
  getTrends,
  getSymptoms,
  getLocations,
  getRiskDistribution,
  getAnomalies,
  getMapCases,
  getAlerts,
  createAlert,
  updateAlertStatus,
  deleteAlert,
  checkHealth,
  setForcedDemoMode,
  getForcedDemoMode
};
