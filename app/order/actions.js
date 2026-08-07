'use server';

import { db, products, orders, orderItems, customers } from '@/lib/db';
import { inArray, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { sendSms } from '@/lib/sms';
import { getCustomer } from '@/lib/customer-auth';
import { VIP_DISCOUNT_PERCENT } from '@/lib/shop';

// Creates a PENDING order from the customer's cart. Requires a logged-in customer.
// Each product's quantity is submitted as its own field: qty_<productId>
export async function createOrder(formData) {
  const customer = await getCustomer();
  if (!customer) redirect('/account/login?next=order');

  const customerName = customer.name;
  const customerContact = customer.contact;
  const address = (formData.get('address') || '').toString().trim() || customer.address || '';
  const note = (formData.get('note') || '').toString().trim();
  const idempotencyKey = (formData.get('idempotencyKey') || '').toString().trim() || null;

  if (!address) throw new Error('Delivery address is required.');

  // Dedupe double submissions: if this form was already submitted, reuse that order.
  if (idempotencyKey) {
    const existing = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.idempotencyKey, idempotencyKey))
      .get();
    if (existing) redirect(`/order/${existing.id}`);
  }

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
  const found = await db.select().from(products).where(inArray(products.id, ids)).all();
  const priceById = new Map(found.map((p) => [p.id, p.price]));

  let subtotal = 0;
  const lines = cart.map((c) => {
    const unitPrice = priceById.get(c.productId);
    if (unitPrice == null) throw new Error('A product in your cart is no longer available.');
    subtotal += unitPrice * c.qty;
    return { productId: c.productId, qty: c.qty, unitPrice };
  });

  // Apply the VIP discount to the total for VIP customers.
  const discountPercent = customer.isVip ? VIP_DISCOUNT_PERCENT : 0;
  const total = subtotal * (1 - discountPercent / 100);

  let orderId;
  try {
    const result = await db
      .insert(orders)
      .values({
        customerId: customer.id,
        customerName,
        customerContact,
        address,
        latitude: customer.latitude,
        longitude: customer.longitude,
        note,
        status: 'PENDING',
        discountPercent,
        total,
        idempotencyKey,
      })
      .run();
    orderId = Number(result.lastInsertRowid);
  } catch (err) {
    // Race: a concurrent submit with the same key won the insert. Reuse it.
    if (idempotencyKey) {
      const existing = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.idempotencyKey, idempotencyKey))
        .get();
      if (existing) redirect(`/order/${existing.id}`);
    }
    throw err;
  }

  for (const l of lines) {
    await db.insert(orderItems).values({ orderId, ...l }).run();
  }

  // Keep the customer's saved address up to date with their latest order.
  if (address && address !== customer.address) {
    await db.update(customers).set({ address }).where(eq(customers.id, customer.id)).run();
  }

  // Notify the customer that we received the order.
  await sendSms(
    customerContact,
    `Hi ${customerName}, we received your order #${orderId} (PHP ${total.toFixed(2)}). We'll confirm it shortly. Salamat!`
  );

  // Notify staff of the new order (only on placement).
  if (process.env.STAFF_PHONE) {
    await sendSms(
      process.env.STAFF_PHONE,
      `New order #${orderId} from ${customerName} (${customerContact}) — PHP ${total.toFixed(2)}. Open the admin to confirm.`
    );
  }

  redirect(`/order/${orderId}`);
}