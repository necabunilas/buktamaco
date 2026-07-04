/** @type {import('drizzle-kit').Config} */
export default {
  schema: './lib/db/schema.js',
  out: './lib/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './buktamaco.db',
  },
};