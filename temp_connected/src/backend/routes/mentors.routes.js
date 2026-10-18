import express from 'express';
import {
  getMentors,
  requestMentorship,
  getMentorshipRequests,
  mentorshipRequestSchema,
} from '../controllers/mentors.controller.js';
import { validateBody } from '../middleware/validator.js';

const router = express.Router();

router.get('/', getMentors);
router.get('/requests', getMentorshipRequests);
router.post('/request', validateBody(mentorshipRequestSchema), requestMentorship);

export default router;
