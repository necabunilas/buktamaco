'use server';

import { db, products, orders, orderItems } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';

// Creates a PENDING order from the customer's cart.
// Each product's quantity is submitted as its own field: qty_<productId>
export async function createOrder(formData) {
  const customerName = (formData.get('customerName') || '').toString().trim();
  const customerContact = (formData.get('customerContact') || '').toString().trim();
  const note = (formData.get('note') || '').toString().trim();

  if (!customerName) throw new Error('Customer name is required.');
  if (!customerContact) throw new Error('Contact number is required.');

  // Collect every qty_<productId> field with a positive quantity.
  const cart = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('qty_')) continue;
    const productId = parseInt(key.slice(4), 10);
    const qty = parseInt(value, 10);
    if (productId && qty > 0) cart.push({ productId, qty });
  }
  if (cart.length === 0) throw new Error('Your cart is empty.');

  const ids = cart.map((c) => c.productId);
  const found = db.select().from(products).where(inArray(products.id, ids)).all();
  const priceById = new Map(found.map((p) => [p.id, p.price]));

  let total = 0;
  const lines = cart.map((c) => {
    const unitPrice = priceById.get(c.productId);
    if (unitPrice == null) throw new Error('A product in your cart is no longer available.');
    total += unitPrice * c.qty;
    return { productId: c.productId, qty: c.qty, unitPrice };
  });

  const result = db
    .insert(orders)
    .values({ customerName, customerContact, note, status: 'PENDING', total })
    .run();
  const orderId = Number(result.lastInsertRowid);

  for (const l of lines) {
    db.insert(orderItems).values({ orderId, ...l }).run();
  }

  redirect(`/order/${orderId}`);
}