import { isStaff } from '@/lib/auth';
import { logout } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const staff = await isStaff();

  // The login page renders itself; when not staff, only that page is reachable.
  if (!staff) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <a href="/admin">Dashboard</a>
          <a href="/admin/orders">Orders</a>
          <a href="/admin/inventory">Inventory</a>
          <a href="/admin/products">Products</a>
        </nav>
        <form action={logout}>
          <button className="btn secondary" type="submit">Log out</button>
        </form>
      </div>
      {children}
    </div>
  );
}