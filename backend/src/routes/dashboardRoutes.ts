import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getDashboardData } from '../controllers/dashboardController.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboardData);

export default router;