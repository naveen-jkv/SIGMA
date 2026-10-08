import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getActiveApiUrl } from '../services/api';

export default function NetworkBanner({ isOnline = true, onRetry, isDemo = false }) {
  if (isOnline && !isDemo) return null;

  return (
    <View style={[styles.banner, isDemo ? styles.demoBanner : styles.offlineBanner]}>
      <View style={styles.left}>
        <Ionicons
          name={isDemo ? 'flask' : 'cloud-offline'}
          size={16}
          color={isDemo ? '#92400E' : '#991B1B'}
        />
        <View style={styles.textWrap}>
          <Text style={[styles.title, isDemo ? styles.demoText : styles.offlineText]}>
            {isDemo ? 'DEMO DATA ACTIVE' : 'AQUASENSE Server Offline'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isDemo ? 'Backend unreachable • Using sandbox data' : `Cannot connect to ${getActiveApiUrl()}`}
          </Text>
        </View>
      </View>

      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  offlineBanner: {
    backgroundColor: '#FEF2F2',
    borderBottomColor: '#FECACA',
  },
  demoBanner: {
    backgroundColor: '#FFFBEB',
    borderBottomColor: '#FDE68A',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  offlineText: {
    color: '#991B1B',
  },
  demoText: {
    color: '#92400E',
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  retryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
  },
});
