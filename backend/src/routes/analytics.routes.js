import express from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/conversion', analyticsController.getConversionAnalytics);
router.get('/agent-performance', analyticsController.getAgentPerformance);
router.get('/response-time', analyticsController.getResponseTimeAnalytics);
router.get('/personal-dashboard', analyticsController.getPersonalDashboard);
router.get('/export', analyticsController.exportAnalytics);

export default router;
