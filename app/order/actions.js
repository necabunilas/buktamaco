'use server';

import { db, products, orders, orderItems } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';

// Creates a PENDING order from the customer's cart.
// The cart is submitted as a JSON string: [{ productId, qty }]
export async function createOrder(formData) {
  const customerName = (formData.get('customerName') || '').toString().trim();
  const customerContact = (formData.get('customerContact') || '').toString().trim();
  const note = (formData.get('note') || '').toString().trim();
  const cartRaw = (formData.get('cart') || '[]').toString();

  if (!customerName) throw new Error('Customer name is required.');

  let cart;
  try {
    cart = JSON.parse(cartRaw);
  } catch {
    throw new Error('Invalid cart.');
  }
  cart = (cart || []).filter((c) => c && c.productId && c.qty > 0);
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