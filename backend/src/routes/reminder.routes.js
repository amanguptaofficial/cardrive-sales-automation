import express from 'express';
import * as reminderController from '../controllers/reminder.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/upcoming', reminderController.getUpcomingReminders);
router.get('/', reminderController.getReminders);
router.get('/:id', reminderController.getReminder);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.post('/:id/complete', reminderController.completeReminder);
router.post('/:id/snooze', reminderController.snoozeReminder);
router.delete('/:id', reminderController.deleteReminder);

export default router;
