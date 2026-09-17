// Neo4j connection helper.
// Creates a single shared driver instance for the whole app.
require('dotenv').config();
const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'neo4j';
// Which database inside the DBMS to use. Defaults to 'neo4j' if not set.
const DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

// Verify the connection early so errors are obvious on startup.
async function verifyConnection() {
  try {
    await driver.verifyConnectivity();
    console.log(`✅ Connected to Neo4j at ${URI}`);
    return true;
  } catch (err) {
    console.error('❌ Could not connect to Neo4j:', err.message);
    console.error('   Check your NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD in .env');
    return false;
  }
}

// Runs a Cypher query in a session and always closes the session.
async function runQuery(cypher, params = {}) {
  const session = driver.session({ database: DATABASE });
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

async function close() {
  await driver.close();
}

module.exports = { driver, runQuery, verifyConnection, close, DATABASE };
