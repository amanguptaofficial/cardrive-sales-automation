import Agent from '../models/Agent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  if (!env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured. Please set it in your .env file.', 500);
  }
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY
  });
};

const generateRefreshToken = (id) => {
  if (!env.JWT_REFRESH_SECRET) {
    throw new AppError('JWT_REFRESH_SECRET is not configured. Please set it in your .env file.', 500);
  }
  return jwt.sign({ id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY
  });
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  const existingAgent = await Agent.findOne({ email: email.toLowerCase() });
  if (existingAgent) {
    throw new AppError('Email already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const agent = await Agent.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    role: role || 'agent',
    isVerified: false,
    isActive: false
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Waiting for admin approval.',
    agent: {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      isVerified: agent.isVerified
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const agent = await Agent.findOne({ email: email.toLowerCase() });

  if (!agent) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!agent.isVerified) {
    throw new AppError('Account pending admin verification', 403);
  }

  if (!agent.isActive) {
    throw new AppError('Account is deactivated. Contact admin.', 403);
  }

  const isPasswordValid = await bcrypt.compare(password, agent.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(agent._id);
  const refreshToken = generateRefreshToken(agent._id);

  agent.refreshToken = refreshToken;
  await agent.save();

  res.json({
    success: true,
    token,
    refreshToken,
    agent: {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      phone: agent.phone,
      stats: agent.stats,
      notificationPreferences: agent.notificationPreferences
    }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  if (!req.agent || !req.agent._id) {
    throw new AppError('Agent not authenticated', 401);
  }

  const agent = await Agent.findById(req.agent._id).select('-password');

  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  res.json({
    success: true,
    agent: {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      phone: agent.phone,
      stats: agent.stats,
      isVerified: agent.isVerified,
      isActive: agent.isActive,
      notificationPreferences: agent.notificationPreferences || {
        newLeadAlerts: true,
        hotLeadNotifications: true,
        emailNotifications: false,
        chatNotifications: true,
        mentionNotifications: true
      }
    }
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    const agent = await Agent.findById(decoded.id);

    if (!agent || agent.refreshToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (!agent.isVerified || !agent.isActive) {
      throw new AppError('Account is not active', 403);
    }

    const newToken = generateToken(agent._id);
    const newRefreshToken = generateRefreshToken(agent._id);

    agent.refreshToken = newRefreshToken;
    await agent.save();

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    throw error;
  }
});

export const logout = asyncHandler(async (req, res) => {
  if (req.agent) {
    const agent = await Agent.findById(req.agent._id);
    if (agent) {
      agent.refreshToken = null;
      await agent.save();
    }
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const agentId = req.agent._id;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  if (name) agent.name = name;
  if (phone !== undefined) agent.phone = phone;

  await agent.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    agent: {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      role: agent.role,
      stats: agent.stats
    }
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const agentId = req.agent._id;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  const agent = await Agent.findById(agentId);
  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, agent.password);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  agent.password = hashedPassword;
  await agent.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const agentId = req.agent._id;
  const preferences = req.body;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  if (!agent.notificationPreferences) {
    agent.notificationPreferences = {};
  }

  if (preferences.newLeadAlerts !== undefined) {
    agent.notificationPreferences.newLeadAlerts = preferences.newLeadAlerts;
  }
  if (preferences.hotLeadNotifications !== undefined) {
    agent.notificationPreferences.hotLeadNotifications = preferences.hotLeadNotifications;
  }
  if (preferences.emailNotifications !== undefined) {
    agent.notificationPreferences.emailNotifications = preferences.emailNotifications;
  }
  if (preferences.chatNotifications !== undefined) {
    agent.notificationPreferences.chatNotifications = preferences.chatNotifications;
  }
  if (preferences.mentionNotifications !== undefined) {
    agent.notificationPreferences.mentionNotifications = preferences.mentionNotifications;
  }

  await agent.save();

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    preferences: agent.notificationPreferences
  });
});
