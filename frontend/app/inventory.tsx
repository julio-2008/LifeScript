// Life Inventory — collectibles grid.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBg, GlassCard, SectionTitle } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, State } from '../src/state';
import { INVENTORY_META } from '../src/inventory';

const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 12;

export default function InventoryScreen() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  useFocusEffect(useCallback(() => { loadState().then(setState); }, []));
  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const items = Object.entries(INVENTORY_META);
  const size = (width - 44 - GAP * (COLS - 1)) / COLS;

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 60, paddingBottom: 60 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="inventory-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inventário de Vida</Text>
          <View style={{ width: 40 }} />
        </View>

        <SectionTitle style={{ marginTop: 16 }}>Sua coleção</SectionTitle>
        <View style={styles.grid}>
          {items.map(([key, meta]) => {
            const count = state.inventory[key] || 0;
            const owned = count > 0;
            return (
              <View key={key} style={[styles.card, { width: size, height: size + 38 }]} testID={`inv-${key}`}>
                <View style={[styles.iconWrap, {
                  backgroundColor: owned ? `${meta.color}22` : 'rgba(255,255,255,0.04)',
                  borderColor: owned ? `${meta.color}66` : colors.border,
                }]}>
                  <Ionicons name={meta.icon as any} size={28} color={owned ? meta.color : 'rgba(255,255,255,0.2)'} />
                </View>
                <Text numberOfLines={1} style={[styles.cName, !owned && { color: colors.textDim }]}>{meta.name}</Text>
                <Text style={styles.cCount}>×{count}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  card: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 10, alignItems: 'center' },
  iconWrap: { width: '78%', aspectRatio: 1, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  cName: { color: colors.text, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  cCount: { color: colors.gold, fontSize: 11, fontWeight: '700', marginTop: 2 },
});
