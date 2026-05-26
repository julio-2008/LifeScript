import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type BioStatusSnapshot = {
  heartRate: number;
  sleepScore: number;
  cognitiveDebt: number;
  stressRatio: number;
  hydrated: boolean;
  recordedAt: string;
};

export type GeofenceZone = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  hint: string;
};

export type GeofenceState = {
  currentZone: GeofenceZone | null;
  ready: boolean;
  permission: 'unknown' | 'granted' | 'denied';
};

const DEFAULT_ZONES: GeofenceZone[] = [
  {
    id: 'library',
    label: 'Zona da Biblioteca',
    latitude: -23.561684,
    longitude: -46.655981,
    radiusMeters: 180,
    hint: 'Um espaço de concentração e estudo profundo.',
  },
  {
    id: 'park',
    label: 'Parque de Tribo',
    latitude: -23.559616,
    longitude: -46.658864,
    radiusMeters: 220,
    hint: 'Use para respirar, integrar e recalibrar seu ritmo.',
  },
];

function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
}

export function useBiofeedback() {
  const [bio, setBio] = useState<BioStatusSnapshot>({
    heartRate: 68,
    sleepScore: 78,
    cognitiveDebt: 0.12,
    stressRatio: 0.18,
    hydrated: true,
    recordedAt: new Date().toISOString(),
  });

  useEffect(() => {
    let mounted = true;
    async function syncBio() {
      try {
        if (Location?.getBackgroundPermissionsAsync) {
          await Location.getBackgroundPermissionsAsync();
        }
      } catch {
        // permission may not be available, continue with local state.
      }

      const updateSnapshot = () => {
        if (!mounted) return;
        setBio((prev) => ({
          heartRate: Math.max(54, Math.min(88, prev.heartRate + (Math.random() > 0.5 ? 1 : -1))),
          sleepScore: Math.max(65, Math.min(92, prev.sleepScore + (Math.random() > 0.65 ? 1 : 0))),
          cognitiveDebt: Math.max(0, Math.min(1, prev.cognitiveDebt + (Math.random() - 0.45) * 0.03)),
          stressRatio: Math.max(0, Math.min(1, prev.stressRatio + (Math.random() - 0.5) * 0.04)),
          hydrated: Math.random() > 0.18,
          recordedAt: new Date().toISOString(),
        }));
      };

      updateSnapshot();
      const interval = setInterval(updateSnapshot, 120000);
      return () => { mounted = false; clearInterval(interval); };
    }
    let cleanup: (() => void) | undefined;
    syncBio().then((dispose) => {
      cleanup = dispose;
    }).catch(() => {
      cleanup = undefined;
    });
    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  return bio;
}

export function useGeofencing() {
  const [state, setState] = useState<GeofenceState>({ currentZone: null, ready: false, permission: 'unknown' });

  useEffect(() => {
    let watcher: any;
    let mounted = true;

    async function prepare() {
      try {
        if (!Location) {
          setState((prev) => ({ ...prev, ready: false, permission: 'denied' }));
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync?.();
        const bg = await Location.requestBackgroundPermissionsAsync?.();
        const granted = status === 'granted' || bg?.status === 'granted';
        if (!granted) {
          if (mounted) setState({ currentZone: null, ready: true, permission: 'denied' });
          return;
        }

        if (mounted) setState({ currentZone: null, ready: true, permission: 'granted' });

        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy?.Balanced ?? 3,
            distanceInterval: 25,
            timeInterval: 5000,
          },
          (position: Location.LocationObject) => {
            if (!mounted) return;
            const { latitude, longitude } = position.coords || {};
            setState((prevState) => {
              const match = DEFAULT_ZONES.find((zone) => distanceBetween(latitude, longitude, zone.latitude, zone.longitude) <= zone.radiusMeters);
              if (match) {
                return { currentZone: match, ready: true, permission: 'granted' };
              }
              if (prevState.currentZone) {
                return { currentZone: null, ready: true, permission: 'granted' };
              }
              return prevState;
            });
          },
        );
      } catch {
        if (mounted) setState({ currentZone: null, ready: true, permission: 'denied' });
      }
    }

    prepare();
    return () => {
      mounted = false;
      if (watcher?.remove) watcher.remove();
    };
  }, []);

  return state;
}
