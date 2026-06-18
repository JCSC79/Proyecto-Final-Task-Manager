import type { Intent } from '@blueprintjs/core';

/**
 * Maps a 7-char hex color from the DB to the nearest Blueprint intent.
 * This avoids inline styles while still reflecting the user's chosen color family.
 */
export function hexToIntent(hex: string): Intent {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  if (r === max && r - g > 30) {
    return 'danger';
  }
  if (g === max && g - r > 20) {
    return 'success';
  }
  if (b === max) {
    return 'primary';
  }
  return 'warning';
}
