import { db, orders, orderItems, products, receipts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import PrintButton from './PrintButton';
import { formatPHDateTime } from '@/lib/format';
import './receipt.css';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({ params }) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) notFound();

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) notFound();

  const receipt = await db.select().from(receipts).where(eq(receipts.orderId, orderId)).get();
  // Receipts only exist for paid orders.
  if (!receipt || order.status !== 'PAID') notFound();

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

  return (
    <div className="receipt-wrap">
      <PrintButton />
      <div className="receipt">
        <div className="receipt-head">
          <h2>BukTamaCo</h2>
          <p>Fresh Carabao Milk</p>
        </div>

        <div className="receipt-meta">
          <div><span>Receipt</span><strong>{receipt.receiptNo}</strong></div>
          <div><span>Order</span><strong>#{order.id}</strong></div>
          <div><span>Date</span><strong>{formatPHDateTime(order.paidAt)}</strong></div>
          <div><span>Customer</span><strong>{order.customerName}</strong></div>
        </div>

        <table className="receipt-items">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th>Amt</th></tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.name}{it.flavor ? ` (${it.flavor})` : ''}</td>
                <td>{it.qty}</td>
                <td>{it.unitPrice.toFixed(2)}</td>
                <td>{(it.unitPrice * it.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-totals">
          <div><span>Total</span><strong>₱{order.total.toFixed(2)}</strong></div>
          <div><span>Cash</span><strong>₱{(order.cashReceived ?? 0).toFixed(2)}</strong></div>
          <div><span>Change</span><strong>₱{(order.changeDue ?? 0).toFixed(2)}</strong></div>
        </div>

        <p className="receipt-foot">Thank you for your purchase!</p>
      </div>
    </div>
  );
}