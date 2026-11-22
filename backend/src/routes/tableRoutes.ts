import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getTables,
  createTable,
  deleteTable,
  assignGuestToTable,
  removeGuestFromTable,
} from '../controllers/tableController.js';

const router = Router();

router.use(authMiddleware);

router.get('/tables', getTables);
router.post('/tables', createTable);
router.delete('/tables/:id', deleteTable);
router.post('/tables/:id/guests', assignGuestToTable);
router.delete('/tables/:id/guests/:guestId', removeGuestFromTable);

export default router;