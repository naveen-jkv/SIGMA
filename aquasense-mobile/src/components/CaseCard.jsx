import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import RiskBadge from './RiskBadge';

export default function CaseCard({ item }) {
  const dateStr = item.symptomDate || item.reportedDate || item.createdAt;
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'Today';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.idGroup}>
          <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
          <Text style={styles.caseId}>{item.caseId || 'CASE-REG'}</Text>
        </View>
        <RiskBadge level={item.riskLevel} score={item.riskScore} size="sm" />
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {item.locality || 'Unknown Locality'}{item.district ? `, ${item.district}` : ''}
        </Text>
      </View>

      {item.suspectedDisease ? (
        <View style={styles.diseaseRow}>
          <Ionicons name="medkit-outline" size={14} color={COLORS.teal} />
          <Text style={styles.diseaseText}>{item.suspectedDisease}</Text>
        </View>
      ) : null}

      {item.symptoms && item.symptoms.length > 0 && (
        <View style={styles.symptomsWrap}>
          {item.symptoms.slice(0, 3).map((sym, idx) => (
            <View key={idx} style={styles.symptomPill}>
              <Text style={styles.symptomText}>{sym}</Text>
            </View>
          ))}
          {item.symptoms.length > 3 && (
            <View style={[styles.symptomPill, styles.morePill]}>
              <Text style={styles.moreText}>+{item.symptoms.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footerRow}>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{item.status || 'REPORTED'}</Text>
        </View>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseId: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  diseaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  diseaseText: {
    fontSize: 12,
    color: COLORS.teal,
    fontWeight: '600',
  },
  symptomsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  symptomPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  symptomText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  morePill: {
    backgroundColor: '#E2E8F0',
  },
  moreText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusPill: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
