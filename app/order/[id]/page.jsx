import { db, orders, orderItems, products, receipts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const STATUS_LABEL = {
  PENDING: 'Pending — waiting for staff to confirm',
  CONFIRMED: 'Confirmed — ready for pickup & cash payment',
  PAID: 'Paid — thank you!',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default async function OrderStatusPage({ params }) {
  const { id } = await params;
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

  return (
    <div>
      <h1>Order #{order.id}</h1>
      <p>
        <span className="badge">{order.status}</span>{' '}
        {STATUS_LABEL[order.status] || ''}
      </p>

      <div className="card" style={{ marginTop: '1rem' }}>
        <p style={{ margin: '0 0 0.25rem' }}>
          <strong>{order.customerName}</strong>
        </p>
        {order.customerContact && (
          <p style={{ margin: '0 0 0.25rem', color: 'var(--muted)' }}>{order.customerContact}</p>
        )}
        {order.note && <p style={{ margin: '0.5rem 0', color: 'var(--muted)' }}>Note: {order.note}</p>}

        <table style={{ marginTop: '0.75rem' }}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>
                  {it.name} {it.flavor ? `(${it.flavor})` : ''}
                </td>
                <td>{it.qty}</td>
                <td style={{ textAlign: 'right' }}>₱{it.unitPrice.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>₱{(it.unitPrice * it.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>
                Total
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>₱{order.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.status === 'PAID' && receipt && (
        <p style={{ marginTop: '1rem' }}>
          <a className="btn" href={`/order/${order.id}/receipt`}>View / print receipt ({receipt.receiptNo})</a>
        </p>
      )}

      <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>
        Save this page link to check your order status.
      </p>
    </div>
  );
}