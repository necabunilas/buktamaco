'use server';

import { db, products, orders, orderItems } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { sendSms } from '@/lib/sms';

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
  const found = await db.select().from(products).where(inArray(products.id, ids)).all();
  const priceById = new Map(found.map((p) => [p.id, p.price]));

  let total = 0;
  const lines = cart.map((c) => {
    const unitPrice = priceById.get(c.productId);
    if (unitPrice == null) throw new Error('A product in your cart is no longer available.');
    total += unitPrice * c.qty;
    return { productId: c.productId, qty: c.qty, unitPrice };
  });

  const result = await db
    .insert(orders)
    .values({ customerName, customerContact, note, status: 'PENDING', total })
    .run();
  const orderId = Number(result.lastInsertRowid);

  for (const l of lines) {
    await db.insert(orderItems).values({ orderId, ...l }).run();
  }

  // Notify the customer that we received the order.
  await sendSms(
    customerContact,
    `BukTamaCo: Hi ${customerName}, we received your order #${orderId} (PHP ${total.toFixed(2)}). We'll confirm it shortly. Salamat!`
  );

  // Staff notification disabled for now to save on SMS cost. To re-enable,
  // uncomment and set STAFF_PHONE.
  // if (process.env.STAFF_PHONE) {
  //   await sendSms(
  //     process.env.STAFF_PHONE,
  //     `New BukTamaCo order #${orderId} from ${customerName} (${customerContact}) — PHP ${total.toFixed(2)}. Open the admin to confirm.`
  //   );
  // }

  redirect(`/order/${orderId}`);
}