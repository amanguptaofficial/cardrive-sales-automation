import jwt from 'jsonwebtoken';
import Agent from '../models/Agent.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    if (!env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'JWT_SECRET is not configured. Please set it in your .env file.'
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const agent = await Agent.findById(decoded.id).select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    if (!agent.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Account pending verification'
      });
    }

    if (!agent.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    req.agent = agent;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    next(error);
  }
};
