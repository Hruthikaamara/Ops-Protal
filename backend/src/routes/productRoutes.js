import { Router } from 'express';
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct, adjustStock,
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Admin and Warehouse manage products
router.get('/', authorize('admin', 'warehouse'), listProducts);
router.get('/:id', authorize('admin', 'warehouse'), getProduct);
router.post('/', authorize('admin', 'warehouse'), createProduct);
router.put('/:id', authorize('admin', 'warehouse'), updateProduct);
router.delete('/:id', authorize('admin', 'warehouse'), deleteProduct);
router.post('/:id/adjust-stock', authorize('admin', 'warehouse'), adjustStock);

export default router;
