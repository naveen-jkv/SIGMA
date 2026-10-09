import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe as apiGetMe } from '../services/api';

const AuthContext = createContext(null);

export const normalizeRole = (role) => {
  if (!role) return 'HEALTH_WORKER';
  const upper = String(role).toUpperCase().trim();
  if (upper === 'HEALTH_AUTHORITY' || upper === 'AUTHORITY' || upper === 'ADMIN') {
    return 'HEALTH_AUTHORITY';
  }
  return 'HEALTH_WORKER';
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('aquasense_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('aquasense_token');
    localStorage.removeItem('aquasense_user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('aquasense_token');
      if (savedToken) {
        try {
          const res = await apiGetMe();
          if (res?.success && res?.user) {
            setUser(res.user);
            localStorage.setItem('aquasense_user', JSON.stringify(res.user));
          } else {
            // Invalid or expired token
            logout();
          }
        } catch (e) {
          // 401 or token validation failed - log out cleanly
          logout();
        }
      } else {
        logout();
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const data = await apiLogin(credentials);
    if (data?.token && data?.user) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const demoLogin = async (roleType = 'HEALTH_AUTHORITY') => {
    const isWorker = roleType === 'HEALTH_WORKER';
    const credentials = {
      email: isWorker ? 'healthworker@demo.com' : 'authority@demo.com',
      password: 'password123'
    };
    return await login(credentials);
  };

  const activeRole = normalizeRole(user?.role);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: activeRole,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        demoLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
