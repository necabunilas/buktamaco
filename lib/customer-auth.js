import { cookies } from 'next/headers';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db, customers, customerSessions } from '@/lib/db';

const COOKIE = 'buktama_customer';
const SESSION_DAYS = 30;

// Store timestamps as UTC 'YYYY-MM-DD HH:MM:SS' to match the SQLite datetime format.
function toSqlTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
function fromSqlTime(s) {
  return new Date(s.replace(' ', 'T') + 'Z');
}

export async function signInCustomer(customerId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await db.insert(customerSessions).values({ token, customerId, expiresAt: toSqlTime(expires) }).run();
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export async function getCustomer() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.select().from(customerSessions).where(eq(customerSessions.token, token)).get();
  if (!session) return null;
  if (fromSqlTime(session.expiresAt) < new Date()) return null;
  const customer = await db.select().from(customers).where(eq(customers.id, session.customerId)).get();
  return customer || null;
}

export async function signOutCustomer() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.delete(customerSessions).where(eq(customerSessions.token, token)).run();
  store.delete(COOKIE);
}