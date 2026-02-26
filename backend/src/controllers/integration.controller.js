import Integration from '../models/Integration.js';
import Lead from '../models/Lead.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const getIntegrations = asyncHandler(async (req, res) => {
  const integrations = await Integration.find().sort({ createdAt: -1 });
  
  const integrationsWithStats = await Promise.all(
    integrations.map(async (integration) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      
      const stats = {
        totalLeads: await Lead.countDocuments({ source: integration.source }),
        leadsToday: await Lead.countDocuments({
          source: integration.source,
          createdAt: { $gte: today }
        }),
        leadsThisWeek: await Lead.countDocuments({
          source: integration.source,
          createdAt: { $gte: thisWeek }
        }),
        leadsThisMonth: await Lead.countDocuments({
          source: integration.source,
          createdAt: { $gte: thisMonth }
        })
      };
      
      return {
        ...integration.toObject(),
        stats
      };
    })
  );
  
  res.json({
    success: true,
    data: integrationsWithStats
  });
});

export const getIntegration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const integration = await Integration.findById(id);
  
  if (!integration) {
    throw new AppError('Integration not found', 404);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = {
    totalLeads: await Lead.countDocuments({ source: integration.source }),
    leadsToday: await Lead.countDocuments({
      source: integration.source,
      createdAt: { $gte: today }
    })
  };
  
  res.json({
    success: true,
    data: {
      ...integration.toObject(),
      stats
    }
  });
});

export const createIntegration = asyncHandler(async (req, res) => {
  const { name, source, webhookUrl, webhookSecret, config, description } = req.body;
  
  const existing = await Integration.findOne({ source });
  if (existing) {
    throw new AppError(`Integration with source "${source}" already exists`, 400);
  }
  
  const integration = await Integration.create({
    name,
    source,
    webhookUrl: webhookUrl || `/api/webhooks/${source}`,
    webhookSecret,
    config: config || {},
    description,
    status: 'disconnected'
  });
  
  res.status(201).json({
    success: true,
    data: integration
  });
});

export const updateIntegration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, webhookUrl, webhookSecret, config, description, isActive } = req.body;
  
  const integration = await Integration.findById(id);
  if (!integration) {
    throw new AppError('Integration not found', 404);
  }
  
  if (name) integration.name = name;
  if (webhookUrl) integration.webhookUrl = webhookUrl;
  if (webhookSecret !== undefined) integration.webhookSecret = webhookSecret;
  if (config) integration.config = { ...integration.config, ...config };
  if (description !== undefined) integration.description = description;
  if (isActive !== undefined) integration.isActive = isActive;
  
  await integration.save();
  
  res.json({
    success: true,
    data: integration
  });
});

export const connectIntegration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { config } = req.body;
  
  const integration = await Integration.findById(id);
  if (!integration) {
    throw new AppError('Integration not found', 404);
  }
  
  integration.status = 'connected';
  integration.lastSyncAt = new Date();
  if (config) {
    integration.config = { ...integration.config, ...config };
  }
  
  await integration.save();
  
  logger.info(`Integration ${integration.name} (${integration.source}) connected`);
  
  res.json({
    success: true,
    message: `${integration.name} connected successfully`,
    data: integration
  });
});

export const disconnectIntegration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const integration = await Integration.findById(id);
  if (!integration) {
    throw new AppError('Integration not found', 404);
  }
  
  integration.status = 'disconnected';
  await integration.save();
  
  logger.info(`Integration ${integration.name} (${integration.source}) disconnected`);
  
  res.json({
    success: true,
    message: `${integration.name} disconnected successfully`,
    data: integration
  });
});

export const deleteIntegration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const integration = await Integration.findById(id);
  if (!integration) {
    throw new AppError('Integration not found', 404);
  }
  
  const leadCount = await Lead.countDocuments({ source: integration.source });
  if (leadCount > 0) {
    throw new AppError(
      `Cannot delete integration with ${leadCount} existing leads. Disconnect it instead.`,
      400
    );
  }
  
  await Integration.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'Integration deleted successfully'
  });
});

export const refreshIntegration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const integration = await Integration.findById(id);
  if (!integration) {
    throw new AppError('Integration not found', 404);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  
  const thisMonth = new Date();
  thisMonth.setMonth(thisMonth.getMonth() - 1);
  
  const stats = {
    totalLeads: await Lead.countDocuments({ source: integration.source }),
    leadsToday: await Lead.countDocuments({
      source: integration.source,
      createdAt: { $gte: today }
    }),
    leadsThisWeek: await Lead.countDocuments({
      source: integration.source,
      createdAt: { $gte: thisWeek }
    }),
    leadsThisMonth: await Lead.countDocuments({
      source: integration.source,
      createdAt: { $gte: thisMonth }
    })
  };
  
  integration.stats = stats;
  integration.lastSyncAt = new Date();
  await integration.save();
  
  res.json({
    success: true,
    message: 'Integration stats refreshed',
    data: integration
  });
});

export const getWebhookUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const integration = await Integration.findById(id);
  if (!integration) {
    throw new AppError('Integration not found', 404);
  }
  
  const baseUrl = env.FRONTEND_URL?.replace(':5173', ':5003') || 
                  `http://localhost:${env.PORT}`;
  const fullUrl = `${baseUrl}${integration.webhookUrl}`;
  
  res.json({
    success: true,
    data: {
      webhookUrl: fullUrl,
      relativeUrl: integration.webhookUrl
    }
  });
});
