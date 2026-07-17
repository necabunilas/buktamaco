import { db, orders, orderItems, products, receipts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { confirmOrder, cancelOrder, markPaid } from '../../actions';
import { formatPHDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetail({ params, searchParams }) {
  if (!(await isStaff())) redirect('/admin/login');

  const { id } = await params;
  const sp = await searchParams;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) notFound();

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) notFound();

  const items = await db
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

  const receipt = await db.select().from(receipts).where(eq(receipts.orderId, orderId)).get();
  const open = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const itemCount = items.reduce((n, it) => n + it.qty, 0);

  return (
    <div>
      <p style={{ margin: '0 0 0.5rem' }}><a href="/admin/orders">← All orders</a></p>
      <div className="page-head">
        <h1 style={{ margin: 0 }}>Order #{order.id}</h1>
        <span className={`badge status-${order.status}`}>{order.status}</span>
      </div>

      <div className="card">
        <div className="order-head">
          <div>
            <p className="order-customer">{order.customerName}</p>
            {order.customerContact && (
              <a className="order-contact" href={`tel:${order.customerContact}`}>📞 {order.customerContact}</a>
            )}
          </div>
          <div className="order-meta">
            <span>Placed {formatPHDateTime(order.createdAt)}</span>
            {order.paidAt && <span>Paid {formatPHDateTime(order.paidAt)}</span>}
          </div>
        </div>
        {order.note && <p className="order-note">Note: {order.note}</p>}

        <table className="responsive-table" style={{ marginTop: '1rem' }}>
          <thead>
            <tr><th>Item</th><th>Qty</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td data-label="Item">{it.name} {it.flavor ? `(${it.flavor})` : ''}</td>
                <td data-label="Qty">{it.qty}</td>
                <td data-label="Price" style={{ textAlign: 'right' }}>₱{it.unitPrice.toFixed(2)}</td>
                <td data-label="Subtotal" style={{ textAlign: 'right' }}>₱{(it.unitPrice * it.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="order-total">
          <span>Total ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
          <strong>₱{order.total.toFixed(2)}</strong>
        </div>
      </div>

      {order.status === 'PAID' && (
        <div className="card paid-card" style={{ marginTop: '1rem' }}>
          <div className="paid-figures">
            <div><span>Cash received</span><strong>₱{(order.cashReceived ?? 0).toFixed(2)}</strong></div>
            <div><span>Change given</span><strong>₱{(order.changeDue ?? 0).toFixed(2)}</strong></div>
          </div>
          {receipt && (
            <a className="btn" href={`/order/${order.id}/receipt`}>View / print receipt ({receipt.receiptNo})</a>
          )}
        </div>
      )}

      {open && (
        <div className="card" style={{ marginTop: '1rem' }}>
          {order.status === 'PENDING' && (
            <div className="action-step">
              <div>
                <strong>Step 1 — Confirm the order</strong>
                <p style={{ margin: '0.15rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Let the customer know it's ready for pickup.
                </p>
              </div>
              <form action={confirmOrder}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="btn" type="submit">Confirm order</button>
              </form>
            </div>
          )}

          <div className="action-step" style={{ borderTop: order.status === 'PENDING' ? '1px solid var(--border)' : 'none', marginTop: order.status === 'PENDING' ? '1.25rem' : 0, paddingTop: order.status === 'PENDING' ? '1.25rem' : 0 }}>
            <form action={markPaid} style={{ width: '100%' }}>
              <input type="hidden" name="orderId" value={order.id} />
              <strong>{order.status === 'PENDING' ? 'Step 2 — ' : ''}Take cash payment</strong>
              <p style={{ margin: '0.15rem 0 0.6rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Amount due: <strong style={{ color: 'var(--accent-dark)' }}>₱{order.total.toFixed(2)}</strong>
              </p>
              <div className="cash-row">
                <input
                  id="cashReceived"
                  name="cashReceived"
                  type="number"
                  step="0.01"
                  min={order.total}
                  placeholder="Cash received"
                  style={{ width: '160px' }}
                />
                <button className="btn btn-gold" type="submit">Mark as paid</button>
              </div>
              {sp?.error === 'cash' && (
                <p style={{ color: 'var(--warn)', margin: '0.5rem 0 0' }}>Cash received must be at least the amount due.</p>
              )}
            </form>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
            <form action={cancelOrder}>
              <input type="hidden" name="orderId" value={order.id} />
              <button className="btn danger" type="submit">Cancel this order</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}