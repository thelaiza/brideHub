import { Router } from 'express';
import { updateWedding } from '../controllers/weddingController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.put('/wedding', authMiddleware, updateWedding);

export default router;