import { db, orders } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { logout } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const staff = await isStaff();

  // The login page renders itself; when not staff, only that page is reachable.
  if (!staff) {
    return <div>{children}</div>;
  }

  const pending = await db
    .select({ c: sql`count(*)` })
    .from(orders)
    .where(eq(orders.status, 'PENDING'))
    .get();
  const pendingCount = Number(pending?.c || 0);

  return (
    <div>
      <div className="admin-bar">
        <div className="admin-bar-left">
          <span className="admin-badge">Staff</span>
          <nav className="admin-nav">
            <a href="/admin">Dashboard</a>
            <a href="/admin/orders?status=PENDING" className="nav-with-badge">
              Orders
              {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
            </a>
            <a href="/admin/sales">Sales</a>
            <a href="/admin/inventory">Inventory</a>
            <a href="/admin/products">Products</a>
          </nav>
        </div>
        <form action={logout}>
          <button className="btn secondary" type="submit">Log out</button>
        </form>
      </div>
      {children}
    </div>
  );
}