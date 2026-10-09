import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import RiskBadge from './RiskBadge';

export default function CaseCard({ item }) {
  const [expanded, setExpanded] = useState(false);

  const dateStr = item.symptomDate || item.reportedDate || item.createdAt;
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'Today';

  return (
    <View style={styles.card}>
      {/* Header: Case ID + Risk Badge */}
      <View style={styles.headerRow}>
        <View style={styles.idGroup}>
          <Text style={styles.emojiIcon}>📋</Text>
          <Text style={styles.caseId}>{item.caseId || 'CASE-REG'}</Text>
        </View>
        <RiskBadge level={item.riskLevel} score={item.riskScore} size="sm" />
      </View>

      {/* Patient Demographics & Disease */}
      <View style={styles.demographicsRow}>
        <View style={styles.demoBadge}>
          <Text style={styles.tinyEmoji}>👤</Text>
          <Text style={styles.demoText}>
            {item.age ? `${item.age} yrs` : 'Age N/A'} • {item.gender || 'Unknown'}
          </Text>
        </View>
        {item.suspectedDisease ? (
          <View style={styles.diseaseBadge}>
            <Text style={styles.tinyEmoji}>🩺</Text>
            <Text style={styles.diseaseText}>{item.suspectedDisease}</Text>
          </View>
        ) : null}
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Text style={styles.tinyEmoji}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>
          {item.locality || 'Unknown Locality'}{item.district ? `, ${item.district}` : ''}
        </Text>
      </View>

      {/* Primary Water Source */}
      {item.waterSource ? (
        <View style={styles.waterRow}>
          <Text style={styles.tinyEmoji}>💧</Text>
          <Text style={styles.waterText} numberOfLines={1}>
            Source: <Text style={styles.waterHighlight}>{item.waterSource}</Text>
          </Text>
        </View>
      ) : null}

      {/* Symptoms Pills */}
      {item.symptoms && item.symptoms.length > 0 && (
        <View style={styles.symptomsWrap}>
          {(expanded ? item.symptoms : item.symptoms.slice(0, 3)).map((sym, idx) => (
            <View key={idx} style={styles.symptomPill}>
              <Text style={styles.symptomText}>{sym}</Text>
            </View>
          ))}
          {!expanded && item.symptoms.length > 3 && (
            <TouchableOpacity onPress={() => setExpanded(true)} style={[styles.symptomPill, styles.morePill]}>
              <Text style={styles.moreText}>+{item.symptoms.length - 3} more</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Expanded Clinical & Environmental Inputs (No raw coordinates) */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.expandedDivider} />

          <Text style={styles.expandedTitle}>REPORTED CLINICAL & FIELD INPUTS</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Clinical Severity:</Text>
              <Text style={styles.detailValBold}>{item.severity || 'MODERATE'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cluster Cases Nearby:</Text>
              <Text style={styles.detailValBold}>
                {item.similarCasesNearby !== undefined ? `${item.similarCasesNearby} cases` : '0 cases'}
              </Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Water Contamination:</Text>
              <Text style={[styles.detailValBold, item.waterQualityConcern ? styles.hazardText : styles.safeText]}>
                {item.waterQualityConcern ? '⚠️ Yes (Reported)' : '✓ Normal'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Recent Flooding:</Text>
              <Text style={[styles.detailValBold, item.flooding ? styles.hazardText : styles.safeText]}>
                {item.flooding ? '🌊 Yes (Flooded)' : '✓ No'}
              </Text>
            </View>
          </View>

          {item.notes ? (
            <View style={styles.detailFull}>
              <Text style={styles.detailLabel}>Field Notes & Triage:</Text>
              <Text style={styles.detailNotes}>"{item.notes}"</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Footer Row: Status Pill, Expand Toggle, Date */}
      <View style={styles.footerRow}>
        <View style={[styles.statusPill, item.isPendingSync && styles.pendingPill]}>
          <Text style={[styles.statusText, item.isPendingSync && styles.pendingText]}>
            {item.isPendingSync ? '⏳ PENDING SYNC (OFFLINE)' : item.status || 'REPORTED'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.expandToggle}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandText}>{expanded ? 'Hide Details' : 'View Inputs'}</Text>
          <Text style={styles.chevronSymbol}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

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
  emojiIcon: {
    fontSize: 14,
  },
  tinyEmoji: {
    fontSize: 12,
  },
  caseId: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  demographicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  demoText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  diseaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  diseaseText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.teal,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  waterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  waterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  waterHighlight: {
    color: '#0369A1',
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
  expandedSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expandedDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  expandedTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailItem: {
    flex: 1,
  },
  detailFull: {
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 1,
  },
  detailValBold: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  detailNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  hazardText: {
    color: '#DC2626',
  },
  safeText: {
    color: '#059669',
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
  pendingPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    color: '#B45309',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  expandText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  chevronSymbol: {
    fontSize: 9,
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
