import express from 'express';
import { getCourses, createCourse } from '../controllers/courseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// The 'protect' middleware runs first. If valid, it moves to the controller.
router.route('/')
  .get(protect, getCourses)
  .post(protect, createCourse);

export default router;