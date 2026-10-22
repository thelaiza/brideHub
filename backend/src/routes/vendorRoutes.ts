import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  getVendors, 
  createVendor, 
  updateVendor, 
  deleteVendor 
} from '../controllers/vendorController.js';

const router = Router();

router.use(authMiddleware);

router.get('/vendors', getVendors);
router.post('/vendors', createVendor);
router.patch('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);

export default router;