'use client';

export default function PrintButton({ orderId }) {
  return (
    <div className="no-print receipt-actions">
      <a className="btn secondary" href={`/admin/orders/${orderId}`}>← Back to order</a>
      <button className="btn" onClick={() => window.print()}>Print receipt</button>
    </div>
  );
}