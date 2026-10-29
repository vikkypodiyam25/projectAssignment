import { Router } from 'express';
import * as controller from '../controllers/email.controller.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router();
router.use(authenticate); router.get('/dashboard', asyncHandler(controller.dashboard)); router.post('/', asyncHandler(controller.schedule)); router.get('/', asyncHandler(controller.list)); router.get('/:id', asyncHandler(controller.get)); router.delete('/:id', asyncHandler(controller.remove));
export default router;
