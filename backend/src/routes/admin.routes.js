import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/users/pending', adminController.getPendingUsers);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/verify', adminController.verifyUser);
router.delete('/users/:userId', adminController.deleteUser);

export default router;
