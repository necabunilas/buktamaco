import { db, products, inventory } from '@/lib/db';
import { eq } from 'drizzle-orm';
import OrderForm from './OrderForm';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      flavor: products.flavor,
      price: products.price,
      unit: products.unit,
      qty: inventory.qtyOnHand,
    })
    .from(products)
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(eq(products.active, true))
    .all();

  const available = rows.filter((r) => (r.qty ?? 0) > 0);

  return (
    <div>
      <h1>Place an Order</h1>
      <p style={{ color: 'var(--muted)' }}>
        Choose your milk, submit, and pay cash on pickup.
      </p>
      {available.length === 0 ? (
        <p>Sorry, everything is out of stock right now.</p>
      ) : (
        <OrderForm products={available} />
      )}
    </div>
  );
}