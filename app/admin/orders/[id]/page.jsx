import { db, orders, orderItems, products, receipts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { confirmOrder, cancelOrder, markPaid } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetail({ params, searchParams }) {
  if (!(await isStaff())) redirect('/admin/login');

  const { id } = await params;
  const sp = await searchParams;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) notFound();

  const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) notFound();

  const items = db
    .select({
      name: products.name,
      flavor: products.flavor,
      qty: orderItems.qty,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, orderId))
    .all();

  const receipt = db.select().from(receipts).where(eq(receipts.orderId, orderId)).get();
  const open = order.status === 'PENDING' || order.status === 'CONFIRMED';

  return (
    <div>
      <p><a href="/admin/orders">← All orders</a></p>
      <h1>Order #{order.id}</h1>
      <p>
        <span className={`badge status-${order.status}`}>{order.status}</span>
      </p>

      <div className="card">
        <p style={{ margin: '0 0 0.25rem' }}><strong>{order.customerName}</strong></p>
        {order.customerContact && <p style={{ margin: 0, color: 'var(--muted)' }}>{order.customerContact}</p>}
        {order.note && <p style={{ margin: '0.5rem 0', color: 'var(--muted)' }}>Note: {order.note}</p>}

        <table style={{ marginTop: '0.75rem' }}>
          <thead>
            <tr><th>Item</th><th>Qty</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.name} {it.flavor ? `(${it.flavor})` : ''}</td>
                <td>{it.qty}</td>
                <td style={{ textAlign: 'right' }}>₱{it.unitPrice.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>₱{(it.unitPrice * it.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>₱{order.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.status === 'PAID' && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>Cash received: ₱{(order.cashReceived ?? 0).toFixed(2)}</p>
          <p style={{ margin: '0.25rem 0' }}>Change: ₱{(order.changeDue ?? 0).toFixed(2)}</p>
          {receipt && (
            <p style={{ marginBottom: 0 }}>
              <a className="btn" href={`/order/${order.id}/receipt`}>View / print receipt ({receipt.receiptNo})</a>
            </p>
          )}
        </div>
      )}

      {open && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Actions</h3>

          {order.status === 'PENDING' && (
            <form action={confirmOrder} style={{ display: 'inline' }}>
              <input type="hidden" name="orderId" value={order.id} />
              <button className="btn" type="submit">Confirm order</button>
            </form>
          )}

          <form action={markPaid} style={{ marginTop: '1rem' }}>
            <input type="hidden" name="orderId" value={order.id} />
            <label htmlFor="cashReceived">Cash received (total ₱{order.total.toFixed(2)})</label>
            <input id="cashReceived" name="cashReceived" type="number" step="0.01" min={order.total} style={{ width: '160px' }} />
            {sp?.error === 'cash' && (
              <p style={{ color: 'var(--warn)' }}>Cash received must be at least the order total.</p>
            )}
            <div style={{ marginTop: '0.5rem' }}>
              <button className="btn" type="submit">Take cash &amp; mark paid</button>
            </div>
          </form>

          <form action={cancelOrder} style={{ marginTop: '1rem' }}>
            <input type="hidden" name="orderId" value={order.id} />
            <button className="btn secondary" type="submit">Cancel order</button>
          </form>
        </div>
      )}
    </div>
  );
}