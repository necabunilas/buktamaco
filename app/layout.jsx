import './globals.css';

export const metadata = {
  title: 'BukTamaCo — Fresh Carabao Milk',
  description: 'Fresh 1 liter carabao milk, plain and flavored.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a className="brand" href="/">BukTamaCo</a>
          <nav>
            <a href="/products">Products</a>
            <a href="/order/new">Order</a>
            <a href="/admin">Staff</a>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <p>BukTamaCo — Fresh carabao milk.</p>
        </footer>
      </body>
    </html>
  );
}