import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface LogoBrandProps {
  size?: number;
  variant?: 'light' | 'dark' | 'white' | 'auto';
  style?: ViewStyle;
}

/**
 * Logo Brand Component
 * Adaptável para qualquer fundo
 * - light: branco em fundo escuro
 * - dark: preto em fundo claro
 * - white: branco puro
 * - auto: detecta o fundo automaticamente
 */
export function LogoBrand({
  size = 32,
  variant = 'auto',
  style,
}: LogoBrandProps) {
  const colorMap = {
    light: '#FFFFFF',
    dark: '#000000',
    white: '#FFFFFF',
    auto: '#A78BFA', // cor principal
  };

  const color = colorMap[variant];

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
      >
        {/* Logo geométrico: triângulo com chevron */}
        <G>
          {/* Triângulo superior */}
          <Path
            d="M 50 10 L 80 70 L 50 55 L 20 70 Z"
            fill={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Chevron inferior */}
          <Path
            d="M 30 60 L 50 80 L 70 60"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

interface LogoWithTextProps {
  size?: number;
  variant?: 'light' | 'dark';
  showText?: boolean;
  textColor?: string;
}

/**
 * Logo com texto "LifeScript"
 */
export function LogoWithText({
  size = 48,
  variant = 'light',
  showText = true,
  textColor,
}: LogoWithTextProps) {
  const textCol = textColor || (variant === 'light' ? '#FFFFFF' : '#000000');

  return (
    <View style={styles.logoWithText}>
      <LogoBrand size={size} variant={variant as any} />
      {showText && (
        <View style={{ marginLeft: size / 2 }}>
          <Text
            style={[
              styles.logoText,
              { color: textCol, fontSize: size * 0.6 },
            ]}
          >
            LifeScript
          </Text>
          <Text
            style={[
              styles.logoSubtext,
              {
                color: textCol,
                fontSize: size * 0.25,
                opacity: 0.7,
              },
            ]}
          >
            Identity OS
          </Text>
        </View>
      )}
    </View>
  );
}

interface LogoMinimalProps {
  size?: number;
  variant?: 'light' | 'dark';
}

/**
 * Logo minimal - apenas o símbolo geométrico
 */
export function LogoMinimal({ size = 24, variant = 'light' }: LogoMinimalProps) {
  return <LogoBrand size={size} variant={variant as any} />;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: '700',
    fontFamily: 'Menlo',
    letterSpacing: 1,
  },
  logoSubtext: {
    fontWeight: '500',
    fontFamily: 'Menlo',
    letterSpacing: 0.5,
  },
});
