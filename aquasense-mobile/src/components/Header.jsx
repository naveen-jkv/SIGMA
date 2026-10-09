import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function Header({ title = 'AQUASENSE', subtitle = 'Health Worker Portal', showBack = false }) {
  const router = useRouter();
  const { user, isDemo } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          {showBack && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backSymbol}>‹</Text>
            </TouchableOpacity>
          )}
          <View style={styles.logoMark}>
            <Text style={{ fontSize: 15 }}>💧</Text>
          </View>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.title}>{title}</Text>
              {isDemo && (
                <View style={styles.demoBadge}>
                  <Text style={styles.demoText}>DEMO</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.rightGroup}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/profile')}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.navy,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navyBorder,
    ...SHADOWS.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    paddingRight: 4,
  },
  backSymbol: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F2744',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  demoBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  demoText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileBtn: {
    padding: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
