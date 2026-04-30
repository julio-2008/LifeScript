// Web stub — LifeScript notifications are a no-op on the web preview.
export async function ensurePermission(): Promise<boolean> { return false; }
export async function cancelAllScheduled(): Promise<void> { /* noop */ }
export async function scheduleDaily(_opts: any): Promise<string | null> { return null; }
export async function scheduleOnce(_at: Date, _title: string, _body: string): Promise<string | null> { return null; }
export async function scheduleAll(_name: string, _missionTitle?: string, _streak?: number): Promise<void> { /* noop */ }
