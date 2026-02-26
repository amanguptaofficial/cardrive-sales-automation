import express from 'express';
import * as leadController from '../controllers/lead.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', leadController.createLead);
router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLead);
router.patch('/:id', leadController.updateLead);
router.patch('/:id/score', leadController.updateLeadScore);
router.delete('/:id', leadController.deleteLead);
router.post('/:id/messages', leadController.addMessage);
router.get('/:id/messages', leadController.getMessages);
router.post('/:id/notes', leadController.addNote);
router.get('/:id/notes', leadController.getNotes);
router.put('/:id/notes/:noteId', leadController.updateNote);
router.delete('/:id/notes/:noteId', leadController.deleteNote);
router.post('/:id/quick-action', leadController.quickAction);
router.post('/bulk-update', leadController.bulkUpdate);
router.get('/ai-inbox/list', leadController.getAIInbox);
router.get('/pipeline/stats', leadController.getPipeline);
router.get('/scoring/stats', leadController.getAIScoring);

export default router;
