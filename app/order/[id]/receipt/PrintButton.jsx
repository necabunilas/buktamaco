'use client';

export default function PrintButton() {
  return (
    <div className="no-print" style={{ marginBottom: '1rem' }}>
      <button className="btn" onClick={() => window.print()}>Print receipt</button>
    </div>
  );
}