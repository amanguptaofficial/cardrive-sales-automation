import Sequence from '../models/Sequence.js';
import Lead from '../models/Lead.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { dripQueue } from '../queues/index.js';
import { logger } from '../utils/logger.js';

export const getSequences = asyncHandler(async (req, res) => {
  const sequences = await Sequence.find().sort({ createdAt: -1 });
  
  for (const sequence of sequences) {
    const enrolledCount = await Lead.countDocuments({
      'drip.sequence': sequence._id.toString(),
      'drip.isActive': true
    });
    sequence.enrolledLeads = enrolledCount;
  }
  
  res.json({
    success: true,
    data: sequences
  });
});

export const getSequence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sequence = await Sequence.findById(id);
  
  if (!sequence) {
    throw new AppError('Sequence not found', 404);
  }
  
  const enrolledCount = await Lead.countDocuments({
    'drip.sequence': id,
    'drip.isActive': true
  });
  sequence.enrolledLeads = enrolledCount;
  
  res.json({
    success: true,
    data: sequence
  });
});

export const createSequence = asyncHandler(async (req, res) => {
  const { name, description, targetTier, messages } = req.body;
  
  if (!name || !messages || messages.length === 0) {
    throw new AppError('Name and at least one message are required', 400);
  }
  
  const sequence = await Sequence.create({
    name,
    description,
    targetTier: targetTier || 'cold',
    messages: messages.map((msg, index) => ({
      day: msg.day || (index + 1),
      content: msg.content,
      subject: msg.subject
    })),
    isActive: true
  });
  
  res.status(201).json({
    success: true,
    data: sequence
  });
});

export const updateSequence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, targetTier, messages, isActive } = req.body;
  
  const sequence = await Sequence.findById(id);
  if (!sequence) {
    throw new AppError('Sequence not found', 404);
  }
  
  if (name) sequence.name = name;
  if (description !== undefined) sequence.description = description;
  if (targetTier) sequence.targetTier = targetTier;
  if (messages) {
    sequence.messages = messages.map((msg, index) => ({
      day: msg.day || (index + 1),
      content: msg.content,
      subject: msg.subject
    }));
  }
  if (isActive !== undefined) sequence.isActive = isActive;
  
  await sequence.save();
  
  res.json({
    success: true,
    data: sequence
  });
});

export const deleteSequence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const sequence = await Sequence.findById(id);
  if (!sequence) {
    throw new AppError('Sequence not found', 404);
  }
  
  const enrolledCount = await Lead.countDocuments({
    'drip.sequence': id,
    'drip.isActive': true
  });
  
  if (enrolledCount > 0) {
    throw new AppError(`Cannot delete sequence with ${enrolledCount} active leads enrolled`, 400);
  }
  
  await Sequence.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'Sequence deleted successfully'
  });
});

export const activateSequence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { leadIds } = req.body;
  
  const sequence = await Sequence.findById(id);
  if (!sequence) {
    throw new AppError('Sequence not found', 404);
  }
  
  if (!sequence.isActive) {
    sequence.isActive = true;
    await sequence.save();
    logger.info(`Sequence ${id} automatically activated during lead enrollment`);
  }
  
  const query = leadIds && leadIds.length > 0 
    ? { _id: { $in: leadIds } }
    : { tier: sequence.targetTier === 'all' ? { $exists: true } : sequence.targetTier };
  
  const leads = await Lead.find(query);
  
  let enrolled = 0;
  
  for (const lead of leads) {
    if (!lead.drip?.isActive) {
      lead.drip = {
        isActive: true,
        sequence: id,
        step: 0,
        nextAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      await lead.save();
      
      if (dripQueue && sequence.messages.length > 0) {
        const firstMessage = sequence.messages[0];
        const delay = (firstMessage.day || 1) * 24 * 60 * 60 * 1000;
        
        await dripQueue.add('send-drip', {
          leadId: lead._id.toString(),
          sequence: id,
          step: 1
        }, {
          delay
        });
      }
      
      enrolled++;
    }
  }
  
  res.json({
    success: true,
    message: `${enrolled} leads enrolled in sequence`,
    enrolled
  });
});

export const pauseSequence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const sequence = await Sequence.findById(id);
  if (!sequence) {
    throw new AppError('Sequence not found', 404);
  }
  
  const result = await Lead.updateMany(
    { 'drip.sequence': id, 'drip.isActive': true },
    { $set: { 'drip.isActive': false } }
  );
  
  sequence.isActive = false;
  await sequence.save();
  
  res.json({
    success: true,
    message: `Sequence paused. ${result.modifiedCount} leads removed from sequence.`,
    paused: result.modifiedCount
  });
});

export const getSequenceStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const sequence = await Sequence.findById(id);
  if (!sequence) {
    throw new AppError('Sequence not found', 404);
  }
  
  const totalEnrolled = await Lead.countDocuments({
    'drip.sequence': id
  });
  
  const activeEnrolled = await Lead.countDocuments({
    'drip.sequence': id,
    'drip.isActive': true
  });
  
  res.json({
    success: true,
    data: {
      totalEnrolled,
      activeEnrolled,
      pausedEnrolled: totalEnrolled - activeEnrolled
    }
  });
});
