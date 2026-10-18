import express from 'express';
import {
  getAlumni,
  getAlumniById,
  createAlumni,
  updateAlumni,
  searchAlumniRAG,
  alumniCreateSchema,
  alumniQuerySchema,
} from '../controllers/alumni.controller.js';
import { validateBody, validateQuery } from '../middleware/validator.js';

const router = express.Router();

router.get('/search/rag', searchAlumniRAG);
router.get('/', validateQuery(alumniQuerySchema), getAlumni);
router.get('/:id', getAlumniById);
router.post('/', validateBody(alumniCreateSchema), createAlumni);
router.put('/:id', updateAlumni);
router.put('/', updateAlumni);

export default router;
