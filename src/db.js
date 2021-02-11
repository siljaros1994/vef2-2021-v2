import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = require('pg');
const connectionString = process.env.DATABASE_URL;

dotenv.config();

const {
  DATABASE_URL: connectionString,
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

/**
 * Framkvæmir SQL fyrirspurn á gagnagrunn sem keyrir á `DATABASE_URL`,
 * skilgreint í `.env`
 *
 * @param {string} q Query til að keyra
 * @param {array} values Fylki af gildum fyrir query
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function query(q, values = []) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q, values);

    return result;
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Bætir við undirskriftir.
 *
 * @param {array} data Fylki af gögnum fyrir undirskriftir
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function insert(data) {
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
async function select() {
  const result = await query('SELECT * FROM applications ORDER BY id');

  return result.rows;
}

/**
 * Uppfærir undirskriftir sem unna.
 *
 * @param {string} id Id á undirskriftir
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function update(id) {
  const q = `
UPDATE applications
SET processed = true, updated = current_timestamp
WHERE id = $1`;

  return query(q, [id]);
}

module.exports = {
  insert,
  select,
};