import { createClient } from '@libsql/client';

// Uses Turso when TURSO_DATABASE_URL is set, else a local SQLite file.
// Resets the catalog (products + inventory) and reseeds. Safe while there are no real orders.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:buktamaco.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Real prices as of 2026-07-06. flavor: null = plain. active 0 = hidden from store.
const seedProducts = [
  { name: 'Raw Milk 1L', sku: 'MILK-RAW-1L', flavor: null, unit: '1L', price: 90, stock: 30, active: 1 },
  { name: 'Pasteurized Milk 1L', sku: 'MILK-PASTEUR-1L', flavor: null, unit: '1L', price: 105, stock: 30, active: 1 },
  { name: 'Fresh Milk 1L', sku: 'MILK-FRESH-1L', flavor: null, unit: '1L', price: 140, stock: 30, active: 1 },
  { name: 'Fresh Milk 330ml', sku: 'MILK-FRESH-330', flavor: null, unit: '330ml', price: 50, stock: 30, active: 1 },
  { name: 'Choco Milk 1L', sku: 'MILK-CHOCO-1L', flavor: 'Choco', unit: '1L', price: 145, stock: 30, active: 1 },
  { name: 'Choco Milk 330ml', sku: 'MILK-CHOCO-330', flavor: 'Choco', unit: '330ml', price: 55, stock: 30, active: 1 },
  { name: 'Melon Milk 330ml', sku: 'MILK-MELON-330', flavor: 'Melon', unit: '330ml', price: 55, stock: 30, active: 1 },
  { name: 'Pastillas', sku: 'PAST-120', flavor: null, unit: '120g pack', price: 100, stock: 20, active: 1 },
  { name: 'Greek Yogurt 200ml', sku: 'YOG-GREEK-200', flavor: null, unit: '200ml', price: 0, stock: 20, active: 0 },
];

// Wipe catalog + dependent inventory so reseeding gives a clean, current set.
await client.execute('DELETE FROM inventory_movements');
await client.execute('DELETE FROM inventory');
await client.execute('DELETE FROM products');

for (const p of seedProducts) {
  const res = await client.execute({
    sql: `INSERT INTO products (name, sku, flavor, price, unit, active)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [p.name, p.sku, p.flavor, p.price, p.unit, p.active],
  });
  const productId = Number(res.lastInsertRowid);
  await client.execute({
    sql: `INSERT INTO inventory (product_id, qty_on_hand, reorder_level) VALUES (?, ?, 10)`,
    args: [productId, p.stock],
  });
}

console.log(`Seed complete — ${seedProducts.length} products.`);