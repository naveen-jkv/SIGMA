/**
 * AQUASENSE Mobile - Centralized API Service
 * Connects React Native app to the Node.js Express backend.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  TOKEN: '@aquasense_token',
  USER: '@aquasense_user',
  CUSTOM_API_URL: '@aquasense_api_url',
  CACHED_CASES: '@aquasense_cached_cases',
  CACHED_ALERTS: '@aquasense_cached_alerts',
  CACHED_STATS: '@aquasense_cached_stats',
  DEMO_MODE: '@aquasense_demo_mode',
};

// Default Fallback IP
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.43.161:5000/api';

let activeBaseUrl = DEFAULT_URL;

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: DEFAULT_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Load saved custom URL on startup
export const initializeApiUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_API_URL);
    if (saved) {
      activeBaseUrl = saved.trim().replace(/\/$/, '');
      apiClient.defaults.baseURL = activeBaseUrl;
    } else {
      activeBaseUrl = DEFAULT_URL;
      apiClient.defaults.baseURL = activeBaseUrl;
    }
  } catch {
    activeBaseUrl = DEFAULT_URL;
  }
  return activeBaseUrl;
};

export const getActiveApiUrl = () => activeBaseUrl;

export const setCustomApiUrl = async (newUrl) => {
  if (!newUrl) return;
  const clean = newUrl.trim().replace(/\/$/, '');
  const finalUrl = clean.endsWith('/api') ? clean : `${clean}/api`;
  activeBaseUrl = finalUrl;
  apiClient.defaults.baseURL = finalUrl;
  await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_API_URL, finalUrl);
  return finalUrl;
};

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore token read error
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Friendly error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetwork = !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
    if (isNetwork) {
      error.isNetworkError = true;
      error.displayMessage = `Unable to connect to AQUASENSE server at ${activeBaseUrl}. Verify network connection & IP.`;
    } else if (error.response?.data?.error) {
      error.displayMessage = error.response.data.error;
    } else {
      error.displayMessage = error.message || 'An unexpected error occurred';
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 1. HEALTH & CONNECTIVITY
// ==========================================
export const checkHealth = async () => {
  try {
    const res = await apiClient.get('/health', { timeout: 3500 });
    return { online: true, data: res.data };
  } catch (error) {
    return { online: false, error: error.displayMessage || error.message };
  }
};

// ==========================================
// 2. AUTHENTICATION
// ==========================================
export const login = async (email, password) => {
  try {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data?.token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
      await AsyncStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'false');
    }
    return res.data;
  } catch (error) {
    throw error;
  }
};

/**
 * 1-Tap Demo Login for Hackathon Judges
 * First tries to log in with healthworker@demo.com on live backend.
 * If user does not exist, registers them on the backend so they get a real JWT!
 * If backend is unreachable, falls back to clearly labeled DEMO MODE.
 */
export const demoLogin = async () => {
  const demoEmail = 'healthworker@demo.com';
  const demoPass = 'demo123';

  try {
    // 1. Try logging in
    const res = await apiClient.post('/auth/login', { email: demoEmail, password: demoPass }, { timeout: 4000 });
    if (res.data?.token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
      await AsyncStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'false');
      return { ...res.data, isDemoFallback: false };
    }
  } catch (err) {
    // 2. If user not found (401), automatically register on backend
    if (err.response && err.response.status === 401) {
      try {
        const regRes = await apiClient.post('/auth/register', {
          name: 'Health Worker Priya',
          email: demoEmail,
          password: demoPass,
          role: 'HEALTH_WORKER',
        });
        if (regRes.data?.token) {
          await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, regRes.data.token);
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(regRes.data.user));
          await AsyncStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'false');
          return { ...regRes.data, isDemoFallback: false };
        }
      } catch (regErr) {
        // If register fails, try seeded account worker@aquasense.org
        try {
          const fallbackSeed = await apiClient.post('/auth/login', {
            email: 'worker@aquasense.org',
            password: 'password123',
          });
          if (fallbackSeed.data?.token) {
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, fallbackSeed.data.token);
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fallbackSeed.data.user));
            await AsyncStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'false');
            return { ...fallbackSeed.data, isDemoFallback: false };
          }
        } catch {
          // Proceed to offline demo
        }
      }
    }
  }

  // 3. Backend Offline: Activate Labeled DEMO MODE
  const mockUser = {
    id: 'demo_worker_01',
    name: 'Health Worker Priya (Demo)',
    email: demoEmail,
    role: 'HEALTH_WORKER',
    isDemo: true,
  };
  const mockToken = 'mock_jwt_demo_token_2026';
  await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
  await AsyncStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');

  return {
    success: true,
    token: mockToken,
    user: mockUser,
    isDemoFallback: true,
  };
};

export const getMe = async () => {
  const isDemo = (await AsyncStorage.getItem(STORAGE_KEYS.DEMO_MODE)) === 'true';
  if (isDemo) {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return { success: true, user: raw ? JSON.parse(raw) : null };
  }

  try {
    const res = await apiClient.get('/auth/me');
    return res.data;
  } catch (error) {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return { success: true, user: raw ? JSON.parse(raw) : null };
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  await AsyncStorage.removeItem(STORAGE_KEYS.DEMO_MODE);
};

// ==========================================
// 3. DASHBOARD STATS
// ==========================================
export const getDashboardStats = async () => {
  const isDemo = (await AsyncStorage.getItem(STORAGE_KEYS.DEMO_MODE)) === 'true';
  if (isDemo) {
    return {
      totalCases: 34,
      casesToday: 5,
      highRiskAreas: 2,
      activeAlerts: 2,
      isDemoData: true,
    };
  }

  try {
    const res = await apiClient.get('/dashboard/stats');
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_STATS, JSON.stringify(res.data));
    return res.data;
  } catch (error) {
    // Return cached if available
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_STATS);
    if (cached) {
      return { ...JSON.parse(cached), isCached: true };
    }
    throw error;
  }
};

// ==========================================
// 4. CASES MANAGEMENT
// ==========================================
export const getCases = async (params = {}) => {
  const isDemo = (await AsyncStorage.getItem(STORAGE_KEYS.DEMO_MODE)) === 'true';
  if (isDemo) {
    return getMockCases();
  }

  try {
    const res = await apiClient.get('/cases', { params });
    const data = res.data?.data || res.data || [];
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_CASES, JSON.stringify(data));
    return data;
  } catch (error) {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_CASES);
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
};

export const createCase = async (caseData) => {
  const isDemo = (await AsyncStorage.getItem(STORAGE_KEYS.DEMO_MODE)) === 'true';
  if (isDemo) {
    // Demo mode local evaluation
    const score = caseData.severity === 'CRITICAL' ? 88 : 42;
    const level = score >= 76 ? 'CRITICAL' : score >= 51 ? 'HIGH' : 'MODERATE';
    const newCase = {
      _id: `demo_${Date.now()}`,
      caseId: `CASE-${Date.now().toString().slice(-6)}`,
      ...caseData,
      riskScore: score,
      riskLevel: level,
      createdAt: new Date().toISOString(),
    };
    return {
      success: true,
      case: newCase,
      risk: {
        score,
        level,
        reason: 'Outbreak risk evaluated locally in Demo Mode',
        breakdown: {
          volume_score: 16.0,
          growth_score: 25.0,
          clustering_score: 21.0,
          severity_score: 18.0,
          environmental_score: 8.0,
        },
      },
      alertGenerated: level === 'CRITICAL',
      alert: level === 'CRITICAL' ? {
        alertId: `ALT-${Date.now().toString().slice(-6)}`,
        location: caseData.locality,
        riskLevel: 'CRITICAL',
        caseCount: 9,
        recommendedAction: `Deploy rapid intervention team to ${caseData.locality}. Distribute chlorine tablets.`,
      } : null,
      isDemoData: true,
      disclaimer: 'AQUASENSE is an early warning / decision support system for public health surveillance and does not provide medical diagnoses.',
    };
  }

  try {
    // REAL BACKEND CALL: DO NOT FAKE
    const res = await apiClient.post('/cases', caseData);
    return res.data;
  } catch (error) {
    throw error;
  }
};

// ==========================================
// 5. ALERTS
// ==========================================
export const getAlerts = async () => {
  const isDemo = (await AsyncStorage.getItem(STORAGE_KEYS.DEMO_MODE)) === 'true';
  if (isDemo) {
    return getMockAlerts();
  }

  try {
    const res = await apiClient.get('/alerts');
    const data = res.data?.data || res.data || [];
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ALERTS, JSON.stringify(data));
    return data;
  } catch (error) {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_ALERTS);
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
};

// ==========================================
// 6. MOCK DATA FOR OFFLINE DEMO MODE
// ==========================================
export const getMockCases = () => [
  {
    _id: 'mock_1',
    caseId: 'CASE-HOT-001',
    locality: 'Riverbank Slum Colony',
    district: 'Central Metro',
    symptoms: ['Watery Diarrhea', 'Severe Dehydration', 'Vomiting'],
    suspectedDisease: 'Cholera',
    severity: 'CRITICAL',
    riskScore: 93,
    riskLevel: 'CRITICAL',
    symptomDate: new Date().toISOString(),
    status: 'REPORTED',
  },
  {
    _id: 'mock_2',
    caseId: 'CASE-HOT-002',
    locality: 'Old Market Basti',
    district: 'Central Metro',
    symptoms: ['Watery Diarrhea', 'Abdominal Cramps'],
    suspectedDisease: 'Acute Gastroenteritis',
    severity: 'HIGH',
    riskScore: 72,
    riskLevel: 'HIGH',
    symptomDate: new Date(Date.now() - 86400000).toISOString(),
    status: 'INVESTIGATING',
  },
  {
    _id: 'mock_3',
    caseId: 'CASE-NORM-003',
    locality: 'Greenfield Heights',
    district: 'North Zone',
    symptoms: ['Mild Fever', 'Headache'],
    suspectedDisease: 'Typhoid (Suspected)',
    severity: 'LOW',
    riskScore: 22,
    riskLevel: 'LOW',
    symptomDate: new Date(Date.now() - 172800000).toISOString(),
    status: 'CONFIRMED',
  },
];

export const getMockAlerts = () => [
  {
    _id: 'alt_1',
    alertId: 'ALT-2026-HOT-01',
    location: 'Riverbank Slum Colony',
    riskLevel: 'CRITICAL',
    riskScore: 93,
    caseCount: 16,
    reason: 'Epidemic surge detected: Rapid increase in suspected Cholera cases with high clinical severity and flooded tap contamination.',
    recommendedAction: 'URGENT: Deploy rapid response medical team. Issue boil-water notice and distribute emergency chlorine purification tablets.',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'alt_2',
    alertId: 'ALT-2026-WARN-02',
    location: 'Old Market Basti',
    riskLevel: 'HIGH',
    riskScore: 72,
    caseCount: 9,
    reason: 'Elevated case cluster detected near open drain pipeline.',
    recommendedAction: 'Inspect municipal distribution line for cross-contamination. Collect bacteriological water samples.',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const checkIsDemoMode = async () => {
  return (await AsyncStorage.getItem(STORAGE_KEYS.DEMO_MODE)) === 'true';
};
