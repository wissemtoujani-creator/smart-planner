import express from 'express';
import { generateSchedule, getSchedule } from '../controllers/scheduleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSchedule);

router.route('/generate')
  .post(protect, generateSchedule);

export default router;