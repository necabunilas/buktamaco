'use client';

import { useMemo, useState } from 'react';
import { createOrder } from '../actions';

export default function OrderForm({ products }) {
  const [qtys, setQtys] = useState({}); // { [productId]: qty }

  const cart = useMemo(
    () =>
      products
        .map((p) => ({ productId: p.id, qty: qtys[p.id] || 0, price: p.price, name: p.name }))
        .filter((c) => c.qty > 0),
    [products, qtys]
  );

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  function setQty(product, value) {
    const max = product.qty;
    let qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > max) qty = max;
    setQtys((prev) => ({ ...prev, [product.id]: qty }));
  }

  return (
    <form action={createOrder} style={{ marginTop: '1rem' }}>
      <div className="grid">
        {products.map((p) => (
          <div className="card" key={p.id}>
            <h3 style={{ margin: '0 0 0.25rem' }}>{p.name}</h3>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)' }}>
              {p.flavor ? p.flavor : 'Plain'} · {p.unit}
            </p>
            <p style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>₱{p.price.toFixed(2)}</p>
            <label htmlFor={`qty-${p.id}`}>Quantity (max {p.qty})</label>
            <input
              id={`qty-${p.id}`}
              type="number"
              min="0"
              max={p.qty}
              value={qtys[p.id] || 0}
              onChange={(e) => setQty(p, e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Your Details</h3>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="customerName">Name *</label>
          <input id="customerName" name="customerName" required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="customerContact">Contact (phone/email)</label>
          <input id="customerContact" name="customerContact" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="note">Note (optional)</label>
          <input id="note" name="note" style={{ width: '100%' }} />
        </div>

        <input type="hidden" name="cart" value={JSON.stringify(cart.map((c) => ({ productId: c.productId, qty: c.qty })))} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          <strong>Total: ₱{total.toFixed(2)}</strong>
          <button className="btn" type="submit" disabled={cart.length === 0}>
            Submit Order
          </button>
        </div>
        {cart.length === 0 && (
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Add at least one item to submit.</p>
        )}
      </div>
    </form>
  );
}