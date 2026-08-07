'use client';

import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createOrder } from '../actions';
import { VIP_DISCOUNT_PERCENT } from '@/lib/shop';

// Disables itself while the order is submitting so a double-tap can't
// fire the server action twice (paired with a server-side idempotency key).
function SubmitButton({ disabled }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={disabled || pending}>
      {pending ? 'Submitting…' : 'Submit Order'}
    </button>
  );
}

export default function OrderForm({ products, customer }) {
  const [qtys, setQtys] = useState({}); // { [productId]: qty }
  // One key per form load; reused if the user somehow submits twice.
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1e9)}`
  );

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

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const discountPct = customer.isVip ? VIP_DISCOUNT_PERCENT : 0;
  const discount = subtotal * (discountPct / 100);
  const total = subtotal - discount;

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

  // Remove a line from the order (clears its quantity field).
  function removeItem(productId) {
    setQtys((prev) => ({ ...prev, [productId]: '' }));
  }

  return (
    <form action={createOrder} style={{ marginTop: '1rem' }}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="grid">
        {products.map((p) => (
          <div className="product-card" key={p.id}>
            <div className="product-media">
              {p.flavor && <span className="flavor-tag">{p.flavor}</span>}
              <img src="/logo.jpeg" alt="" />
            </div>
            <div className="product-body">
              <h3 className="product-name">{p.name}</h3>
              <span className="product-unit">{p.flavor ? p.flavor : 'Plain'} · {p.unit}</span>
              <span className="product-price">₱{p.price.toFixed(2)}</span>
              <div className="product-foot">
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
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Delivery Details</h3>
        <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)' }}>
          Ordering as <strong style={{ color: 'var(--ink)' }}>{customer.name}</strong> · {customer.contact}
        </p>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="address">Delivery address *</label>
          <input id="address" name="address" required defaultValue={customer.address || ''} placeholder="House/street, barangay, city" style={{ width: '100%' }} />
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
                    <td style={{ textAlign: 'right', width: 34 }}>
                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => removeItem(c.productId)}
                        aria-label={`Remove ${c.name}`}
                        title="Remove"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {discountPct > 0 && cart.length > 0 && (
          <div style={{ marginTop: '1rem', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-dark)' }}>
              <span>VIP discount ({discountPct}%)</span><span>−₱{discount.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          <strong>Total: ₱{total.toFixed(2)}</strong>
          <SubmitButton disabled={cart.length === 0} />
        </div>
        {cart.length === 0 && (
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Add at least one item to submit.</p>
        )}
      </div>
    </form>
  );
}