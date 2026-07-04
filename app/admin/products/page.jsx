import { db, products, inventory } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { addProduct, updateProduct } from '../actions';

export const dynamic = 'force-dynamic';

const ERROR_MSG = {
  missing: 'Name and SKU are required.',
  price: 'Price must be a number ≥ 0.',
  sku: 'That SKU already exists.',
};
const OK_MSG = { added: 'Product added.', updated: 'Product updated.' };

export default async function AdminProducts({ searchParams }) {
  if (!(await isStaff())) redirect('/admin/login');
  const sp = await searchParams;

  const rows = db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      flavor: products.flavor,
      unit: products.unit,
      price: products.price,
      active: products.active,
      qty: inventory.qtyOnHand,
    })
    .from(products)
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .orderBy(asc(products.id))
    .all();

  return (
    <div>
      <h1>Manage Products</h1>

      {sp?.error && <p style={{ color: 'var(--warn)' }}>{ERROR_MSG[sp.error] || 'Something went wrong.'}</p>}
      {sp?.ok && <p style={{ color: 'var(--ok)' }}>{OK_MSG[sp.ok] || 'Saved.'}</p>}

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Flavor</th>
            <th>Size</th>
            <th>Stock</th>
            <th>Price</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td style={{ color: 'var(--muted)' }}>{p.sku}</td>
              <td>{p.flavor || 'Plain'}</td>
              <td>{p.unit}</td>
              <td>{p.qty ?? 0}</td>
              <td colSpan={3}>
                <form action={updateProduct} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="hidden" name="productId" value={p.id} />
                  <span>₱</span>
                  <input name="price" type="number" step="0.01" min="0" defaultValue={p.price} style={{ width: '100px' }} />
                  <label style={{ display: 'flex', gap: '0.25rem', margin: 0, alignItems: 'center' }}>
                    <input type="checkbox" name="active" defaultChecked={!!p.active} /> active
                  </label>
                  <button className="btn secondary" type="submit">Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '1.5rem' }}>Add a product</h2>
      <form action={addProduct} className="card" style={{ maxWidth: 520 }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="name">Name *</label>
          <input id="name" name="name" placeholder="e.g. Choco Milk Custom" style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="sku">SKU *</label>
            <input id="sku" name="sku" placeholder="MILK-CHOCO-CUSTOM" style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="unit">Size / unit</label>
            <input id="unit" name="unit" placeholder="custom" style={{ width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="flavor">Flavor (blank = plain)</label>
            <input id="flavor" name="flavor" placeholder="Choco" style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="price">Price *</label>
            <input id="price" name="price" type="number" step="0.01" min="0" style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="stock">Starting stock</label>
            <input id="stock" name="stock" type="number" min="0" defaultValue={0} style={{ width: '100%' }} />
          </div>
        </div>
        <button className="btn" type="submit">Add product</button>
      </form>
    </div>
  );
}