// One-off helper: creates the target database (Enterprise Edition only).
// Run with: node create-db.js
require('dotenv').config();
const { driver, verifyConnection, close, DATABASE } = require('./db');

async function main() {
  const ok = await verifyConnection();
  if (!ok) {
    await close();
    process.exit(1);
  }

  // CREATE DATABASE must run against the system database.
  const session = driver.session({ database: 'system' });
  try {
    console.log(`🗄️  Creating database "${DATABASE}" (if it doesn't exist)...`);
    await session.run(`CREATE DATABASE \`${DATABASE}\` IF NOT EXISTS`);
    console.log('✅ Database is ready.');
  } catch (err) {
    console.error('❌ Could not create database:', err.message);
    console.error('   Note: named databases require Neo4j Enterprise Edition.');
  } finally {
    await session.close();
    await close();
  }
}

main();
