import { Router } from 'express';
import { archiveProduct, createProduct, listArchivedProducts, listProducts, restoreProduct, updateProduct } from '../controllers/productController.js';
import { requireAdmin, requireApiAuth } from '../middleware/auth.js';
import { requireSameOrigin } from '../middleware/security.js';

const router = Router();

// El catálogo es público; cualquier cambio de inventario sigue requiriendo sesión de administrador.
router.get('/', listProducts);
router.get('/archived', requireApiAuth, requireAdmin, listArchivedProducts);
router.post('/', requireSameOrigin, requireApiAuth, requireAdmin, createProduct);
router.put('/:id', requireSameOrigin, requireApiAuth, requireAdmin, updateProduct);
router.patch('/:id/restore', requireSameOrigin, requireApiAuth, requireAdmin, restoreProduct);
router.delete('/:id', requireSameOrigin, requireApiAuth, requireAdmin, archiveProduct);

export default router;
