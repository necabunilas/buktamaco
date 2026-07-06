import Database from 'better-sqlite3';

// Standalone seed (no Drizzle) so it runs with plain `node`.
// Resets the catalog (products + inventory) and reseeds. Safe while there are no real orders.
const db = new Database('buktamaco.db');
db.pragma('foreign_keys = ON');

// Real prices as of 2026-07-06. flavor: null = plain. stock = starting qty on hand.
// active: false = hidden from store (used for items without a confirmed price yet).
const seedProducts = [
  // Plain liter milks
  { name: 'Raw Milk 1L', sku: 'MILK-RAW-1L', flavor: null, unit: '1L', price: 90, stock: 30, active: true },
  { name: 'Pasteurized Milk 1L', sku: 'MILK-PASTEUR-1L', flavor: null, unit: '1L', price: 105, stock: 30, active: true },
  // Fresh Milk — 1L & 330ml
  { name: 'Fresh Milk 1L', sku: 'MILK-FRESH-1L', flavor: null, unit: '1L', price: 140, stock: 30, active: true },
  { name: 'Fresh Milk 330ml', sku: 'MILK-FRESH-330', flavor: null, unit: '330ml', price: 50, stock: 30, active: true },
  // Choco Milk — 1L & 330ml
  { name: 'Choco Milk 1L', sku: 'MILK-CHOCO-1L', flavor: 'Choco', unit: '1L', price: 145, stock: 30, active: true },
  { name: 'Choco Milk 330ml', sku: 'MILK-CHOCO-330', flavor: 'Choco', unit: '330ml', price: 55, stock: 30, active: true },
  // Melon — 330ml only
  { name: 'Melon Milk 330ml', sku: 'MILK-MELON-330', flavor: 'Melon', unit: '330ml', price: 55, stock: 30, active: true },
  // Pastillas — per pack
  { name: 'Pastillas', sku: 'PAST-120', flavor: null, unit: '120g pack', price: 100, stock: 20, active: true },
  // Greek Yogurt — kept but hidden until a price is set (placeholder price below)
  { name: 'Greek Yogurt 200ml', sku: 'YOG-GREEK-200', flavor: null, unit: '200ml', price: 0, stock: 20, active: false },
];

// Wipe catalog + dependent inventory so reseeding gives a clean, current set.
db.prepare('DELETE FROM inventory_movements').run();
db.prepare('DELETE FROM inventory').run();
db.prepare('DELETE FROM products').run();

const insertProduct = db.prepare(
  `INSERT INTO products (name, sku, flavor, price, unit, active)
   VALUES (@name, @sku, @flavor, @price, @unit, @active)`
);
const insertInventory = db.prepare(
  `INSERT INTO inventory (product_id, qty_on_hand, reorder_level)
   VALUES (?, ?, 10)`
);

const tx = db.transaction(() => {
  for (const p of seedProducts) {
    const r = insertProduct.run({ ...p, active: p.active ? 1 : 0 });
    insertInventory.run(Number(r.lastInsertRowid), p.stock);
  }
});
tx();

console.log(`Seed complete — ${seedProducts.length} products.`);
db.close();