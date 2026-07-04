import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Products — 1 liter carabao milk, plain or flavored
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  flavor: text('flavor'), // null = plain
  description: text('description'),
  price: real('price').notNull(),
  unit: text('unit').notNull().default('1L'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default("(datetime('now'))"),
});

// Current stock level per product
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  qtyOnHand: integer('qty_on_hand').notNull().default(0),
  reorderLevel: integer('reorder_level').notNull().default(10),
  updatedAt: text('updated_at').notNull().default("(datetime('now'))"),
});

// Audit trail of every stock change
export const inventoryMovements = sqliteTable('inventory_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  change: integer('change').notNull(), // +restock, -sale/adjustment
  reason: text('reason').notNull(), // 'restock' | 'sale' | 'adjustment'
  orderId: integer('order_id').references(() => orders.id),
  createdAt: text('created_at').notNull().default("(datetime('now'))"),
});

// Orders — customer submits, staff fulfills with cash
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerName: text('customer_name').notNull(),
  customerContact: text('customer_contact'),
  status: text('status').notNull().default('PENDING'), // PENDING|CONFIRMED|PAID|COMPLETED|CANCELLED
  total: real('total').notNull().default(0),
  cashReceived: real('cash_received'),
  changeDue: real('change_due'),
  note: text('note'),
  createdAt: text('created_at').notNull().default("(datetime('now'))"),
  paidAt: text('paid_at'),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  qty: integer('qty').notNull(),
  unitPrice: real('unit_price').notNull(),
});

export const receipts = sqliteTable('receipts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id).unique(),
  receiptNo: text('receipt_no').notNull().unique(),
  issuedAt: text('issued_at').notNull().default("(datetime('now'))"),
});
