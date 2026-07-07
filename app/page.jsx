export default function HomePage() {
  return (
    <div>
      <section className="hero-banner">
        <img
          className="hero-logo"
          src="/badge.jpeg"
          alt="BUKTAMACO — Fresh Carabao Milk, from the hands of the Bukidnon Tagoloanon tribe of Malaybalay City"
        />
      </section>

      <section className="hero">
        <h1 className="hero-title">Fresh carabao milk, straight from Malaybalay.</h1>
        <p>
          Rich, creamy carabao milk — plain and flavored — crafted by the Bukidnon
          Tagoloanon tribe. Order online and pay cash on pickup.
        </p>
        <p>
          <a className="btn btn-gold btn-lg" href="/order/new">Place an order</a>
          <a className="link-cta" href="/products">or browse products →</a>
        </p>
      </section>

      <section className="trust-row">
        <span>🥛 Fresh daily</span>
        <span>🌾 Locally sourced</span>
        <span>💵 Cash on pickup</span>
      </section>

      <section className="story">
        <div className="story-art">
          <img src="/logo.jpeg" alt="BukTamaCo carabao" />
        </div>
        <div className="story-text">
          <h2>From the hands of the Bukidnon Tagoloanon tribe</h2>
          <p>
            Every bottle of BukTamaCo milk comes from carabaos raised in Malaybalay
            City, cared for by the Bukidnon Tagoloanon tribe. We keep it fresh,
            simple, and honest — milk the way it should be, from our community to
            your table.
          </p>
          <p>
            <a className="btn secondary" href="/products">See what we offer</a>
          </p>
        </div>
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={{ textAlign: 'center' }}>Why BukTamaCo</h2>
        <div className="grid" style={{ marginTop: '1.25rem' }}>
          <div className="card feature">
            <h3>100% Carabao Milk</h3>
            <p>Fresh bottles in 330ml and 1 liter, sourced locally in Malaybalay.</p>
          </div>
          <div className="card feature">
            <h3>Plain &amp; Flavored</h3>
            <p>Classic fresh milk, plus choco and melon. Greek yogurt and pastillas too.</p>
          </div>
          <div className="card feature">
            <h3>Simple Ordering</h3>
            <p>Submit your order online, we confirm, you pay cash and get a receipt.</p>
          </div>
        </div>
      </section>
    </div>
  );
}