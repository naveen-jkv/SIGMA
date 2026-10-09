import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../src/constants/theme';
import Header from '../src/components/Header';
import CaseCard from '../src/components/CaseCard';
import NetworkBanner from '../src/components/NetworkBanner';
import { useAuth } from '../src/context/AuthContext';
import { getDashboardStats, getCases, checkHealth } from '../src/services/api';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isDemo } = useAuth();

  const [stats, setStats] = useState({
    totalCases: 0,
    casesToday: 0,
    highRiskAreas: 0,
    activeAlerts: 0,
  });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const health = await checkHealth();
      setIsOnline(health.online || isDemo);

      const [statsData, casesData] = await Promise.all([
        getDashboardStats().catch(() => ({ totalCases: 34, casesToday: 4, highRiskAreas: 2, activeAlerts: 2 })),
        getCases().catch(() => []),
      ]);

      setStats({
        totalCases: statsData.totalCases ?? 0,
        casesToday: statsData.casesToday ?? 0,
        highRiskAreas: statsData.highRiskAreas ?? 0,
        activeAlerts: statsData.activeAlerts ?? 0,
      });

      setRecentCases(Array.isArray(casesData) ? casesData.slice(0, 5) : []);
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDemo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <View style={styles.container}>
      <Header title="AQUASENSE" subtitle={`Surveillance • ${user?.name || 'Health Worker'}`} />
      <NetworkBanner isOnline={isOnline} isDemo={isDemo} onRetry={loadData} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Welcome Greeting Banner */}
        <View style={styles.greetingBanner}>
          <View>
            <Text style={styles.greetingTitle}>Active Field Surveillance</Text>
            <Text style={styles.greetingSub}>Real-time early warning telemetry</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.liveDot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
            <Text style={styles.liveText}>{isOnline ? (isDemo ? 'DEMO' : 'LIVE API') : 'OFFLINE'}</Text>
          </View>
        </View>

        {/* 4 Metric KPI Cards */}
        <View style={styles.statsGrid}>
          {/* Total Cases */}
          <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
            <View style={styles.statIconWrap}>
              <Text style={{ fontSize: 16 }}>👥</Text>
            </View>
            <Text style={styles.statNumber}>{stats.totalCases}</Text>
            <Text style={styles.statLabel}>TOTAL CASES</Text>
          </View>

          {/* Cases Today */}
          <View style={[styles.statCard, { borderLeftColor: '#0EA5E9' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Text style={{ fontSize: 16 }}>📅</Text>
            </View>
            <Text style={styles.statNumber}>{stats.casesToday}</Text>
            <Text style={styles.statLabel}>CASES TODAY</Text>
          </View>

          {/* High-Risk Areas */}
          <View style={[styles.statCard, { borderLeftColor: '#F97316' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FFEDD5' }]}>
              <Text style={{ fontSize: 16 }}>🔥</Text>
            </View>
            <Text style={styles.statNumber}>{stats.highRiskAreas}</Text>
            <Text style={styles.statLabel}>HIGH-RISK AREAS</Text>
          </View>

          {/* Active Alerts */}
          <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
            </View>
            <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.activeAlerts}</Text>
            <Text style={styles.statLabel}>ACTIVE ALERTS</Text>
          </View>
        </View>

        {/* Primary Action Button: REPORT NEW CASE */}
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => router.push('/report-case')}
          activeOpacity={0.88}
        >
          <View style={styles.reportBtnGlow}>
            <Text style={{ fontSize: 20, color: '#FFFFFF', marginRight: 6 }}>➕</Text>
            <Text style={styles.reportBtnText}>+ REPORT NEW CASE</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Nav Shortcut Tabs */}
        <View style={styles.quickNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/cases')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18, marginBottom: 2 }}>📋</Text>
            <Text style={styles.navItemText}>My Cases</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/alerts')}
            activeOpacity={0.7}
          >
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 18, marginBottom: 2 }}>🔔</Text>
              {stats.activeAlerts > 0 && <View style={styles.alertDot} />}
            </View>
            <Text style={styles.navItemText}>Alerts ({stats.activeAlerts})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18, marginBottom: 2 }}>👤</Text>
            <Text style={styles.navItemText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Cases Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Case Reports</Text>
          <TouchableOpacity onPress={() => router.push('/cases')} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All ({stats.totalCases}) →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching surveillance reports...</Text>
          </View>
        ) : recentCases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
            <Text style={styles.emptyTitle}>No Cases Recorded Yet</Text>
            <Text style={styles.emptySub}>Tap "+ REPORT NEW CASE" to register your first clinical observation.</Text>
          </View>
        ) : (
          recentCases.map((item, idx) => (
            <CaseCard key={item._id || item.caseId || idx} item={item} />
          ))
        )}
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
  greetingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  greetingSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.navy,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  reportBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  reportBtnGlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: '#0284C7',
  },
  reportBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  quickNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  viewAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  loadingWrap: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
