import { Router } from 'express';
import { getDashboardStats, getReportsOverview, getAccountsOverview } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Dashboard: all roles
router.get('/dashboard', getDashboardStats);

// Reports: admin, accounts, sales
router.get('/reports/overview', authorize('admin', 'accounts', 'sales'), getReportsOverview);

// Accounts: admin, accounts
router.get('/accounts/overview', authorize('admin', 'accounts'), getAccountsOverview);

export default router;
