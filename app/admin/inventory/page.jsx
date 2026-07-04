import { db, products, inventory } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { restock } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminInventory() {
  if (!(await isStaff())) redirect('/admin/login');

  const rows = db
    .select({
      productId: products.id,
      name: products.name,
      flavor: products.flavor,
      qty: inventory.qtyOnHand,
      reorder: inventory.reorderLevel,
    })
    .from(inventory)
    .leftJoin(products, eq(products.id, inventory.productId))
    .all();

  return (
    <div>
      <h1>Inventory</h1>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>On hand</th>
            <th>Reorder at</th>
            <th>Adjust</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.productId}>
              <td>
                {r.name} {r.flavor ? `(${r.flavor})` : ''}
              </td>
              <td className={r.qty <= r.reorder ? 'low-stock' : ''}>{r.qty}</td>
              <td>{r.reorder}</td>
              <td>
                <form action={restock} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input type="hidden" name="productId" value={r.productId} />
                  <input
                    name="amount"
                    type="number"
                    defaultValue={12}
                    style={{ width: '90px' }}
                    aria-label="Adjust amount (negative to remove)"
                  />
                  <button className="btn secondary" type="submit">Apply</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: 'var(--muted)', marginTop: '0.75rem' }}>
        Enter a positive number to restock, or a negative number to remove stock. Every change is logged.
      </p>
    </div>
  );
}