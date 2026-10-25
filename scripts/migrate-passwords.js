import { pool } from '../src/config/database.js';
import { hashPassword, isPasswordHash } from '../src/security/passwords.js';

async function migrate() {
  const connection = await pool.getConnection();
  let upgraded = 0;

  try {
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT id, password FROM usuarios FOR UPDATE');

    for (const user of users) {
      if (typeof user.password !== 'string') {
        throw new Error('Se encontró una contraseña con formato no compatible.');
      }
      if (isPasswordHash(user.password)) continue;

      const passwordHash = await hashPassword(user.password);
      await connection.execute('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, user.id]);
      upgraded += 1;
    }

    await connection.commit();
    console.info('Migración terminada. Contraseñas actualizadas: ' + upgraded + '.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

try {
  await migrate();
} catch (error) {
  console.error('No se pudo completar la migración: ' + error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
