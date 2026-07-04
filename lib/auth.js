import { cookies } from 'next/headers';

// Minimal staff auth for local use: a single shared password.
// TODO: replace with per-staff accounts + hashing before any real deployment.
export const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'admin';
const COOKIE = 'buktama_staff';
const COOKIE_VALUE = 'ok';

export async function isStaff() {
  const store = await cookies();
  return store.get(COOKIE)?.value === COOKIE_VALUE;
}

export async function signInStaff() {
  const store = await cookies();
  store.set(COOKIE, COOKIE_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

export async function signOutStaff() {
  const store = await cookies();
  store.delete(COOKIE);
}