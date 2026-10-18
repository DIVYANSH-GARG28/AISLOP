import express from 'express';
import { getJobs, getJobById, createJob, jobCreateSchema } from '../controllers/jobs.controller.js';
import { validateBody } from '../middleware/validator.js';

const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', validateBody(jobCreateSchema), createJob);

export default router;
