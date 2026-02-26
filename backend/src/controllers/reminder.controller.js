import Reminder from '../models/Reminder.js';
import Lead from '../models/Lead.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { getIO } from '../socket.js';

export const createReminder = asyncHandler(async (req, res) => {
  const { leadId, title, description, reminderDate, type, priority } = req.body;
  const agentId = req.agent._id;

  if (!leadId || !reminderDate) {
    throw new AppError('Lead ID and reminder date are required', 400);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const reminder = await Reminder.create({
    leadId,
    agentId,
    title: title || `Follow-up for ${lead.name}`,
    description: description || '',
    reminderDate: new Date(reminderDate),
    type: type || 'follow_up',
    priority: priority || 'medium'
  });

  res.status(201).json({
    success: true,
    data: reminder
  });
});

export const getReminders = asyncHandler(async (req, res) => {
  const agentId = req.agent._id;
  const { status, type, startDate, endDate } = req.query;

  const query = { agentId };

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  if (startDate || endDate) {
    query.reminderDate = {};
    if (startDate) query.reminderDate.$gte = new Date(startDate);
    if (endDate) query.reminderDate.$lte = new Date(endDate);
  }

  const reminders = await Reminder.find(query)
    .populate('leadId', 'name email phone interest')
    .sort({ reminderDate: 1 })
    .limit(100);

  res.json({
    success: true,
    data: reminders
  });
});

export const getReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = req.agent._id;

  const reminder = await Reminder.findOne({ _id: id, agentId })
    .populate('leadId')
    .populate('agentId', 'name email');

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  res.json({
    success: true,
    data: reminder
  });
});

export const updateReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = req.agent._id;
  const { title, description, reminderDate, type, priority, status, snoozedUntil } = req.body;

  const reminder = await Reminder.findOne({ _id: id, agentId });

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  if (title) reminder.title = title;
  if (description !== undefined) reminder.description = description;
  if (reminderDate) reminder.reminderDate = new Date(reminderDate);
  if (type) reminder.type = type;
  if (priority) reminder.priority = priority;
  if (status) {
    reminder.status = status;
    if (status === 'completed') {
      reminder.completedAt = new Date();
    }
  }
  if (snoozedUntil) {
    reminder.snoozedUntil = new Date(snoozedUntil);
    reminder.status = 'snoozed';
  }

  await reminder.save();

  res.json({
    success: true,
    data: reminder
  });
});

export const completeReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = req.agent._id;

  const reminder = await Reminder.findOne({ _id: id, agentId });

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  reminder.status = 'completed';
  reminder.completedAt = new Date();
  await reminder.save();

  res.json({
    success: true,
    data: reminder
  });
});

export const snoozeReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hours = 24 } = req.body;
  const agentId = req.agent._id;

  const reminder = await Reminder.findOne({ _id: id, agentId });

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  const snoozeDate = new Date();
  snoozeDate.setHours(snoozeDate.getHours() + hours);

  reminder.status = 'snoozed';
  reminder.snoozedUntil = snoozeDate;
  await reminder.save();

  res.json({
    success: true,
    data: reminder
  });
});

export const deleteReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = req.agent._id;

  const reminder = await Reminder.findOneAndDelete({ _id: id, agentId });

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  res.json({
    success: true,
    message: 'Reminder deleted successfully'
  });
});

export const getUpcomingReminders = asyncHandler(async (req, res) => {
  const agentId = req.agent._id;
  const { limit = 10 } = req.query;

  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const reminders = await Reminder.find({
    agentId,
    status: 'pending',
    reminderDate: { $gte: now, $lte: tomorrow }
  })
    .populate('leadId', 'name email phone interest')
    .sort({ reminderDate: 1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: reminders
  });
});
