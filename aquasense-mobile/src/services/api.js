/**
 * AQUASENSE Mobile - Centralized API Service
 * Connects React Native app to the Node.js Express backend.
 * 
 * Flow:
 * Android Phone ➔ HTTP POST ➔ Express Backend ➔ Persistent DB / Mongo ➔ AI Risk Engine ➔ Auto Alert ➔ Authority Dashboard
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TOKEN: '@aquasense_token',
  USER: '@aquasense_user',
  CUSTOM_API_URL: '@aquasense_api_url',
  CACHED_CASES: '@aquasense_cached_cases',
  CACHED_ALERTS: '@aquasense_cached_alerts',
  CACHED_STATS: '@aquasense_cached_stats',
  PENDING_CASES: '@aquasense_pending_cases',
  DEMO_MODE: '@aquasense_demo_mode',
};

// Default Fallback IP
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.43.161:5000/api';

let activeBaseUrl = DEFAULT_URL;

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: DEFAULT_URL,
  timeout: 10000,
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
    } catch {
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
      error.displayMessage = `Unable to connect to AQUASENSE server at ${activeBaseUrl}. Verify your Wi-Fi IP and ensure backend is running.`;
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
    const res = await apiClient.get('/health', { timeout: 4000 });
    return { online: true, data: res.data };
  } catch (error) {
    return { online: false, error: error.displayMessage || error.message };
  }
};

// ==========================================
// 2. AUTHENTICATION (Real JWT flow)
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
 * 1-Tap Demo Login
 * Connects directly to real backend. If user does not exist, registers on backend.
 */
export const demoLogin = async () => {
  const demoEmail = 'healthworker@demo.com';
  const demoPass = 'demo123';

  // 1. Try logging in on live backend
  try {
    const res = await apiClient.post('/auth/login', { email: demoEmail, password: demoPass }, { timeout: 4500 });
    if (res.data?.token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
      await AsyncStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'false');
      return { ...res.data, isDemoFallback: false };
    }
  } catch (err) {
    // 2. If user not found (401), automatically register on backend for real JWT
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
      } catch {
        // Fallback to seeded account
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
          // Proceed to offline demo warning
        }
      }
    }
  }

  // 3. Backend completely unreachable: Warn and activate offline demo
  const mockUser = {
    id: 'demo_worker_01',
    name: 'Health Worker Priya (Offline Sandbox)',
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
  try {
    const res = await apiClient.get('/auth/me');
    return res.data;
  } catch {
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
// 3. DASHBOARD STATS (Real backend GET)
// ==========================================
export const getDashboardStats = async () => {
  try {
    const res = await apiClient.get('/dashboard/stats');
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_STATS, JSON.stringify(res.data));
    return res.data;
  } catch (error) {
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
  try {
    const res = await apiClient.get('/cases', { params });
    const data = res.data?.data || res.data || [];
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_CASES, JSON.stringify(data));
    
    // Merge pending offline cases if any
    const pending = await getPendingCases();
    return [...pending, ...data];
  } catch (error) {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_CASES);
    const pending = await getPendingCases();
    if (cached) {
      return [...pending, ...JSON.parse(cached)];
    }
    if (pending.length > 0) {
      return pending;
    }
    throw error;
  }
};

/**
 * Real Case Submission: NEVER FAKES SUCCESS
 * Sends actual HTTP POST to /cases on existing backend.
 * Must wait for HTTP 201 before displaying success.
 */
export const createCase = async (caseData) => {
  try {
    const res = await apiClient.post('/cases', caseData);
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.error || 'Server rejected case submission');
    }
    return res.data;
  } catch (error) {
    // NEVER fake success if the server is offline or errors
    throw error;
  }
};

// ==========================================
// 5. ALERTS (Real backend GET)
// ==========================================
export const getAlerts = async () => {
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
// 6. SAFE OFFLINE PENDING QUEUE (No fake success)
// ==========================================
export const savePendingCase = async (caseData) => {
  const pendingId = `PENDING-${Date.now().toString().slice(-4)}`;
  const pendingDoc = {
    ...caseData,
    _id: `pending_${Date.now()}`,
    caseId: pendingId,
    status: 'PENDING_SYNC',
    riskLevel: 'PENDING',
    riskScore: null,
    isPendingSync: true,
    createdAt: new Date().toISOString(),
  };

  const current = await getPendingCases();
  const updated = [pendingDoc, ...current];
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CASES, JSON.stringify(updated));
  return pendingDoc;
};

export const getPendingCases = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CASES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const syncPendingCases = async () => {
  const pending = await getPendingCases();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  const remaining = [];
  let synced = 0;

  for (const item of pending) {
    try {
      const { _id, caseId, isPendingSync, status, ...cleanData } = item;
      await apiClient.post('/cases', cleanData);
      synced++;
    } catch {
      remaining.push(item);
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CASES, JSON.stringify(remaining));
  return { synced, failed: remaining.length };
};
