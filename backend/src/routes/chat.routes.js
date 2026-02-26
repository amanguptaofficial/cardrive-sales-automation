import express from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', chatController.getChats);
router.get('/agents', chatController.getAgents);
router.get('/:id', chatController.getChat);
router.post('/direct', chatController.createDirectChat);
router.post('/group', chatController.createGroupChat);
router.post('/:chatId/message', chatController.upload.single('file'), chatController.sendMessage);
router.post('/:chatId/members', chatController.addMembers);
router.delete('/:chatId/members/:memberId', chatController.removeMember);

export default router;
