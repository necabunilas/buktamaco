import { db, orders } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { getCustomer } from '@/lib/customer-auth';
import { redirect } from 'next/navigation';
import { logoutCustomer } from './actions';
import { formatPHDateTime } from '@/lib/format';
import MapView from './MapView';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect('/account/login');

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt))
    .all();

  return (
    <div>
      <div className="page-head">
        <h1>My Account</h1>
        <form action={logoutCustomer}>
          <button className="btn secondary" type="submit">Log out</button>
        </form>
      </div>

      <div className="card">
        <p style={{ margin: '0 0 0.25rem' }}><strong>{customer.name}</strong>{customer.isVip && <span className="badge" style={{ marginLeft: '0.5rem', background: 'var(--gold)', color: '#4a2f00' }}>VIP</span>}</p>
        <p style={{ margin: '0 0 0.25rem', color: 'var(--muted)' }}>{customer.contact}</p>
        {customer.address && <p style={{ margin: 0, color: 'var(--muted)' }}>📍 {customer.address}</p>}
        {customer.latitude != null && customer.longitude != null && (
          <div style={{ marginTop: '0.75rem' }}>
            <MapView lat={customer.latitude} lng={customer.longitude} height={170} />
          </div>
        )}
      </div>

      <p style={{ marginTop: '1.25rem' }}>
        <a className="btn btn-gold" href="/order/new">Place a new order</a>
      </p>

      <h2 style={{ marginTop: '1.5rem' }}>My Orders</h2>
      {myOrders.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>You haven't placed any orders yet.</p>
      ) : (
        <table className="responsive-table" style={{ marginTop: '0.75rem' }}>
          <thead>
            <tr><th>Order</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th><th>Placed</th><th></th></tr>
          </thead>
          <tbody>
            {myOrders.map((o) => (
              <tr key={o.id}>
                <td data-label="Order">#{o.id}</td>
                <td data-label="Status"><span className={`badge status-${o.status}`}>{o.status}</span></td>
                <td data-label="Total" style={{ textAlign: 'right' }}>₱{o.total.toFixed(2)}</td>
                <td data-label="Placed" style={{ color: 'var(--muted)' }}>{formatPHDateTime(o.createdAt)}</td>
                <td data-label=""><a href={`/order/${o.id}`}>View →</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}