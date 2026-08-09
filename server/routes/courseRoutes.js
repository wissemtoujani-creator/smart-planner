import express from 'express';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCourses)
  .post(protect, createCourse);

// The /:id acts as a variable in the URL, e.g., /api/courses/64abcd1234
router.route('/:id')
  .put(protect, updateCourse)
  .delete(protect, deleteCourse);

export default router;