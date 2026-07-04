# Dairy Milk Shop — Plan / Spec

## Overview
A single Next.js app for a dairy milk business, combining three things:
1. **Info page** — public marketing/about content (products, pricing, contact, hours).
2. **Order + cash payment → receipt** — customers submit orders online; staff confirm, take cash in person, and issue a printable receipt.
3. **Inventory** — track dairy milk stock, decremented when orders are paid, with low-stock alerts.

## Users & devices
- **Customers** — browse info + product catalog, submit an order request from any device (phone/desktop) over the network. No login required (guest checkout with name + contact).
- **Staff** — password/role-gated admin area to confirm orders, take cash, issue receipts, and manage inventory + products. Used on a shop tablet/PC.

Runs on **one host** (shop PC or small VPS). SQLite lives on that host. Not offline-per-device.

## Stack
- **Next.js** (App Router)
- **SQLite** via `better-sqlite3`
- **Drizzle ORM** for schema + migrations
- **Receipts** — print-friendly HTML page → browser print / Save-as-PDF (no PDF library to start)
- **Staff auth** — simple password gate + role (start minimal; can harden later)
- **Styling** — plain CSS or Tailwind (TBD)

## Order flow (customer submits, staff fulfills)
1. Customer browses catalog, adds items, submits an order → status `PENDING`.
2. Order appears in staff admin `/admin/orders`.
3. Staff confirm availability, customer pays cash in person.
4. Staff enter `cash_received`, system computes `change`, marks order `PAID`.
5. On PAID:
   - inventory for each line item is decremented,
   - a `receipt_no` is issued,
   - receipt page becomes printable.
6. Staff can print/hand receipt; customer can also view it at `/order/[id]`.

Statuses: `PENDING → CONFIRMED → PAID → COMPLETED`, plus `CANCELLED`.

## Data model (first pass)
- **products**: id, name, sku, description, price, unit (e.g. bottle/liter), active
- **inventory**: id, product_id, qty_on_hand, reorder_level, updated_at
- **inventory_movements**: id, product_id, change (+/-), reason (restock/sale/adjustment), order_id?, created_at
- **orders**: id, customer_name, customer_contact, status, subtotal, total, cash_received, change_due, created_at, paid_at
- **order_items**: id, order_id, product_id, qty, unit_price
- **receipts**: id, order_id, receipt_no (sequential), issued_at

> `inventory_movements` gives an audit trail so stock changes are traceable, not just a running number.

## Page structure
```
/app
  /(public)
    /                 info / landing page
    /products         catalog
    /order/new        cart + submit order
    /order/[id]       order status + printable receipt
  /admin
    /                 dashboard (today's orders, low stock)
    /orders           list + take cash / mark paid / issue receipt
    /orders/[id]      order detail
    /inventory        stock levels, restock, low-stock alerts
    /products         manage catalog + prices
/lib
  /db                 drizzle schema + sqlite connection
  /receipts           receipt number generation, formatting
  /auth               staff password/role gate
```

## Build phases
1. **Scaffold** — Next.js app, SQLite + Drizzle wired up, base layout.
2. **Products + inventory** — schema, admin CRUD for products, stock levels, movements.
3. **Public info + catalog** — landing page, product listing.
4. **Ordering** — cart, submit order (PENDING), order status page.
5. **Staff fulfillment** — admin orders list, take cash, mark PAID, inventory decrement.
6. **Receipts** — receipt number issuance, printable receipt page.
7. **Auth** — gate the admin area.
8. **Polish** — low-stock alerts, dashboard, styling.

## Decisions (2026-07-01)
- **Shop name:** BukTamaCo
- **Products:** 1 liter carabao milk — plain, plus flavored variants (flavors provided later)
- **Receipts:** cash total only, no tax for now
- **Staff auth:** single password `admin` for now
- **Styling:** plain CSS
- **Deployment:** local dev only for now

## Still to provide later
- Flavor list for flavored carabao milk
- Prices per product
- Shop branding/contact details for info page