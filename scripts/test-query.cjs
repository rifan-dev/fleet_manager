const path = require('path');
const { Client } = require(path.resolve(__dirname, '../lib/db/node_modules/pg'));

async function test() {
  const client = new Client({
    connectionString: 'postgresql://postgres:' + encodeURIComponent('R@7356844902inan') + '@db.yokdhyfwgoythppmubgs.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    const sql = 'select "id", "make", "model", "year", "category", "daily_rate", "seats", "transmission", "fuel_type", "rating", "image_url", "is_available", "license_plate", "description", "created_at" from "vehicles"';
    const res = await client.query(sql);
    console.log('Exact Drizzle query succeeded! Count:', res.rows.length);
  } catch(e) {
    console.error('Exact SQL error:', e.message, e.code, e.detail, e.hint);
  }
  await client.end();
}
test().catch(console.error);
