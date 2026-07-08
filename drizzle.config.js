/** @type {import('drizzle-kit').Config} */
export default {
  schema: './lib/db/schema.js',
  out: './lib/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || 'file:buktamaco.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};