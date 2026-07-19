import { db, orders, orderItems, receipts } from '@/lib/db';
import { and, eq, sql, desc } from 'drizzle-orm';
import { isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { formatPHDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

const peso = (n) =>
  '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AdminSales({ searchParams }) {
  if (!(await isStaff())) redirect('/admin/login');

  const sp = await searchParams;
  const from = (sp?.from || '').toString();
  const to = (sp?.to || '').toString();

  // Only paid orders count as sales; filter by Manila-day range on paid_at.
  const conds = [eq(orders.status, 'PAID')];
  if (from) conds.push(sql`date(${orders.paidAt}, '+8 hours') >= ${from}`);
  if (to) conds.push(sql`date(${orders.paidAt}, '+8 hours') <= ${to}`);
  const where = and(...conds);

  const summary = await db
    .select({ txns: sql`count(*)`, revenue: sql`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(where)
    .get();

  const itemsAgg = await db
    .select({ n: sql`coalesce(sum(${orderItems.qty}), 0)` })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(where)
    .get();

  const txns = await db
    .select({
      id: orders.id,
      name: orders.customerName,
      total: orders.total,
      paidAt: orders.paidAt,
      receiptNo: receipts.receiptNo,
    })
    .from(orders)
    .leftJoin(receipts, eq(receipts.orderId, orders.id))
    .where(where)
    .orderBy(desc(orders.paidAt))
    .all();

  const revenue = Number(summary.revenue);
  const count = Number(summary.txns);
  const itemsSold = Number(itemsAgg.n);
  const avg = count > 0 ? revenue / count : 0;

  // Quick-range links (Manila dates).
  const todayPH = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
  const monthStartPH = todayPH.slice(0, 8) + '01';
  const rangeLabel = from || to ? `${from || '…'} to ${to || '…'}` : 'All time';

  return (
    <div>
      <div className="page-head">
        <h1>Sales</h1>
      </div>

      <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
        <a className={`filter-tab${!from && !to ? ' active' : ''}`} href="/admin/sales">All time</a>
        <a className="filter-tab" href={`/admin/sales?from=${todayPH}&to=${todayPH}`}>Today</a>
        <a className="filter-tab" href={`/admin/sales?from=${monthStartPH}&to=${todayPH}`}>This month</a>
      </div>

      <form className="date-range card" method="get">
        <div>
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div>
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <button className="btn" type="submit">Apply</button>
      </form>

      <p style={{ color: 'var(--muted)', margin: '1rem 0 0.5rem' }}>Showing: <strong>{rangeLabel}</strong></p>

      <div className="stat-grid">
        <div className="stat-card green">
          <span className="stat-value">{peso(revenue)}</span>
          <span className="stat-label">Total sales</span>
          <span className="stat-sub">{count} transaction{count !== 1 ? 's' : ''}</span>
        </div>
        <div className="stat-card blue">
          <span className="stat-value">{itemsSold}</span>
          <span className="stat-label">Items sold</span>
        </div>
        <div className="stat-card amber">
          <span className="stat-value">{peso(avg)}</span>
          <span className="stat-label">Average sale</span>
        </div>
      </div>

      <h2 style={{ marginTop: '1.75rem' }}>Transactions</h2>
      {txns.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No sales in this range.</p>
      ) : (
        <table className="responsive-table" style={{ marginTop: '0.75rem' }}>
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Paid</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id}>
                <td data-label="Receipt">{t.receiptNo || '—'}</td>
                <td data-label="Order">#{t.id}</td>
                <td data-label="Customer">{t.name}</td>
                <td data-label="Paid" style={{ color: 'var(--muted)' }}>{formatPHDateTime(t.paidAt)}</td>
                <td data-label="Amount" style={{ textAlign: 'right', fontWeight: 700 }}>{peso(t.total)}</td>
                <td data-label=""><a href={`/admin/orders/${t.id}`}>Open →</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}