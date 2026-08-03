import { requestLoginOtp } from '../actions';
import { getCustomer } from '@/lib/customer-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ERR = {
  phone: 'Enter a valid PH mobile number (e.g. 0917xxxxxxx).',
  notfound: 'No account found for that number. Please register first.',
};

export default async function LoginPage({ searchParams }) {
  if (await getCustomer()) redirect('/account');
  const sp = await searchParams;

  return (
    <div style={{ maxWidth: 420, margin: '1rem auto' }}>
      <h1>Log in</h1>
      <p style={{ color: 'var(--muted)' }}>
        Enter your mobile number and we'll text you a one-time code.
      </p>
      <form action={requestLoginOtp} className="card">
        {sp?.error && <p style={{ color: 'var(--warn)' }}>{ERR[sp.error] || 'Please try again.'}</p>}
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="contact">Mobile number</label>
          <input id="contact" name="contact" inputMode="numeric" placeholder="0917xxxxxxx" required style={{ width: '100%' }} />
        </div>
        <button className="btn btn-gold" type="submit" style={{ width: '100%' }}>Send code</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        No account yet? <a href="/account/register">Register</a>
      </p>
    </div>
  );
}