/**
 * Thin wrapper around the Vibration API (navigator.vibrate).
 * Silently no-ops on browsers/devices that don't support it (e.g., iOS Safari).
 *
 * @param pattern - Duration in ms, or an array of [vibrate, pause, vibrate, …]
 */
export function haptic(pattern: number | number[] = 50): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration API not supported — safe to ignore
  }
}
