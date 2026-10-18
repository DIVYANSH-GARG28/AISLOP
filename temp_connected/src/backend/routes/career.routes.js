import express from 'express';
import { getRoadmap, saveRoadmap, generateAIRoadmap, roadmapSaveSchema } from '../controllers/career.controller.js';
import { validateBody } from '../middleware/validator.js';

const router = express.Router();

router.get('/roadmap/:studentId', getRoadmap);
router.post('/roadmap/generate', generateAIRoadmap);
router.post('/roadmap', validateBody(roadmapSaveSchema), saveRoadmap);

export default router;
