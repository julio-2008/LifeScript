// Native implementation of LifeScript notifications.
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.status === 'granted') return true;
    const next = await Notifications.requestPermissionsAsync();
    return next.status === 'granted';
  } catch { return false; }
}

export async function cancelAllScheduled(): Promise<void> {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}

export async function scheduleDaily(opts: { hour: number; minute: number; title: string; body: string }): Promise<string | null> {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: opts.title, body: opts.body },
      trigger: { hour: opts.hour, minute: opts.minute, repeats: true, type: 'daily' } as any,
    });
  } catch { return null; }
}

export async function scheduleOnce(at: Date, title: string, body: string): Promise<string | null> {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { date: at, type: 'date' } as any,
    });
  } catch { return null; }
}

export async function scheduleAll(name: string, missionTitle?: string, streak?: number) {
  const granted = await ensurePermission();
  if (!granted) return;
  await cancelAllScheduled();
  await scheduleDaily({ hour: 7, minute: 0,
    title: `Good morning, ${name}.`,
    body: missionTitle ? `Today's mission: ${missionTitle}. Your streak: ${streak ?? 0} days.` : "Today's mission is waiting. Open LifeScript." });
  await scheduleDaily({ hour: 12, minute: 0,
    title: `Half the day is gone, ${name}.`,
    body: 'Your mission is waiting. Other LifeScripters are already moving.' });
  await scheduleDaily({ hour: 20, minute: 0,
    title: `${name}. Today is almost over.`,
    body: 'One question: did you show up for yourself?' });
}
