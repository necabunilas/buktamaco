// Safely erase transactional data for a fresh production launch.
// Keeps products + current inventory levels. Backs up first. Requires CONFIRM=ERASE.
import { loadEnv, getClient, backup, dbLabel } from './_db.mjs';

loadEnv();
const client = getClient();

if (process.env.CONFIRM !== 'ERASE') {
  console.error(`
⚠️  This ERASES all orders, receipts, customers, sessions, OTP codes,
    and stock-movement history from:  ${dbLabel()}
    Products and current inventory levels are KEPT.

    A backup is taken automatically before erasing.
    To proceed, re-run with:

        CONFIRM=ERASE npm run db:reset
`);
  process.exit(1);
}

console.log('Target:', dbLabel());
console.log('Backing up first...');
const b = await backup(client, 'pre-reset');
console.log('  saved', b.file, `(${b.rowCount} rows)`);

// Delete children before parents (FK-safe order).
const wipe = [
  'receipts',
  'order_items',
  'inventory_movements',
  'orders',
  'customer_sessions',
  'otp_codes',
  'customers',
];
for (const t of wipe) {
  await client.execute('DELETE FROM ' + t);
  console.log('  cleared', t);
}
// Reset auto-increment counters so IDs start fresh.
await client.execute(
  "DELETE FROM sqlite_sequence WHERE name IN ('orders','order_items','receipts','customers','inventory_movements','customer_sessions','otp_codes')"
);

console.log('\n✅ Production data erased. Products + inventory kept.');
console.log('   Restore point:', b.file);