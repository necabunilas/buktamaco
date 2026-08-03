import { db, customers, orders } from '@/lib/db';
import { sql, desc, eq } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { toggleVip } from '../actions';
import { formatPHDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

const peso = (n) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AdminCustomers() {
  if (!(await isStaff())) redirect('/admin/login');

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      contact: customers.contact,
      address: customers.address,
      latitude: customers.latitude,
      longitude: customers.longitude,
      isVip: customers.isVip,
      createdAt: customers.createdAt,
      orderCount: sql`count(${orders.id})`,
      totalSpent: sql`coalesce(sum(case when ${orders.status} = 'PAID' then ${orders.total} else 0 end), 0)`,
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt))
    .all();

  const vipCount = rows.filter((c) => c.isVip).length;

  return (
    <div>
      <div className="page-head">
        <h1>Customers</h1>
      </div>

      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card blue">
          <span className="stat-value">{rows.length}</span>
          <span className="stat-label">Registered customers</span>
        </div>
        <div className="stat-card amber">
          <span className="stat-value">{vipCount}</span>
          <span className="stat-label">VIP customers</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No registered customers yet.</p>
      ) : (
        <table className="responsive-table customers-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Address</th>
              <th style={{ textAlign: 'center' }}>Orders</th>
              <th style={{ textAlign: 'right' }}>Spent</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const mapsUrl =
                c.latitude != null && c.longitude != null
                  ? `https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`
                  : c.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`
                    : null;
              return (
                <tr key={c.id} className={c.isVip ? 'vip-row' : ''}>
                  <td data-label="Customer">
                    <div className="cust-name">
                      {c.name}
                      {c.isVip ? <span className="vip-badge">VIP</span> : null}
                    </div>
                    <a className="cust-phone" href={`tel:${c.contact}`}>📞 {c.contact}</a>
                  </td>
                  <td data-label="Address" className="cust-address">
                    <div>
                      <span>{c.address || '—'}</span>{' '}
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                          Map →
                        </a>
                      )}
                    </div>
                  </td>
                  <td data-label="Orders" style={{ textAlign: 'center' }}>{Number(c.orderCount)}</td>
                  <td data-label="Spent" style={{ textAlign: 'right', fontWeight: 700 }}>{peso(c.totalSpent)}</td>
                  <td data-label="Joined" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {formatPHDateTime(c.createdAt)}
                  </td>
                  <td data-label="">
                    <form action={toggleVip}>
                      <input type="hidden" name="customerId" value={c.id} />
                      <input type="hidden" name="makeVip" value={c.isVip ? '0' : '1'} />
                      <button className={`stock-btn ${c.isVip ? 'remove' : 'add'}`} type="submit">
                        {c.isVip ? 'Remove VIP' : '★ Make VIP'}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}