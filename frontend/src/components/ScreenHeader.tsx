import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LogoMinimal } from './LogoBrand';
import { colors } from '../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  onLogoPress?: () => void;
  rightComponent?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showLogo = true,
  onLogoPress,
  rightComponent,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showLogo && (
          <Pressable onPress={onLogoPress} style={styles.logoContainer}>
            <LogoMinimal size={28} variant="light" />
          </Pressable>
        )}
        <View style={{ marginLeft: showLogo ? 12 : 0 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {rightComponent && (
        <View style={styles.rightSection}>
          {rightComponent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0A0A1A',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  rightSection: {
    marginLeft: 12,
  },
});
