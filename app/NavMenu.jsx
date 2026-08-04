'use client';

import { useState } from 'react';

export default function NavMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={`nav-toggle${open ? ' open' : ''}`}
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={`site-nav${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
        <a href="/products">Products</a>
        <a href="/order/new">Order</a>
        <a href="/account">Account</a>
        <a href="/admin">Staff</a>
      </nav>
    </>
  );
}