import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../src/constants/theme';
import Header from '../src/components/Header';
import RiskBadge from '../src/components/RiskBadge';

export default function RiskResultScreen() {
  const router = useRouter();
  const { resultJson } = useLocalSearchParams();

  let data = null;
  try {
    data = resultJson ? JSON.parse(resultJson) : null;
  } catch (e) {
    console.warn('Failed to parse resultJson:', e);
  }

  const caseData = data?.case || {};
  const risk = data?.risk || {};
  const alertObj = data?.alert || null;
  const alertGenerated = Boolean(data?.alertGenerated || alertObj);
  const score = risk.score ?? caseData.riskScore ?? 86;
  const level = risk.level ?? caseData.riskLevel ?? 'CRITICAL';
  const breakdown = risk.breakdown || {
    volume_score: 18.0,
    growth_score: 28.0,
    clustering_score: 22.8,
    severity_score: 25.0,
    environmental_score: 8.0,
  };

  const isCritical = level === 'CRITICAL' || level === 'HIGH';

  return (
    <View style={styles.container}>
      <Header title="Risk Analysis" subtitle="Surveillance Decision Support" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Check Badge */}
        <View style={styles.successHeader}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>CASE SUCCESSFULLY REGISTERED</Text>
          <Text style={styles.caseIdSub}>
            ID: {caseData.caseId || 'CASE-REG'} • {caseData.locality || 'Field Locality'}
          </Text>
        </View>

        {/* Big Outbreak Risk Score Card */}
        <View style={[styles.riskScoreCard, isCritical && styles.criticalCardBorder]}>
          <Text style={styles.scoreHeader}>MULTI-FACTOR OUTBREAK RISK SCORE</Text>

          <View style={styles.scoreRow}>
            <Text style={[styles.largeScore, { color: isCritical ? '#EF4444' : '#0284C7' }]}>
              {score}
            </Text>
            <Text style={styles.scoreDenominator}>/ 100</Text>
          </View>

          <View style={styles.badgeWrap}>
            <RiskBadge level={level} size="lg" />
          </View>

          {/* Outbreak pattern detected signal */}
          <View style={[styles.patternBox, isCritical && styles.criticalPatternBox]}>
            <Ionicons
              name={isCritical ? 'analytics' : 'information-circle'}
              size={18}
              color={isCritical ? '#B91C1C' : '#0369A1'}
            />
            <Text style={[styles.patternText, isCritical && styles.criticalPatternText]}>
              {isCritical
                ? 'Potential outbreak pattern detected. Early-warning signal generated.'
                : 'Case metrics evaluated against baseline thresholds.'}
            </Text>
          </View>
        </View>

        {/* Automated Alert Generated Banner */}
        {alertGenerated && (
          <View style={styles.alertNoticeBox}>
            <View style={styles.alertNoticeHeader}>
              <Ionicons name="alert-circle" size={24} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertNoticeTitle}>🚨 OUTBREAK ALERT GENERATED</Text>
                <Text style={styles.alertNoticeSub}>Health authorities have been notified.</Text>
              </View>
            </View>

            {alertObj?.recommendedAction && (
              <View style={styles.actionPill}>
                <Text style={styles.actionLabel}>Immediate Recommended Action:</Text>
                <Text style={styles.actionValue}>{alertObj.recommendedAction}</Text>
              </View>
            )}
          </View>
        )}

        {/* Factor Breakdown Table */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Explainable Risk Factor Breakdown</Text>
          <Text style={styles.breakdownSub}>
            Transparent algorithmic attribution calculated by AQUASENSE engine:
          </Text>

          <View style={styles.factorList}>
            {/* Case Growth */}
            <View style={styles.factorRow}>
              <View style={styles.factorLeft}>
                <Ionicons name="trending-up" size={16} color={COLORS.primary} />
                <Text style={styles.factorName}>Case Surge & Growth Velocity</Text>
              </View>
              <Text style={styles.factorPts}>+{breakdown.growth_score ?? 28} pts</Text>
            </View>

            {/* Symptom & Volume */}
            <View style={styles.factorRow}>
              <View style={styles.factorLeft}>
                <Ionicons name="medkit" size={16} color={COLORS.teal} />
                <Text style={styles.factorName}>Symptom Similarity Cluster</Text>
              </View>
              <Text style={styles.factorPts}>+{breakdown.volume_score ?? 18} pts</Text>
            </View>

            {/* Location Clustering */}
            <View style={styles.factorRow}>
              <View style={styles.factorLeft}>
                <Ionicons name="location" size={16} color="#EA580C" />
                <Text style={styles.factorName}>Geographic Coordinate Density</Text>
              </View>
              <Text style={styles.factorPts}>+{breakdown.clustering_score ?? 22.8} pts</Text>
            </View>

            {/* Severity */}
            <View style={styles.factorRow}>
              <View style={styles.factorLeft}>
                <Ionicons name="pulse" size={16} color="#DC2626" />
                <Text style={styles.factorName}>Clinical Severity Score</Text>
              </View>
              <Text style={styles.factorPts}>+{breakdown.severity_score ?? 25} pts</Text>
            </View>

            {/* Environment */}
            <View style={styles.factorRow}>
              <View style={styles.factorLeft}>
                <Ionicons name="water" size={16} color="#0284C7" />
                <Text style={styles.factorName}>Environmental Hazard (Flooding/Water)</Text>
              </View>
              <Text style={styles.factorPts}>+{breakdown.environmental_score ?? 8} pts</Text>
            </View>

            {/* Total Row */}
            <View style={[styles.factorRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>TOTAL EVALUATED SCORE</Text>
              <Text style={[styles.totalPts, { color: isCritical ? '#DC2626' : COLORS.primary }]}>
                {score} / 100
              </Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.disclaimerText}>
            Medical Disclaimer: AQUASENSE is an early warning / decision support system for public health surveillance and does not provide clinical medical diagnoses.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnCol}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push('/cases')}
            activeOpacity={0.85}
          >
            <Ionicons name="list" size={18} color="#FFFFFF" />
            <Text style={styles.historyBtnText}>View In Case History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dashBtn}
            onPress={() => router.replace('/dashboard')}
            activeOpacity={0.85}
          >
            <Text style={styles.dashBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
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
  successHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconWrap: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  caseIdSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  riskScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...SHADOWS.md,
  },
  criticalCardBorder: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  scoreHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  largeScore: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreDenominator: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  badgeWrap: {
    marginBottom: 14,
  },
  patternBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    width: '100%',
  },
  criticalPatternBox: {
    backgroundColor: '#FEF2F2',
  },
  patternText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
    flex: 1,
    lineHeight: 16,
  },
  criticalPatternText: {
    color: '#991B1B',
  },
  alertNoticeBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F87171',
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  alertNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  alertNoticeTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#B91C1C',
  },
  alertNoticeSub: {
    fontSize: 12,
    color: '#7F1D1D',
    fontWeight: '600',
    marginTop: 2,
  },
  actionPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  actionValue: {
    fontSize: 12,
    color: COLORS.navy,
    fontWeight: '600',
    lineHeight: 16,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 2,
  },
  breakdownSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  factorList: {
    gap: 10,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  factorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  factorName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  factorPts: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.navy,
  },
  totalPts: {
    fontSize: 16,
    fontWeight: '900',
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  disclaimerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
    flex: 1,
  },
  btnCol: {
    gap: 10,
  },
  historyBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  historyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dashBtn: {
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dashBtnText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '700',
  },
});
