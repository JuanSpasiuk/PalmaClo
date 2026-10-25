import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { login, logout, me } from '../controllers/authController.js';
import { verificarLogin, soloAdmin } from '../middlewares/auth.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');


router.get('/login', (_req, res) =>
  res.sendFile('index.html', { root: PUBLIC_DIR })
);

router.get('/home', verificarLogin, (_req, res) =>
  res.sendFile('home.html', { root: PUBLIC_DIR })
);

router.get('/admin', verificarLogin, soloAdmin, (_req, res) =>
  res.sendFile('admin.html', { root: PUBLIC_DIR })
);


router.get('/api/auth/me', verificarLogin, (req, res) => {
  res.json({
    ok: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      rol: req.user.rol
    }
  });
});


router.post('/api/auth/login', login);
router.post('/api/auth/logout', logout);
router.get('/api/auth/me', verificarLogin, me);


export default router;


