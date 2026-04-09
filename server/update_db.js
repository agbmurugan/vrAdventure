const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updatePrices() {
  try {
    await pool.query("UPDATE tour_packages SET price = 95000 WHERE title LIKE '%Bora Bora%'");
    await pool.query("UPDATE tour_packages SET price = 72000 WHERE title LIKE '%Swiss Alps%'");
    await pool.query("UPDATE tour_packages SET price = 68000 WHERE title LIKE '%Kyoto%'");
    console.log('Database updated with INR prices.');
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await pool.end();
  }
}

updatePrices();
