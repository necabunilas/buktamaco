import { verifyOtp, resendOtp } from '../actions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ERR = {
  code: 'Incorrect code. Please try again.',
  expired: 'That code expired. Request a new one.',
};

export default async function VerifyPage({ searchParams }) {
  const sp = await searchParams;
  const contact = (sp?.contact || '').toString();
  const purpose = (sp?.purpose || '').toString();
  if (!contact || !['register', 'login'].includes(purpose)) notFound();

  return (
    <div style={{ maxWidth: 420, margin: '1rem auto' }}>
      <h1>Enter your code</h1>
      <p style={{ color: 'var(--muted)' }}>
        We texted a 6-digit code to <strong>{contact}</strong>. It's valid for 5 minutes.
      </p>
      <form action={verifyOtp} className="card">
        {sp?.error && <p style={{ color: 'var(--warn)' }}>{ERR[sp.error] || 'Please try again.'}</p>}
        <input type="hidden" name="contact" value={contact} />
        <input type="hidden" name="purpose" value={purpose} />
        <label htmlFor="code">Verification code</label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          autoFocus
          required
          style={{ width: '100%', letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center' }}
        />
        <button className="btn btn-gold" type="submit" style={{ width: '100%', marginTop: '0.75rem' }}>Verify</button>
      </form>
      <form action={resendOtp} style={{ marginTop: '1rem', textAlign: 'center' }}>
        <input type="hidden" name="contact" value={contact} />
        <input type="hidden" name="purpose" value={purpose} />
        <button type="submit" className="link-cta" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          Didn't get it? Resend code
        </button>
      </form>
    </div>
  );
}