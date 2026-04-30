// Focus Mode — minimalist single-mission deep-work timer.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, CircularProgress, PrimaryButton } from '../src/ui';
import { colors } from '../src/theme';
import { Sounds } from '../src/sounds';

export default function Focus() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [total] = useState(25 * 60);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => {
      if (s <= 1) { Sounds.complete(); setRunning(false); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [running]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  const progress = 1 - seconds / total;

  return (
    <ScreenBg gradient={['#000', '#081A12', '#000']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="focus-back-btn">
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <Text style={styles.kicker}>FOCO · 25 MIN</Text>
        <CircularProgress progress={progress} size={260} stroke={10} color={colors.secondary}>
          <Text style={styles.time}>{mm}:{ss}</Text>
        </CircularProgress>
        <View style={{ width: '100%', paddingHorizontal: 32, marginTop: 28, gap: 10 }}>
          <PrimaryButton
            label={running ? 'Pausar' : seconds === 0 ? 'Reiniciar' : 'Começar foco profundo'}
            icon={running ? 'pause' : 'play'}
            testID="focus-toggle-btn"
            onPress={() => { if (seconds === 0) setSeconds(total); setRunning(!running); }}
            variant="gold"
          />
          <PrimaryButton label="Resetar" icon="refresh" testID="focus-reset-btn" onPress={() => { setSeconds(total); setRunning(false); }} variant="ghost" />
        </View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', padding: 16, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: colors.secondary, fontWeight: '800', letterSpacing: 3, marginBottom: 18, fontSize: 12 },
  time: { color: colors.text, fontSize: 64, fontWeight: '800', letterSpacing: -2 },
});
