import express from 'express';
import {
  register,
  login,
  getMe,
  registerSchema,
  loginSchema,
} from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validator.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticateToken, getMe);

export default router;
