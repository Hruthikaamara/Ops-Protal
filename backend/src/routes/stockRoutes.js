import { Router } from 'express';
import { listMovements } from '../controllers/stockController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'warehouse'), listMovements);

export default router;
