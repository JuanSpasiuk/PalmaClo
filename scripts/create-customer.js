import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';
import { hashPassword } from '../src/security/passwords.js';

function askText(question) {
  const terminal = createInterface({ input: stdin, output: stdout });
  return terminal.question(question).then((answer) => {
    terminal.close();
    return answer.trim();
  });
}

function askSecret(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Ejecuta este comando desde una terminal interactiva.');
  }

  stdout.write(question);
  stdin.setEncoding('utf8');
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdout.write('\n');
      error ? reject(error) : resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          finish(new Error('Operación cancelada.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
        } else if (character >= ' ') {
          value += character;
        }
      }
    };
    stdin.on('data', onData);
  });
}

async function createCustomer() {
  const name = await askText('Nombre del cliente: ');
  const email = (await askText('Correo para iniciar sesión: ')).toLowerCase();

  if (!name || name.length > 120) throw new Error('El nombre debe tener entre 1 y 120 caracteres.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Ingresa una dirección de correo válida.');
  }

  const password = await askSecret('Contraseña (mínimo 12 caracteres, no se mostrará): ');
  const confirmation = await askSecret('Repite la contraseña: ');
  if (password.length < 12 || password.length > 1024) {
    throw new Error('La contraseña debe tener entre 12 y 1024 caracteres.');
  }
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');

  const rootPassword = await askSecret('Contraseña de MySQL root (no se guardará): ');
  const connection = await mysql.createConnection({
    host: env.database.host,
    port: env.database.port,
    user: 'root',
    password: rootPassword,
    database: env.database.name,
  });

  try {
    const [existing] = await connection.execute('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]);
    if (existing.length) throw new Error('Ya existe una cuenta con ese correo.');

    const passwordHash = await hashPassword(password);
    await connection.execute(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'cliente'],
    );
    console.info('Cuenta de cliente creada. Inicia sesión con el correo ingresado y la contraseña elegida.');
  } finally {
    await connection.end();
  }
}

try {
  await createCustomer();
} catch (error) {
  console.error('No se pudo crear la cuenta de cliente: ' + error.message);
  process.exitCode = 1;
}