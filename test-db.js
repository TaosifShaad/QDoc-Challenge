require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    statement_timeout: 10000,
  });

  const hardTimeout = setTimeout(() => {
    console.error('❌ Timed out after 15s while connecting/querying database');
    process.exit(1);
  }, 15000);

  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const res = await client.query('SELECT NOW()');
    console.log('✅ Query executed successfully:', res.rows[0]);
    
    await client.end();
    console.log('✅ Connection closed');
    clearTimeout(hardTimeout);
  } catch (error) {
    clearTimeout(hardTimeout);
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();