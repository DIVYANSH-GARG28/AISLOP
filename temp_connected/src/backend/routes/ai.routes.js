import express from 'express';
import { handleCopilotQuery } from '../controllers/ai.controller.js';

const router = express.Router();

router.post('/copilot', handleCopilotQuery);

export default router;
