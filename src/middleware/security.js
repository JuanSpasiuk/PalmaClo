import { randomUUID } from 'node:crypto';

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data:",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self'",
].join('; ');

export function securityHeaders(_req, res, next) {
  res.set({
    'Content-Security-Policy': CSP,
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  });
  next();
}

export function requestContext(req, res, next) {
  req.requestId = randomUUID();
  res.set('X-Request-Id', req.requestId);
  next();
}

export function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (!origin) return res.status(403).json({ error: 'Origen de solicitud inválido.' });

  try {
    const requestOrigin = new URL(origin);
    const expectedProtocol = req.secure ? 'https:' : 'http:';
    if (requestOrigin.host !== req.get('host') || requestOrigin.protocol !== expectedProtocol) {
      return res.status(403).json({ error: 'Origen de solicitud inválido.' });
    }
  } catch {
    return res.status(403).json({ error: 'Origen de solicitud inválido.' });
  }

  next();
}

export function createLoginRateLimiter({ maxAttempts = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const failures = new Map();
  const maxKeys = 10000;

  return function loginRateLimiter(req, res, next) {
    const key = req.ip;
    const now = Date.now();
    const entry = failures.get(key);

    if (entry && entry.resetAt > now && entry.count >= maxAttempts) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos y vuelve a probar.' });
    }

    req.recordLoginFailure = () => {
      const current = failures.get(key);
      if (current && current.resetAt > Date.now()) {
        current.count += 1;
        return;
      }
      if (failures.size >= maxKeys) {
        for (const [storedKey, storedEntry] of failures) {
          if (storedEntry.resetAt <= Date.now()) failures.delete(storedKey);
        }
        if (failures.size >= maxKeys) failures.delete(failures.keys().next().value);
      }
      failures.set(key, { count: 1, resetAt: Date.now() + windowMs });
    };

    next();
  };
}
