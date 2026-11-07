import { Router } from 'express';
import { getCategories } from '../controllers/categoryController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/categories', authMiddleware, getCategories);

export default router;