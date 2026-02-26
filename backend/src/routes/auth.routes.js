import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/profile', protect, authController.updateProfile);
router.patch('/password', protect, authController.updatePassword);
router.patch('/notifications', protect, authController.updateNotificationPreferences);

export default router;
