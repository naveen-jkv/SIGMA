import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (token && user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isLoading, token, user]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Decorative Background Circles */}
      <View style={styles.ambientCircleOne} />
      <View style={styles.ambientCircleTwo} />

      {/* Center Brand Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.pulseRing}>
          <View style={styles.innerGlow}>
            <Ionicons name="water" size={64} color="#38BDF8" />
            <View style={styles.aiBadge}>
              <Ionicons name="pulse" size={16} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </View>

      {/* App Branding */}
      <View style={styles.textContainer}>
        <Text style={styles.brandTitle}>AQUASENSE</Text>
        <Text style={styles.brandTagline}>
          Detect Early. Alert Faster. Protect Communities.
        </Text>
        <View style={styles.pillBox}>
          <Text style={styles.pillText}>AI-Powered Outbreak Early Warning System</Text>
        </View>
      </View>

      {/* Footer Loading & Version */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#38BDF8" />
        <Text style={styles.footerText}>Field Surveillance Portal v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ambientCircleOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#0F2744',
    top: -60,
    right: -80,
    opacity: 0.6,
  },
  ambientCircleTwo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#0369A1',
    bottom: -60,
    left: -70,
    opacity: 0.2,
  },
  iconContainer: {
    marginBottom: 28,
  },
  pulseRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#0E2A4A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  innerGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#082F49',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0284C7',
    position: 'relative',
  },
  aiBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.navy,
  },
  textContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  pillBox: {
    backgroundColor: '#0F2744',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  pillText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
});
