// Helpers to convert between the API's date-only string format ("YYYY-MM-DD") and a JS Date, always using LOCAL date components (never UTC / toISOString()).
// This mirrors the fix applied on the backend (task.dao.ts) — mixing local and UTC time references for a date-only value is what causes the classic
// "off by one day" bug in timezones with a positive UTC offset.

export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
}
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Bridges our "YYYY-MM-DD" string state to/from the ISO-string value/onChange contract used by Blueprint's <DateInput>. The round trip always goes through
// a real Date object read back with LOCAL getters, so it stays correct no matter what the server's or browser's timezone offset is.
export function dateStringToIso(value: string): string | null {
  const date = parseLocalDate(value);
  return date ? date.toISOString() : null;
}

export function isoToDateString(iso: string | null): string {
  if (!iso) {
    return '';
}
  return formatLocalDate(new Date(iso));
}
