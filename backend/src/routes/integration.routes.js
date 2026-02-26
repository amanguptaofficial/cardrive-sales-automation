import express from 'express';
import * as integrationController from '../controllers/integration.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', integrationController.getIntegrations);
router.get('/:id', integrationController.getIntegration);
router.get('/:id/webhook-url', integrationController.getWebhookUrl);
router.post('/', integrationController.createIntegration);
router.put('/:id', integrationController.updateIntegration);
router.post('/:id/connect', integrationController.connectIntegration);
router.post('/:id/disconnect', integrationController.disconnectIntegration);
router.post('/:id/refresh', integrationController.refreshIntegration);
router.delete('/:id', integrationController.deleteIntegration);

export default router;
