import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', dashboardController.getStats);
router.get('/funnel', dashboardController.getFunnel);
router.get('/activity', dashboardController.getActivity);
router.get('/volume', dashboardController.getVolume);

export default router;
