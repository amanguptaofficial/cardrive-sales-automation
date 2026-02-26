import express from 'express';
import * as rulesController from '../controllers/rules.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', rulesController.getRules);
router.post('/', rulesController.createRule);
router.patch('/:id', rulesController.updateRule);
router.delete('/:id', rulesController.deleteRule);

export default router;
