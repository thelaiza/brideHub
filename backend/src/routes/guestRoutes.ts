import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  getGuests, 
  createGuest, 
  updateGuest, 
  deleteGuest, 
  importGuests 
} from '../controllers/guestController.js';

const router = Router();

router.use(authMiddleware);

router.get('/guests', getGuests);
router.post('/guests', createGuest);
router.post('/guests/import', importGuests);
router.patch('/guests/:id', updateGuest);
router.delete('/guests/:id', deleteGuest);

export default router;