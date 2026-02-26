import MessageTemplate from '../models/MessageTemplate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

export const createTemplate = asyncHandler(async (req, res) => {
  const { name, category, content, channel, variables, isPublic } = req.body;
  const agentId = req.agent._id;

  if (!name || !content) {
    throw new AppError('Name and content are required', 400);
  }

  const template = await MessageTemplate.create({
    name,
    category: category || 'other',
    content,
    channel: channel || 'all',
    variables: variables || [],
    createdBy: agentId,
    isPublic: isPublic || false
  });

  res.status(201).json({
    success: true,
    data: template
  });
});

export const getTemplates = asyncHandler(async (req, res) => {
  const agentId = req.agent._id;
  const { category, channel, isPublic } = req.query;

  const query = {
    $or: [
      { createdBy: agentId },
      { isPublic: true, isActive: true }
    ]
  };

  if (category) {
    query.category = category;
  }

  if (channel) {
    query.$or = [
      { channel: channel },
      { channel: 'all' }
    ];
  }

  if (isPublic !== undefined) {
    query.isPublic = isPublic === 'true';
  }

  const templates = await MessageTemplate.find(query)
    .populate('createdBy', 'name email')
    .sort({ usageCount: -1, createdAt: -1 });

  res.json({
    success: true,
    data: templates
  });
});

export const getTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = req.agent._id;

  const template = await MessageTemplate.findOne({
    _id: id,
    $or: [
      { createdBy: agentId },
      { isPublic: true }
    ]
  }).populate('createdBy', 'name email');

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  res.json({
    success: true,
    data: template
  });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = req.agent._id;
  const { name, category, content, channel, variables, isPublic, isActive } = req.body;

  const template = await MessageTemplate.findOne({ _id: id, createdBy: agentId });

  if (!template) {
    throw new AppError('Template not found or unauthorized', 404);
  }

  if (name) template.name = name;
  if (category) template.category = category;
  if (content) template.content = content;
  if (channel) template.channel = channel;
  if (variables) template.variables = variables;
  if (isPublic !== undefined) template.isPublic = isPublic;
  if (isActive !== undefined) template.isActive = isActive;

  await template.save();

  res.json({
    success: true,
    data: template
  });
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = req.agent._id;

  const template = await MessageTemplate.findOneAndDelete({ _id: id, createdBy: agentId });

  if (!template) {
    throw new AppError('Template not found or unauthorized', 404);
  }

  res.json({
    success: true,
    message: 'Template deleted successfully'
  });
});

export const useTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = req.agent._id;

  const template = await MessageTemplate.findOne({
    _id: id,
    $or: [
      { createdBy: agentId },
      { isPublic: true, isActive: true }
    ]
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  template.usageCount += 1;
  await template.save();

  res.json({
    success: true,
    data: template
  });
});
