import { login } from '../actions';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }) {
  if (await isStaff()) redirect('/admin');
  const sp = await searchParams;
  const error = sp?.error;

  return (
    <div style={{ maxWidth: 360, margin: '2rem auto' }}>
      <h1>Staff Login</h1>
      <form action={login} className="card">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoFocus style={{ width: '100%' }} />
        {error && (
          <p style={{ color: 'var(--warn)', marginBottom: 0 }}>Incorrect password.</p>
        )}
        <button className="btn" type="submit" style={{ marginTop: '1rem', width: '100%' }}>
          Log in
        </button>
      </form>
    </div>
  );
}