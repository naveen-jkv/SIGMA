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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/theme';
import Header from '../src/components/Header';
import CaseCard from '../src/components/CaseCard';
import { getCases } from '../src/services/api';

const FILTER_LEVELS = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];

export default function CasesScreen() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Risk Level Filter
      if (activeFilter !== 'ALL' && (c.riskLevel || '').toUpperCase() !== activeFilter) {
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
                  {level}
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
});
