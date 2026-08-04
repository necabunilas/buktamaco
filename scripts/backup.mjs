// Dump the whole database to backups/<timestamp>.sql
import { loadEnv, getClient, backup, dbLabel } from './_db.mjs';

loadEnv();
console.log('Backing up:', dbLabel());
const r = await backup(getClient());
console.log(`✅ Backup written: ${r.file} (${r.tables} tables, ${r.rowCount} rows)`);