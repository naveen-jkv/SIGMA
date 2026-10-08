import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import RiskBadge from './RiskBadge';

export default function AlertCard({ alert }) {
  const isCritical = (alert.riskLevel || '').toUpperCase() === 'CRITICAL';
  const cardBorderColor = isCritical ? '#FCA5A5' : '#FED7AA';
  const cardBg = isCritical ? '#FFF5F5' : '#FFFAF0';

  return (
    <View style={[styles.card, { borderColor: cardBorderColor, backgroundColor: cardBg }]}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Ionicons
            name={isCritical ? 'alert-circle' : 'warning'}
            size={20}
            color={isCritical ? '#EF4444' : '#F97316'}
          />
          <Text style={styles.alertTitle}>
            {isCritical ? '🚨 CRITICAL OUTBREAK ALERT' : '⚠️ HIGH RISK WARNING'}
          </Text>
        </View>
        <RiskBadge level={alert.riskLevel} score={alert.riskScore} size="sm" />
      </View>

      <View style={styles.detailBox}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{alert.location || 'Reported Sector'}</Text>
        </View>

        {alert.caseCount !== undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Associated Cases:</Text>
            <Text style={[styles.value, { color: COLORS.navy, fontWeight: '700' }]}>
              {alert.caseCount} active cases
            </Text>
          </View>
        )}
      </View>

      {alert.reason && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Surveillance Reason:</Text>
          <Text style={styles.reasonText}>{alert.reason}</Text>
        </View>
      )}

      {alert.recommendedAction && (
        <View style={styles.actionBox}>
          <Ionicons name="shield-checkmark" size={16} color="#0D9488" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionLabel}>Recommended Intervention:</Text>
            <Text style={styles.actionText}>{alert.recommendedAction}</Text>
          </View>
        </View>
      )}

      <View style={styles.statusRow}>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{alert.status || 'ACTIVE'}</Text>
        </View>
        <Text style={styles.timeText}>
          {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : 'Active'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    ...SHADOWS.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },
  detailBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  actionBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    marginBottom: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#134E4A',
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusPill: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
