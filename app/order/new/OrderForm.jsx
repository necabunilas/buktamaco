'use client';

import { useMemo, useState } from 'react';
import { createOrder } from '../actions';

export default function OrderForm({ products }) {
  const [qtys, setQtys] = useState({}); // { [productId]: qty }

  const cart = useMemo(
    () =>
      products
        .map((p) => {
          // Parse the raw string; clamp only for display/total (not while typing).
          let qty = parseInt(qtys[p.id], 10);
          if (isNaN(qty) || qty < 0) qty = 0;
          if (qty > p.qty) qty = p.qty;
          return { productId: p.id, qty, price: p.price, name: p.name };
        })
        .filter((c) => c.qty > 0),
    [products, qtys]
  );

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  // Store the raw string exactly as typed — no coercion — so the field never
  // resets itself out from under the user (which was dropping items on blur).
  function setQty(product, value) {
    const cleaned = value.replace(/[^0-9]/g, ''); // digits only
    setQtys((prev) => ({ ...prev, [product.id]: cleaned }));
  }

  // On blur, clamp an over-stock entry down to the max so it matches the summary.
  function clampQty(product) {
    setQtys((prev) => {
      const raw = parseInt(prev[product.id], 10);
      if (!isNaN(raw) && raw > product.qty) {
        return { ...prev, [product.id]: String(product.qty) };
      }
      return prev;
    });
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
              name={`qty_${p.id}`}
              type="text"
              inputMode="numeric"
              value={qtys[p.id] ?? ''}
              placeholder="0"
              onChange={(e) => setQty(p, e.target.value)}
              onBlur={() => clampQty(p)}
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
          <label htmlFor="customerContact">Contact number *</label>
          <input id="customerContact" name="customerContact" required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="note">Note (optional)</label>
          <input id="note" name="note" style={{ width: '100%' }} />
        </div>

        {cart.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem' }}>Your order</h4>
            <table>
              <tbody>
                {cart.map((c) => (
                  <tr key={c.productId}>
                    <td>{c.name}</td>
                    <td style={{ textAlign: 'center' }}>×{c.qty}</td>
                    <td style={{ textAlign: 'right' }}>₱{(c.price * c.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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