/**
 * AQUASENSE Mobile - Design System & Theme
 * Professional Healthcare Grade Colors and Styles
 */

export const COLORS = {
  // Brand Deep Navy & Medical Blue
  navy: '#0A192F',
  navyLight: '#112240',
  navyBorder: '#1E3A5F',
  primary: '#0284C7', // Sky 600
  primaryDark: '#0369A1',
  primaryLight: '#E0F2FE',
  cyan: '#06B6D4',
  teal: '#0D9488',

  // Neutrals
  background: '#F8FAFC', // Slate 50
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  inputBg: '#F1F5F9',
  inputBorder: '#CBD5E1',

  // Typography
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textWhite: '#FFFFFF',

  // Risk Classification System
  risk: {
    LOW: {
      label: 'LOW RISK',
      color: '#10B981', // Emerald 500
      bg: '#ECFDF5',
      border: '#A7F3D0',
      text: '#065F46',
    },
    MODERATE: {
      label: 'MODERATE RISK',
      color: '#F59E0B', // Amber 500
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
    },
    HIGH: {
      label: 'HIGH RISK',
      color: '#F97316', // Orange 500
      bg: '#FFF7ED',
      border: '#FED7AA',
      text: '#9A3412',
    },
    CRITICAL: {
      label: 'CRITICAL RISK',
      color: '#EF4444', // Red 500
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#991B1B',
    },
    PENDING: {
      label: 'PENDING SYNC',
      color: '#F59E0B', // Amber 500
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#B45309',
    },
  },

  // Status Indicators
  online: '#10B981',
  offline: '#EF4444',
  warning: '#F59E0B',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
};
