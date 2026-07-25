import { Router } from 'express';
import authRoutes from './authRoutes.js';
import customerRoutes from './customerRoutes.js';
import productRoutes from './productRoutes.js';
import stockRoutes from './stockRoutes.js';
import challanRoutes from './challanRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/stock-movements', stockRoutes);
router.use('/challans', challanRoutes);
router.use('/', dashboardRoutes);

export default router;
