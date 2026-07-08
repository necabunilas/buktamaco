import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Local dev falls back to a local SQLite file; production uses Turso via env vars.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:buktamaco.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export * from './schema';