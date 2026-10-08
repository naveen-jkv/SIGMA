import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function RiskBadge({ level = 'LOW', score, size = 'md' }) {
  const normLevel = (level || 'LOW').toUpperCase();
  const config = COLORS.risk[normLevel] || COLORS.risk.LOW;

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 3 : isLarge ? 8 : 5,
          paddingHorizontal: isSmall ? 8 : isLarge ? 16 : 10,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSmall ? 10 : isLarge ? 14 : 11,
            fontWeight: '700',
          },
        ]}
      >
        {config.label}
        {score !== undefined && score !== null ? ` • ${score}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    letterSpacing: 0.5,
  },
});
