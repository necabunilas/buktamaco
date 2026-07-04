import { db, orders, products, inventory } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  if (!(await isStaff())) redirect('/admin/login');

  const pending = db.select({ c: sql`count(*)` }).from(orders).where(eq(orders.status, 'PENDING')).get();
  const confirmed = db.select({ c: sql`count(*)` }).from(orders).where(eq(orders.status, 'CONFIRMED')).get();
  const paidToday = db
    .select({ c: sql`count(*)`, total: sql`coalesce(sum(total),0)` })
    .from(orders)
    .where(sql`status = 'PAID' AND date(paid_at) = date('now')`)
    .get();

  const lowStock = db
    .select({ name: products.name, qty: inventory.qtyOnHand, reorder: inventory.reorderLevel })
    .from(inventory)
    .leftJoin(products, eq(products.id, inventory.productId))
    .where(sql`${inventory.qtyOnHand} <= ${inventory.reorderLevel}`)
    .all();

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid">
        <div className="card">
          <h3 style={{ margin: 0 }}>{Number(pending.c)}</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Pending orders</p>
        </div>
        <div className="card">
          <h3 style={{ margin: 0 }}>{Number(confirmed.c)}</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Confirmed (awaiting cash)</p>
        </div>
        <div className="card">
          <h3 style={{ margin: 0 }}>{Number(paidToday.c)}</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Paid today · ₱{Number(paidToday.total).toFixed(2)}
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: '1.5rem' }}>Low stock</h2>
      {lowStock.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Everything is above its reorder level.</p>
      ) : (
        <ul>
          {lowStock.map((p, i) => (
            <li key={i} className="low-stock">
              {p.name} — {p.qty} left (reorder at {p.reorder})
            </li>
          ))}
        </ul>
      )}
      <p style={{ marginTop: '1rem' }}>
        <a className="btn" href="/admin/orders">Go to orders</a>
      </p>
    </div>
  );
}