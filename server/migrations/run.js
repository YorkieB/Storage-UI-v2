import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    console.log('📝 Executing migration: 001_initial_schema.sql');
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('Database schema created:');
    console.log('  - users');
    console.log('  - folders');
    console.log('  - files');
    console.log('  - albums');
    console.log('  - album_files');
    console.log('  - shared_links');
    console.log('  - oauth_tokens');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
