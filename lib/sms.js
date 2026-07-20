// Vonage (Nexmo) SMS adapter — https://vonage.com. Sends order notifications.
// No-ops safely when VONAGE_API_KEY/SECRET are unset (e.g. local dev), and never
// throws — a failed text must never break the order flow.
const API_URL = 'https://rest.nexmo.com/sms/json';

// Normalize a Philippine mobile number to international 639XXXXXXXXX (no +).
export function normalizePHNumber(raw) {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '63' + d.slice(1); // 09xxxxxxxxx -> 639xxxxxxxxx
  if (d.length === 10 && d.startsWith('9')) d = '63' + d; // 9xxxxxxxxx -> 639xxxxxxxxx
  return d;
}

export async function sendSms(number, message) {
  const apiKey = process.env.VONAGE_API_KEY;
  const apiSecret = process.env.VONAGE_API_SECRET;
  if (!apiKey || !apiSecret) {
    console.log('[sms] VONAGE_API_KEY/SECRET not set — skipping SMS:', message);
    return;
  }
  const to = normalizePHNumber(number);
  if (!/^639\d{9}$/.test(to)) {
    console.warn('[sms] not a valid PH mobile number, skipping:', number);
    return;
  }
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      api_secret: apiSecret,
      to,
      from: process.env.SMS_SENDER_NAME || 'BukTamaCo',
      text: message,
    });
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await res.json().catch(() => null);
    const msg = data?.messages?.[0];
    if (!msg || msg.status !== '0') {
      console.warn('[sms] Vonage send failed:', msg?.status, msg?.['error-text']);
    }
  } catch (e) {
    console.warn('[sms] error:', e?.message);
  }
}