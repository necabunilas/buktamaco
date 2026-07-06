'use server';

import { db, products, orders, orderItems, inventory, inventoryMovements, receipts } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { STAFF_PASSWORD, signInStaff, signOutStaff, isStaff } from '@/lib/auth';

export async function login(formData) {
  const password = (formData.get('password') || '').toString();
  if (password !== STAFF_PASSWORD) {
    redirect('/admin/login?error=1');
  }
  await signInStaff();
  redirect('/admin');
}

export async function logout() {
  await signOutStaff();
  redirect('/admin/login');
}

async function requireStaff() {
  if (!(await isStaff())) redirect('/admin/login');
}

export async function confirmOrder(formData) {
  await requireStaff();
  const orderId = Number(formData.get('orderId'));
  db.update(orders).set({ status: 'CONFIRMED' }).where(eq(orders.id, orderId)).run();
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
}

export async function cancelOrder(formData) {
  await requireStaff();
  const orderId = Number(formData.get('orderId'));
  db.update(orders).set({ status: 'CANCELLED' }).where(eq(orders.id, orderId)).run();
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
}

// Take cash → mark PAID → decrement inventory → issue receipt. Runs in one transaction.
export async function markPaid(formData) {
  await requireStaff();
  const orderId = Number(formData.get('orderId'));
  const cashReceived = parseFloat(formData.get('cashReceived'));

  const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) throw new Error('Order not found.');
  if (order.status === 'PAID' || order.status === 'COMPLETED') {
    throw new Error('Order is already paid.');
  }
  if (isNaN(cashReceived) || cashReceived < order.total) {
    redirect(`/admin/orders/${orderId}?error=cash`);
  }

  const items = db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();

  // Drizzle (better-sqlite3) runs this callback immediately and returns its result.
  db.transaction((tx) => {
    // Verify and decrement stock for each line.
    for (const it of items) {
      const inv = tx.select().from(inventory).where(eq(inventory.productId, it.productId)).get();
      if (!inv || inv.qtyOnHand < it.qty) {
        throw new Error('Not enough stock to fulfill this order.');
      }
    }
    for (const it of items) {
      tx.update(inventory)
        .set({ qtyOnHand: sql`${inventory.qtyOnHand} - ${it.qty}`, updatedAt: sql`(datetime('now'))` })
        .where(eq(inventory.productId, it.productId))
        .run();
      tx.insert(inventoryMovements)
        .values({ productId: it.productId, change: -it.qty, reason: 'sale', orderId })
        .run();
    }

    tx.update(orders)
      .set({
        status: 'PAID',
        cashReceived,
        changeDue: cashReceived - order.total,
        paidAt: sql`(datetime('now'))`,
      })
      .where(eq(orders.id, orderId))
      .run();

    // Issue a sequential receipt number: BTC-000001
    const count = tx.select({ c: sql`count(*)` }).from(receipts).get();
    const receiptNo = `BTC-${String(Number(count.c) + 1).padStart(6, '0')}`;
    tx.insert(receipts).values({ orderId, receiptNo }).run();
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath('/admin/inventory');
  redirect(`/order/${orderId}/receipt`);
}

export async function addProduct(formData) {
  await requireStaff();
  const name = (formData.get('name') || '').toString().trim();
  const sku = (formData.get('sku') || '').toString().trim();
  const unit = (formData.get('unit') || '').toString().trim() || '1L';
  const flavorRaw = (formData.get('flavor') || '').toString().trim();
  const flavor = flavorRaw === '' ? null : flavorRaw; // blank = plain
  const price = parseFloat(formData.get('price'));
  const stock = parseInt(formData.get('stock'), 10) || 0;

  if (!name || !sku) redirect('/admin/products?error=missing');
  if (isNaN(price) || price < 0) redirect('/admin/products?error=price');

  const existing = db.select().from(products).where(eq(products.sku, sku)).get();
  if (existing) redirect('/admin/products?error=sku');

  const r = db.insert(products).values({ name, sku, unit, flavor, price, active: true }).run();
  const productId = Number(r.lastInsertRowid);
  db.insert(inventory).values({ productId, qtyOnHand: stock, reorderLevel: 10 }).run();
  if (stock > 0) {
    db.insert(inventoryMovements).values({ productId, change: stock, reason: 'restock' }).run();
  }
  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  redirect('/admin/products?ok=added');
}

export async function updateProduct(formData) {
  await requireStaff();
  const productId = Number(formData.get('productId'));
  const price = parseFloat(formData.get('price'));
  const active = formData.get('active') === 'on';
  if (isNaN(price) || price < 0) redirect('/admin/products?error=price');

  db.update(products).set({ price, active }).where(eq(products.id, productId)).run();
  revalidatePath('/admin/products');
  revalidatePath('/products');
  redirect('/admin/products?ok=updated');
}

export async function restock(formData) {
  await requireStaff();
  const productId = Number(formData.get('productId'));
  const amount = parseInt(formData.get('amount'), 10);
  if (isNaN(amount) || amount === 0) return;

  db.update(inventory)
    .set({ qtyOnHand: sql`${inventory.qtyOnHand} + ${amount}`, updatedAt: sql`(datetime('now'))` })
    .where(eq(inventory.productId, productId))
    .run();
  db.insert(inventoryMovements)
    .values({ productId, change: amount, reason: amount > 0 ? 'restock' : 'adjustment' })
    .run();
  revalidatePath('/admin/inventory');
}