import { Router } from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { requireApiAuth } from '../middleware/auth.js';
import { requireSameOrigin, createLoginRateLimiter } from '../middleware/security.js';

const router = Router();
const loginRateLimiter = createLoginRateLimiter();

router.post('/login', requireSameOrigin, loginRateLimiter, login);
router.post('/logout', requireSameOrigin, logout);
router.get('/me', requireApiAuth, me);

export default router;
