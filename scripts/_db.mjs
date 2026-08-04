// Shared helpers for the backup/reset scripts.
import { createClient } from '@libsql/client';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';

// Load TURSO_* (and others) from .env.local so `npm run` scripts just work.
export function loadEnv() {
  if (!existsSync('.env.local')) return;
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/\s+#.*$/, '').trim();
  }
}

export function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:buktamaco.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export function dbLabel() {
  const url = process.env.TURSO_DATABASE_URL || 'file:buktamaco.db';
  return url.startsWith('file:') ? 'LOCAL file' : url.replace('libsql://', '');
}

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (v instanceof Uint8Array) return "X'" + Buffer.from(v).toString('hex') + "'";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

// Full SQL dump (schema + data) written to backups/. Self-contained: restore
// into a fresh DB with `turso db shell <db> < backups/<file>.sql`.
export async function backup(client, label = '') {
  const objs = (
    await client.execute(
      "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'"
    )
  ).rows;
  const tables = objs.filter((o) => o.type === 'table');
  const indexes = objs.filter((o) => o.type === 'index');

  let out = '-- BukTamaCo backup\nPRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\n';
  for (const t of tables) out += t.sql + ';\n';

  let rowCount = 0;
  for (const t of tables) {
    const res = await client.execute('SELECT * FROM "' + t.name + '"');
    for (const row of res.rows) {
      const cols = Object.keys(row);
      const vals = cols.map((c) => esc(row[c]));
      out += `INSERT INTO "${t.name}" (${cols.map((c) => '"' + c + '"').join(', ')}) VALUES (${vals.join(', ')});\n`;
      rowCount++;
    }
  }
  for (const i of indexes) out += i.sql + ';\n';
  out += 'COMMIT;\n';

  mkdirSync('backups', { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = `backups/buktamaco-${label ? label + '-' : ''}${stamp}.sql`;
  writeFileSync(file, out);
  return { file, rowCount, tables: tables.length };
}