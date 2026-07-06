// Timestamps are stored in UTC as 'YYYY-MM-DD HH:MM:SS' (from SQLite datetime('now')).
// Display them in Philippine time (Asia/Manila, UTC+8).
const PH_TZ = 'Asia/Manila';

export function formatPHDateTime(ts) {
  if (!ts) return '';
  // Interpret the stored value as UTC, then render in Manila time.
  const date = new Date(ts.replace(' ', 'T') + 'Z');
  if (isNaN(date.getTime())) return ts;
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: PH_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}