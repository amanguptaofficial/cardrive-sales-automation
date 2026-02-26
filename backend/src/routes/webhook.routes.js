import express from 'express';
import * as webhookController from '../controllers/webhook.controller.js';

const router = express.Router();

router.post('/website', webhookController.websiteWebhook);
router.post('/cardekho', webhookController.cardekhoWebhook);
router.post('/carwale', webhookController.carwaleWebhook);

export default router;
