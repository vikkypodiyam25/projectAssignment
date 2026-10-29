import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router();
router.post('/register', asyncHandler(register)); router.post('/login', asyncHandler(login)); router.get('/me', authenticate, asyncHandler(me));
export default router;
