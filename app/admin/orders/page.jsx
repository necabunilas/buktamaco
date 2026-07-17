import { db, orders } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { formatPHDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PAID', label: 'Paid' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default async function AdminOrders({ searchParams }) {
  if (!(await isStaff())) redirect('/admin/login');

  const sp = await searchParams;
  const status = (sp?.status || '').toString().toUpperCase();
  const active = FILTERS.some((f) => f.key === status) ? status : '';

  const base = db.select().from(orders);
  const rows = active
    ? await base.where(eq(orders.status, active)).orderBy(desc(orders.createdAt)).all()
    : await base.orderBy(desc(orders.createdAt)).all();

  return (
    <div>
      <div className="page-head">
        <h1>Orders</h1>
      </div>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <a
            key={f.key || 'all'}
            href={f.key ? `/admin/orders?status=${f.key}` : '/admin/orders'}
            className={`filter-tab${active === f.key ? ' active' : ''}`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>
          {active ? `No ${active.toLowerCase()} orders.` : 'No orders yet.'}
        </p>
      ) : (
        <table className="responsive-table" style={{ marginTop: '1rem' }}>
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
                <td data-label="Order">#{o.id}</td>
                <td data-label="Customer">{o.customerName}</td>
                <td data-label="Status"><span className={`badge status-${o.status}`}>{o.status}</span></td>
                <td data-label="Total" style={{ textAlign: 'right' }}>₱{o.total.toFixed(2)}</td>
                <td data-label="Placed" style={{ color: 'var(--muted)' }}>{formatPHDateTime(o.createdAt)}</td>
                <td data-label=""><a href={`/admin/orders/${o.id}`}>Open →</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}