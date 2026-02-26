import Agent from '../models/Agent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { AgentRole } from '../enums/index.js';

export const getPendingUsers = asyncHandler(async (req, res) => {
  if (req.agent.role !== AgentRole.MANAGER && req.agent.role !== AgentRole.OWNER) {
    throw new AppError('Unauthorized. Admin access required.', 403);
  }

  const pendingUsers = await Agent.find({
    isVerified: false
  }).select('-password').sort({ createdAt: -1 });

  const formattedUsers = pendingUsers.map(user => ({
    id: user._id.toString(),
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));

  res.json({
    success: true,
    data: formattedUsers
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  if (req.agent.role !== AgentRole.MANAGER && req.agent.role !== AgentRole.OWNER) {
    throw new AppError('Unauthorized. Admin access required.', 403);
  }

  const users = await Agent.find({})
    .select('-password')
    .sort({ createdAt: -1 });

  const formattedUsers = users.map(user => ({
    id: user._id.toString(),
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));

  res.json({
    success: true,
    data: formattedUsers
  });
});

export const verifyUser = asyncHandler(async (req, res) => {
  if (req.agent.role !== AgentRole.MANAGER && req.agent.role !== AgentRole.OWNER) {
    throw new AppError('Unauthorized. Admin access required.', 403);
  }

  const { userId } = req.params;
  
  if (!userId || userId === 'undefined') {
    throw new AppError('User ID is required', 400);
  }

  const { isVerified, isActive, role } = req.body;

  const user = await Agent.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (isVerified !== undefined) {
    user.isVerified = isVerified;
  }
  if (isActive !== undefined) {
    user.isActive = isActive;
  }
  if (role && Object.values(AgentRole).includes(role)) {
    user.role = role;
  }

  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive
    }
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.agent.role !== AgentRole.MANAGER && req.agent.role !== AgentRole.OWNER) {
    throw new AppError('Unauthorized. Admin access required.', 403);
  }

  const { userId } = req.params;

  if (!userId || userId === 'undefined') {
    throw new AppError('User ID is required', 400);
  }

  if (userId === req.agent._id.toString()) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const user = await Agent.findByIdAndDelete(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});
