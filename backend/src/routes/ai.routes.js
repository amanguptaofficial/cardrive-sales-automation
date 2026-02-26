import express from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/score/:leadId', aiController.scoreLeadAI);
router.post('/generate/:leadId', aiController.generateResponseAI);
router.post('/send/:leadId', aiController.sendAIResponse);
router.post('/regen/:leadId', aiController.regenerateResponseAI);

export default router;
