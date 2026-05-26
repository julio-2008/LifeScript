import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LogoMinimal } from './LogoBrand';

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  icon?: string | 'logo';
  trend?: 'up' | 'down' | 'neutral';
  color?: 'purple' | 'blue' | 'green' | 'red';
  onPress?: () => void;
}

export function PremiumStatCard({
  title,
  value,
  icon,
  trend,
  color = 'purple',
  onPress,
}: PremiumStatCardProps) {
  const colorMap = {
    purple: '#A78BFA',
    blue: '#60A5FA',
    green: '#34D399',
    red: '#F87171',
  };

  const trendIcon = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        { borderLeftColor: colorMap[color] },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {trend && (
          <Text style={[styles.trend, { color: colorMap[color] }]}>
            {trendIcon[trend]}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        {icon === 'logo' ? (
          <LogoMinimal size={24} variant="light" />
        ) : (
          icon && <Text style={styles.icon}>{icon}</Text>
        )}
        <Text style={[styles.value, { color: colorMap[color] }]}>
          {value}
        </Text>
      </View>

      <View
        style={[styles.bottomBar, { backgroundColor: colorMap[color] }]}
      />
    </Pressable>
  );
}

interface PremiumCardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  color?: 'purple' | 'blue' | 'green' | 'red';
}

export function PremiumCard({
  title,
  children,
  onPress,
  color = 'purple',
}: PremiumCardProps) {
  const colorMap = {
    purple: '#A78BFA',
    blue: '#60A5FA',
    green: '#34D399',
    red: '#F87171',
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        { borderTopColor: colorMap[color] },
      ]}
    >
      {title && (
        <Text style={[styles.cardTitle, { color: colorMap[color] }]}>
          {title}
        </Text>
      )}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F0F23',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: '#151530',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trend: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  bottomBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F0F23',
    borderRadius: 10,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  cardPressed: {
    opacity: 0.7,
    backgroundColor: '#151530',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
