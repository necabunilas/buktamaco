// Semaphore SMS adapter (https://semaphore.co). Sends order notifications.
// No-ops safely when SEMAPHORE_API_KEY is unset (e.g. local dev), and never
// throws — a failed text must never break the order flow.
const API_URL = 'https://api.semaphore.co/api/v4/messages';

// Normalize a Philippine mobile number to 09XXXXXXXXX.
export function normalizePHNumber(raw) {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('63')) d = '0' + d.slice(2); // 639xxxxxxxxx -> 09xxxxxxxxx
  if (d.length === 10 && d.startsWith('9')) d = '0' + d; // 9xxxxxxxxx -> 09xxxxxxxxx
  return d;
}

export async function sendSms(number, message) {
  const apikey = process.env.SEMAPHORE_API_KEY;
  if (!apikey) {
    console.log('[sms] SEMAPHORE_API_KEY not set — skipping SMS:', message);
    return;
  }
  const to = normalizePHNumber(number);
  if (!/^09\d{9}$/.test(to)) {
    console.warn('[sms] not a valid PH mobile number, skipping:', number);
    return;
  }
  try {
    const params = new URLSearchParams({ apikey, number: to, message });
    if (process.env.SEMAPHORE_SENDER_NAME) {
      params.set('sendername', process.env.SEMAPHORE_SENDER_NAME);
    }
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    if (!res.ok) {
      console.warn('[sms] send failed', res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    console.warn('[sms] error:', e?.message);
  }
}