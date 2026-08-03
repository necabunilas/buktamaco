'use server';

import crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db, customers, otpCodes } from '@/lib/db';
import { sendSms } from '@/lib/sms';
import { signInCustomer, signOutCustomer } from '@/lib/customer-auth';

function genCode() {
  return String(crypto.randomInt(100000, 1000000));
}
function normalize(raw) {
  let d = (raw || '').toString().replace(/\D/g, '');
  if (d.startsWith('63')) d = '0' + d.slice(2);
  if (d.length === 10 && d.startsWith('9')) d = '0' + d;
  return d;
}
function sqlExpiry(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
}
function isExpired(s) {
  return new Date(s.replace(' ', 'T') + 'Z') < new Date();
}

export async function requestRegisterOtp(formData) {
  const name = (formData.get('name') || '').toString().trim();
  const address = (formData.get('address') || '').toString().trim();
  const contact = normalize(formData.get('contact'));

  if (!name || !address) redirect('/account/register?error=missing');
  if (!/^09\d{9}$/.test(contact)) redirect('/account/register?error=phone');

  const existing = await db.select().from(customers).where(eq(customers.contact, contact)).get();
  if (existing) redirect('/account/register?error=exists');

  const code = genCode();
  await db.delete(otpCodes).where(and(eq(otpCodes.contact, contact), eq(otpCodes.purpose, 'register'))).run();
  await db.insert(otpCodes).values({ contact, code, purpose: 'register', name, address, expiresAt: sqlExpiry(5) }).run();
  await sendSms(contact, `Your BukTamaCo verification code is ${code}. Valid for 5 minutes.`);

  redirect(`/account/verify?contact=${encodeURIComponent(contact)}&purpose=register`);
}

export async function requestLoginOtp(formData) {
  const contact = normalize(formData.get('contact'));
  if (!/^09\d{9}$/.test(contact)) redirect('/account/login?error=phone');

  const existing = await db.select().from(customers).where(eq(customers.contact, contact)).get();
  if (!existing) redirect('/account/login?error=notfound');

  const code = genCode();
  await db.delete(otpCodes).where(and(eq(otpCodes.contact, contact), eq(otpCodes.purpose, 'login'))).run();
  await db.insert(otpCodes).values({ contact, code, purpose: 'login', expiresAt: sqlExpiry(5) }).run();
  await sendSms(contact, `Your BukTamaCo login code is ${code}. Valid for 5 minutes.`);

  redirect(`/account/verify?contact=${encodeURIComponent(contact)}&purpose=login`);
}

export async function resendOtp(formData) {
  const contact = normalize(formData.get('contact'));
  const purpose = (formData.get('purpose') || '').toString();

  if (purpose === 'login') {
    const existing = await db.select().from(customers).where(eq(customers.contact, contact)).get();
    if (!existing) redirect('/account/login?error=notfound');
  }

  // Reuse the pending registration name/address from the existing OTP row.
  const prev = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.contact, contact), eq(otpCodes.purpose, purpose)))
    .get();
  if (!prev) {
    redirect(purpose === 'register' ? '/account/register' : '/account/login');
  }

  const code = genCode();
  await db.delete(otpCodes).where(and(eq(otpCodes.contact, contact), eq(otpCodes.purpose, purpose))).run();
  await db
    .insert(otpCodes)
    .values({ contact, code, purpose, name: prev.name, address: prev.address, expiresAt: sqlExpiry(5) })
    .run();
  await sendSms(contact, `Your BukTamaCo code is ${code}. Valid for 5 minutes.`);

  redirect(`/account/verify?contact=${encodeURIComponent(contact)}&purpose=${purpose}`);
}

export async function verifyOtp(formData) {
  const contact = normalize(formData.get('contact'));
  const purpose = (formData.get('purpose') || '').toString();
  const code = (formData.get('code') || '').toString().trim();
  const back = `/account/verify?contact=${encodeURIComponent(contact)}&purpose=${purpose}`;

  const row = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.contact, contact), eq(otpCodes.purpose, purpose)))
    .get();

  if (!row || row.code !== code) redirect(`${back}&error=code`);
  if (isExpired(row.expiresAt)) redirect(`${back}&error=expired`);

  let customerId;
  if (purpose === 'register') {
    const existing = await db.select().from(customers).where(eq(customers.contact, contact)).get();
    if (existing) {
      customerId = existing.id;
    } else {
      const r = await db
        .insert(customers)
        .values({ name: row.name, contact, address: row.address })
        .run();
      customerId = Number(r.lastInsertRowid);
    }
  } else {
    const c = await db.select().from(customers).where(eq(customers.contact, contact)).get();
    if (!c) redirect('/account/login?error=notfound');
    customerId = c.id;
  }

  await db.delete(otpCodes).where(eq(otpCodes.id, row.id)).run();
  await signInCustomer(customerId);
  redirect('/account');
}

export async function logoutCustomer() {
  await signOutCustomer();
  redirect('/');
}