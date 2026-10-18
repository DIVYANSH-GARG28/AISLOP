import express from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import studentRoutes from './students.routes.js';
import alumniRoutes from './alumni.routes.js';
import mentorRoutes from './mentors.routes.js';
import jobRoutes from './jobs.routes.js';
import careerRoutes from './career.routes.js';
import aiRoutes from './ai.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/alumni', alumniRoutes);
router.use('/mentors', mentorRoutes);
router.use('/jobs', jobRoutes);
router.use('/career', careerRoutes);
router.use('/ai', aiRoutes);

export default router;
