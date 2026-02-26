import RoutingRule from '../models/RoutingRule.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

export const getRules = asyncHandler(async (req, res) => {
  const rules = await RoutingRule.find()
    .sort({ priority: -1, createdAt: -1 });

  const formattedRules = rules.map(rule => ({
    ...rule.toObject(),
    conditions: rule.condition,
    actions: rule.action
  }));

  res.json({
    success: true,
    data: formattedRules
  });
});

export const createRule = asyncHandler(async (req, res) => {
  const ruleData = {
    ...req.body,
    condition: req.body.conditions || req.body.condition,
    action: req.body.actions || req.body.action
  };
  delete ruleData.conditions;
  delete ruleData.actions;
  
  const rule = await RoutingRule.create(ruleData);

  res.status(201).json({
    success: true,
    data: {
      ...rule.toObject(),
      conditions: rule.condition,
      actions: rule.action
    }
  });
});

export const updateRule = asyncHandler(async (req, res) => {
  const rule = await RoutingRule.findById(req.params.id);

  if (!rule) {
    throw new AppError('Rule not found', 404);
  }

  const updateData = { ...req.body };
  if (updateData.conditions) {
    updateData.condition = updateData.conditions;
    delete updateData.conditions;
  }
  if (updateData.actions) {
    updateData.action = updateData.actions;
    delete updateData.actions;
  }

  Object.assign(rule, updateData);
  await rule.save();

  res.json({
    success: true,
    data: {
      ...rule.toObject(),
      conditions: rule.condition,
      actions: rule.action
    }
  });
});

export const deleteRule = asyncHandler(async (req, res) => {
  const rule = await RoutingRule.findById(req.params.id);

  if (!rule) {
    throw new AppError('Rule not found', 404);
  }

  await rule.deleteOne();

  res.json({
    success: true,
    message: 'Rule deleted successfully'
  });
});
