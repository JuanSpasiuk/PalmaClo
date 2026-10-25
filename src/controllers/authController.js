import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getUserByEmail, updatePasswordHash } from '../models/userModel.js';
import { hashPassword, isPasswordHash, verifyPassword } from '../security/passwords.js';

const SESSION_TTL_MS = 30 * 60 * 1000;
const DUMMY_PASSWORD_HASH = hashPassword('invalid-account-lookup-placeholder');
const sessionCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict',
  path: '/',
  maxAge: SESSION_TTL_MS,
};

function validEmail(value) {
  return typeof value === 'string'
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function login(req, res, next) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;

  if (!validEmail(email) || typeof password !== 'string' || password.length < 1 || password.length > 1024) {
    req.recordLoginFailure?.();
    return res.status(400).json({ error: 'Revisa el correo y la contraseña.' });
  }

  try {
    const user = await getUserByEmail(email);
    const passwordMatches = await verifyPassword(password, user?.password ?? await DUMMY_PASSWORD_HASH);

    if (!user || !passwordMatches || !['admin', 'cliente'].includes(user.rol)) {
      req.recordLoginFailure?.();
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    if (!isPasswordHash(user.password)) {
      const upgradedHash = await hashPassword(password);
      await updatePasswordHash(user.id, upgradedHash);
    }

    const token = jwt.sign(
      { rol: user.rol },
      env.jwtSecret,
      {
        algorithm: 'HS256',
        subject: String(user.id),
        issuer: 'palmaclo',
        audience: 'palmaclo-web',
        expiresIn: '30m',
      },
    );

    res.cookie('session', token, sessionCookieOptions);
    res.json({
      ok: true,
      user: { nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (error) {
    next(error);
  }
}

export function logout(_req, res) {
  res.clearCookie('session', {
    httpOnly: sessionCookieOptions.httpOnly,
    secure: sessionCookieOptions.secure,
    sameSite: sessionCookieOptions.sameSite,
    path: sessionCookieOptions.path,
  });
  res.status(204).end();
}

export function me(req, res) {
  res.json({ ok: true, user: req.user });
}
