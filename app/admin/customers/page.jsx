import { db, customers } from '@/lib/db';
import { sql, desc } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { toggleVip } from '../actions';

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
      orderCount: sql`(SELECT count(*) FROM orders o WHERE o.customer_id = ${customers.id})`,
      totalSpent: sql`(SELECT coalesce(sum(total),0) FROM orders o WHERE o.customer_id = ${customers.id} AND o.status = 'PAID')`,
    })
    .from(customers)
    .orderBy(desc(customers.createdAt))
    .all();

  return (
    <div>
      <div className="page-head">
        <h1>Customers</h1>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No registered customers yet.</p>
      ) : (
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Orders</th>
              <th style={{ textAlign: 'right' }}>Spent</th>
              <th>VIP</th>
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
                <tr key={c.id}>
                  <td data-label="Name">
                    {c.name} {c.isVip ? <span className="vip-badge">VIP</span> : null}
                  </td>
                  <td data-label="Contact"><a href={`tel:${c.contact}`}>{c.contact}</a></td>
                  <td data-label="Address">
                    {c.address || '—'}{' '}
                    {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer">Map →</a>}
                  </td>
                  <td data-label="Orders">{Number(c.orderCount)}</td>
                  <td data-label="Spent" style={{ textAlign: 'right' }}>{peso(c.totalSpent)}</td>
                  <td data-label="VIP">
                    <form action={toggleVip}>
                      <input type="hidden" name="customerId" value={c.id} />
                      <input type="hidden" name="makeVip" value={c.isVip ? '0' : '1'} />
                      <button className={`stock-btn ${c.isVip ? 'remove' : 'add'}`} type="submit">
                        {c.isVip ? 'Remove VIP' : 'Make VIP'}
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