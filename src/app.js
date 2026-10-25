import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { requireAdmin, requirePageAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { requestContext, securityHeaders } from './middleware/security.js';

const app = express();
const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

app.disable('x-powered-by');
app.use(requestContext);
app.use(securityHeaders);
app.use(express.json({ limit: '16kb', strict: true }));
app.use(cookieParser());

app.use('/assets/styles', express.static(path.join(PUBLIC_DIR, 'stylesheet'), { index: false, dotfiles: 'deny', maxAge: '1h' }));
app.use('/assets/scripts', express.static(path.join(PUBLIC_DIR, 'scripts'), { index: false, dotfiles: 'deny', maxAge: '1h' }));
app.use('/assets/images', express.static(path.join(PUBLIC_DIR, 'images', 'images'), { index: false, dotfiles: 'deny', maxAge: '1d' }));

app.get('/', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'home.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/home', (_req, res) => res.redirect('/'));
app.get('/admin', requirePageAuth, requireAdmin, (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
app.get('/home.html', (_req, res) => res.redirect('/'));
app.get('/admin.html', (_req, res) => res.redirect('/admin'));
app.get('/index.html', (_req, res) => res.redirect('/login'));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);

app.use('/api', notFound);
app.use((_req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html')));
app.use(errorHandler);

export default app;