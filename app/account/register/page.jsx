import { requestRegisterOtp } from '../actions';
import { getCustomer } from '@/lib/customer-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ERR = {
  missing: 'Name and address are required.',
  phone: 'Enter a valid PH mobile number (e.g. 0917xxxxxxx).',
  exists: 'That number is already registered. Please log in instead.',
};

export default async function RegisterPage({ searchParams }) {
  if (await getCustomer()) redirect('/account');
  const sp = await searchParams;

  return (
    <div style={{ maxWidth: 420, margin: '1rem auto' }}>
      <h1>Create your account</h1>
      <p style={{ color: 'var(--muted)' }}>
        We'll text you a one-time code to verify your number.
      </p>
      <form action={requestRegisterOtp} className="card">
        {sp?.error && <p style={{ color: 'var(--warn)' }}>{ERR[sp.error] || 'Please check your details.'}</p>}
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="name">Full name *</label>
          <input id="name" name="name" required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="contact">Mobile number *</label>
          <input id="contact" name="contact" inputMode="numeric" placeholder="0917xxxxxxx" required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="address">Delivery address *</label>
          <input id="address" name="address" placeholder="House/street, barangay, city" required style={{ width: '100%' }} />
        </div>
        <button className="btn btn-gold" type="submit" style={{ width: '100%' }}>Send verification code</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Already have an account? <a href="/account/login">Log in</a>
      </p>
    </div>
  );
}