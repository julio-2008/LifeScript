// LifeScript 2.0 design tokens.
export const colors = {
  bg: '#080818',
  bgDeep: '#04040C',
  surface: '#10102A',
  surfaceAlt: '#181836',
  glass: 'rgba(255,255,255,0.04)',
  glassStrong: 'rgba(255,255,255,0.09)',
  border: 'rgba(255,255,255,0.1)',
  borderActive: 'rgba(124,58,237,0.55)',
  primary: '#6D28D9',
  primaryLight: '#A78BFA',
  primaryGlow: 'rgba(109,40,217,0.5)',
  secondary: '#0D9488',
  gold: '#F59E0B',
  goldGlow: 'rgba(245,158,11,0.4)',
  green: '#10B981',
  red: '#F43F5E',
  blue: '#3B82F6',
  rose: '#F43F5E',
  pink: '#EC4899',
  cyan: '#06B6D4',
  emerald: '#10B981',
  amber: '#F59E0B',
  iridescent: '#E0E7FF',
  text: '#F9FAFB',
  textDim: '#9CA3AF',
  textAccent: '#C4B5FD',
  danger: '#EF4444',
};

export const radii = {
  sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, full: 9999,
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const fonts = {
  heading: 'Sora_700Bold',
  headingExtra: 'Sora_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodyBold: 'Inter_700Bold',
};

// 8 life areas colour map (new: Purpose / Legacy)
export const areaColors: Record<string, string> = {
  Career: '#3B82F6',
  Finances: '#F59E0B',
  Health: '#10B981',
  Relationships: '#F43F5E',
  Mind: '#A78BFA',
  Skills: '#06B6D4',
  Purpose: '#FFFFFF',
  Legacy: '#FFD700',
};

export const areaIcons: Record<string, string> = {
  Career: 'briefcase',
  Finances: 'cash',
  Health: 'fitness',
  Relationships: 'people',
  Mind: 'bulb',
  Skills: 'construct',
  Purpose: 'compass',
  Legacy: 'ribbon',
};

export const themes: Record<
  string,
  { base: string; accent: string; star: string }
> = {
  aurora: { base: '#080818', accent: '#6D28D9', star: '#A78BFA' },
  nebula: { base: '#0B0820', accent: '#F43F5E', star: '#F472B6' },
  ember:  { base: '#1A0808', accent: '#F59E0B', star: '#FBBF24' },
  forest: { base: '#05170E', accent: '#10B981', star: '#34D399' },
  mono:   { base: '#000000', accent: '#FFFFFF', star: '#9CA3AF' },
};
