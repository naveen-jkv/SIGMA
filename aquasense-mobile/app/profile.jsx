import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../src/constants/theme';
import Header from '../src/components/Header';
import { useAuth } from '../src/context/AuthContext';
import { getActiveApiUrl, setCustomApiUrl, checkHealth } from '../src/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isDemo } = useAuth();

  const [serverUrl, setServerUrl] = useState(getActiveApiUrl());
  const [testing, setTesting] = useState(false);
  const [healthResult, setHealthResult] = useState(null);

  const handleTestBackend = async () => {
    setTesting(true);
    setHealthResult(null);
    try {
      await setCustomApiUrl(serverUrl);
      const res = await checkHealth();
      setHealthResult(res);
    } catch (e) {
      setHealthResult({ online: false, error: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of AQUASENSE?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" subtitle="Surveillance Officer Credentials" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Health Worker'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'worker@aquasense.org'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#0369A1" />
            <Text style={styles.roleText}>{user?.role || 'HEALTH_WORKER'}</Text>
          </View>

          {isDemo && (
            <View style={styles.demoWarningPill}>
              <Text style={styles.demoWarningText}>Operating in Local Demo Mode</Text>
            </View>
          )}
        </View>

        {/* Server & Connectivity Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Backend Connection Settings</Text>
          </View>

          <Text style={styles.inputLabel}>Current REST API Base URL</Text>
          <TextInput
            style={styles.textInput}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://YOUR_COMPUTER_IP:5000/api"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestBackend}
            disabled={testing}
            activeOpacity={0.8}
          >
            {testing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="pulse" size={16} color="#FFFFFF" />
                <Text style={styles.testBtnText}>Test Server Connection</Text>
              </View>
            )}
          </TouchableOpacity>

          {healthResult && (
            <View
              style={[
                styles.resultBox,
                { backgroundColor: healthResult.online ? '#ECFDF5' : '#FEF2F2' },
              ]}
            >
              <Ionicons
                name={healthResult.online ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={healthResult.online ? '#10B981' : '#EF4444'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.resultTitle,
                    { color: healthResult.online ? '#065F46' : '#991B1B' },
                  ]}
                >
                  {healthResult.online ? 'Server Online & Reachable' : 'Connection Failed'}
                </Text>
                <Text
                  style={[
                    styles.resultDesc,
                    { color: healthResult.online ? '#047857' : '#B91C1C' },
                  ]}
                >
                  {healthResult.online
                    ? `Service: ${healthResult.data?.service || 'AQUASENSE API'} • Database: ${healthResult.data?.database || 'Connected'}`
                    : healthResult.error || 'Check that your computer and phone are on the same Wi-Fi network.'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* System Info */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Application Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoVal}>AQUASENSE Mobile v1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Engine</Text>
            <Text style={styles.infoVal}>React Native • Expo SDK 57</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role Scope</Text>
            <Text style={styles.infoVal}>Field Case Reporting & Local Triage</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutBtnText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#38BDF8',
    marginBottom: 12,
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  roleText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoWarningPill: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  demoWarningText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  testBtn: {
    backgroundColor: COLORS.primary,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  resultDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    color: COLORS.navy,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
