import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/theme';
import Header from '../src/components/Header';
import CaseCard from '../src/components/CaseCard';
import { getCases, syncPendingCases } from '../src/services/api';

const FILTER_LEVELS = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'PENDING'];

export default function CasesScreen() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const fetchCases = useCallback(async () => {
    try {
      const data = await getCases();
      setCases(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to fetch cases:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncPendingCases();
      Alert.alert(
        'Surveillance Sync',
        `Successfully synchronized ${res.synced} case(s) with authority backend.${res.failed > 0 ? ` ${res.failed} pending retry.` : ''}`
      );
      fetchCases();
    } catch (err) {
      Alert.alert('Sync Incomplete', err.message || 'Backend unreachable. Verify Wi-Fi network.');
    } finally {
      setSyncing(false);
    }
  };

  const pendingCasesCount = useMemo(() => {
    return cases.filter((c) => c.isPendingSync).length;
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Risk Level / Pending Filter
      if (activeFilter === 'PENDING') {
        if (!c.isPendingSync && (c.riskLevel || '').toUpperCase() !== 'PENDING') {
          return false;
        }
      } else if (activeFilter !== 'ALL' && (c.riskLevel || '').toUpperCase() !== activeFilter) {
        return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const loc = (c.locality || '').toLowerCase();
        const dis = (c.district || '').toLowerCase();
        const disease = (c.suspectedDisease || '').toLowerCase();
        const cid = (c.caseId || '').toLowerCase();
        return loc.includes(q) || dis.includes(q) || disease.includes(q) || cid.includes(q);
      }
      return true;
    });
  }, [cases, activeFilter, searchQuery]);

  return (
    <View style={styles.container}>
      <Header title="My Cases" subtitle="Field Epidemiological Records" showBack />

      <View style={styles.topBar}>
        {/* Search Input */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by locality, ID, or disease..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_LEVELS.map((level) => {
            const isActive = activeFilter === level;
            return (
              <TouchableOpacity
                key={level}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(level)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {level === 'PENDING' ? `PENDING (${pendingCasesCount})` : level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {pendingCasesCount > 0 && (
          <View style={styles.syncCard}>
            <View style={styles.syncCardLeft}>
              <View style={styles.syncIconWrap}>
                <Ionicons name="cloud-offline" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.syncTitle}>
                  {pendingCasesCount} Offline Case{pendingCasesCount > 1 ? 's' : ''} Pending Sync
                </Text>
                <Text style={styles.syncSub}>
                  Recorded without network. Upload to server now.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={handleSync}
              disabled={syncing}
              activeOpacity={0.8}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.syncBtnText}>Sync All</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing {filteredCases.length} of {cases.length} recorded cases
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading case records...</Text>
          </View>
        ) : filteredCases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Matching Cases</Text>
            <Text style={styles.emptySub}>
              No surveillance reports match your current filter or search criteria.
            </Text>
          </View>
        ) : (
          filteredCases.map((item, idx) => (
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
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  countRow: {
    marginBottom: 12,
  },
  countText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
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
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginTop: 20,
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
  },
  syncCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  syncCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  syncIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  syncSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 78,
    alignItems: 'center',
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
