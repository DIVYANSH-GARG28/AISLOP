import express from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  studentCreateSchema,
  studentQuerySchema,
} from '../controllers/students.controller.js';
import { validateBody, validateQuery } from '../middleware/validator.js';

const router = express.Router();

router.get('/', validateQuery(studentQuerySchema), getStudents);
router.get('/:id', getStudentById);
router.post('/', validateBody(studentCreateSchema), createStudent);
router.put('/:id', updateStudent);
router.put('/', updateStudent);

export default router;
