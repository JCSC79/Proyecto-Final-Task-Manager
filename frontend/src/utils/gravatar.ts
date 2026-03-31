/**
 * Returns a Gravatar image URL for the given email using SHA-256.
 * Falls back to "mp" (mystery person silhouette) when no Gravatar exists.
 */
export async function gravatarUrl(email: string, size = 36): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp&r=g`;
}
