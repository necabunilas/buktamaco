import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Evaluated SQL default: current UTC timestamp as 'YYYY-MM-DD HH:MM:SS'.
const now = sql`(datetime('now'))`;

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
  createdAt: text('created_at').notNull().default(now),
});

// Current stock level per product
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  qtyOnHand: integer('qty_on_hand').notNull().default(0),
  reorderLevel: integer('reorder_level').notNull().default(10),
  updatedAt: text('updated_at').notNull().default(now),
});

// Audit trail of every stock change
export const inventoryMovements = sqliteTable('inventory_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  change: integer('change').notNull(), // +restock, -sale/adjustment
  reason: text('reason').notNull(), // 'restock' | 'sale' | 'adjustment'
  orderId: integer('order_id').references(() => orders.id),
  createdAt: text('created_at').notNull().default(now),
});

// Customers — one record per phone number; staff can tag VIP
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  contact: text('contact').notNull().unique(),
  address: text('address'),
  isVip: integer('is_vip', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(now),
});

// One-time passcodes for phone verification (registration & login).
export const otpCodes = sqliteTable('otp_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contact: text('contact').notNull(),
  code: text('code').notNull(),
  purpose: text('purpose').notNull(), // 'register' | 'login'
  name: text('name'), // pending registration name
  address: text('address'), // pending registration address
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(now),
});

// Logged-in customer sessions (cookie token -> customer).
export const customerSessions = sqliteTable('customer_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull().unique(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(now),
});

// Orders — customer submits, staff fulfills with cash or verified GCash
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerContact: text('customer_contact'),
  address: text('address'),
  status: text('status').notNull().default('PENDING'), // PENDING|CONFIRMED|PAID|COMPLETED|CANCELLED
  paymentMethod: text('payment_method').notNull().default('cash'), // 'cash' | 'gcash'
  gcashReference: text('gcash_reference'),
  total: real('total').notNull().default(0),
  cashReceived: real('cash_received'),
  changeDue: real('change_due'),
  note: text('note'),
  createdAt: text('created_at').notNull().default(now),
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
  issuedAt: text('issued_at').notNull().default(now),
});
