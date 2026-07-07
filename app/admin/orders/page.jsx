import { db, orders } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { formatPHDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminOrders() {
  if (!(await isStaff())) redirect('/admin/login');

  const rows = db.select().from(orders).orderBy(desc(orders.createdAt)).all();

  return (
    <div>
      <h1>Orders</h1>
      {rows.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No orders yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th>Placed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customerName}</td>
                <td><span className={`badge status-${o.status}`}>{o.status}</span></td>
                <td style={{ textAlign: 'right' }}>₱{o.total.toFixed(2)}</td>
                <td style={{ color: 'var(--muted)' }}>{formatPHDateTime(o.createdAt)}</td>
                <td><a href={`/admin/orders/${o.id}`}>Open</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}