export default function manifest() {
  return {
    name: 'BukTamaCo — Fresh Carabao Milk',
    short_name: 'BukTamaCo',
    description: 'Order fresh carabao milk from BukTamaCo.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fcfaf5',
    theme_color: '#cc0000',
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };
}