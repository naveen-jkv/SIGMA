import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe as apiGetMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('aquasense_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aquasense_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('aquasense_token');
      if (savedToken) {
        try {
          const res = await apiGetMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('aquasense_user', JSON.stringify(res.user));
          }
        } catch (e) {
          console.warn('Session verification fallback to stored user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const data = await apiLogin(credentials);
    if (data?.token) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const demoLogin = async (role = 'AUTHORITY') => {
    const credentials = {
      email: role === 'AUTHORITY' ? 'officer@aquasense.org' : 'worker@aquasense.org',
      password: 'password123',
      role: role
    };
    return await login(credentials);
  };

  const logout = () => {
    localStorage.removeItem('aquasense_token');
    localStorage.removeItem('aquasense_user');
    setToken(null);
    setUser(null);
  };

  const updateUserRole = (newRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('aquasense_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || 'AUTHORITY',
        isAuthenticated: !!token,
        loading,
        login,
        demoLogin,
        logout,
        updateUserRole
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
