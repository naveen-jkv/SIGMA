import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { getActiveApiUrl, setCustomApiUrl, checkHealth } from '../src/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login, demoLogin } = useAuth();

  const [email, setEmail] = useState('worker@aquasense.org');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Server IP Configurator
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(getActiveApiUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      setErrorMessage(err.displayMessage || err.message || 'Login failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage('');
    setDemoLoading(true);

    try {
      await demoLogin();
      router.replace('/dashboard');
    } catch (err) {
      setErrorMessage(err.displayMessage || err.message || 'Demo login failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      await setCustomApiUrl(serverUrl);
      const res = await checkHealth();
      if (res.online) {
        setConnectionStatus({ success: true, text: 'Online • Connected to AQUASENSE API' });
      } else {
        setConnectionStatus({ success: false, text: res.error || 'Server offline or unreachable' });
      }
    } catch (e) {
      setConnectionStatus({ success: false, text: e.message });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Branding Header */}
        <View style={styles.topSection}>
          <View style={styles.logoBadge}>
            <Ionicons name="water" size={32} color="#38BDF8" />
          </View>
          <Text style={styles.appTitle}>AQUASENSE</Text>
          <Text style={styles.appSubtitle}>Health Worker Surveillance Portal</Text>
        </View>

        {/* Main Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Sign In</Text>
          <Text style={styles.cardSub}>Authenticate to report field cases and receive warnings</Text>

          {/* Error Message Box */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="worker@aquasense.org"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading && !demoLoading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading && !demoLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action: LOGIN */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading || demoLoading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.loginBtnText}>LOGIN</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR HACKATHON DEMO</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Action: DEMO LOGIN */}
          <TouchableOpacity
            style={[styles.demoBtn, demoLoading && styles.disabledBtn]}
            onPress={handleDemoLogin}
            disabled={loading || demoLoading}
            activeOpacity={0.85}
          >
            {demoLoading ? (
              <ActivityIndicator color={COLORS.navy} size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="flash" size={18} color="#0284C7" />
                <Text style={styles.demoBtnText}>1-TAP DEMO LOGIN</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.demoHint}>
            Uses demo health worker profile with immediate dashboard access.
          </Text>
        </View>

        {/* Server Connection Pill / Expander */}
        <View style={styles.serverSection}>
          <TouchableOpacity
            style={styles.serverPill}
            onPress={() => setShowServerConfig(!showServerConfig)}
            activeOpacity={0.7}
          >
            <Ionicons name="server-outline" size={14} color="#64748B" />
            <Text style={styles.serverPillText} numberOfLines={1}>
              API: {getActiveApiUrl()}
            </Text>
            <Ionicons
              name={showServerConfig ? 'chevron-up' : 'settings-outline'}
              size={14}
              color="#64748B"
            />
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverConfigCard}>
              <Text style={styles.configTitle}>Server IP Configuration</Text>
              <Text style={styles.configDesc}>
                When testing on a physical phone, set this to your computer's LAN IP address on port 5000.
              </Text>
              <TextInput
                style={styles.serverInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.100:5000/api"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />
              <View style={styles.configBtnRow}>
                <TouchableOpacity
                  style={styles.testBtn}
                  onPress={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <ActivityIndicator size="small" color="#0284C7" />
                  ) : (
                    <Text style={styles.testBtnText}>Save & Test Connection</Text>
                  )}
                </TouchableOpacity>
              </View>

              {connectionStatus && (
                <View
                  style={[
                    styles.statusBox,
                    { backgroundColor: connectionStatus.success ? '#ECFDF5' : '#FEF2F2' },
                  ]}
                >
                  <Ionicons
                    name={connectionStatus.success ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={connectionStatus.success ? '#10B981' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: connectionStatus.success ? '#065F46' : '#991B1B' },
                    ]}
                  >
                    {connectionStatus.text}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F2744',
    borderWidth: 2,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    ...SHADOWS.lg,
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  cardSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    height: 46,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SHADOWS.md,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  demoBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtnText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  serverSection: {
    marginTop: 18,
    alignItems: 'center',
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F2744',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  serverPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 240,
  },
  serverConfigCard: {
    width: '100%',
    backgroundColor: '#0F2744',
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  configTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  configDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  serverInput: {
    backgroundColor: '#07162C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    height: 40,
    paddingHorizontal: 10,
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 10,
  },
  configBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  testBtn: {
    backgroundColor: '#0369A1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
