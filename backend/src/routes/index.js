import express from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import leadRoutes from './lead.routes.js';
import aiRoutes from './ai.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import webhookRoutes from './webhook.routes.js';
import rulesRoutes from './rules.routes.js';
import csvRoutes from './csv.routes.js';
import sequenceRoutes from './sequence.routes.js';
import chatRoutes from './chat.routes.js';
import integrationRoutes from './integration.routes.js';
import reminderRoutes from './reminder.routes.js';
import templateRoutes from './template.routes.js';
import analyticsRoutes from './analytics.routes.js';
import vehicleRoutes from './vehicle.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/leads', leadRoutes);
router.use('/ai', aiRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/rules', rulesRoutes);
router.use('/csv', csvRoutes);
router.use('/sequences', sequenceRoutes);
router.use('/chat', chatRoutes);
router.use('/integrations', integrationRoutes);
router.use('/reminders', reminderRoutes);
router.use('/templates', templateRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/vehicles', vehicleRoutes);

export default router;
