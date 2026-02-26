import express from 'express';
import * as sequenceController from '../controllers/sequence.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', sequenceController.getSequences);
router.get('/:id', sequenceController.getSequence);
router.get('/:id/stats', sequenceController.getSequenceStats);
router.post('/', sequenceController.createSequence);
router.put('/:id', sequenceController.updateSequence);
router.delete('/:id', sequenceController.deleteSequence);
router.post('/:id/activate', sequenceController.activateSequence);
router.post('/:id/pause', sequenceController.pauseSequence);

export default router;
