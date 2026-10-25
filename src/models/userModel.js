import { pool } from '../config/database.js';

export async function getUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? LIMIT 1',
    [email],
  );
  return rows[0] ?? null;
}

export async function updatePasswordHash(userId, passwordHash) {
  await pool.execute('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, userId]);
}
