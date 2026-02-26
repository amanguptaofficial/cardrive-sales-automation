import express from 'express';
import * as templateController from '../controllers/template.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', templateController.getTemplates);
router.get('/:id', templateController.getTemplate);
router.post('/', templateController.createTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
router.post('/:id/use', templateController.useTemplate);

export default router;
