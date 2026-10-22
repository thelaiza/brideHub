import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense 
} from '../controllers/expenseController.js';

const router = Router();

router.use(authMiddleware);

router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.patch('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

export default router;