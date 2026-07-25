import { Router } from 'express';
import {
  listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer,
  addNote, deleteNote,
} from '../controllers/customerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// Admin and Sales have full CRUD
router.get('/', authorize('admin', 'sales'), listCustomers);
router.get('/:id', authorize('admin', 'sales'), getCustomer);
router.post('/', authorize('admin', 'sales'), createCustomer);
router.put('/:id', authorize('admin', 'sales'), updateCustomer);
router.delete('/:id', authorize('admin', 'sales'), deleteCustomer);

// Customer notes
router.post('/:id/notes', authorize('admin', 'sales'), addNote);
router.delete('/:id/notes/:noteId', authorize('admin', 'sales'), deleteNote);

export default router;
