import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const {
  DATABASE_URL: connectionString,
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

/**
 * Framkvæmir SQL fyrirspurn á gagnagrunn sem keyrir á `DATABASE_URL`,
 * skilgreint í `.env`
 *
 * @param {string} q Query til að keyra
 * @param {array} values Fylki af gildum fyrir query
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */

export async function query(_query, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(_query, values);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Bætir við undirskriftir.
 *
 * @param {array} data Fylki af gögnum fyrir undirskriftir
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
export async function insert(data) {
  const q = `
INSERT INTO applications
(name, email, phone, text, job)
VALUES
($1, $2, $3, $4, $5)`;
  const values = [data.name, data.email, data.phone, data.text, data.job];

  return query(q, values);
}

/**
 * Sækir allar undirskriftir
 *
 * @returns {array} Fylki af öllum undirskriftum
 */
export async function select() {
  const result = await query('SELECT * FROM applications ORDER BY id');

  return result.rows;
}

/**
 * Uppfærir undirskriftir sem unna.
 *
 * @param {string} id Id á undirskriftir
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
export async function update(id) {
  const q = `
UPDATE applications
SET processed = true, updated = current_timestamp
WHERE id = $1`;

  return query(q, [id]);
}
