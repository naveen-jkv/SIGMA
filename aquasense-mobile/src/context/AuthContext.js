/**
 * AQUASENSE Mobile - Authentication Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, demoLogin as apiDemoLogin, logout as apiLogout, initializeApiUrl } from '../services/api';

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isDemo: false,
  login: async () => {},
  demoLogin: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initializeApiUrl();
        const storedToken = await AsyncStorage.getItem('@aquasense_token');
        const storedUser = await AsyncStorage.getItem('@aquasense_user');
        const storedDemo = await AsyncStorage.getItem('@aquasense_demo_mode');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsDemo(storedDemo === 'true');
        }
      } catch (e) {
        console.warn('Auth bootstrap failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleLogin = async (email, password) => {
    const data = await apiLogin(email, password);
    setToken(data.token);
    setUser(data.user);
    setIsDemo(false);
    return data;
  };

  const handleDemoLogin = async () => {
    const data = await apiDemoLogin();
    setToken(data.token);
    setUser(data.user);
    setIsDemo(Boolean(data.isDemoFallback || data.user?.isDemo));
    return data;
  };

  const handleLogout = async () => {
    await apiLogout();
    setToken(null);
    setUser(null);
    setIsDemo(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isDemo,
        login: handleLogin,
        demoLogin: handleDemoLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
