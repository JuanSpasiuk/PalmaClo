import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function readSession(req) {
  const token = req.cookies?.session;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'palmaclo',
      audience: 'palmaclo-web',
    });
    if (!payload.sub || !['admin', 'cliente'].includes(payload.rol)) return null;
    return { id: String(payload.sub), rol: payload.rol };
  } catch {
    return null;
  }
}

export function requirePageAuth(req, res, next) {
  const user = readSession(req);
  if (!user) return res.redirect('/login');
  req.user = user;
  next();
}

export function requireApiAuth(req, res, next) {
  const user = readSession(req);
  if (!user) return res.status(401).json({ error: 'Autenticación requerida.' });
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
  next();
}
