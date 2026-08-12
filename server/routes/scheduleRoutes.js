import express from 'express';
import { generateSchedule, getSchedule, updateScheduleEntry } from '../controllers/scheduleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSchedule);

router.route('/generate')
  .post(protect, generateSchedule);
router.route('/:id')
  .put(protect, updateScheduleEntry);

export default router;