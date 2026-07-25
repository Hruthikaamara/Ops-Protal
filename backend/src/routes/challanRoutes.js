import { Router } from 'express';
import {
  listChallans, getChallan, createChallan, updateChallanStatus, deleteChallan,
} from '../controllers/challanController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Admin and Sales manage challans
router.get('/', authorize('admin', 'sales'), listChallans);
router.get('/:id', authorize('admin', 'sales'), getChallan);
router.post('/', authorize('admin', 'sales'), createChallan);
router.put('/:id/status', authorize('admin', 'sales'), updateChallanStatus);
router.delete('/:id', authorize('admin', 'sales'), deleteChallan);

export default router;
