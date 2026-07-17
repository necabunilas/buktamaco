import { db, products, inventory } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { restock } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminInventory() {
  if (!(await isStaff())) redirect('/admin/login');

  const rows = await db
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
                <form action={restock} className="stock-adjust">
                  <input type="hidden" name="productId" value={r.productId} />
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    defaultValue={1}
                    className="stock-amount"
                    aria-label="Amount to add or remove"
                  />
                  <button className="stock-btn add" name="op" value="add" type="submit" title="Add stock">＋ Add</button>
                  <button className="stock-btn remove" name="op" value="remove" type="submit" title="Remove stock">－ Remove</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: 'var(--muted)', marginTop: '0.75rem' }}>
        Enter an amount, then tap <strong>Add</strong> to restock or <strong>Remove</strong> to take stock out. Every change is logged and stock never goes below zero.
      </p>
    </div>
  );
}