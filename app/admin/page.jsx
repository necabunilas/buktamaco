import { db, orders, products, inventory } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  if (!(await isStaff())) redirect('/admin/login');

  const pending = await db.select({ c: sql`count(*)` }).from(orders).where(eq(orders.status, 'PENDING')).get();
  const confirmed = await db.select({ c: sql`count(*)` }).from(orders).where(eq(orders.status, 'CONFIRMED')).get();
  const paidToday = await db
    .select({ c: sql`count(*)`, total: sql`coalesce(sum(total),0)` })
    .from(orders)
    .where(sql`status = 'PAID' AND date(paid_at, '+8 hours') = date('now', '+8 hours')`)
    .get();

  const lowStock = await db
    .select({ name: products.name, qty: inventory.qtyOnHand, reorder: inventory.reorderLevel })
    .from(inventory)
    .leftJoin(products, eq(products.id, inventory.productId))
    .where(sql`${inventory.qtyOnHand} <= ${inventory.reorderLevel}`)
    .all();

  const paidTotal = Number(paidToday.total);

  return (
    <div>
      <div className="page-head">
        <h1>Dashboard</h1>
        <a className="btn btn-gold" href="/admin/orders">Go to orders →</a>
      </div>

      <div className="stat-grid">
        <a className="stat-card amber" href="/admin/orders">
          <span className="stat-value">{Number(pending.c)}</span>
          <span className="stat-label">Pending orders</span>
          <span className="stat-sub">Awaiting confirmation</span>
        </a>
        <a className="stat-card blue" href="/admin/orders">
          <span className="stat-value">{Number(confirmed.c)}</span>
          <span className="stat-label">Confirmed</span>
          <span className="stat-sub">Awaiting cash payment</span>
        </a>
        <div className="stat-card green">
          <span className="stat-value">{Number(paidToday.c)}</span>
          <span className="stat-label">Paid today</span>
          <span className="stat-sub">₱{paidTotal.toFixed(2)} collected</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-head">
          <h2 style={{ margin: 0 }}>Stock alerts</h2>
          <a href="/admin/inventory" style={{ fontWeight: 700 }}>Manage inventory →</a>
        </div>
        {lowStock.length === 0 ? (
          <p style={{ color: 'var(--ok)', margin: '0.75rem 0 0' }}>
            ✓ All products are well stocked — nothing needs restocking.
          </p>
        ) : (
          <>
            <p style={{ color: 'var(--warn)', fontWeight: 700, margin: '0.75rem 0 0.75rem' }}>
              {lowStock.length} item{lowStock.length > 1 ? 's' : ''} running low
            </p>
            <div className="alert-list">
              {lowStock.map((p, i) => (
                <div className="alert-item" key={i}>
                  <span>{p.name}</span>
                  <span className="badge out">{p.qty} left · reorder at {p.reorder}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}