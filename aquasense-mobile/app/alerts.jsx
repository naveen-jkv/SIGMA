import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/theme';
import Header from '../src/components/Header';
import AlertCard from '../src/components/AlertCard';
import { getAlerts } from '../src/services/api';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to fetch alerts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const displayedAlerts = filterActiveOnly
    ? alerts.filter((a) => (a.status || 'ACTIVE').toUpperCase() === 'ACTIVE')
    : alerts;

  return (
    <View style={styles.container}>
      <Header title="Outbreak Alerts" subtitle="Urgent Public Health Warnings" showBack />

      {/* Filter / Summary Bar */}
      <View style={styles.topSummary}>
        <View style={styles.statPill}>
          <Ionicons name="notifications" size={16} color="#DC2626" />
          <Text style={styles.statPillText}>
            {alerts.length} Total Warnings Triggered
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, filterActiveOnly && styles.toggleBtnActive]}
          onPress={() => setFilterActiveOnly(!filterActiveOnly)}
        >
          <Text style={[styles.toggleBtnText, filterActiveOnly && styles.toggleBtnTextActive]}>
            {filterActiveOnly ? 'Showing: Active Only' : 'Filter: Active Only'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>Retrieving epidemiological alerts...</Text>
          </View>
        ) : displayedAlerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="shield-checkmark-outline" size={42} color="#10B981" />
            <Text style={styles.emptyTitle}>No Critical Outbreak Alerts</Text>
            <Text style={styles.emptySub}>
              All monitored locality clusters are operating within normal baseline bounds.
            </Text>
          </View>
        ) : (
          displayedAlerts.map((alert, idx) => (
            <AlertCard key={alert._id || alert.alertId || idx} alert={alert} />
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
  topSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toggleBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#DC2626',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingWrap: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
