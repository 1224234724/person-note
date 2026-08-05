/**
 * One-off script: change the admin account username/password.
 * Usage: node scripts/change-admin.js
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = await mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'person_note_blog',
});

const NEW_USERNAME = 'wangyu';
const NEW_PASSWORD = 'hhxxttxs';

const [result] = await pool.query('UPDATE users SET username = ?, password = ? WHERE id = 1', [
  NEW_USERNAME,
  bcrypt.hashSync(NEW_PASSWORD, 10),
]);

if (result.affectedRows === 0) {
  console.error('No user found with id=1');
  process.exit(1);
}
console.log(`Admin account updated: username=${NEW_USERNAME}`);
await pool.end();
