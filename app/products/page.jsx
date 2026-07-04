import { db, products, inventory } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  const rows = db
    .select({
      id: products.id,
      name: products.name,
      flavor: products.flavor,
      price: products.price,
      unit: products.unit,
      active: products.active,
      qty: inventory.qtyOnHand,
    })
    .from(products)
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(eq(products.active, true))
    .all();

  return (
    <div>
      <h1>Products</h1>
      <p style={{ color: 'var(--muted)' }}>Fresh 1 liter carabao milk.</p>

      {rows.length === 0 ? (
        <p>No products available yet.</p>
      ) : (
        <div className="grid" style={{ marginTop: '1rem' }}>
          {rows.map((p) => (
            <div className="card" key={p.id}>
              <h3 style={{ margin: '0 0 0.25rem' }}>{p.name}</h3>
              <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)' }}>
                {p.flavor ? p.flavor : 'Plain'} · {p.unit}
              </p>
              <p style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>
                ₱{p.price.toFixed(2)}
              </p>
              <span className={p.qty > 0 ? 'badge' : 'badge low-stock'}>
                {p.qty > 0 ? `${p.qty} in stock` : 'Out of stock'}
              </span>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: '1.5rem' }}>
        <a className="btn" href="/order/new">Place an order</a>
      </p>
    </div>
  );
}