export default function HomePage() {
  return (
    <div>
      <section className="hero">
        <h1>Fresh Carabao Milk from BukTamaCo</h1>
        <p>
          Rich, creamy 1 liter carabao milk — plain and flavored. Order online,
          pay cash on pickup, and take home the good stuff.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <a className="btn" href="/order/new">Place an order</a>
          <a className="btn secondary" href="/products" style={{ marginLeft: '0.75rem' }}>
            See products
          </a>
        </p>
      </section>

      <section className="grid" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3>100% Carabao Milk</h3>
          <p>Fresh 1 liter bottles, sourced locally.</p>
        </div>
        <div className="card">
          <h3>Plain &amp; Flavored</h3>
          <p>Classic plain, plus flavored varieties (more flavors coming soon).</p>
        </div>
        <div className="card">
          <h3>Cash on Pickup</h3>
          <p>Submit your order, we confirm, you pay cash and get a receipt.</p>
        </div>
      </section>
    </div>
  );
}