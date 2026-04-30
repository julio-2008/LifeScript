// Lightweight sound + haptic layer. Uses expo-haptics for tactile feedback and
// expo-speech for Axiom voice briefings. Real audio tones are synthesised on
// the web via Web Audio API — on native we fall back to haptics only so we do
// not need to bundle audio assets.
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

let audioCtx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  // @ts-ignore
  const Ctor = (typeof window !== 'undefined') ? (window.AudioContext || (window as any).webkitAudioContext) : null;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

function tone(freq: number, dur = 0.18, type: OscillatorType = 'sine', gain = 0.05): void {
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.value = freq;
  osc.type = type;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.stop(c.currentTime + dur);
}

export const Sounds = {
  async tap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    tone(660, 0.06, 'triangle');
  },
  async complete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    tone(523, 0.15, 'sine');
    setTimeout(() => tone(659, 0.15), 120);
    setTimeout(() => tone(784, 0.25), 240);
  },
  async levelUp() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22), i * 150));
  },
  async streakBreak() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    tone(220, 0.5, 'sawtooth', 0.04);
  },
  async open() {
    tone(196, 0.5, 'sine', 0.02);
  },
  async speak(text: string) {
    if (!text) return;
    try {
      Speech.speak(text, { rate: 0.95, pitch: 1.0 });
    } catch {}
  },
  stopSpeak() {
    try { Speech.stop(); } catch {}
  },
};
