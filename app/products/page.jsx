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
        <div className="grid" style={{ marginTop: '1.5rem' }}>
          {rows.map((p) => (
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
                  <span className={p.qty > 0 ? 'badge in-stock' : 'badge out'}>
                    {p.qty > 0 ? `${p.qty} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
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