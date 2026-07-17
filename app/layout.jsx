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
          <a className="brand" href="/">
            <img src="/logo.jpeg" alt="" />
            BUKTAMACO
          </a>
          <nav>
            <a href="/products">Products</a>
            <a href="/order/new">Order</a>
            <a href="/admin">Staff</a>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <img src="/logo.jpeg" alt="" />
              <div>
                <span className="footer-name">BUKTAMACO</span>
                <p>Fresh carabao milk from Malaybalay, by the Bukidnon Tagoloanon tribe.</p>
              </div>
            </div>

            <div className="footer-social" aria-label="Social media">
              <a href="https://www.facebook.com/profile.php?id=61590406680358" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/buktamacodairy/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.15 0-3.52.01-4.76.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.9-.19-1.39-.32-1.71a2.9 2.9 0 0 0-.69-1.06 2.9 2.9 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.76-.07zm0 3.06a4.98 4.98 0 1 1 0 9.96 4.98 4.98 0 0 1 0-9.96zm0 8.21a3.23 3.23 0 1 0 0-6.46 3.23 3.23 0 0 0 0 6.46zm6.34-8.41a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-bottom">© 2026 BukTamaCo. All rights reserved.</div>
        </footer>
      </body>
    </html>
  );
}