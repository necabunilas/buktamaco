import Database from 'better-sqlite3';

// Standalone seed (no Drizzle) so it runs with plain `node`.
// Resets the catalog (products + inventory) and reseeds. Safe while there are no real orders.
const db = new Database('buktamaco.db');
db.pragma('foreign_keys = ON');

// ⚠️ PRICES BELOW ARE PLACEHOLDERS — update the `price` values to the real ones.
// flavor: null = plain. stock = starting qty on hand.
const seedProducts = [
  // Fresh Milk — 330ml & 1L, in Fresh Milk (plain) / Choco / Melon
  { name: 'Fresh Milk 330ml', sku: 'MILK-FRESH-330', flavor: null, unit: '330ml', price: 60, stock: 30 },
  { name: 'Fresh Milk 1L', sku: 'MILK-FRESH-1L', flavor: null, unit: '1L', price: 150, stock: 30 },
  { name: 'Choco Milk 330ml', sku: 'MILK-CHOCO-330', flavor: 'Choco', unit: '330ml', price: 65, stock: 30 },
  { name: 'Choco Milk 1L', sku: 'MILK-CHOCO-1L', flavor: 'Choco', unit: '1L', price: 160, stock: 30 },
  { name: 'Melon Milk 330ml', sku: 'MILK-MELON-330', flavor: 'Melon', unit: '330ml', price: 65, stock: 30 },
  { name: 'Melon Milk 1L', sku: 'MILK-MELON-1L', flavor: 'Melon', unit: '1L', price: 160, stock: 30 },
  // Greek Yogurt — 200ml
  { name: 'Greek Yogurt 200ml', sku: 'YOG-GREEK-200', flavor: null, unit: '200ml', price: 90, stock: 20 },
  // Pastillas Candy — 120g pack
  { name: 'Pastillas Candy 120g', sku: 'PAST-120', flavor: null, unit: '120g pack', price: 80, stock: 20 },
];

// Wipe catalog + dependent inventory so reseeding gives a clean, current set.
db.prepare('DELETE FROM inventory_movements').run();
db.prepare('DELETE FROM inventory').run();
db.prepare('DELETE FROM products').run();

const insertProduct = db.prepare(
  `INSERT INTO products (name, sku, flavor, price, unit, active)
   VALUES (@name, @sku, @flavor, @price, @unit, 1)`
);
const insertInventory = db.prepare(
  `INSERT INTO inventory (product_id, qty_on_hand, reorder_level)
   VALUES (?, ?, 10)`
);

const tx = db.transaction(() => {
  for (const p of seedProducts) {
    const r = insertProduct.run(p);
    insertInventory.run(Number(r.lastInsertRowid), p.stock);
  }
});
tx();

console.log(`Seed complete — ${seedProducts.length} products.`);
db.close();