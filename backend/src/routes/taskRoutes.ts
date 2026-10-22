import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../controllers/taskController.js';

const router = Router();

router.use(authMiddleware);

router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.patch('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

export default router;